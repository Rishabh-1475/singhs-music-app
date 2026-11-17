'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Pause, Heart } from 'lucide-react';
import { Track } from '@/types/track';
import { usePlayerStore } from '@/store/playerStore';
import DownloadButton from './DownloadButton';
import {
  isSongLiked,
  toggleSongLike,
  onLikedSongsChange,
} from '@/services/recommendationService';

interface SongCardProps {
  track: Track;
  tracks?: Track[];
}

export default function SongCard({ track, tracks }: SongCardProps) {
  const isCurrent = usePlayerStore((s) => s.currentTrack?.id === track.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(isSongLiked(track.id));

    const unsubscribe = onLikedSongsChange((changedId, isLikedState) => {
      if (changedId === track.id) {
        setLiked(isLikedState);
      }
    });

    return unsubscribe;
  }, [track.id]);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLiked = toggleSongLike(track);
    setLiked(nextLiked);
  };

  const imageSrc =
    track.albumArt ||
    track.artwork ||
    'https://picsum.photos/seed/spotify/400/400';

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      const queueToPlay = tracks && tracks.length > 0 ? tracks : [track];
      const idx = queueToPlay.findIndex((t) => t.id === track.id);
      playQueue(queueToPlay, idx >= 0 ? idx : 0);
    }
  };

  return (
    <div
      onClick={handlePlay}
      className="group relative flex cursor-pointer flex-col rounded-2xl bg-[#16191E] border border-[#22262F] p-3.5 transition-all duration-200 hover:border-neutral-600 hover:bg-[#1c2027] select-none shadow-sm hover:shadow-xl hover:-translate-y-0.5"
    >
      {/* Square Thumbnail with Floating Circular Green Play Button & Heart Button */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-900 shadow-md">
        <Image
          src={imageSrc}
          alt={track.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Floating Download Button (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <DownloadButton
            track={track}
            size={15}
            className="p-2 rounded-full backdrop-blur-md bg-black/60 text-neutral-300 hover:text-white hover:scale-110 shadow-md transition-all duration-200"
          />
        </div>

        {/* Floating Heart / Like Button */}
        <button
          onClick={handleLikeClick}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
            liked
              ? 'bg-black/60 text-emerald-400 opacity-100'
              : 'bg-black/40 text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-white hover:scale-110'
          }`}
          title={liked ? 'Unlike' : 'Like'}
          aria-label={liked ? 'Unlike track' : 'Like track'}
        >
          <Heart
            size={16}
            className={liked ? 'fill-emerald-400 text-emerald-400' : ''}
          />
        </button>

        {/* Floating Green Play Button */}
        <div
          className={`absolute bottom-2.5 right-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 ${
            isCurrent && isPlaying
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          {isCurrent && isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-0.5" />
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="mt-3 min-w-0">
        <p
          className={`truncate font-bold text-sm leading-tight ${
            isCurrent ? 'text-[#1DB954]' : 'text-white'
          }`}
        >
          {track.title}
        </p>
        <p className="mt-1 truncate text-xs text-neutral-400 font-normal">
          {track.artist}
        </p>
      </div>
    </div>
  );
}
