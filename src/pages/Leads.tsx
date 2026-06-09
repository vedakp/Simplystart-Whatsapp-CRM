import React, { useState, useEffect } from 'react';
import { Target, Plus, Loader2, DollarSign, Mail, Phone, Calendar, AlignLeft, Edit2 } from 'lucide-react';
import { cn } from '../utils';
import MarkdownEditor from '../components/MarkdownEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', value: 0, notes: '' });

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(data);
    } catch(e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
      await fetchLeads();
      setShowCreate(false);
      setNewLead({ name: '', phone: '', email: '', value: 0 });
    } catch(e) {} finally {
      setIsCreating(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const original = leads;
    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch(e) {
      setLeads(original); // revert on auth/error
    }
  };

  const columns = ["New", "Contacted", "Qualified", "Converted", "Lost"];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-bold tracking-tight text-2xl text-slate-900 dark:text-white">Lead Management</h2>
          <p className="text-xs text-slate-500 mt-1">Track potential customers through your pipeline.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-[10px] rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 uppercase tracking-widest transition-colors flex items-center"
        >
          <Plus className="w-3.5 h-3.5 mr-2" />
          Add Lead
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map(status => (
            <div key={status} className="w-80 flex flex-col bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 overflow-hidden">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">{status}</h3>
                <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-500 px-2 rounded-full border border-slate-200 dark:border-white/10">
                  {leads.filter(l => l.status === status).length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {leads.filter(l => l.status === status).map(lead => (
                  <div key={lead.id} className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 p-4 rounded-xl hover:border-primary-500/30 transition-colors group">
                    <div className="font-medium text-slate-900 dark:text-white text-sm mb-2">{lead.name}</div>
                    
                    {lead.phone && <div className="flex items-center text-[10px] text-slate-500 mb-1"><Phone className="w-3 h-3 mr-1.5 shrink-0" /> <span className="truncate">{lead.phone}</span></div>}
                    {lead.email && <div className="flex items-center text-[10px] text-slate-500 mb-3 truncate"><Mail className="w-3 h-3 mr-1.5 shrink-0" /> <span className="truncate">{lead.email}</span></div>}
                    
                    {lead.notes && (
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 p-2 rounded-lg mb-3">
                        <div className="flex items-center text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest"><AlignLeft className="w-3 h-3 mr-1"/> Notes</div>
                        <div className="prose prose-sm dark:prose-invert prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0 text-[10px] max-h-24 overflow-y-auto custom-scrollbar pr-1">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{lead.notes}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-200 dark:border-white/5">
                      <span className="text-xs text-primary-400 font-mono font-medium">${lead.value}</span>
                      <select 
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className="bg-transparent text-[10px] uppercase font-bold text-slate-500 hover:text-primary-400 focus:outline-none tracking-widest cursor-pointer"
                      >
                       {columns.map(c => <option key={c} value={c} className="text-white dark:text-slate-900 bg-slate-900 dark:bg-white">{c}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
         <div className="fixed inset-0 bg-slate-50 dark:bg-[#0a0b0d]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#07080a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">New Lead</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
               <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Full Name</label>
                  <input required type="text" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Phone</label>
                  <input type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Email</label>
                  <input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Potential Value ($)</label>
                  <input type="number" value={newLead.value} onChange={e => setNewLead({...newLead, value: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Description / Notes</label>
                  <MarkdownEditor 
                     value={newLead.notes} 
                     onChange={(val) => setNewLead({...newLead, notes: val})} 
                     placeholder="Lead description, requirements, etc..." 
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/5 space-x-3">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={isCreating} className="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full transition-colors flex items-center">
                    {isCreating ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                    Save Lead
                  </button>
                </div>
            </form>
          </div>
         </div>
      )}
    </div>
  );
}
