'use client';

import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VinylPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const { seek } = useAudioPlayer();

  const progressPercent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
  const imageSrc =
    currentTrack?.albumArt ||
    currentTrack?.artwork ||
    'https://picsum.photos/seed/vinyl/500/500';

  const trackNumStr =
    queueIndex >= 0 ? (queueIndex + 1).toString().padStart(2, '0') : '01';

  return (
    <div className="relative flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      {/* Vinyl Disc Container */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
        {/* Subtle Outer Progress Ring with Dot */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 100 100"
        >
          {/* Background circle track */}
          <circle
            cx="50"
            cy="50"
            r="48"
            className="stroke-neutral-300"
            strokeWidth="1.2"
            fill="none"
          />
          {/* Progress active arc */}
          <circle
            cx="50"
            cy="50"
            r="48"
            className="stroke-smc-accent transition-all duration-300"
            strokeWidth="2"
            strokeDasharray="301.6"
            strokeDashoffset={301.6 - (301.6 * progressPercent) / 100}
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Vinyl Disc Body */}
        <div
          onClick={togglePlay}
          className={`relative w-[90%] h-[90%] rounded-full vinyl-grooves shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-[1.02] border-4 border-neutral-900 ${
            isPlaying ? 'animate-spin-slow' : ''
          }`}
          style={{
            animationPlayState: isPlaying ? 'running' : 'paused',
          }}
          title="Click Vinyl to Play / Pause"
        >
          {/* Vinyl Sheen Overlay */}
          <div
            className="absolute inset-0 rounded-full opacity-30 pointer-events-none"
            style={{
              background:
                'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.25) 60deg, transparent 120deg, rgba(255,255,255,0.3) 240deg, transparent 300deg)',
            }}
          />

          {/* Vinyl Concentric Grooves */}
          <div className="absolute inset-4 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute inset-12 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-16 rounded-full border border-white/10 pointer-events-none" />

          {/* Center Record Label with Album Art Thumbnail */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-neutral-900 shadow-inner flex items-center justify-center bg-neutral-900 group">
            <Image
              src={imageSrc}
              alt={currentTrack?.title || 'Vinyl Center'}
              fill
              sizes="128px"
              className="object-cover"
            />
            {/* Play/Pause Hover Icon */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isPlaying ? (
                <Pause size={28} className="text-white drop-shadow" fill="white" />
              ) : (
                <Play size={28} className="text-white drop-shadow ml-1" fill="white" />
              )}
            </div>

            {/* Center Spindle Hole */}
            <div className="absolute w-5 h-5 rounded-full bg-smc-canvas border-2 border-neutral-800 shadow-inner z-10" />
          </div>
        </div>

        {/* Terracotta Indicator Dot on the Arc */}
        <div
          className="absolute w-4 h-4 rounded-full bg-smc-accent shadow-md border-2 border-white pointer-events-none transition-all duration-300"
          style={{
            top: `${
              50 - 48 * Math.cos((progressPercent / 100) * 2 * Math.PI)
            }%`,
            left: `${
              50 + 48 * Math.sin((progressPercent / 100) * 2 * Math.PI)
            }%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Now Playing Info & Animated Equalizer below vinyl */}
      <div className="mt-5 flex flex-col items-center text-center max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          {/* Animated terracotta soundwave equalizer */}
          <div className="flex items-end gap-1 h-4">
            <span
              className={`w-1 bg-smc-accent rounded-full transition-all duration-300 ${
                isPlaying ? 'animate-pulse h-3.5' : 'h-1.5'
              }`}
            />
            <span
              className={`w-1 bg-smc-accent rounded-full transition-all duration-300 ${
                isPlaying ? 'animate-bounce h-4' : 'h-2'
              }`}
            />
            <span
              className={`w-1 bg-smc-accent rounded-full transition-all duration-300 ${
                isPlaying ? 'animate-pulse h-2.5' : 'h-1'
              }`}
            />
          </div>

          <span className="font-mono text-xs font-bold tracking-wider text-smc-text uppercase truncate">
            {trackNumStr}. {currentTrack?.title || 'BORDERLINE'}
          </span>
        </div>

        <p className="text-xs text-smc-muted uppercase tracking-wider truncate max-w-[240px]">
          {currentTrack?.artist || 'SELECT TRACK TO PLAY'}
        </p>

        {/* Live timestamp */}
        <div className="mt-2 font-mono text-[11px] font-semibold text-neutral-500 tracking-widest bg-neutral-200/70 px-3 py-1 rounded-full border border-neutral-300/60">
          {formatTime(progress)} <span className="text-neutral-400">/</span> {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
