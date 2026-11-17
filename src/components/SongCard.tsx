'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { DEFAULT_COVER } from '@/services/api';

interface SongCardProps {
  song?: any;
  track?: any;
  allSongs?: any[];
  tracks?: any;
}

export default function SongCard({ song, track, allSongs, tracks }: SongCardProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  const active = track || song;
  const queue = tracks || allSongs || (active ? [active] : []);

  const [imgSrc, setImgSrc] = useState<string>('');

  if (!active) return null;

  const isCurrent = currentTrack?.id === active.id;

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(active, queue);
    }
  };

  const currentDisplayImage =
    imgSrc ||
    active.albumArt ||
    active.image ||
    DEFAULT_COVER;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer ${
        isCurrent
          ? isPlaying
            ? 'ring-2 ring-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/25 scale-[1.02]'
            : 'ring-1 ring-emerald-500/50 bg-emerald-500/5'
          : ''
      }`}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-900 shadow-md">
        <img
          src={currentDisplayImage}
          alt={active.name || active.title || 'Track'}
          onError={() => setImgSrc(DEFAULT_COVER)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div
          className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 transform active:scale-90 transition ${
              isCurrent && isPlaying ? 'ring-2 ring-white animate-pulse' : ''
            }`}
          >
            {isCurrent && isPlaying ? (
              <span className="text-sm font-bold">⏸</span>
            ) : (
              <span className="text-sm font-bold ml-0.5">▶</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <h4
          className={`font-semibold text-sm truncate ${
            isCurrent ? 'text-emerald-400 font-bold' : 'text-white'
          }`}
        >
          {active.name || active.title || 'Unknown Track'}
        </h4>
        <p className="text-xs text-neutral-400 truncate mt-0.5">
          {active.artist || active.singers || 'SMC Music'}
        </p>
      </div>
    </div>
  );
}
