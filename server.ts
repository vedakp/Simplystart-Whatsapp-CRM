import fs from "fs";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// --- Real WhatsApp State ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

let sock: any = null;
let isWhatsAppConnected = false;
let qrDataUrlStr = "";
let contacts: any[] = [];
let groups: any[] = [];

// Campaign Job State
let messageQueue: { jid: string, message: string, campId: string }[] = [];
let campaigns: any[] = [];
let isProcessingQueue = false;

// Chat State
let chatMessages: Record<string, any[]> = {};

// Leads State
let leads: any[] = [];

// Notes State
let notes: any[] = [
  { id: uuidv4(), title: "Getting Started", content: "Welcome to your new workspace. You can write notes here...", updatedAt: new Date().toISOString() }
];

// Settings State
import { connectDB, models, isDBConnected } from './database';
import fsPromises from 'fs/promises';

let settings: any = {
  geminiApiKey: "",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3",
  autoReplyEnabled: false
};

async function initSettingsFromStorage() {
  try {
     const data = await fsPromises.readFile('local-settings.json', 'utf8');
     const parsedSettings = JSON.parse(data);
     settings = { ...settings, ...parsedSettings };
  } catch(e) {}
  
  // Connect to DB using .env
  if (process.env.DB_HOST && process.env.DB_USER) {
      await connectDB({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD || "",
          database: process.env.DB_NAME || "simplystart"
      });
      if (isDBConnected()) {
        try {
          const [dbSettingsRecord, created] = await models.Setting.findOrCreate({
             where: { key: 'global_settings' },
             defaults: { value: settings }
          });
          if (!created && dbSettingsRecord.value) {
             settings = { ...settings, ...dbSettingsRecord.value };
          }
        } catch(e) {
          console.error('Failed to load settings from DB:', e);
        }
      }
  }
}
initSettingsFromStorage();

let orders = [
  {
    id: "ORD-1001",
    customerName: "Alice Smith",
    customerPhone: "+1234567890",
    items: [{ name: "Premium Widget", quantity: 1, price: 99.99 }],
    totalAmount: 99.99,
    status: "Pending",
    createdAt: new Date().toISOString(),
    logs: [
      { message: "Order created", date: new Date().toISOString() }
    ]
  }
];

let appointments: any[] = [];

import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import { GoogleGenAI } from '@google/genai';

