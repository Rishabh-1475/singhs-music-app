'use client';

import Image from 'next/image';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Bluetooth,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function NowPlayingCard() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);
  const showQueue = usePlayerStore((s) => s.showQueue);

  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);

  const { seek } = useAudioPlayer();

  const isCurrentLiked = currentTrack ? isLiked(currentTrack.id) : false;

  const imageSrc =
    currentTrack?.albumArt ||
    currentTrack?.artwork ||
    'https://picsum.photos/seed/nowplaying/600/600';

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const remaining = Math.max(0, duration - progress);

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

  return (
    <div className="w-full max-w-4xl mx-auto rounded-[32px] sm:rounded-[38px] bg-[#161619]/95 border border-white/10 p-5 sm:p-7 md:p-8 shadow-2xl backdrop-blur-xl select-none transition-all">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* Left: Square Album Art Thumbnail (Image 1 reference) */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative aspect-square w-64 sm:w-72 md:w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 group">
            <Image
              src={imageSrc}
              alt={currentTrack?.title || 'Album Art'}
              fill
              priority
              sizes="(max-width: 768px) 280px, 320px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Subtle gloss badge */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider text-neutral-300 border border-white/10">
              {currentTrack?.genre?.toUpperCase() || '320 KBPS'}
            </div>
          </div>
        </div>

        {/* Right: Controls & Details (Image 1 reference) */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-5">
          {/* Track Title & Artist & Like Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight truncate">
                {currentTrack?.title || 'About You'}
              </h1>
              <p className="text-base sm:text-lg text-neutral-400 font-medium mt-1 truncate">
                {currentTrack?.artist || 'The 1975'}
              </p>
            </div>
            {currentTrack && (
              <button
                onClick={() => toggleLike(currentTrack)}
                className="p-2 text-neutral-400 hover:text-rose-500 transition-colors"
                title={isCurrentLiked ? 'Remove from Liked' : 'Save to Liked'}
              >
                <Heart
                  size={24}
                  className={
                    isCurrentLiked
                      ? 'fill-rose-500 text-rose-500'
                      : 'hover:scale-110 active:scale-95 transition-transform'
                  }
                />
              </button>
            )}
          </div>

          {/* Clean Progress Scrub Bar with elapsed and -remaining time */}
          <div>
            <div
              onClick={handleSeek}
              className="relative h-2 w-full bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-colors group"
            >
              <div
                className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-75 relative"
                style={{ width: `${progressPct}%` }}
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-neutral-400 font-medium tabular-nums mt-2">
              <span>{formatTime(progress)}</span>
              <span>-{formatTime(remaining)}</span>
            </div>
          </div>

          {/* Big Bold Transport Controls (Image 1 reference) */}
          <div className="flex items-center justify-between sm:justify-center sm:gap-8 py-1">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-2 transition-colors ${
                isShuffled
                  ? 'text-emerald-400 font-bold'
                  : 'text-neutral-500 hover:text-white'
              }`}
              title="Shuffle queue"
            >
              <Shuffle size={20} />
            </button>

            {/* Previous Track << */}
            <button
              onClick={prevTrack}
              className="text-white hover:text-neutral-300 transition-transform active:scale-90"
              aria-label="Previous"
            >
              <SkipBack size={34} fill="currentColor" />
            </button>

            {/* Play / Pause Toggle || / ▶ */}
            <button
              onClick={togglePlay}
              className="text-white hover:scale-105 active:scale-95 transition-transform p-1"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={44} fill="currentColor" />
              ) : (
                <Play size={44} fill="currentColor" className="ml-1" />
              )}
            </button>

            {/* Next Track >> */}
            <button
              onClick={nextTrack}
              className="text-white hover:text-neutral-300 transition-transform active:scale-90"
              aria-label="Next"
            >
              <SkipForward size={34} fill="currentColor" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`p-2 transition-colors ${
                repeatMode !== 'off'
                  ? 'text-emerald-400 font-bold'
                  : 'text-neutral-500 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
          </div>

          {/* Volume Control Bar & Queue Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 max-w-xs flex-1">
              <button
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume1 size={18} />
                )}
              </button>
              <div
                onClick={handleVolumeChange}
                className="relative h-1.5 flex-1 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-colors group"
              >
                <div
                  className="absolute left-0 top-0 h-full bg-white rounded-full"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
              <button
                onClick={() => setVolume(1)}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Max Volume"
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* Queue Button */}
            <button
              onClick={toggleQueue}
              className={`p-2 rounded-xl transition-colors ${
                showQueue
                  ? 'bg-white/20 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="View Queue"
            >
              <ListMusic size={18} />
            </button>
          </div>

          {/* Connected Device Pill (Image 1 reference) */}
          <div className="flex justify-center md:justify-end pt-1">
            <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-1.5 rounded-full text-xs font-medium text-neutral-200 shadow-sm cursor-default transition-colors">
              <Bluetooth size={14} className="text-blue-400 animate-pulse" />
              <span>Singh&apos;s Music Co. &bull; WH-1000XM4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
