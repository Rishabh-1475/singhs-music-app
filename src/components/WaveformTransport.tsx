'use client';

import { Play, Pause, SkipBack, SkipForward, Shuffle, Maximize2, Plus, Heart } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useState, useRef } from 'react';

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// 32 pre-computed bar heights representing a soundwave
const WAVEFORM_BARS = [
  6, 12, 18, 14, 22, 28, 16, 24, 30, 20, 15, 26, 32, 22, 18, 25, 
  30, 16, 20, 28, 32, 24, 18, 26, 15, 22, 28, 18, 24, 14, 10, 6
];

export default function WaveformTransport() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleFullScreen = usePlayerStore((s) => s.toggleFullScreen);
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);

  const { seek } = useAudioPlayer();
  const waveRef = useRef<HTMLDivElement>(null);

  const liked = currentTrack ? isLiked(currentTrack.id) : false;
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  const handleWaveClick = (e: React.MouseEvent) => {
    if (!waveRef.current || duration === 0) return;
    const rect = waveRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    seek(pct * duration);
  };

  return (
    <div className="w-full max-w-md mx-auto pt-4 space-y-4 select-none">
      {/* Title & Tag Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-deck-accent uppercase truncate font-pixel">
            {currentTrack?.title || 'The Suffering'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] font-bold px-3 py-0.5 rounded-full bg-black text-white uppercase shadow-sm">
              {currentTrack?.genre || 'Classic'}
            </span>
            <span className="font-mono text-xs text-neutral-600 uppercase truncate">
              {currentTrack?.artist || 'Singh&apos;s Music Co.'}
            </span>
          </div>
        </div>

        {/* Like Badge [+ 392] */}
        <button
          onClick={() => currentTrack && toggleLike(currentTrack)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 font-mono text-xs font-bold transition-all ${
            liked
              ? 'bg-black text-white border-black shadow'
              : 'bg-white text-black border-black hover:bg-neutral-100 shadow-sm'
          }`}
        >
          <Plus size={13} className={liked ? 'rotate-45 transition-transform' : ''} />
          <span>{liked ? '393' : '392'}</span>
        </button>
      </div>

      {/* Interactive Waveform Audio Scrubber */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-bold text-neutral-800 tabular-nums w-10 text-right">
          {formatTime(progress)}
        </span>

        {/* Soundwave Bars */}
        <div
          ref={waveRef}
          onClick={handleWaveClick}
          className="flex-1 h-10 flex items-center justify-between gap-1 cursor-pointer p-1 group"
          title="Click to seek waveform"
        >
          {WAVEFORM_BARS.map((height, i) => {
            const barPct = (i / WAVEFORM_BARS.length) * 100;
            const isFilled = barPct <= progressPct;
            return (
              <div
                key={i}
                className="flex-1 flex items-center justify-center h-full"
              >
                <div
                  className={`w-full rounded-full transition-all duration-150 ${
                    isFilled
                      ? 'bg-black group-hover:bg-neutral-800'
                      : 'bg-neutral-400 group-hover:bg-neutral-500'
                  }`}
                  style={{
                    height: `${height}px`,
                  }}
                />
              </div>
            );
          })}
        </div>

        <span className="font-mono text-xs font-bold text-neutral-800 tabular-nums w-10">
          {formatTime(duration)}
        </span>
      </div>

      {/* Transport Controls (Exact Matching Template) */}
      <div className="flex items-center justify-center gap-6 sm:gap-8 pt-1">
        {/* Fullscreen Expand */}
        <button
          onClick={toggleFullScreen}
          className="p-2 text-neutral-800 hover:text-black transition-transform hover:scale-110"
          title="Fullscreen Deck"
        >
          <Maximize2 size={18} />
        </button>

        {/* Previous Track |< */}
        <button
          onClick={prevTrack}
          className="p-2 text-neutral-900 hover:text-black transition-transform hover:scale-110"
          title="Previous Track"
        >
          <SkipBack size={22} fill="currentColor" />
        </button>

        {/* Solid Black Play / Pause Toggle Button */}
        <button
          onClick={togglePlay}
          className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black text-white shadow-xl hover:scale-105 active:scale-95 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={22} fill="currentColor" />
          ) : (
            <Play size={22} fill="currentColor" className="ml-1" />
          )}
        </button>

        {/* Next Track >| */}
        <button
          onClick={nextTrack}
          className="p-2 text-neutral-900 hover:text-black transition-transform hover:scale-110"
          title="Next Track"
        >
          <SkipForward size={22} fill="currentColor" />
        </button>

        {/* Shuffle Toggle */}
        <button
          onClick={toggleShuffle}
          className={`p-2 transition-transform hover:scale-110 ${
            isShuffled ? 'text-black font-black' : 'text-neutral-500 hover:text-black'
          }`}
          title="Shuffle"
        >
          <Shuffle size={18} />
        </button>
      </div>
    </div>
  );
}
