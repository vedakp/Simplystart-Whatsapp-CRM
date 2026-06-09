import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../utils';

export default function Media() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      setMedia(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only images are supported.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch('/api/media', {
        method: 'POST',
        body: formData
      });
      await fetchMedia();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
      setMedia(media.filter(m => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto w-full p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <ImageIcon className="w-6 h-6 mr-3 text-primary-500" />
            Media Gallery
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage images for your campaigns (Max 10 files).</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
            accept="image/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || media.length >= 10}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all shadow-lg flex items-center shadow-primary-500/20"
          >
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
          <ImageIcon className="w-12 h-12 mb-4 text-slate-300 dark:text-white/20" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">No Media Found</h3>
          <p className="text-sm">Upload images to use in your campaigns.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((item) => (
            <div key={item.id} className="group relative bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden aspect-square">
              <img src={item.url} alt={item.originalName} className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-[10px] text-white truncate px-1">{item.originalName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
