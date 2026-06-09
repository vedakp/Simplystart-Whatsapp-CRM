import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareShare, Plus, Loader2, Send, RefreshCw, Users, Info, Sparkles, X } from 'lucide-react';
import { cn } from '../utils';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');
  
  const [messageTemplate, setMessageTemplate] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const filteredCampaigns = campaigns.filter(camp => {
    if (filter === 'Running') return camp.status === 'Sending';
    if (filter === 'Completed') return camp.status === 'Completed';
    return true;
  });

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data.reverse());
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
       const res = await fetch('/api/groups');
       const data = await res.json();
       setGroups(data);
    } catch(e) {}
  };

  const fetchContacts = async () => {
    try {
       const res = await fetch('/api/contacts');
       const data = await res.json();
       setContacts(data);
    } catch(e) {}
  };

  useEffect(() => {
    fetchCampaigns();
    fetchGroups();
    fetchContacts();
    
    const iv = setInterval(() => {
      fetchCampaigns();
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           prompt: aiPrompt,
           context: "You are an expert marketing copywriter for WhatsApp. Write a short, engaging broadcast message based on the user's prompt. Use placeholders like {{name}} where appropriate. Do NOT include any conversation context, just the final template text."
        })
      });
      const data = await res.json();
      if (data.result) {
        setMessageTemplate(data.result);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setAiGenerating(false);
      setAiModalOpen(false);
      setAiPrompt('');
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    
    const formData = new FormData(e.currentTarget);
    const targetTags = formData.get('tags')?.toString().split(',').map(s => s.trim()).filter(Boolean) || [];
    
    // get selected groups
    const select = e.currentTarget.elements.namedItem('groups') as HTMLSelectElement;
    const targetGroups = Array.from(select.selectedOptions).map(opt => opt.value).filter(Boolean);

    const payload = {
      name: formData.get('name'),
      messageTemplate: messageTemplate,
      targetTags,
      targetGroups,
      targetContacts: selectedContacts
    };

    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await fetchCampaigns();
      (e.target as HTMLFormElement).reset();
      setMessageTemplate('');
      setSelectedContacts([]);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold tracking-tight text-2xl text-slate-900 dark:text-white">Message Campaigns</h2>
          <p className="text-xs text-slate-500 mt-1">Send bulk WhatsApp messages to contact segments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-white/[0.02] border text-sm border-slate-200 dark:border-white/5 rounded-2xl p-6 sticky top-6">
            <h3 className="font-bold tracking-tight text-base text-slate-900 dark:text-white mb-6 flex items-center">
              New Campaign
            </h3>
            
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Campaign Name</label>
                <input 
                  required
                  name="name"
                  type="text" 
                  placeholder="e.g. Summer Promo" 
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Target Tags (comma separated)</label>
                <input 
                  name="tags"
                  type="text" 
                  placeholder="e.g. VIP, Customer" 
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Target WhatsApp Groups</label>
                <select 
                  name="groups"
                  multiple
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500/50 transition-colors text-sm min-h-[80px]"
                >
                  <option disabled value="" className="text-slate-500 italic">Select groups (Ctrl/Cmd to pick multiple)</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-600 mt-2">Leave tags and groups empty to message all contacts.</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Target Contacts (Optional)</label>
                <div className="max-h-32 overflow-y-auto w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-slate-900 dark:text-white space-y-1">
                  {contacts.map(c => (
                     <label key={c.id} className="flex items-center space-x-2 text-sm cursor-pointer p-1 hover:bg-slate-200 dark:hover:bg-white/5 rounded">
                       <input 
                          type="checkbox" 
                          checked={selectedContacts.includes(c.id)}
                          onChange={(e) => {
                             if(e.target.checked) setSelectedContacts([...selectedContacts, c.id]);
                             else setSelectedContacts(selectedContacts.filter(id => id !== c.id));
                          }}
                          className="rounded border-slate-300 dark:border-white/20 text-primary-500 focus:ring-primary-500" 
                       />
                       <span>{c.name}</span>
                     </label>
                  ))}
                  {contacts.length === 0 && <div className="text-xs text-slate-500 p-1">No contacts available</div>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex justify-between">
                  <span>Message Body <span className="text-primary-500 ml-1">Use {'{{name}}'}</span></span>
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); setAiModalOpen(true); }}
                    className="text-purple-500 hover:text-purple-400 flex items-center transition-colors"
                  >
                     <Sparkles className="w-3 h-3 mr-1" />
                     Auto-Write
                  </button>
                </label>
                <textarea 
                  required
                  name="messageTemplate"
                  rows={5}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="Hello {{name}}, check out our new update..." 
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full font-semibold transition-colors flex items-center justify-center disabled:opacity-50 text-[10px] uppercase tracking-widest mt-4"
              >
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {isCreating ? 'Launching...' : 'Launch Campaign'}
              </button>
            </form>

            {/* AI Generator Modal */}
            {aiModalOpen && (
              <div className="absolute inset-0 bg-white/80 dark:bg-[#07080a]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
                <div className="bg-white dark:bg-[#0a0b0d] border border-slate-200 dark:border-white/10 p-5 rounded-2xl w-full max-w-sm shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold tracking-tight text-[15px] text-slate-900 dark:text-white flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-purple-500" /> AI Writer
                    </h3>
                    <button onClick={() => setAiModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleAIGenerate}>
                    <textarea
                      autoFocus
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="E.g., Write a festive 20% off promo..."
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-purple-500/50 resize-none h-24 mb-3"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={aiGenerating || !aiPrompt.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center disabled:opacity-50"
                      >
                        {aiGenerating ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
                        Generate
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center">
                 <h3 className="font-bold tracking-tight text-base text-slate-900 dark:text-white">Campaign Pulse</h3>
                 {campaigns.some(c => c.status === 'Sending') && (
                   <span className="ml-4 px-2 py-0.5 text-[10px] bg-primary-900/20 text-primary-400 border border-primary-500/20 rounded uppercase tracking-widest font-bold animate-pulse">Running Background Engine</span>
                 )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex bg-slate-50 dark:bg-black/20 rounded-lg p-1 border border-slate-200 dark:border-white/5">
                   {['All', 'Running', 'Completed'].map(f => (
                     <button
                       key={f}
                       onClick={() => setFilter(f)}
                       className={cn(
                         "px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-md transition-colors",
                         filter === f ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
                       )}
                     >
                       {f}
                     </button>
                   ))}
                </div>
                <button onClick={fetchCampaigns} className="text-[10px] text-slate-500 underline uppercase tracking-tighter hover:text-primary-400 transition-colors" title="Refresh">
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex h-full justify-center items-center py-20 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  No {filter.toLowerCase()} campaigns found.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.map((camp) => (
                    <div key={camp.id} className="p-5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:bg-white/[0.05] transition-colors relative overflow-hidden">
                      {camp.status === 'Sending' && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-medium text-slate-200 text-sm">{camp.name}</div>
                        <span className={cn(
                          "px-2 py-1 text-[10px] uppercase font-bold rounded",
                          camp.status === 'Completed' ? "bg-primary-900/20 text-primary-500 border border-primary-500/20" :
                          camp.status === 'Failed' ? "bg-rose-900/20 text-rose-500 border border-rose-500/20" :
                          "bg-amber-900/20 text-amber-500 border border-amber-500/20"
                        )}>
                          {camp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 bg-slate-50 dark:bg-black/20 p-3 rounded-lg border border-slate-200 dark:border-white/5 font-mono">
                        {camp.messageTemplate}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">
                          <span>Progress</span>
                          <span className={camp.sentCount === camp.targets ? "text-primary-400" : ""}>{camp.sentCount || 0} / {camp.targets} Sent</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                          <div 
                            className={cn("h-full transition-all duration-500 rounded-full", camp.status === 'Completed' ? "bg-primary-500" : "bg-amber-500")}
                            style={{ width: `${Math.min(100, Math.max(0, ((camp.sentCount || 0) / Math.max(1, camp.targets)) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold border-t border-slate-200 dark:border-white/5 pt-3">
                        <span className="flex items-center"><Users className="w-3 h-3 mr-1.5 opacity-70" /> {camp.targets} target{camp.targets !== 1 ? 's' : ''}</span>
                        <span>{new Date(camp.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
