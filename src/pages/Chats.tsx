import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, ShoppingCart, User } from 'lucide-react';
import { cn } from '../utils';
import { useNavigate } from 'react-router-dom';

export default function Chats() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      setChats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    
    setSending(true);
    try {
      await fetch(`/api/chats/${selectedChat.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });
      setNewMessage('');
      fetchMessages();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      {/* Sidebar - Chat List */}
      <div className="w-full md:w-80 flex flex-col bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shrink-0">
        <div className="p-5 border-b border-slate-200 dark:border-white/5">
          <h2 className="font-serif text-xl text-slate-900 dark:text-white flex items-center">
            <MessageCircle className="w-5 h-5 mr-3 text-emerald-500" />
            Live Chats
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : chats.length === 0 ? (
             <div className="text-center py-10 text-slate-500 text-xs uppercase tracking-widest font-mono">
               No recent chats
             </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-slate-100 dark:bg-white/[0.05] transition-colors flex items-center gap-4",
                    selectedChat?.id === chat.id && "bg-slate-200 dark:bg-white/[0.08]"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center shrink-0">
                     <User className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{chat.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{chat.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center">
                     <User className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{selectedChat.name}</h3>
                    <p className="text-[10px] font-mono text-slate-500">{selectedChat.phone}</p>
                  </div>
              </div>
              <button 
                onClick={() => {
                   // Navigate to Orders and pass state via location to pre-fill Create Order
                   navigate('/orders', { state: { createOrderPhone: selectedChat.phone, createOrderName: selectedChat.name } });
                }}
                className="flex items-center px-4 py-2 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-2" />
                Place Order
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
               {messages.map((msg, idx) => (
                 <div key={idx} className={cn("flex flex-col max-w-[75%]", msg.fromMe ? "ml-auto items-end" : "mr-auto items-start")}>
                   <div className={cn(
                     "p-3 rounded-2xl text-sm",
                     msg.fromMe 
                      ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-50 rounded-br-none" 
                      : "bg-slate-200 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-bl-none"
                   )}>
                     {msg.text}
                   </div>
                   <span className="text-[9px] text-slate-500 mt-1 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
               ))}
               <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 shrink-0">
               <form onSubmit={sendMessage} className="flex gap-3">
                 <input
                   type="text"
                   value={newMessage}
                   onChange={e => setNewMessage(e.target.value)}
                   placeholder="Type a message..."
                   className="flex-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-full px-5 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                 />
                 <button 
                  type="submit" 
                  disabled={sending || !newMessage.trim()}
                  className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
                >
                   {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                 </button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
            <p className="font-serif text-lg text-slate-900 dark:text-white">Select a chat to view messages</p>
            <p className="text-xs mt-2 uppercase tracking-widest font-mono">Real-time sync active</p>
          </div>
        )}
      </div>
    </div>
  );
}
