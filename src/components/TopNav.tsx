'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  ExternalLink,
  LogIn,
  LogOut,
  User as UserIcon,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthModal from './AuthModal';

interface TopNavProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchClear?: () => void;
}

export default function TopNav({
  searchQuery: externalQuery,
  onSearchChange: externalOnChange,
  onSearchClear: externalOnClear,
}: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [localQuery, setLocalQuery] = useState(externalQuery ?? '');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const signOut = useAuthStore((s) => s.signOut);
  const userLikedSongs = useAuthStore((s) => s.userLikedSongs);

  useEffect(() => {
    if (externalQuery !== undefined) {
      setLocalQuery(externalQuery);
    } else if (typeof window !== 'undefined') {
      const q =
        new URLSearchParams(window.location.search).get('q') ||
        new URLSearchParams(window.location.search).get('query') ||
        '';
      if (q) setLocalQuery(q);
    }
  }, [externalQuery]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    if (isProfileOpen || isUserMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileOpen, isUserMenuOpen]);

  const handleInputChange = (val: string) => {
    setLocalQuery(val);

    if (externalOnChange) {
      externalOnChange(val);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        router.push(`/search?q=${encodeURIComponent(val.trim())}`);
      }
    }, 300);
  };

  const handleClear = () => {
    setLocalQuery('');
    if (externalOnClear) {
      externalOnClear();
    } else if (pathname === '/search') {
      router.push('/search');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 sm:h-20 bg-[#0D0F11]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between text-white border-b border-[#22262F] select-none gap-3 sm:gap-4">
        {/* Left: History Navigation Buttons & Search Input */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-2xl">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#16191E] border border-[#22262F] flex items-center justify-center text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
              title="Go back"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => router.forward()}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#16191E] border border-[#22262F] flex items-center justify-center text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
              title="Go forward"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Global Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Artists, songs, or podcasts..."
              className="w-full bg-[#16191E] border border-[#22262F] hover:border-neutral-600 focus:border-[#1DB954] text-xs sm:text-sm text-white placeholder:text-neutral-500 rounded-full py-2.5 pl-9 pr-9 outline-none transition-colors shadow-inner font-medium"
            />
            {localQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Area: Auth Button / User Profile & Founder Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          {/* 1. AUTHENTICATION SECTION */}
          {!user ? (
            /* Unauthenticated: Clean "Sign In" button opening AuthModal */
            <button
              onClick={openAuthModal}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              title="Sign in with Google, Email, or Phone"
            >
              <LogIn size={15} />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          ) : (
            /* Authenticated: User Avatar / Phone Placeholder */
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 bg-[#16191E] border border-emerald-500/40 hover:border-emerald-400 px-2 sm:px-3 py-1.5 rounded-full shadow-md transition-all duration-200 cursor-pointer active:scale-95 group text-left"
                title="Account menu"
              >
                {user.photoURL ? (
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-neutral-800 border border-emerald-400 flex-shrink-0">
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 flex-shrink-0 font-bold text-xs">
                    <UserIcon size={16} />
                  </div>
                )}

                <div className="hidden lg:flex flex-col text-left pr-1 max-w-[120px]">
                  <span className="text-xs font-bold text-white truncate">
                    {user.displayName || (user.email ? user.email.split('@')[0] : 'Member')}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono truncate">
                    {user.email || user.phoneNumber || 'Authenticated'}
                  </span>
                </div>
              </button>

              {/* User Account Dropdown / Modal */}
              {isUserMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-14 w-64 bg-neutral-900/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl z-50 text-white animate-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    {user.photoURL ? (
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border border-emerald-400 flex-shrink-0">
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                        <UserIcon size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate text-white">
                        {user.displayName || 'SMC Music Listener'}
                      </p>
                      <p className="text-xs text-neutral-400 truncate font-mono">
                        {user.email || user.phoneNumber || 'User'}
                      </p>
                    </div>
                  </div>

                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        Auth UID:
                      </span>
                      <span className="font-mono text-[10px] text-neutral-400">
                        {user.uid.slice(0, 10)}...
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <Heart size={14} className="text-emerald-400 fill-emerald-400" />
                        Synced Favorites:
                      </span>
                      <span className="font-bold text-emerald-400">
                        {userLikedSongs.length} songs
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await signOut();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-all font-bold text-xs cursor-pointer active:scale-95"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. CREATOR / FOUNDER SPOTLIGHT BADGE (48px Circle) */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2.5 bg-[#16191E] border border-[#22262F] hover:border-emerald-500/50 hover:bg-[#1a1f26] px-2 sm:px-3 py-1.5 rounded-full shadow-md transition-all duration-200 cursor-pointer active:scale-95 group text-left"
            title="View Founder Profile"
          >
            {/* 48px circle with glowing emerald ring */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-neutral-800 border-2 border-emerald-400 shadow-lg shadow-emerald-500/25 flex-shrink-0 group-hover:border-emerald-300 transition-colors">
              <Image
                src="/creator.jpg"
                alt="Rishabh Singh"
                fill
                priority
                className="object-cover"
              />
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#16191E]" />
            </div>

            {/* Name and Founder Title */}
            <div className="hidden xl:flex flex-col text-left pr-1">
              <span className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                Rishabh Singh
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-400 font-medium">
                Founder &amp; Lead Dev
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Glassmorphic Auth Modal (Google, Email/Password, Phone OTP) */}
      <AuthModal />

      {/* Interactive Glassmorphic Founder Profile Modal */}
      {isProfileOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsProfileOpen(false);
            }
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full text-center relative animate-in zoom-in-95 duration-200 text-white"
          >
            {/* Top-Right Close Button */}
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer text-base font-bold"
              title="Close modal"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Large 112px Circular Creator Photo (w-28 h-28) */}
            <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-emerald-400 shadow-xl shadow-emerald-500/25 bg-neutral-800">
              <Image
                src="/creator.jpg"
                alt="Rishabh Singh"
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Headline with Verified Badge */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <h3 className="text-2xl font-black text-white tracking-tight">
                Rishabh Singh
              </h3>
              <CheckCircle2
                size={20}
                className="text-emerald-400 fill-emerald-400/20 flex-shrink-0"
              />
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wider mt-1">
              Founder &amp; Architect • SMC
            </p>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-neutral-300 mt-3.5 leading-relaxed px-2">
              Full-Stack Architect &amp; Creator of Singh&apos;s Music Company. Engineering ultra-fast, lossless audio experiences with Next.js, Tailwind CSS, and Native Android architectures.
            </p>

            {/* Tech Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-[11px] font-medium">
                Next.js 14
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                Lossless 320kbps
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-[11px] font-medium">
                React Native &bull; Android
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10 my-6" />

            {/* Direct Instagram Redirect Button */}
            <a
              href="https://www.instagram.com/rish4bhsiingh/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition-all group"
            >
              <svg
                className="w-5 h-5 flex-shrink-0 fill-current group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Follow on Instagram (@rish4bhsiingh)</span>
              <ExternalLink size={16} className="ml-1 opacity-70 group-hover:opacity-100" />
            </a>

            {/* Footer Tag */}
            <p className="text-[11px] text-neutral-500 mt-4">
              Singh&apos;s Music Company &bull; Made with ❤️ by Rishabh Singh
            </p>
          </div>
        </div>
      )}
    </>
  );
}
