'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ArrowDownToLine, Play, Pause, Trash2, Clock, HardDriveDownload } from 'lucide-react';
import TopNav from '@/components/TopNav';
import FooterSignature from '@/components/FooterSignature';
import { usePlayerStore } from '@/store/playerStore';
import { Track } from '@/types/track';
import {
  getDownloadedTracks,
  deleteOfflineTrack,
  offlineTrackToTrack,
  getTotalStorageUsed,
  onOfflineTracksChange,
  OfflineTrack,
} from '@/services/offlineStorage';

export default function DownloadsPage() {
  const [offlineTracks, setOfflineTracks] = useState<OfflineTrack[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ bytes: number; formatted: string }>({
    bytes: 0,
    formatted: '0 KB',
  });
  const [isLoading, setIsLoading] = useState(true);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const loadOfflineTracks = useCallback(async () => {
    try {
      const [tracks, storage] = await Promise.all([
        getDownloadedTracks(),
        getTotalStorageUsed(),
      ]);
      setOfflineTracks(tracks);
      setStorageInfo(storage);
    } catch (e) {
      console.warn('Failed to load offline tracks:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfflineTracks();
    const unsubscribe = onOfflineTracksChange(() => {
      loadOfflineTracks();
    });
    return () => unsubscribe();
  }, [loadOfflineTracks]);

  const playableTracks: Track[] = offlineTracks.map(offlineTrackToTrack);

  const isDownloadsPlaying =
    playableTracks.some((t) => t.id === currentTrack?.id) && isPlaying;

  const handlePlayAll = () => {
    if (playableTracks.length === 0) return;
    if (isDownloadsPlaying) {
      togglePlay();
    } else {
      playQueue(playableTracks, 0);
    }
  };

  const handlePlayTrack = (track: Track, index: number) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playQueue(playableTracks, index);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteOfflineTrack(id);
    await loadOfflineTracks();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0F11]">
      <TopNav />

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-36 md:pb-20 space-y-6 scroll-smooth">
        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#16191E] to-[#16191E] border border-[#22262F] shadow-xl">
          <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-2xl shadow-2xl flex-shrink-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-black border border-white/10">
            <ArrowDownToLine size={56} strokeWidth={2.5} />
          </div>

          <div className="flex flex-col text-center sm:text-left gap-2 min-w-0 flex-1">
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
              Offline Storage Vault
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Downloaded Songs
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Cached locally in IndexedDB &bull; Zero internet required for playback
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-neutral-400 mt-2">
              <span className="font-semibold text-white">SMC Vault</span>
              <span>&bull;</span>
              <span>{offlineTracks.length} {offlineTracks.length === 1 ? 'track' : 'tracks'}</span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                💾 {storageInfo.formatted} used
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4 py-2">
          <button
            onClick={handlePlayAll}
            disabled={offlineTracks.length === 0}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1DB954] text-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1DB954]/20 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            title={isDownloadsPlaying ? 'Pause' : 'Play all downloaded songs'}
          >
            {isDownloadsPlaying ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </button>
        </div>

        {/* Tracks List */}
        <div className="space-y-1">
          <div className="grid grid-cols-12 text-xs text-neutral-400 uppercase font-semibold px-4 py-2 border-b border-[#22262F]">
            <span className="col-span-1">#</span>
            <span className="col-span-6 sm:col-span-5">Title</span>
            <span className="hidden sm:block col-span-4">Album</span>
            <span className="col-span-5 sm:col-span-2 text-right flex items-center justify-end gap-1">
              <Clock size={14} />
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-neutral-500 text-sm animate-pulse">
              Loading offline vault...
            </div>
          ) : offlineTracks.length === 0 ? (
            <div className="text-center py-20 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#16191E] border border-[#22262F] flex items-center justify-center text-emerald-400 shadow-lg">
                <HardDriveDownload size={32} />
              </div>
              <p className="text-white font-bold text-lg">No downloaded tracks yet</p>
              <p className="text-neutral-400 text-sm leading-relaxed">
                No offline music downloaded yet. Tap the download icon on any song to listen without internet.
              </p>
            </div>
          ) : (
            playableTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isTrackPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrack(track, idx)}
                  className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl transition-colors cursor-pointer group ${
                    isCurrent ? 'bg-white/10 text-[#1DB954]' : 'hover:bg-white/5 text-neutral-300'
                  }`}
                >
                  <span className="col-span-1 text-sm font-semibold text-neutral-400 group-hover:text-white">
                    {isTrackPlaying ? (
                      <span className="text-[#1DB954] font-bold">▶</span>
                    ) : (
                      idx + 1
                    )}
                  </span>

                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900">
                      <Image
                        src={track.albumArt || '/creator.jpg'}
                        alt={track.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-bold ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-neutral-400">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <span className="hidden sm:block col-span-4 truncate text-xs text-neutral-400">
                    {track.album || 'Single'}
                  </span>

                  <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-3 text-right">
                    <span className="text-xs text-neutral-400 font-mono">
                      Offline
                    </span>
                    <button
                      onClick={(e) => handleDelete(track.id, e)}
                      className="p-1.5 rounded-full text-neutral-500 hover:text-rose-400 hover:bg-white/10 transition-colors"
                      title="Delete from offline storage"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <FooterSignature />
      </div>
    </div>
  );
}
