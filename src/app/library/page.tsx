'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Heart, Music, ArrowDownToLine } from 'lucide-react';
import TopNav from '@/components/TopNav';
import FooterSignature from '@/components/FooterSignature';
import { useLibraryStore } from '@/store/libraryStore';
import { useAuthStore } from '@/store/authStore';
import { getDownloadedTracks, onOfflineTracksChange } from '@/services/offlineStorage';

export default function LibraryPage() {
  const playlists = useLibraryStore((s) => s.playlists);
  const likedTrackIds = useLibraryStore((s) => s.likedTrackIds);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const showAuthToast = useAuthStore((s) => s.showAuthToast);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    getDownloadedTracks().then((tracks) => setDownloadedCount(tracks.length));
    const unsubscribe = onOfflineTracksChange(() => {
      getDownloadedTracks().then((tracks) => setDownloadedCount(tracks.length));
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = () => {
    if (!user) {
      showAuthToast('Sign in required to stream music and save playlists.');
      openAuthModal();
      return;
    }
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName('');
      setShowCreate(false);
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      showAuthToast('Sign in required to stream music and save playlists.');
      openAuthModal();
      return;
    }
    setShowCreate(!showCreate);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0F11]">
      {/* Sticky TopNav */}
      <TopNav />

      {/* Scrollable View Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-36 md:pb-20 space-y-6 scroll-smooth">
        {/* Header & Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Your Library
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Playlists, saved tracks, and custom mixtapes
            </p>
          </div>

          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1DB954] text-black font-extrabold text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-[#1DB954]/20"
          >
            <Plus size={16} />
            <span>Create playlist</span>
          </button>
        </div>

        {/* Create Input Modal / Drawer */}
        {showCreate && (
          <div className="bg-[#16191E] p-5 rounded-2xl border border-[#22262F] max-w-md space-y-3 shadow-xl">
            <h3 className="font-bold text-sm text-white">New Playlist Title</h3>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Punjabi Party Mix..."
              className="w-full bg-[#0D0F11] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none border border-[#22262F] focus:border-[#1DB954]"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                className="px-4 py-1.5 rounded-full bg-[#1DB954] text-black font-bold text-xs hover:scale-105 transition-transform"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-1.5 rounded-full bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Library Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {/* Liked Songs Tile */}
          <Link
            href="/liked"
            className="group relative flex flex-col rounded-2xl bg-[#16191E] border border-[#22262F] p-3.5 transition-all duration-200 hover:border-neutral-500 hover:bg-[#1c2027] select-none cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shadow-md flex items-center justify-center text-white">
              <Heart size={44} fill="white" />
            </div>
            <div className="mt-3 min-w-0">
              <p className="truncate font-bold text-sm text-white">Liked Songs</p>
              <p className="mt-1 truncate text-xs text-neutral-400 font-normal">
                {isMounted ? likedTrackIds.length : 0} tracks saved
              </p>
            </div>
          </Link>

          {/* Downloaded Songs Tile */}
          <Link
            href="/downloads"
            className="group relative flex flex-col rounded-2xl bg-[#16191E] border border-[#22262F] p-3.5 transition-all duration-200 hover:border-neutral-500 hover:bg-[#1c2027] select-none cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 shadow-md flex items-center justify-center text-black">
              <ArrowDownToLine size={44} strokeWidth={2.5} />
            </div>
            <div className="mt-3 min-w-0">
              <p className="truncate font-bold text-sm text-white">Downloaded</p>
              <p className="mt-1 truncate text-xs text-neutral-400 font-normal">
                {isMounted ? downloadedCount : 0} offline tracks
              </p>
            </div>
          </Link>

          {/* User Playlists */}
          {isMounted &&
            playlists.map((pl) => (
              <div
                key={pl.id}
                className="group relative flex flex-col rounded-2xl bg-[#16191E] border border-[#22262F] p-3.5 transition-all duration-200 hover:border-neutral-500 hover:bg-[#1c2027] select-none cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5"
              >
              <Link
                href={`/playlist/${pl.id}`}
                className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-900 border border-[#22262F] shadow-md flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors"
              >
                <Music size={40} />
              </Link>
              <div className="mt-3 min-w-0 flex items-center justify-between">
                <Link href={`/playlist/${pl.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-bold text-sm text-white hover:underline">
                    {pl.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-neutral-400 font-normal">
                    Playlist &bull; {pl.trackIds?.length || 0} tracks
                  </p>
                </Link>
                <button
                  onClick={() => deletePlaylist(pl.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-500 transition-all"
                  title="Delete playlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <FooterSignature />
      </div>
    </div>
  );
}
