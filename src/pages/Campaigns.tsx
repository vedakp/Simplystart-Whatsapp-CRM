import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareShare, Plus, Loader2, Send, RefreshCw, Users, Info, Sparkles, X } from 'lucide-react';
import { cn } from '../utils';
import AIPromptModal from '../components/AIPromptModal';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');
  
  const [messageTemplate, setMessageTemplate] = useState('');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [targetTags, setTargetTags] = useState('');
  const [targetGroups, setTargetGroups] = useState<string[]>([]);

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

  const getPreviewTargets = () => {
    let targets: any[] = [];
    
    if (targetGroups.length > 0) {
       targets = targets.concat(groups.filter(c => targetGroups.includes(c.id)));
    }

    const tagList = targetTags.split(',').map(s => s.trim()).filter(Boolean);
    if (tagList.length > 0) {
      targets = targets.concat(contacts.filter(c => c.tags && c.tags.some((t: string) => tagList.includes(t))));
    }
    
    if (selectedContacts.length > 0) {
      targets = targets.concat(contacts.filter(c => selectedContacts.includes(c.id)));
    }

    if (!tagList.length && !targetGroups.length && !selectedContacts.length) {
      targets = targets.concat(contacts);
    }

    // Deduplicate
    targets = Array.from(new Set(targets.map(a => a.id))).map(id => {
      return targets.find(a => a.id === id);
    });

    return targets;
  };

  const previewTargets = getPreviewTargets();

  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [mediaList, setMediaList] = useState<any[]>([]);

  useEffect(() => {
    fetchMediaList();
  }, []);

  const fetchMediaList = async () => {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      setMediaList(data);
    } catch {}
  };

  const handleUploadInline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData });
      const data = await res.json();
      setImageUrl(data.url);
      await fetchMediaList();
    } catch {}
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 4) {
      nextStep();
      return;
    }
    
    setIsCreating(true);
    
    const resolvedTags = targetTags.split(',').map(s => s.trim()).filter(Boolean);
    
    const payload = {
      name: campaignName,
      messageTemplate,
      image: imageUrl,
      delaySeconds,
      targetTags: resolvedTags,
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
      
      setCampaignName('');
      setMessageTemplate('');
      setSelectedContacts([]);
      setTargetTags('');
      setTargetGroups([]);
      setImageUrl('');
      setStep(1);
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
              <div className="flex items-center justify-between mb-4">
                 {[1, 2, 3, 4].map(s => (
                    <div key={s} className="flex items-center">
                       <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors", step >= s ? "bg-primary-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500")}>
                         {s}
                       </div>
                       {s < 4 && <div className={cn("w-8 h-1 mx-1 rounded-full", step > s ? "bg-primary-500" : "bg-slate-200 dark:bg-white/10")} />}
                    </div>
                 ))}
              </div>

              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Campaign Name</label>
                    <input 
                      required
                      name="name"
                      type="text" 
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      placeholder="e.g. Summer Promo" 
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                    />
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
                      rows={6}
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      placeholder="Hello {{name}}, check out our new update..." 
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Target Tags (comma separated)</label>
                    <input 
                      name="tags"
                      type="text"
                      value={targetTags}
                      onChange={e => setTargetTags(e.target.value)}
                      placeholder="e.g. VIP, Customer" 
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Target WhatsApp Groups</label>
                    <select 
                      name="groups"
                      multiple
                      value={targetGroups}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setTargetGroups(options);
                      }}
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500/50 transition-colors text-sm min-h-[80px]"
                    >
                      <option disabled value="" className="text-slate-500 italic">Select groups (Ctrl/Cmd to pick multiple)</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
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
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Select Media (Optional)</label>
                    <div className="grid grid-cols-3 gap-2 mb-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      {mediaList.map(item => (
                         <div 
                           key={item.id} 
                           onClick={() => setImageUrl(imageUrl === item.url ? '' : item.url)}
                           className={cn("cursor-pointer border-2 rounded-lg overflow-hidden aspect-square transition-all", imageUrl === item.url ? 'border-primary-500 scale-[0.98]' : 'border-slate-200 dark:border-white/10 hover:border-primary-300')}
                         >
                           <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
                         </div>
                      ))}
                    </div>
                    <label className="flex items-center justify-center w-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-dashed border-slate-300 dark:border-white/20 p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors">
                      <input type="file" onChange={handleUploadInline} className="hidden" accept="image/*" />
                      + Upload New Image
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Delay per message (sec)</label>
                    <input 
                      name="delay"
                      type="number"
                      min="1"
                      value={delaySeconds}
                      onChange={e => setDelaySeconds(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-slate-100 dark:bg-black/40 rounded-lg border border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold text-primary-500">Target Audience</span>
                      <span className="text-xs font-bold bg-white dark:bg-black px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">{previewTargets.length}</span>
                    </div>
                    <div className="max-h-24 overflow-y-auto custom-scrollbar">
                      {previewTargets.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {previewTargets.slice(0, 20).map(t => (
                            <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              {t.name}
                            </span>
                          ))}
                          {previewTargets.length > 20 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded text-slate-500">+{previewTargets.length - 20} more</span>
                          )}
                        </div>
                      ) : (
                         <span className="text-xs text-slate-400 italic">No contacts matched</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 p-4 rounded-lg flex flex-col items-start">
                    <h4 className="font-bold text-xs mb-1 text-slate-900 dark:text-white">{campaignName || 'Unnamed'}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-2 w-full">{messageTemplate || 'No message'}</p>
                    {imageUrl && <img src={imageUrl} alt="attached" className="w-16 h-16 object-cover rounded-md border border-slate-200 dark:border-white/10 mb-2" />}
                    <p className="text-[10px] text-slate-500 font-mono">Delay: {delaySeconds}s</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
                {step > 1 ? (
                   <button type="button" onClick={prevStep} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                     Back
                   </button>
                ) : <div/>}
                
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full font-semibold transition-colors flex items-center justify-center disabled:opacity-50 text-[10px] uppercase tracking-widest"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {step < 4 ? 'Next Step' : (isCreating ? 'Creating...' : 'Launch Campaign')}
                </button>
              </div>

            </form>

      <AIPromptModal 
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onGenerate={async (prompt) => {
          const res = await fetch('/api/ai/generate', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
               prompt: prompt,
               context: "You are an expert marketing copywriter for WhatsApp. Write a short, engaging broadcast message based on the user's prompt. Use placeholders like {{name}} where appropriate. Do NOT include any conversation context, just the final template text."
            })
          });
          const data = await res.json();
          if (data.result) {
            setMessageTemplate(data.result);
          }
        }}
      />
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
