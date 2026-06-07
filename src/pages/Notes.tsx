import React, { useState, useEffect } from 'react';
import { FileText, Plus, Loader2, Save, Trash2, Edit3, AlignLeft, Sparkles, X } from 'lucide-react';
import { cn } from '../utils';

export default function Notes() {
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      setNotes(data);
      if (data.length > 0 && !selectedNote) {
        selectNote(data[0]);
      }
    } catch(e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const selectNote = (note: any) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Note', content: '' })
      });
      const newNote = await res.json();
      await fetchNotes();
      selectNote(newNote);
    } catch(e) {}
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      const updated = await res.json();
      setSelectedNote(updated);
      setNotes(notes.map(n => n.id === updated.id ? updated : n));
    } catch(e) {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Are you sure?")) return;
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes(notes.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setTitle('');
        setContent('');
      }
    } catch(e) {}
  };

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
           context: "You are an AI assistant helping to write a note. Continue or generate text based on the user's prompt. Do NOT include generic conversational text, only the requested content directly, because it will be appended to the current user's note."
        })
      });
      const data = await res.json();
      if (data.result) {
        setContent(prev => prev + (prev.length > 0 ? '\n\n' : '') + data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiGenerating(false);
      setAiModalOpen(false);
      setAiPrompt('');
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      {/* Sidebar - Note List */}
      <div className="w-full md:w-72 flex flex-col bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shrink-0">
        <div className="p-5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
          <h2 className="font-serif text-xl text-slate-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-3 text-emerald-500" />
            Workspace
          </h2>
          <button onClick={handleCreate} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-lg text-slate-900 dark:text-white transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : notes.length === 0 ? (
             <div className="text-center py-10 text-slate-500 text-xs uppercase tracking-widest font-mono">
               No notes yet
             </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {notes.map(note => (
                <div
                  key={note.id}
                  className={cn(
                    "w-full text-left p-4 hover:bg-slate-100 dark:bg-white/[0.05] transition-colors flex items-center justify-between group cursor-pointer",
                    selectedNote?.id === note.id && "bg-slate-200 dark:bg-white/[0.08]"
                  )}
                  onClick={() => selectNote(note)}
                >
                  <div className="flex items-center flex-1 min-w-0 pr-4">
                    <AlignLeft className="w-4 h-4 text-slate-500 mr-3 shrink-0" />
                    <div className="truncate text-sm text-slate-900 dark:text-white font-medium">{note.title}</div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden relative">
        {aiModalOpen && (
           <div className="absolute inset-0 bg-white/80 dark:bg-[#07080a]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
              <div className="bg-white dark:bg-[#0a0b0d] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-lg text-slate-900 dark:text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                    Ask AI Writer
                  </h3>
                  <button onClick={() => setAiModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAIGenerate}>
                  <textarea
                    autoFocus
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="E.g., Write a draft email about our new product launch..."
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none h-32 mb-4"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={aiGenerating || !aiPrompt.trim()}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center disabled:opacity-50"
                    >
                      {aiGenerating ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                      Generate & Append
                    </button>
                  </div>
                </form>
              </div>
           </div>
        )}

        {selectedNote ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex justify-between items-center shrink-0">
               <div className="flex items-center text-[10px] uppercase font-bold tracking-widest text-slate-500">
                 <Edit3 className="w-3.5 h-3.5 mr-2" /> Editor
               </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setAiModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  AI Writer
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                  Save Changes
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
               <div className="max-w-3xl mx-auto h-full flex flex-col">
                 <input
                   type="text"
                   value={title}
                   onChange={e => setTitle(e.target.value)}
                   onBlur={handleSave}
                   placeholder="Note Title"
                   className="w-full bg-transparent border-none text-4xl font-serif text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none mb-8"
                 />
                 <textarea
                   value={content}
                   onChange={e => setContent(e.target.value)}
                   onBlur={handleSave}
                   placeholder="Start writing..."
                   className="flex-1 w-full bg-transparent border-none text-slate-700 dark:text-slate-300 placeholder-slate-700 focus:outline-none resize-none text-lg leading-relaxed font-sans"
                 />
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <FileText className="w-16 h-16 opacity-20 mb-4" />
            <p className="font-serif text-lg text-slate-900 dark:text-white">Select or create a note</p>
          </div>
        )}
      </div>
    </div>
  );
}
