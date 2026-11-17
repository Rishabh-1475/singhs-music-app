'use client';

import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';

interface SongCardProps {
  song?: any;
  track?: any;
  allSongs?: any[];
  tracks?: any[];
}

export default function SongCard({ song, track, allSongs, tracks }: SongCardProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  const activeSong = track || song;
  const queue = tracks || allSongs || (activeSong ? [activeSong] : []);

  const [imgSrc, setImgSrc] = useState(
    activeSong?.albumArt || activeSong?.image || '/creator.jpg'
  );

  useEffect(() => {
    if (activeSong) {
      setImgSrc(activeSong.albumArt || activeSong.image || '/creator.jpg');
    }
  }, [activeSong]);

  if (!activeSong) return null;

  const isCurrent = currentTrack?.id === activeSong.id;

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(activeSong, queue);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer ${
        isCurrent
          ? isPlaying
            ? 'ring-2 ring-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
            : 'ring-1 ring-emerald-500/50 bg-emerald-500/5'
          : ''
      }`}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-900 shadow-lg">
        <img
          src={imgSrc}
          alt={activeSong.name || activeSong.title || 'Track'}
          onError={() => setImgSrc('/creator.jpg')}
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
          {activeSong.name || activeSong.title || 'Unknown Track'}
        </h4>
        <p className="text-xs text-neutral-400 truncate mt-0.5">
          {activeSong.artist || activeSong.singers || 'SMC Music'}
        </p>
      </div>
    </div>
  );
}
