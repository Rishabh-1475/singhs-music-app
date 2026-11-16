'use client';

import { X, Link as LinkIcon, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { useLibraryStore } from '@/store/libraryStore';
import { Track } from '@/types/track';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const importTrack = useLibraryStore((s) => s.importTrack);

  if (!isOpen) return null;

  const handleUrlImport = () => {
    if (!url.trim()) return;
    const track: Track = {
      id: `imported-${Date.now()}`,
      title: title.trim() || 'Custom Studio Master',
      artist: artist.trim() || 'Independent Artist',
      album: 'Studio Import',
      albumArt: `https://picsum.photos/seed/imp${Date.now()}/500/500`,
      artwork: `https://picsum.photos/seed/imp${Date.now()}/500/500`,
      duration: 0,
      url: url.trim(),
      audioUrl: url.trim(),
      genre: 'Custom',
    };
    importTrack(track);
    setUrl('');
    setTitle('');
    setArtist('');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const track: Track = {
      id: `local-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ''),
      artist: 'Local Vinyl File',
      album: 'Uploaded',
      albumArt: `https://picsum.photos/seed/local${Date.now()}/500/500`,
      artwork: `https://picsum.photos/seed/local${Date.now()}/500/500`,
      duration: 0,
      url: objectUrl,
      audioUrl: objectUrl,
      genre: 'Local',
    };
    importTrack(track);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-saviom-card p-6 sm:p-8 shadow-2xl border border-saviom-border">
        <div className="mb-6 flex items-center justify-between border-b border-saviom-border/60 pb-3">
          <div>
            <h2 className="font-mono text-sm font-black uppercase tracking-wider text-saviom-black">
              INGEST CUSTOM AUDIO
            </h2>
            <p className="font-mono text-[10px] text-saviom-muted uppercase">
              STUDIO ARCHIVE IMPORT
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-saviom-muted hover:text-saviom-black"
          >
            <X size={18} />
          </button>
        </div>

        {/* URL Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-saviom-muted">
            <LinkIcon size={14} />
            <span className="font-mono text-xs uppercase font-bold tracking-wider text-saviom-black">
              Import from Direct URL
            </span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Track title..."
            className="w-full rounded-lg bg-saviom-hover px-3.5 py-2.5 font-mono text-xs text-saviom-black outline-none border border-saviom-border focus:border-saviom-black"
          />
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist name..."
            className="w-full rounded-lg bg-saviom-hover px-3.5 py-2.5 font-mono text-xs text-saviom-black outline-none border border-saviom-border focus:border-saviom-black"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/stream.mp3"
            className="w-full rounded-lg bg-saviom-hover px-3.5 py-2.5 font-mono text-xs text-saviom-black outline-none border border-saviom-border focus:border-saviom-black"
          />
          <button
            onClick={handleUrlImport}
            disabled={!url.trim()}
            className="w-full rounded-full bg-saviom-black py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-saviom-accent disabled:opacity-40"
          >
            Import Stream
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <hr className="flex-1 border-saviom-border" />
          <span className="font-mono text-[10px] text-saviom-muted uppercase">
            OR
          </span>
          <hr className="flex-1 border-saviom-border" />
        </div>

        {/* Local File Input */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-saviom-border bg-saviom-hover py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-saviom-black transition-colors hover:border-saviom-black"
        >
          <Upload size={14} />
          Upload Local MP3 File
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
