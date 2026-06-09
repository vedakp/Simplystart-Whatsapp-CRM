import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, History, Trash2 } from 'lucide-react';
import { cn } from '../utils';

type AIPromptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<void>;
};

export default function AIPromptModal({ isOpen, onClose, onGenerate }: AIPromptModalProps) {
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setShowHistory(false);
      setAiPrompt('');
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/ai/history');
      const data = await res.json();
      setHistory(data);
    } catch {
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      await onGenerate(aiPrompt);
      await fetchHistory();
    } finally {
      setAiGenerating(false);
      onClose();
    }
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai/history/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch {}
  };

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all history?")) return;
    try {
      await fetch(`/api/ai/history`, { method: 'DELETE' });
      setHistory([]);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/50 dark:bg-[#07080a]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0a0b0d] border border-slate-200 dark:border-white/10 p-5 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold tracking-tight text-[15px] text-slate-900 dark:text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-purple-500" /> AI Writer
          </h3>
          <div className="flex items-center space-x-2">
            <button 
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-1.5 rounded-lg transition-colors border text-slate-500",
                showHistory 
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400" 
                  : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-white/5"
              )}
              title="Recent Prompts"
            >
              <History className="w-4 h-4" />
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {showHistory ? (
            <div className="h-48 md:h-64 flex flex-col animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recent Prompts</span>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-[10px] text-slate-500 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center">
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {loadingHistory ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-slate-500 text-xs italic">
                    No recent prompts found.
                  </div>
                ) : (
                  history.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => { setAiPrompt(item.prompt); setShowHistory(false); }}
                      className="group flex justify-between items-start p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 hover:border-purple-500/30 cursor-pointer transition-all"
                    >
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed flex-1 pr-3">
                        {item.prompt}
                      </p>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 md:h-64 animate-in fade-in slide-in-from-left-4 duration-200">
              <textarea
                autoFocus
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to write..."
                className="w-full h-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-purple-500/50 resize-none custom-scrollbar"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-white/5 shrink-0">
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={aiGenerating || !aiPrompt.trim()}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-colors flex items-center disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {aiGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {aiGenerating ? 'Generating...' : 'Generate Text'}
          </button>
        </div>
      </div>
    </div>
  );
}
