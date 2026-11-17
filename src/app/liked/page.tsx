'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Play, Pause, Clock } from 'lucide-react';
import TopNav from '@/components/TopNav';
import TrackRow from '@/components/TrackRow';
import FooterSignature from '@/components/FooterSignature';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';
import { Track } from '@/types/track';

export default function LikedSongsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const likedTrackIds = useLibraryStore((s) => s.likedTrackIds);
  const savedTracks = useLibraryStore((s) => s.savedTracks);
  const importedTracks = useLibraryStore((s) => s.importedTracks);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const likedTracks = useMemo(() => {
    return likedTrackIds
      .map(
        (id) =>
          savedTracks[id] ||
          TRENDING_FALLBACK_TRACKS.find((t) => t.id === id) ||
          importedTracks.find((t) => t.id === id)
      )
      .filter((t): t is Track => t !== undefined);
  }, [likedTrackIds, savedTracks, importedTracks]);

  const isLikedPlaying =
    likedTracks.some((t) => t.id === currentTrack?.id) && isPlaying;

  const handlePlayAll = () => {
    if (likedTracks.length === 0) return;
    if (isLikedPlaying) {
      togglePlay();
    } else {
      playQueue(likedTracks, 0);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0F11]">
      {/* Top Navbar */}
      <TopNav />

      {/* Scrollable View Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-36 md:pb-20 space-y-6 scroll-smooth">
        {/* Liked Songs Hero Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-[#16191E] to-[#16191E] border border-[#22262F] shadow-xl">
          <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-2xl shadow-2xl flex-shrink-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white border border-white/10">
            <Heart size={68} fill="white" />
          </div>

          <div className="flex flex-col text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1DB954]">
              PLAYLIST &bull; COLLECTION
            </span>
            <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight mt-1">
              Liked Songs
            </h1>
            <p className="text-xs text-neutral-300 font-medium mt-3">
              <span className="font-bold text-white">Singh&apos;s Music Company</span> &bull;{' '}
              {isMounted ? likedTracks.length : 0} saved songs
            </p>
          </div>
        </div>

        {/* Play Action Row */}
        <div className="flex items-center gap-6 py-2">
          <button
            onClick={handlePlayAll}
            disabled={!isMounted || likedTracks.length === 0}
            className="w-14 h-14 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
            title={isLikedPlaying ? 'Pause' : 'Play'}
          >
            {isLikedPlaying ? (
              <Pause size={26} fill="black" />
            ) : (
              <Play size={26} fill="black" className="ml-1" />
            )}
          </button>
        </div>

        {/* Track Table */}
        {isMounted && likedTracks.length > 0 ? (
          <div className="space-y-1">
            {/* Headers */}
            <div className="grid grid-cols-12 gap-4 px-3.5 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-[#22262F] select-none">
              <div className="col-span-8 sm:col-span-6 flex items-center gap-3">
                <span className="w-5 text-center">#</span>
                <span>Title</span>
              </div>
              <div className="hidden sm:block sm:col-span-4">Album</div>
              <div className="col-span-4 sm:col-span-2 text-right">
                <Clock size={16} className="inline ml-auto" />
              </div>
            </div>

            {/* Rows */}
            {likedTracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                tracks={likedTracks}
                showAlbum={true}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-neutral-400 space-y-2">
            <Heart size={48} className="mx-auto text-neutral-600" />
            <h2 className="text-xl font-bold text-white">Songs you like will appear here</h2>
            <p className="text-xs text-neutral-400">
              Save songs by tapping the heart icon in the player or search results.
            </p>
          </div>
        )}

        <FooterSignature />
      </div>
    </div>
  );
}
