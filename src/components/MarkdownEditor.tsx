import React, { useRef } from 'react';
import { Bold, Italic, List } from 'lucide-react';
import { cn } from '../utils';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSyntax = (syntax: string, wrapper: boolean = false) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    let newText = '';
    let newSelectionStart = start;
    let newSelectionEnd = end;

    if (wrapper) {
      // For bold and italic e.g., **text**
      const selectedContent = text.substring(start, end);
      newText = text.substring(0, start) + syntax + selectedContent + syntax + text.substring(end);
      newSelectionStart = start + syntax.length;
      newSelectionEnd = end + syntax.length;
    } else {
      // For lists e.g., - item
      newText = text.substring(0, start) + syntax + text.substring(end);
      newSelectionStart = start + syntax.length;
      newSelectionEnd = start + syntax.length;
    }

    onChange(newText);
    
    // Set focus back and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
    }, 0);
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden flex flex-col focus-within:border-primary-500/50 transition-colors">
      <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-white/10 px-2 py-1 bg-white dark:bg-black/40">
        <button
          type="button"
          onClick={() => insertSyntax('**', true)}
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('*', true)}
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
        <button
          type="button"
          onClick={() => insertSyntax('- ')}
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full p-3 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none resize-y min-h-[100px] custom-scrollbar"
      />
    </div>
  );
}
