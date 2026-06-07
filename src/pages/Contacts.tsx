import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, Search, Loader2, Tag, X } from 'lucide-react';
import { cn } from '../utils';

export default function Contacts() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  
  // Tag Management State
  const [editingContact, setEditingContact] = useState<any>(null);
  const [newTag, setNewTag] = useState('');
  const [contactTags, setContactTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Auto refresh
  useEffect(() => {
    fetchContacts();
    const iv = setInterval(fetchContacts, 10000);
    return () => clearInterval(iv);
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setContacts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/contacts/sync', { method: 'POST' });
      await fetchContacts();
    } finally {
      setSyncing(false);
    }
  };

  const openTagModal = (contact: any) => {
    setEditingContact(contact);
    setContactTags([...(contact.tags || [])]);
    setNewTag('');
  };

  const saveTags = async () => {
    if (!editingContact) return;
    setIsSaving(true);
    try {
      await fetch(`/api/contacts/${editingContact.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: contactTags })
      });
      await fetchContacts();
      setEditingContact(null);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-3xl text-slate-900 dark:text-white">Phonebook Contacts</h2>
          <p className="text-xs text-slate-500 mt-1">Manage and sync your connected contacts.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full font-semibold transition-colors disabled:opacity-50 text-[10px] uppercase tracking-widest"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", syncing && "animate-spin")} />
          {syncing ? "Syncing..." : "Background Sync"}
        </button>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No contacts found.
            </div>
          ) : (
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-white/5">
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold">Phone / JID</th>
                  <th className="px-6 py-4 font-bold">Tags</th>
                  <th className="px-6 py-4 font-bold flex justify-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-sm">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-white dark:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center text-slate-900 dark:text-white font-medium">
                        <div className="w-8 h-8 rounded-full border border-emerald-500/20 bg-emerald-900/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] mr-3">
                          {contact.name?.charAt(0) || '?'}
                        </div>
                        {contact.name || contact.phone}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {contact.jid || contact.phone}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2 flex-wrap max-w-xs">
                        {contact.tags?.length ? contact.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                            {tag}
                          </span>
                        )) : (
                          <span className="text-[10px] text-slate-600 uppercase tracking-widest">No Tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 flex justify-end">
                       <button
                        onClick={() => openTagModal(contact)}
                        className="text-slate-900 dark:text-white border border-slate-300 dark:border-white/20 rounded-full px-4 py-1.5 text-[10px] hover:bg-slate-200 dark:bg-white/10 transition-colors uppercase tracking-widest font-semibold flex items-center"
                      >
                         <Tag className="w-3 h-3 mr-2" />
                        Edit Tags
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editingContact && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-[#0a0b0d]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#07080a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="font-serif text-xl text-slate-900 dark:text-white">Manage Tags</h3>
              <button onClick={() => setEditingContact(null)} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Assign tags to <strong className="text-slate-900 dark:text-white">{editingContact.name}</strong> to easily group them for campaigns.</p>
              
              <div className="mb-6 flex flex-wrap gap-2">
                {contactTags.map(t => (
                  <div key={t} className="flex items-center px-3 py-1.5 bg-emerald-900/20 border border-emerald-500/20 rounded text-emerald-400 text-xs font-bold tracking-wider uppercase">
                    {t}
                    <button onClick={() => setContactTags(contactTags.filter(x => x !== t))} className="ml-2 hover:text-rose-400"><X className="w-3.5 h-3.5"/></button>
                  </div>
                ))}
                {contactTags.length === 0 && <p className="text-xs text-slate-600 uppercase tracking-widest">No tags assigned yet.</p>}
              </div>

              <div className="flex gap-2 mb-2">
                <input
                   type="text"
                   value={newTag}
                   onChange={e => setNewTag(e.target.value)}
                   onKeyDown={e => {
                     if (e.key === 'Enter' && newTag.trim()) {
                       setContactTags(Array.from(new Set([...contactTags, newTag.trim()])));
                       setNewTag('');
                     }
                   }}
                   placeholder="Add new tag (e.g. VIP)"
                   className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                   onClick={() => {
                     if (newTag.trim()) {
                       setContactTags(Array.from(new Set([...contactTags, newTag.trim()])));
                       setNewTag('');
                     }
                   }}
                   className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="flex justify-end p-5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 gap-3">
               <button onClick={() => setEditingContact(null)} className="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">Cancel</button>
               <button onClick={saveTags} disabled={isSaving} className="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full transition-colors flex items-center">
                 {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                 Save Tags
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
