'use client';

import Image from 'next/image';
import { Play, Pause, Heart } from 'lucide-react';
import { Track } from '@/types/track';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useState } from 'react';

interface TrackRowProps {
  track: Track;
  index: number;
  tracks: Track[];
  showAlbum?: boolean;
}

function formatTime(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function TrackRow({
  track,
  index,
  tracks,
  showAlbum = true,
}: TrackRowProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);
  const [hovered, setHovered] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const liked = isLiked(track.id);
  const imageSrc =
    track.albumArt ||
    track.artwork ||
    'https://picsum.photos/seed/spotify-track/300/300';

  const handlePlay = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playQueue(tracks, index);
    }
  };

  return (
    <div
      onClick={handlePlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group grid grid-cols-12 items-center gap-4 py-2.5 px-3.5 rounded-xl transition-all duration-150 cursor-pointer select-none text-sm border ${
        isCurrent
          ? 'bg-[#1DB954]/10 border-[#1DB954]/30 text-white'
          : 'bg-[#16191E]/60 hover:bg-[#16191E] border-transparent hover:border-[#22262F] text-neutral-400 hover:text-white'
      }`}
    >
      {/* Index / Play Button & Title */}
      <div className="col-span-8 sm:col-span-6 flex items-center gap-3.5 min-w-0">
        <div className="w-5 text-center flex-shrink-0 text-xs font-mono">
          {hovered ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              className="text-white hover:scale-110 transition-transform"
            >
              {isCurrent && isPlaying ? (
                <Pause size={14} fill="white" />
              ) : (
                <Play size={14} fill="white" className="ml-0.5" />
              )}
            </button>
          ) : isCurrent && isPlaying ? (
            <span className="w-2.5 h-2.5 rounded-full bg-[#1DB954] inline-block animate-pulse" />
          ) : (
            <span className={isCurrent ? 'text-[#1DB954] font-bold' : 'text-neutral-500'}>
              {index + 1}
            </span>
          )}
        </div>

        {/* Square Thumbnail */}
        <div className="relative h-11 w-11 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-900 border border-[#22262F] shadow-sm">
          <Image
            src={imageSrc}
            alt={track.title}
            fill
            sizes="44px"
            className="object-cover"
          />
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-semibold text-sm leading-tight ${
              isCurrent ? 'text-[#1DB954]' : 'text-white'
            }`}
          >
            {track.title}
          </p>
          <p className="truncate text-xs text-neutral-400 mt-0.5 group-hover:text-neutral-300">
            {track.artist}
          </p>
        </div>
      </div>

      {/* Album Column */}
      {showAlbum && (
        <div className="hidden sm:block sm:col-span-4 truncate text-xs text-neutral-400 group-hover:text-neutral-300">
          {track.album || track.title}
        </div>
      )}

      {/* Duration & Like Button */}
      <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-3.5 text-xs text-neutral-400 font-mono">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          className={`p-1 transition-colors ${
            liked
              ? 'text-[#1DB954]'
              : 'opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white'
          }`}
          title={liked ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={16} className={liked ? 'fill-[#1DB954]' : ''} />
        </button>

        <span className="tabular-nums">{formatTime(track.duration)}</span>
      </div>
    </div>
  );
}
