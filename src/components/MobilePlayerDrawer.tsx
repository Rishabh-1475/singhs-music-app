'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Radio,
  Share2,
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import {
  isSongLiked,
  toggleSongLike,
  onLikedSongsChange,
} from '@/services/recommendationService';
import DownloadButton from './DownloadButton';

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface MobilePlayerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobilePlayerDrawer({
  isOpen,
  onClose,
}: MobilePlayerDrawerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffled = usePlayerStore((s) => s.isShuffled);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);

  const { seek } = useAudioPlayer();

  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const trackId = currentTrack?.id;
    if (!trackId) {
      setLiked(false);
      return;
    }
    setLiked(isSongLiked(trackId));

    const unsubscribe = onLikedSongsChange((changedId, isLikedState) => {
      if (changedId === trackId) {
        setLiked(isLikedState);
      }
    });

    return unsubscribe;
  }, [currentTrack?.id]);

  const handleToggleLike = () => {
    if (!currentTrack) return;
    const next = toggleSongLike(currentTrack);
    setLiked(next);
  };

  if (!isOpen || !currentTrack) return null;

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const imageSrc =
    currentTrack.albumArt ||
    currentTrack.artwork ||
    'https://picsum.photos/seed/spotify/500/500';

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pct * duration);
  };

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-gradient-to-b from-[#181f28] via-[#0D0F11] to-[#0D0F11] flex flex-col justify-between p-6 select-none overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Top Bar: Close Chevron & Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
          aria-label="Minimize player"
        >
          <ChevronDown size={28} />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-semibold">
            PLAYING FROM SEARCH
          </span>
          <span className="text-xs font-bold text-white tracking-tight mt-0.5">
            Singh&apos;s Music Company
          </span>
        </div>

        <button
          onClick={toggleQueue}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
          aria-label="View queue"
        >
          <ListMusic size={22} />
        </button>
      </div>

      {/* Center: Large Square Album Artwork */}
      <div className="my-auto py-4 flex justify-center">
        <div className="relative aspect-square w-72 max-w-[85vw] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900">
          <Image
            src={imageSrc}
            alt={currentTrack.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>

      {/* Bottom Area: Track Info, Seekbar & Controls */}
      <div className="space-y-6 pb-4">
        {/* Track Title, Artist & Like Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-neutral-400 font-medium truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <DownloadButton
              track={currentTrack}
              size={22}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            />

            <button
              onClick={handleToggleLike}
              className="w-11 h-11 flex items-center justify-center flex-shrink-0 text-neutral-400 hover:text-white transition-colors"
              title={liked ? 'Remove from favorites' : 'Save to favorites'}
              aria-label={liked ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart
                size={24}
                className={liked ? 'text-emerald-400 fill-emerald-400' : ''}
              />
            </button>
          </div>
        </div>

        {/* Large Touch-Friendly Progress Scrub Bar */}
        <div className="space-y-2">
          <div
            onClick={handleSeek}
            className="relative h-2 w-full bg-neutral-800 rounded-full cursor-pointer py-1"
          >
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#1DB954] rounded-full"
              style={{ width: `${progressPct}%` }}
            />
            <span
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
              style={{ left: `calc(${progressPct}% - 8px)` }}
            />
          </div>

          <div className="flex justify-between text-xs font-mono text-neutral-400 tabular-nums">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport Row with Big Circular Play Button */}
        <div className="flex items-center justify-between px-2">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`w-11 h-11 flex items-center justify-center transition-colors relative ${
              isShuffled ? 'text-[#1DB954]' : 'text-neutral-400'
            }`}
          >
            <Shuffle size={20} />
            {isShuffled && (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1DB954] rounded-full" />
            )}
          </button>

          {/* Previous Track */}
          <button
            onClick={prevTrack}
            className="w-12 h-12 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <SkipBack size={30} fill="currentColor" />
          </button>

          {/* Big Play / Pause Circle (Spotify Electric Green) */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause size={30} fill="black" />
            ) : (
              <Play size={30} fill="black" className="ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            className="w-12 h-12 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <SkipForward size={30} fill="currentColor" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`w-11 h-11 flex items-center justify-center transition-colors relative ${
              repeatMode !== 'off' ? 'text-[#1DB954]' : 'text-neutral-400'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            {repeatMode !== 'off' && (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1DB954] rounded-full" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
