'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  Flame,
  Radio,
  Search,
  X,
  Loader2,
  ExternalLink,
  Instagram,
  RefreshCw,
  Dumbbell,
  Compass,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import SongCard from '@/components/SongCard';
import FooterSignature from '@/components/FooterSignature';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Song, searchSongs, getTrendingSongs, DEFAULT_COVER } from '@/services/api';
import { usePlayerStore } from '@/store/playerStore';

export default function HomePage() {
  const router = useRouter();

  // Core Track States (Guaranteed 0 mock data - initialized strictly as empty arrays)
  const [recommendedTracks, setRecommendedTracks] = useState<Song[]>([]);
  const [workoutTracks, setWorkoutTracks] = useState<Song[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);

  // Search & Loading States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Player Store
  const { playTrack, playQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  // 1. Dynamic Live Feed Ingestion on Mount (No static mocks)
  const loadLiveMusicFeed = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [trending, workout] = await Promise.allSettled([
        getTrendingSongs(),
        searchSongs('Punjabi Hype Hits'),
      ]);

      if (trending.status === 'fulfilled' && trending.value.length > 0) {
        setTrendingTracks(trending.value);
        setRecommendedTracks(trending.value.slice(0, 12));
      }

      if (workout.status === 'fulfilled' && workout.value.length > 0) {
        setWorkoutTracks(workout.value);
      }
    } catch (err) {
      console.warn('Live music feed fetch error:', err);
    } finally {
      setIsLoadingFeed(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLiveMusicFeed();
  }, [loadLiveMusicFeed]);

  // 2. Real-Time 250ms Debounced Search
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!val.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchSongs(val.trim());
        setSearchResults(results);
      } catch (e) {
        console.warn('Real-time search error:', e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Hero Spotlight playback
  const heroSong = trendingTracks[0] || recommendedTracks[0];
  const isHeroPlaying = Boolean(
    heroSong && currentTrack?.id === heroSong.id && isPlaying
  );

  const handleHeroListenNow = () => {
    if (!heroSong) return;
    if (isHeroPlaying) {
      togglePlay();
    } else {
      playTrack(heroSong, trendingTracks.length > 0 ? trendingTracks : [heroSong]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0F11]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Scrollable View Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-36 md:pb-24 space-y-8 sm:space-y-10 scroll-smooth">
        {/* Real-time In-Page Search Bar */}
        <section className="relative w-full max-w-2xl mx-auto">
          <div className="relative flex items-center w-full">
            <Search
              size={18}
              className="absolute left-4 text-emerald-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search songs, artists, Punjabi hits, Bollywood..."
              className="w-full bg-[#16191E] hover:bg-[#1a1f26] focus:bg-[#1c222c] border border-[#22262F] focus:border-emerald-500/80 text-sm sm:text-base text-white placeholder:text-neutral-500 rounded-full py-3.5 pl-11 pr-11 outline-none transition-all shadow-xl shadow-black/40 font-medium"
            />
            {isSearching ? (
              <Loader2
                size={18}
                className="absolute right-4 text-emerald-400 animate-spin"
              />
            ) : searchQuery ? (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 text-neutral-400 hover:text-white transition-colors"
                title="Clear search"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>
        </section>

        {/* PROMINENT SEARCH RESULTS GRID (Displayed when user is searching) */}
        {searchQuery.trim() !== '' ? (
          <ErrorBoundary fallbackTitle="Search Results Unavailable">
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#22262F] pb-3">
                <div className="flex items-center gap-2.5">
                  <Compass size={22} className="text-emerald-400" />
                  <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                    Search Results for &quot;{searchQuery}&quot;
                  </h2>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {searchResults.length} tracks found
                </span>
              </div>

              {isSearching ? (
                /* Skeleton Placeholders */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`search-skeleton-${i}`}
                      className="p-3 rounded-2xl bg-[#16191E] border border-[#22262F] animate-pulse"
                    >
                      <div className="aspect-square w-full rounded-xl bg-neutral-800" />
                      <div className="mt-3 w-3/4 h-3.5 bg-neutral-800 rounded-full" />
                      <div className="mt-1.5 w-1/2 h-2.5 bg-neutral-800/60 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {searchResults.map((song) => (
                    <SongCard
                      key={`search-${song.id}`}
                      song={song}
                      allSongs={searchResults}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-neutral-400 space-y-2">
                  <p className="text-base font-semibold text-neutral-300">
                    No results found for &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-xs text-neutral-500">
                    Try searching for an artist like Arijit Singh, Sidhu Moose Wala, or a song title.
                  </p>
                </div>
              )}
            </section>
          </ErrorBoundary>
        ) : (
          /* DEFAULT HOME FEED: Dynamic sections with zero mock data */
          <>
            {/* 1. Header Headline & Creator Spotlight Banner */}
            <ErrorBoundary fallbackTitle="Spotlight Banner Unavailable">
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111418] via-[#161b22] to-[#12161c] border border-[#22262F] p-6 sm:p-8 shadow-2xl">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Headline */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>OFFICIAL 320 KBPS LOSSLESS STREAM ARCHIVE</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_16px_rgba(16,185,129,0.25)]">
                      Singh&apos;s Music Company
                    </h1>
                    <p className="text-xs sm:text-base font-medium text-neutral-300 max-w-xl">
                      Ultra-Fast &bull; 100% Free &bull; Ad-Free JioSaavn V4 Streaming &bull; Offline Music Vault
                    </p>

                    {heroSong && (
                      <div className="pt-2">
                        <button
                          onClick={handleHeroListenNow}
                          className="px-6 sm:px-8 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all min-h-[44px]"
                        >
                          {isHeroPlaying ? (
                            <>
                              <Pause size={18} fill="black" />
                              <span>Pause Stream</span>
                            </>
                          ) : (
                            <>
                              <Play size={18} fill="black" className="ml-0.5" />
                              <span>Listen Now: {heroSong.name}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Creator Spotlight Profile Card: 48px round creator avatar */}
                  <div className="flex items-center gap-4 bg-[#0D0F11]/90 border border-emerald-500/40 p-4 rounded-2xl shadow-xl flex-shrink-0">
                    {/* Enlarged 48px Profile Avatar with Glowing Emerald Ring */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-800 border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 flex-shrink-0">
                      <Image
                        src="/creator.jpg"
                        alt="Rishabh Singh"
                        fill
                        priority
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-white">
                          Rishabh Singh
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">
                        Founder &amp; Lead Dev
                      </span>
                      <a
                        href="https://www.instagram.com/rish4bhsiingh/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-neutral-300 hover:text-emerald-400 transition-colors font-medium"
                      >
                        <Instagram size={12} className="text-pink-400" />
                        <span>@rish4bhsiingh</span>
                        <ExternalLink size={10} className="ml-0.5 text-neutral-500" />
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            </ErrorBoundary>

            {/* 2. FRESH DISCOVERIES (Trending Songs Feed) */}
            <ErrorBoundary fallbackTitle="Discoveries Unavailable">
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Flame size={22} className="text-emerald-400" />
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                        Fresh Discoveries
                      </h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Live dynamic chartbusters rotated continuously
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={loadLiveMusicFeed}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 active:scale-95 transition-all text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                    title="Refresh dynamic feed"
                  >
                    <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                    <span>{isRefreshing ? 'Loading...' : 'Refresh'}</span>
                  </button>
                </div>

                {isLoadingFeed ? (
                  /* Skeleton Pulses (Never Mock Data) */
                  <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={`trend-skel-${idx}`}
                        className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start flex flex-col p-3 rounded-2xl bg-[#16191E] border border-[#22262F] animate-pulse"
                      >
                        <div className="aspect-square w-full rounded-xl bg-neutral-800" />
                        <div className="mt-3 w-3/4 h-3.5 bg-neutral-800 rounded-full" />
                        <div className="mt-1.5 w-1/2 h-2.5 bg-neutral-800/60 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                    {trendingTracks.slice(0, 12).map((song) => (
                      <div
                        key={song.id}
                        className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start"
                      >
                        <SongCard song={song} allSongs={trendingTracks} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </ErrorBoundary>

            {/* 3. MADE FOR YOU (RECOMMENDED) */}
            <ErrorBoundary fallbackTitle="Recommendations Unavailable">
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={22} className="text-emerald-400" />
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                      Made For You (Recommended)
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Personalized recommendations based on trending chart seeds
                    </p>
                  </div>
                </div>

                {isLoadingFeed ? (
                  <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={`rec-skel-${idx}`}
                        className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start flex flex-col p-3 rounded-2xl bg-[#16191E] border border-[#22262F] animate-pulse"
                      >
                        <div className="aspect-square w-full rounded-xl bg-neutral-800" />
                        <div className="mt-3 w-3/4 h-3.5 bg-neutral-800 rounded-full" />
                        <div className="mt-1.5 w-1/2 h-2.5 bg-neutral-800/60 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                    {recommendedTracks.map((song) => (
                      <div
                        key={`rec-${song.id}`}
                        className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start"
                      >
                        <SongCard song={song} allSongs={recommendedTracks} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </ErrorBoundary>

            {/* 4. WORKOUT & GYM MOTIVATION (Dynamic) */}
            <ErrorBoundary fallbackTitle="Workout Tracks Unavailable">
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2.5">
                  <Dumbbell size={22} className="text-emerald-400" />
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                      Gym &amp; Workout Motivation
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      High-BPM Punjabi hype and workout bangers
                    </p>
                  </div>
                </div>

                {isLoadingFeed ? (
                  <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={`work-skel-${idx}`}
                        className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start flex flex-col p-3 rounded-2xl bg-[#16191E] border border-[#22262F] animate-pulse"
                      >
                        <div className="aspect-square w-full rounded-xl bg-neutral-800" />
                        <div className="mt-3 w-3/4 h-3.5 bg-neutral-800 rounded-full" />
                        <div className="mt-1.5 w-1/2 h-2.5 bg-neutral-800/60 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                    {workoutTracks.map((song) => (
                      <div
                        key={`workout-${song.id}`}
                        className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start"
                      >
                        <SongCard song={song} allSongs={workoutTracks} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </ErrorBoundary>
          </>
        )}

        {/* Footer Signature */}
        <FooterSignature />
      </div>
    </div>
  );
}
