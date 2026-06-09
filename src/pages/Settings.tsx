import React, { useState, useEffect } from 'react';
import { Settings2, Save, Loader2, Key, Bell, Phone, Smartphone, QrCode, Database } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<any>({
    geminiApiKey: "",
    ollamaUrl: "https://ollama.com",
    ollamaModel: "llama3",
    ollamaApiKey: "",
    autoReplyEnabled: false,
    dbHost: "",
    dbPort: "3306",
    dbUser: "",
    dbPassword: "",
    dbName: "simplystart"
  });
  const [dbStatus, setDbStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // WhatsApp State
  const [waLoading, setWaLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    fetchSettings();
    let interval: any;
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        const data = await res.json();
        setConnected(data.connected);
        if (data.qr) {
          setQr(data.qr);
        }
      } catch (error) {} finally {
        setWaLoading(false);
      }
    };
    checkStatus();
    interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data.settings);
      setDbStatus(data.dbStatus || "Not connected");
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDbStatus("Connecting...");
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      setDbStatus(data.dbStatus || "Not connected");
    } catch (e) {} finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      const data = await res.json();
      if (!data.connected) {
         setConnected(false);
         setQr("");
      }
    } finally {
      setConnecting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="font-bold tracking-tight text-2xl text-slate-900 dark:text-white">Platform Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure integrations, AI models, and WhatsApp connectivity.</p>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-8">
        <h3 className="font-bold tracking-tight text-lg text-slate-900 dark:text-white mb-6 flex items-center">
          <Smartphone className="w-5 h-5 mr-3 text-primary-500" /> WhatsApp Device Link
        </h3>
        {waLoading ? (
           <div className="py-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        ) : connected ? (
           <div className="flex items-center justify-between p-6 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-500/20 rounded-xl">
             <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="text-slate-900 dark:text-white font-medium">WhatsApp Connected</h4>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 uppercase tracking-widest font-mono">Session Active</p>
                </div>
             </div>
             <button
               onClick={handleDisconnect}
               disabled={connecting}
               className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 rounded-full text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
             >
               {connecting ? "Disconnecting..." : "Disconnect"}
             </button>
           </div>
        ) : (
           <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-slate-50 dark:bg-black/20 rounded-xl">
             <div className="flex-1 space-y-4">
               <p className="text-sm text-slate-600 dark:text-slate-400">Link your WhatsApp account to enable automated campaigns, order notifications, and live chat sync.</p>
               <ol className="text-xs text-slate-500 space-y-2 mt-4">
                 <li>1. Open WhatsApp on your phone</li>
                 <li>2. Tap Menu or Settings and select Linked Devices</li>
                 <li>3. Tap on Link a Device</li>
                 <li>4. Point your phone to this screen to capture the code</li>
               </ol>
             </div>
             <div className="flex flex-col items-center space-y-4">
               <div className="bg-white p-2 rounded-xl">
                 {qr ? (
                   <img src={qr} alt="QR Code" className="w-48 h-48 block" />
                 ) : (
                   <div className="w-48 h-48 border border-slate-200 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400">
                     <Loader2 className="w-8 h-8 animate-spin mb-2" />
                     <span className="text-[10px] uppercase tracking-widest">Generating QR...</span>
                   </div>
                 )}
               </div>
               <button
                 onClick={handleDisconnect}
                 disabled={connecting}
                 className="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
               >
                 {connecting ? "Restarting..." : "Refresh QR Code"}
               </button>
             </div>
           </div>
        )}
      </div>

      {/* AI & Database Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-8 space-y-6">
        <h3 className="font-bold tracking-tight text-lg text-slate-900 dark:text-white pb-4 border-b border-slate-200 dark:border-white/5 flex items-center">
          <Database className="w-5 h-5 mr-3 text-primary-500" /> Database Connection
        </h3>
        
        <div className="space-y-4">
           {dbStatus.includes('Connected') ? (
             <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-500/20 rounded-xl p-6">
               <h4 className="text-primary-600 dark:text-primary-400 font-medium">
                 Database Connected
               </h4>
               <p className="text-xs text-primary-600/80 dark:text-primary-400/80 mt-1">
                 Connection parameters are successfully loaded via environment variables.
               </p>
             </div>
           ) : (
             <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-6">
               <h4 className="text-slate-900 dark:text-white font-medium">
                 Database Not Connected
               </h4>
               <p className="text-xs text-slate-500 mt-1">
                 Please configure your database connection parameters in the .env file.
               </p>
             </div>
           )}
        </div>

        <h3 className="font-bold tracking-tight text-lg text-slate-900 dark:text-white pt-6 mb-6 flex items-center">
          <Key className="w-5 h-5 mr-3 text-primary-500" /> AI Integrations
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Gemini API Key</label>
            <input 
              type="password" 
              value={settings.geminiApiKey} 
              onChange={e => setSettings({...settings, geminiApiKey: e.target.value})} 
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" 
              placeholder="AIzaSy..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Ollama URL (Local AI)</label>
              <input 
                type="text" 
                value={settings.ollamaUrl} 
                onChange={e => setSettings({...settings, ollamaUrl: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" 
                placeholder="https://ollama.com"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Ollama Model</label>
              <input 
                type="text" 
                value={settings.ollamaModel} 
                onChange={e => setSettings({...settings, ollamaModel: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" 
                placeholder="llama3"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Ollama API Key (Optional)</label>
            <input 
              type="password" 
              value={settings.ollamaApiKey} 
              onChange={e => setSettings({...settings, ollamaApiKey: e.target.value})} 
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" 
              placeholder="Bearer Token or Key for hosted Ollama instances"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
          <label className="flex items-center space-x-3 cursor-pointer">
             <input type="checkbox" checked={settings.autoReplyEnabled} onChange={e => setSettings({...settings, autoReplyEnabled: e.target.checked})} className="w-4 h-4 rounded border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/20 text-primary-500 focus:ring-primary-500" />
             <div>
               <p className="text-sm text-slate-900 dark:text-white font-medium">Enable AI Auto-Responder</p>
               <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Responds automatically to unhandled queries</p>
             </div>
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-[10px] uppercase tracking-widest rounded-full hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors flex items-center disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