async function generateAIResponse(prompt: string, systemInstruction?: string): Promise<string> {
  if (settings.geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey });
      const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: prompt,
         config: {
           systemInstruction: systemInstruction || "You are a helpful assistant.",
         }
      });
      return response.text || "Sorry, I couldn't generate a response.";
    } catch (e: any) {
      console.error("Gemini Error:", e);
      return "Error generating response via Gemini.";
    }
  } else if (settings.ollamaUrl && settings.ollamaModel) {
    try {
      const res = await fetch(`${settings.ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.ollamaModel,
          prompt: (systemInstruction ? `System: ${systemInstruction}\n\n` : '') + `User: ${prompt}`,
          stream: false
        })
      });
      const data = await res.json();
      return data.response || "No response generated";
    } catch (e: any) {
      console.error("Ollama Error:", e);
      return "Error generating response via Ollama.";
    }
  }
  return "AI is not configured. Please add Gemini API key or Ollama URL in settings.";
}

// Background job loop for sending campaigns with random delay to avoid block
setInterval(async () => {
  if (!isWhatsAppConnected || !sock || isProcessingQueue || messageQueue.length === 0) return;
  isProcessingQueue = true;
  
  const task = messageQueue.shift();
  if (task) {
    try {
      if (task.jid) {
        await sock.sendMessage(task.jid, { text: task.message });
        console.log(`Successfully sent message to ${task.jid}`);
      }
      
      const camp = campaigns.find(c => c.id === task.campId);
      if (camp) {
        camp.sentCount = (camp.sentCount || 0) + 1;
        if (camp.sentCount >= camp.targets && camp.status !== "Completed") {
           camp.status = "Completed";
        }
      }
    } catch (error) {
      console.error(`Failed to send to ${task.jid}`, error);
    }
  }

  // Check if campaign is finished
  if (task) {
    const camp = campaigns.find(c => c.id === task.campId);
    if (camp && !messageQueue.some(m => m.campId === camp.id) && camp.sentCount >= camp.targets) {
      camp.status = "Completed";
    }
  }

  // 1 to 3 seconds delay
  const delay = Math.floor(Math.random() * 2000) + 1000;
  setTimeout(() => {
    isProcessingQueue = false;
  }, delay);
}, 1000);

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  const { version } = await fetchLatestBaileysVersion();
  
  sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrDataUrlStr = await QRCode.toDataURL(qr);
      console.log("New QR Generated");
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      qrDataUrlStr = "";
      isWhatsAppConnected = false;
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      isWhatsAppConnected = true;
      qrDataUrlStr = "";
      console.log("WhatsApp Connected!");
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
    if (type === 'notify') {
      for (const msg of messages) {
        if (!msg.message) continue;
        const jid = msg.key.remoteJid;
        if (!jid || jid === 'status@broadcast') continue;
        
        if (!chatMessages[jid]) chatMessages[jid] = [];
        
        const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "[Media/Other]";

        chatMessages[jid].push({
          id: msg.key.id,
          text: messageText,
          fromMe: msg.key.fromMe || false,
          timestamp: new Date((msg.messageTimestamp as number) * 1000).toISOString(),
        });

        // AI Auto Reply
        if (settings.autoReplyEnabled && !(msg.key.fromMe || false) && messageText !== "[Media/Other]") {
           const replyText = await generateAIResponse(
             messageText,
             "You are a helpful customer support agent for Simplystart. Give short, friendly answers to inquiries over WhatsApp. Avoid using emojis."
           );
           messageQueue.push({
             jid,
             message: replyText,
             campId: ''
           });
           
           chatMessages[jid].push({
             id: uuidv4(),
             text: replyText,
             fromMe: true,
             timestamp: new Date().toISOString(),
           });
        }
      }
    }
  });

  // Fallback contact loading
  sock.ev.on('contacts.upsert', async (newContacts: any[]) => {
    for (const c of newContacts) {
      if (!c.id.includes('@g.us') && !c.id.includes('@newsletter')) {
        const cData = {
             id: uuidv4(),
             name: c.name || c.notify || c.id.split('@')[0],
             jid: c.id,
             phone: c.id.split('@')[0],
             tags: []
        };
        if (!contacts.find(ex => ex.jid === c.id)) {
          contacts.push(cData);
        }
        if (isDBConnected()) {
           try {
             // Use findOrCreate to avoid duplication on reconnect
             await models.Contact.findOrCreate({ where: { jid: c.id }, defaults: cData });
           } catch(e){}
        }
      } else if (c.id.includes('@g.us')) {
        const gData = {
            id: uuidv4(),
            name: c.name || c.subject || c.id.split('@')[0],
            jid: c.id
        };
        if (!groups.find(ex => ex.jid === c.id)) {
          groups.push(gData);
        }
        if (isDBConnected()) {
           try {
             await models.Group.findOrCreate({ where: { jid: c.id }, defaults: gData });
           } catch(e){}
        }
      }
    }
  });
}

// --- Server Setup ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Init whatsapp
  connectToWhatsApp().catch(err => console.error('WhatsApp Init Error:', err));

  // --- API Routes ---

  // 1. WhatsApp Web Status
  app.get("/api/whatsapp/status", (req, res) => {
    res.json({ connected: isWhatsAppConnected, qr: qrDataUrlStr });
  });

  app.post("/api/whatsapp/connect", (req, res) => {
    // Return current QR if waiting
    res.json({ connected: isWhatsAppConnected, qr: qrDataUrlStr });
  });

  app.post("/api/whatsapp/disconnect", async (req, res) => {
    try {
      if (sock) {
        await sock.logout();
      }
    } catch(e) {}
    isWhatsAppConnected = false;
    qrDataUrlStr = "";
    sock = null;

    if (fs.existsSync('baileys_auth_info')) {
      try {
        fs.rmSync('baileys_auth_info', { recursive: true, force: true });
      } catch (e) {}
    }

    // Try a new connection immediately
    setTimeout(() => {
      connectToWhatsApp().catch(err => console.error('WhatsApp Reconnect Error:', err));
    }, 1000);

    res.json({ connected: false, message: "WhatsApp disconnected and resetting." });
  });

  // 2. Contact Sync & Tags
  app.get("/api/contacts", async (req, res) => {
    if (isDBConnected()) {
      const dbContacts = await models.Contact.findAll();
      return res.json(dbContacts.map((c: any) => c.toJSON()));
    }
    res.json(contacts);
  });

  app.get("/api/groups", async (req, res) => {
    if (isDBConnected()) {
      const dbGroups = await models.Group.findAll();
      return res.json(dbGroups.map((g: any) => g.toJSON()));
    }
    res.json(groups);
  });

  app.post("/api/contacts/sync", async (req, res) => {
    // If not connected, cannot sync
    if (!isWhatsAppConnected || !sock) {
      return res.status(400).json({ error: "WhatsApp not connected" });
    }
    // Trying to get chats to populate contacts.
    res.json({ message: "Background sync requested (Baileys syncs via WebSockets)", newContacts: contacts.length });
  });

  app.post("/api/contacts/:id/tags", async (req, res) => {
    const { tags } = req.body;
    if (isDBConnected()) {
       const contact = await models.Contact.findByPk(req.params.id);
       if (contact) {
         await contact.update({ tags });
         return res.json(contact.toJSON());
       }
       return res.status(404).json({error: "Not found"});
    }
    const c = contacts.find(c => c.id === req.params.id);
    if (c) {
      c.tags = tags;
      res.json(c);
    } else {
      res.status(404).json({error: "Not found"});
    }
  });

  // API: Chats
  app.get("/api/chats", (req, res) => {
    // Generate chat list based on chatMessages
    const chatsList = Object.keys(chatMessages).map(jid => {
      const contactOrGroup = contacts.find(c => c.jid === jid) || groups.find(g => g.jid === jid);
      const msgs = chatMessages[jid] || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      return {
        id: jid,
        name: contactOrGroup ? contactOrGroup.name : jid.split('@')[0],
        phone: jid.split('@')[0],
        lastMessage: lastMsg ? lastMsg.text : '',
        timestamp: lastMsg ? lastMsg.timestamp : new Date().toISOString(),
        unreadCount: 0 // Mocking unread status for now
      };
    });
    // Sort by most recent message
    chatsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(chatsList);
  });

  app.get("/api/chats/:id/messages", (req, res) => {
    const jid = req.params.id;
    res.json(chatMessages[jid] || []);
  });

  app.post("/api/chats/:id/send", (req, res) => {
    const jid = req.params.id;
    const { message } = req.body;
    
    if (isWhatsAppConnected && sock) {
      if (!chatMessages[jid]) chatMessages[jid] = [];
      chatMessages[jid].push({
        id: uuidv4(),
        text: message,
        fromMe: true,
        timestamp: new Date().toISOString()
      });
      messageQueue.push({
         jid,
         message,
         campId: ''
      });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "WhatsApp not connected" });
    }
  });

  // 3. Campaigns
  app.get("/api/campaigns", async (req, res) => {
    if (isDBConnected()) {
       const dbCampaigns = await models.Campaign.findAll();
       return res.json(dbCampaigns.map((c: any) => c.toJSON()));
    }
    res.json(campaigns);
  });

  app.post("/api/campaigns", async (req, res) => {
    const { name, messageTemplate, targetTags, targetGroups, targetContacts } = req.body;
    
    // Auto-match contacts based on tags or send to all if empty
    let targets: any[] = [];
    
    if (targetGroups && targetGroups.length > 0) {
       targets = targets.concat(groups.filter(c => targetGroups.includes(c.id)));
    }

    if (targetTags && targetTags.length > 0) {
      targets = targets.concat(contacts.filter(c => c.tags && c.tags.some((t: string) => targetTags.includes(t))));
    }
    
    if (targetContacts && targetContacts.length > 0) {
      targets = targets.concat(contacts.filter(c => targetContacts.includes(c.id)));
    }

    if (!targetTags?.length && !targetGroups?.length && !targetContacts?.length) {
      targets = targets.concat(contacts);
    }

    // Deduplicate
    targets = Array.from(new Set(targets.map(a => a.id))).map(id => {
      return targets.find(a => a.id === id);
    });

    const newCampaign = {
      id: uuidv4(),
      name,
      messageTemplate: messageTemplate || "",
      targets: targets.length,
      status: isWhatsAppConnected && targets.length > 0 ? "Sending" : "Failed",
      createdAt: new Date().toISOString()
    };
    
    if (isDBConnected()) {
       try {
         await models.Campaign.create(newCampaign);
       } catch(e){}
    } else {
       campaigns.push(newCampaign);
    }

    if (newCampaign.status === "Sending") {
      targets.forEach(t => {
        messageQueue.push({
           jid: t.jid, 
           message: (messageTemplate || "").replace(/\{\{name\}\}/gi, t.name || ""), 
           campId: newCampaign.id 
        });
      });
    }

    res.json(newCampaign);
  });

  // 4. Order Management
  app.get("/api/orders", async (req, res) => {
    if (isDBConnected()) {
      const dbOrders = await models.Order.findAll();
      return res.json(dbOrders.map((o:any) => o.toJSON()));
    }
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    const { customerName, customerPhone, items, totalAmount } = req.body;
    const newOrder = {
      id: `ORD-${1000 + orders.length + 1}`,
      customerName: customerName || "Unknown",
      customerPhone: customerPhone || "",
      items,
      totalAmount,
      status: "Pending",
      createdAt: new Date().toISOString(),
      logs: [
        { message: "Order created", date: new Date().toISOString() }
      ]
    };
    if (isDBConnected()) {
       models.Order.create(newOrder).catch(()=>{});
    } else {
       orders.push(newOrder);
    }

    // Simulation: Send WhatsApp confirmation automatically if connected
    if (isWhatsAppConnected && sock && customerPhone) {
      const sanitizedNumber = String(customerPhone).replace(/\D/g, '');
      const jid = `${sanitizedNumber}@s.whatsapp.net`;
      messageQueue.push({
         jid,
         message: `Hello ${customerName || 'Customer'}, your order ${newOrder.id} has been received and is currently Pending.`,
         campId: ''
      });
      newOrder.logs.push({
        message: `WhatsApp confirmation queued for ${customerPhone}`,
        date: new Date().toISOString()
      });
    }

    res.json(newOrder);
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    const orderId = req.params.id;
    const { status, sendUpdate } = req.body;

    let customerPhone = '';
    let customerName = '';

    if (isDBConnected()) {
      const order = await models.Order.findByPk(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });
      const currentLogs = order.logs || [];
      const newLogs = [...currentLogs, { message: `Status updated to ${status}`, date: new Date().toISOString() }];
      
      customerPhone = order.customerPhone;
      customerName = order.customerName;

      // Option to send WhatsApp message to customer on update
      if (sendUpdate) {
        if (isWhatsAppConnected && sock && customerPhone) {
          const sanitizedNumber = String(customerPhone).replace(/\D/g, '');
          const jid = `${sanitizedNumber}@s.whatsapp.net`;
          messageQueue.push({
             jid,
             message: `Hello ${customerName || 'Customer'}, the status of your order ${order.id} has been updated to: *${status}*.`,
             campId: ''
          });
          newLogs.push({ message: `WhatsApp status update queued: "Your order is now ${status}"`, date: new Date().toISOString() });
        } else {
          newLogs.push({ message: `Failed to send WhatsApp update: Account not connected or missing phone number.`, date: new Date().toISOString() });
        }
      }
      
      await order.update({ status, logs: newLogs });
      return res.json(order.toJSON());
    }

    const order = orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    order.logs.push({
      message: `Status updated to ${status}`,
      date: new Date().toISOString()
    });

    // Option to send WhatsApp message to customer on update
    if (sendUpdate) {
      if (isWhatsAppConnected && sock && order.customerPhone) {
        const sanitizedNumber = String(order.customerPhone).replace(/\D/g, '');
        const jid = `${sanitizedNumber}@s.whatsapp.net`;
        messageQueue.push({
           jid,
           message: `Hello ${order.customerName || 'Customer'}, the status of your order ${order.id} has been updated to: *${status}*.`,
           campId: ''
        });
        order.logs.push({
          message: `WhatsApp status update queued: "Your order is now ${status}"`,
          date: new Date().toISOString()
        });
      } else {
        order.logs.push({
          message: `Failed to send WhatsApp update: Account not connected or missing phone number.`,
          date: new Date().toISOString()
        });
      }
    }

    res.json(order);
  });

  app.delete("/api/orders/:id", async (req, res) => {
    const orderId = req.params.id;
    try {
      if (isDBConnected()) {
        const order = await models.Order.findByPk(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });
        await order.destroy();
        return res.json({ success: true });
      }
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) {
        return res.status(404).json({ error: "Order not found" });
      }
      orders.splice(idx, 1);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // 4a. Appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      if (isDBConnected() && models.Appointment) {
        const dbAppointments = await models.Appointment.findAll();
        return res.json(dbAppointments.map((a: any) => a.toJSON()));
      }
      res.json(appointments);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appt = {
        id: "APT-" + Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      if (isDBConnected() && models.Appointment) {
        await models.Appointment.create(appt);
      } else {
        appointments.push(appt);
      }
      
      // WhatsApp notification
      if (sock) {
         try {
           const [result] = await sock.onWhatsApp(appt.contactPhone);
           if (result) {
             const message = `Hello ${appt.contactName},\nYour appointment for "${appt.title}" has been scheduled from ${new Date(appt.startTime).toLocaleString()} to ${new Date(appt.endTime).toLocaleString()}.\nNotes: ${appt.notes || "None"}`;
             await sock.sendMessage(result.jid, { text: message });
           }
         } catch(e) {}
      }

      res.json(appt);
    } catch (e) {
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    try {
      if (isDBConnected() && models.Appointment) {
        const appt = await models.Appointment.findByPk(req.params.id);
        if (appt) {
          await appt.update(req.body);
          return res.json(appt.toJSON());
        }
      }
      const idx = appointments.findIndex(a => a.id === req.params.id);
      if (idx !== -1) {
        appointments[idx] = { ...appointments[idx], ...req.body };
        return res.json(appointments[idx]);
      }
      res.status(404).json({ error: "Not found" });
    } catch (e) {
      res.status(500).json({ error: "Failed to update" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      if (isDBConnected() && models.Appointment) {
        const appt = await models.Appointment.findByPk(req.params.id);
        if (appt) await appt.destroy();
      } else {
        appointments = appointments.filter(a => a.id !== req.params.id);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // 5. Leads
  app.get("/api/leads", async (req, res) => {
    if (isDBConnected()) {
      const dbLeads = await models.Lead.findAll();
      return res.json(dbLeads.map((l:any) => l.toJSON()));
    }
    res.json(leads);
  });
  app.post("/api/leads", async (req, res) => {
    const lead = { id: uuidv4(), status: "New", value: 0, notes: "", ...req.body, createdAt: new Date().toISOString() };
    if (isDBConnected()) {
       models.Lead.create(lead).catch(()=>{});
    } else {
       leads.push(lead);
    }
    res.json(lead);
  });
  app.put("/api/leads/:id", async (req, res) => {
    if (isDBConnected()) {
      const lead = await models.Lead.findByPk(req.params.id);
      if (lead) {
         await lead.update({ ...req.body, updatedAt: new Date().toISOString() });
         return res.json(lead.toJSON());
      }
      return res.status(404).send("Not found");
    }
    const index = leads.findIndex(l => l.id === req.params.id);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...req.body, updatedAt: new Date().toISOString() };
      res.json(leads[index]);
    } else {
      res.status(404).send("Not found");
    }
  });
  app.delete("/api/leads/:id", async (req, res) => {
    if (isDBConnected()) {
       await models.Lead.destroy({ where: { id: req.params.id } }).catch(()=>{});
    } else {
       leads = leads.filter(l => l.id !== req.params.id);
    }
    res.json({ success: true });
  });

  // 6. Notes
  app.get("/api/notes", async (req, res) => {
    if (isDBConnected()) {
      const dbNotes = await models.Note.findAll();
      return res.json(dbNotes.map((n:any) => n.toJSON()));
    }
    res.json(notes);
  });
  app.post("/api/notes", async (req, res) => {
    const note = { id: uuidv4(), ...req.body, updatedAt: new Date().toISOString() };
    if (isDBConnected()) {
      models.Note.create(note).catch(()=>{});
    } else {
      notes.push(note);
    }
    res.json(note);
  });
  app.put("/api/notes/:id", async (req, res) => {
    if (isDBConnected()) {
      const note = await models.Note.findByPk(req.params.id);
      if (note) {
         await note.update({ ...req.body, updatedAt: new Date().toISOString() });
         return res.json(note.toJSON());
      }
      return res.status(404).send("Not found");
    }
    const index = notes.findIndex(n => n.id === req.params.id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...req.body, updatedAt: new Date().toISOString() };
      res.json(notes[index]);
    } else {
      res.status(404).send("Not found");
    }
  });
  app.delete("/api/notes/:id", async (req, res) => {
    if (isDBConnected()) {
       await models.Note.destroy({ where: { id: req.params.id } }).catch(()=>{});
    } else {
       notes = notes.filter(n => n.id !== req.params.id);
    }
    res.json({ success: true });
  });

  // 7. Settings
  app.get("/api/settings", (req, res) => {
    res.json({ settings, dbStatus: isDBConnected() ? "Connected successfully" : "Not connected" });
  });

  app.post("/api/settings", async (req, res) => {
    settings = { ...settings, ...req.body };
    try {
        await fsPromises.writeFile('local-settings.json', JSON.stringify(settings));
    } catch(e) {}
    
    if (isDBConnected()) {
        try {
            await models.Setting.upsert({
                key: 'global_settings',
                value: settings
            });
        } catch(e) {
            console.error('Failed to save settings to DB:', e);
        }
    }
    
    res.json({ settings, dbStatus: isDBConnected() ? "Connected successfully" : "Not connected" });
  });

  // 8. AI Generator Endpoint
  app.post("/api/ai/generate", async (req, res) => {
    const { prompt, context } = req.body;
    const response = await generateAIResponse(prompt, context);
    res.json({ result: response });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend Server running on port ${PORT}`);
  });
}

startServer();
