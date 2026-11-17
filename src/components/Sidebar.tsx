'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Radio,
  TrendingUp,
  Clock,
  Heart,
  Mic2,
  Disc,
  Plus,
  Music,
  Trash2,
  Activity,
  BadgeCheck,
  ArrowDownToLine,
} from 'lucide-react';
import { useLibraryStore } from '@/store/libraryStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import { getDownloadedTracks, onOfflineTracksChange } from '@/services/offlineStorage';

export default function Sidebar() {
  const pathname = usePathname();
  const playlists = useLibraryStore((s) => s.playlists);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const showAuthToast = useAuthStore((s) => s.showAuthToast);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    getDownloadedTracks().then((tracks) => setDownloadedCount(tracks.length)).catch(() => {});
    const unsubscribe = onOfflineTracksChange(() => {
      getDownloadedTracks().then((tracks) => setDownloadedCount(tracks.length)).catch(() => {});
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = () => {
    if (!user) {
      showAuthToast('Sign in required to stream music and save playlists.');
      openAuthModal();
      return;
    }
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateInput(false);
    }
  };

  const handlePlusClick = () => {
    if (!user) {
      showAuthToast('Sign in required to stream music and save playlists.');
      openAuthModal();
      return;
    }
    setShowCreateInput(!showCreateInput);
  };

  const menuLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Compass, label: 'Discover' },
    { href: '/search?q=Radio', icon: Radio, label: 'Radio' },
    { href: '/search?q=Top%20Charts', icon: TrendingUp, label: 'Live Charts' },
  ];

  const collectionLinks = [
    { href: '/#recent', icon: Clock, label: 'Recently Played' },
    { href: '/liked', icon: Heart, label: 'Liked Songs' },
    { href: '/downloads', icon: ArrowDownToLine, label: 'Downloaded' },
    { href: '/#artists', icon: Mic2, label: 'Artists' },
    { href: '/library', icon: Disc, label: 'Albums' },
  ];

  return (
    <aside className="w-72 hidden md:flex flex-col justify-between h-full flex-shrink-0 select-none bg-[#0c0e12]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 overflow-hidden shadow-2xl relative">
      {/* 1. Brand Header (Top) */}
      <div className="flex-shrink-0 pb-4 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3.5 group">
          {/* Glowing emerald badge with rounded square corners */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/35 transition-all duration-300 group-hover:scale-105">
            <Activity className="w-6 h-6 text-black stroke-[2.5px] animate-pulse" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-extrabold tracking-wider text-white uppercase leading-none font-sans group-hover:text-emerald-400 transition-colors">
              SINGH&apos;S MUSIC CO.
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                STUDIO LOSSLESS
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 2. Middle Navigation Section (Scrollable, seamless without inner boxes) */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-6">
        {/* Section 1: MENU */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase px-3 mb-2">
            MENU
          </p>
          <nav className="space-y-1">
            {menuLinks.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 to-transparent text-emerald-400 border-l-2 border-emerald-400 font-semibold shadow-inner'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      isActive
                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] stroke-[2.2px]'
                        : 'text-zinc-400'
                    }
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section 2: YOUR COLLECTION */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase px-3 mb-2">
            YOUR COLLECTION
          </p>
          <nav className="space-y-1">
            {collectionLinks.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 to-transparent text-emerald-400 border-l-2 border-emerald-400 font-semibold shadow-inner'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      isActive
                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] stroke-[2.2px]'
                        : 'text-zinc-400'
                    }
                  />
                  <span>{label}</span>
                  {label === 'Downloaded' && isMounted && downloadedCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {downloadedCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section 3: PLAYLISTS */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">
              PLAYLISTS
            </p>
            <button
              onClick={handlePlusClick}
              className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95"
              title="Create playlist"
            >
              <Plus size={14} />
            </button>
          </div>

          {showCreateInput && (
            <div className="px-2 mb-2">
              <input
                type="text"
                autoFocus
                placeholder="New Playlist Name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="w-full bg-[#12151c] border border-emerald-500/50 text-xs text-white px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-zinc-500"
              />
            </div>
          )}

          {/* Quick scrollable list of custom playlists */}
          <div className="space-y-1">
            {isMounted && playlists.length > 0 ? (
              playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
                >
                  <Link
                    href={`/playlist/${pl.id}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 truncate"
                  >
                    <Music size={14} className="flex-shrink-0 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                    <span className="truncate">{pl.name}</span>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlaylist(pl.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-all rounded"
                    title="Delete playlist"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            ) : (
              <p className="px-3 py-1.5 text-[11px] text-zinc-500 italic">
                No custom playlists yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Luxury "Creator & Sound Engine" Card (Bottom) */}
      <div className="flex-shrink-0 pt-3 border-t border-white/[0.06]">
        <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl p-3.5 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-lg">
          {/* Subtle Ambient Emerald Glow */}
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />

          <div className="relative z-10 flex items-center gap-3">
            {/* User Avatar with thin emerald ring and live pulsing active dot */}
            <div className="relative w-10 h-10 rounded-full ring-2 ring-emerald-500/70 p-0.5 flex-shrink-0">
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <Image
                  src="/creator.jpg"
                  alt="Rishabh Singh"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0e12] animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-white tracking-wide truncate">
                  Rishabh Singh
                </p>
                <BadgeCheck size={14} className="text-emerald-400 flex-shrink-0 fill-emerald-400/20" />
              </div>
              <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                Creator &amp; Lead Dev
              </p>
            </div>
          </div>

          {/* Bottom subtle chip */}
          <div className="relative z-10 mt-3 pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider font-semibold">
              PRO AUDIO ENGINE &bull; AD-FREE
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold uppercase border border-emerald-500/30">
              320K
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
