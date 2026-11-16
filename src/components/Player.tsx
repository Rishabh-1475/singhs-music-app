'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronUp,
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import MobilePlayerDrawer from './MobilePlayerDrawer';

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Player() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const showQueue = usePlayerStore((s) => s.showQueue);
  const showFullScreen = usePlayerStore((s) => s.showFullScreen);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);
  const toggleFullScreen = usePlayerStore((s) => s.toggleFullScreen);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);

  const { seek } = useAudioPlayer();

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pct * duration);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
  };

  const imageSrc =
    currentTrack?.albumArt ||
    currentTrack?.artwork ||
    'https://picsum.photos/seed/spotify/400/400';

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <>
      {/* 1. Desktop Persistent Bottom Player Bar (>= 768px) */}
      <footer className="hidden md:flex h-20 sm:h-24 bg-[#0D0F11] border-t border-[#22262F] px-4 sm:px-6 items-center justify-between select-none z-40 relative">
        {/* Left: Track Thumbnail with Sound Equalizer Animation, Title, Artist */}
        <div className="flex items-center gap-3 w-1/4 min-w-[180px] max-w-[320px]">
          {currentTrack ? (
            <>
              <div className="relative h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-[#22262F] shadow-md group">
                <Image
                  src={imageSrc}
                  alt={currentTrack.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
                {/* Sound Equalizer Animation Overlay */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                    <span className="w-1 bg-[#1DB954] rounded-full h-4 animate-pulse" />
                    <span className="w-1 bg-[#1DB954] rounded-full h-2 animate-bounce" />
                    <span className="w-1 bg-[#1DB954] rounded-full h-5 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white hover:underline cursor-pointer">
                  {currentTrack.title}
                </p>
                <p className="truncate text-xs text-neutral-400 hover:text-white cursor-pointer mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>

              <button
                onClick={() => toggleLike(currentTrack)}
                className="p-1 text-neutral-400 hover:text-white transition-colors flex-shrink-0"
                title={liked ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Heart
                  size={18}
                  className={liked ? 'text-[#1DB954] fill-[#1DB954]' : ''}
                />
              </button>
            </>
          ) : (
            <div className="text-xs text-neutral-500 font-mono">
              Select a song to play
            </div>
          )}
        </div>

        {/* Center: Controls & Scrub Bar */}
        <div className="flex flex-col items-center max-w-[700px] w-2/4 px-2">
          {/* Playback Controls */}
          <div className="flex items-center gap-4 sm:gap-6 mb-1.5">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-1.5 transition-colors relative ${
                isShuffled ? 'text-[#1DB954]' : 'text-neutral-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle size={16} />
              {isShuffled && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1DB954] rounded-full" />
              )}
            </button>

            {/* Previous */}
            <button
              onClick={prevTrack}
              disabled={!currentTrack}
              className="text-neutral-300 hover:text-white disabled:opacity-40 transition-colors"
              title="Previous track"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>

            {/* Play / Pause Circle (Spotify Electric Green) */}
            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 shadow-lg shadow-[#1DB954]/25"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={18} fill="black" />
              ) : (
                <Play size={18} fill="black" className="ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              disabled={!currentTrack}
              className="text-neutral-300 hover:text-white disabled:opacity-40 transition-colors"
              title="Next track"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`p-1.5 transition-colors relative ${
                repeatMode !== 'off'
                  ? 'text-[#1DB954]'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              {repeatMode !== 'off' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1DB954] rounded-full" />
              )}
            </button>
          </div>

          {/* Interactive Scrub Progress Bar */}
          <div className="flex items-center gap-2.5 w-full max-w-[500px]">
            <span className="text-[11px] font-mono text-neutral-400 tabular-nums w-8 text-right">
              {formatTime(progress)}
            </span>

            <div
              onClick={handleSeek}
              className="relative h-1 flex-1 bg-neutral-800 hover:h-1.5 rounded-full cursor-pointer transition-all group"
            >
              <div
                className="absolute left-0 top-0 h-full bg-white group-hover:bg-[#1DB954] rounded-full"
                style={{ width: `${progressPct}%` }}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPct}% - 6px)` }}
              />
            </div>

            <span className="text-[11px] font-mono text-neutral-400 tabular-nums w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Queue & Volume Controls */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[180px]">
          {/* Queue Button */}
          <button
            onClick={toggleQueue}
            className={`p-1.5 transition-colors ${
              showQueue ? 'text-[#1DB954]' : 'text-neutral-400 hover:text-white'
            }`}
            title="Queue"
          >
            <ListMusic size={18} />
          </button>

          {/* Volume Mute & Slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon size={18} />
            </button>
            <div
              onClick={handleVolumeChange}
              className="relative h-1 w-20 sm:w-24 bg-neutral-800 hover:h-1.5 rounded-full cursor-pointer transition-all group"
            >
              <div
                className="absolute left-0 top-0 h-full bg-white group-hover:bg-[#1DB954] rounded-full"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${isMuted ? 0 : volume * 100}% - 6px)` }}
              />
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullScreen}
            className="hidden sm:block p-1.5 text-neutral-400 hover:text-white transition-colors"
            title="Fullscreen view"
          >
            {showFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </footer>

      {/* 2. Mobile Floating Mini-Player (< 768px, positioned above bottom nav) */}
      {currentTrack && (
        <div
          onClick={() => setIsDrawerOpen(true)}
          className="md:hidden fixed bottom-[68px] left-2 right-2 z-40 bg-[#16191E]/95 backdrop-blur-xl border border-[#22262F] rounded-2xl p-2.5 flex items-center justify-between shadow-2xl active:scale-[0.99] transition-transform select-none cursor-pointer"
        >
          {/* Top thin progress bar */}
          <div className="absolute top-0 left-3 right-3 h-[2px] bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1DB954] transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Left: Thumbnail + Equalizer + Title/Artist */}
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            <div className="relative h-11 w-11 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-[#22262F]">
              <Image
                src={imageSrc}
                alt={currentTrack.title}
                fill
                sizes="44px"
                className="object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                  <span className="w-0.5 bg-[#1DB954] rounded-full h-3 animate-pulse" />
                  <span className="w-0.5 bg-[#1DB954] rounded-full h-2 animate-bounce" />
                  <span className="w-0.5 bg-[#1DB954] rounded-full h-3.5 animate-pulse" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white leading-tight">
                {currentTrack.title}
              </p>
              <p className="truncate text-[11px] text-neutral-400 mt-0.5 font-medium">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Right: Like, Play/Pause, Chevron Expand */}
          <div
            className="flex items-center gap-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => toggleLike(currentTrack)}
              className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              aria-label="Favorite"
            >
              <Heart
                size={18}
                className={liked ? 'text-[#1DB954] fill-[#1DB954]' : ''}
              />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-[#1DB954]/25"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={18} fill="black" />
              ) : (
                <Play size={18} fill="black" className="ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="w-8 h-10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              aria-label="Expand player"
            >
              <ChevronUp size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Mobile Full-Screen Player Drawer Overlay */}
      <MobilePlayerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
