'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  Flame,
  Radio,
  Clock,
  Heart,
  ChevronRight,
  RefreshCw,
  Shuffle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import SongCard from '@/components/SongCard';
import FooterSignature from '@/components/FooterSignature';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Track, Artist } from '@/types/track';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';
import { getTopArtists } from '@/services/recommendationService';
import {
  searchTracks,
  fetchCategories,
  fetchArtists,
  fetchTrendingTracks,
  MusicCategory,
} from '@/services/musicService';

const SEED_POOL = [
  'Top Hindi',
  'Arijit Singh',
  'Bollywood Romance',
  'Punjabi Pop',
  'Sidhu Moose Wala',
  'AP Dhillon',
  'Lo-Fi Beats',
  'Workout Hype',
  'Karan Aujla',
  'Anirudh Ravichander',
  'Diljit Dosanjh',
  'Trending India',
];

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type CategoryData = MusicCategory;

function HeroArtistPlayButton({ trendingTracks }: { trendingTracks: Track[] }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const currentTrackArtist = usePlayerStore((s) => s.currentTrack?.artist);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const showAuthToast = useAuthStore((s) => s.showAuthToast);

  const isHeroArtistPlaying = Boolean(
    currentTrackArtist &&
      (currentTrackArtist.toLowerCase().includes('arijit') ||
        currentTrackId === trendingTracks[0]?.id) &&
      isPlaying
  );

  const handleHeroListenNow = () => {
    if (!user) {
      showAuthToast('Sign in required to stream music and save playlists.');
      openAuthModal();
      return;
    }
    if (isHeroArtistPlaying) {
      togglePlay();
    } else {
      playQueue(trendingTracks, 0);
    }
  };

  return (
    <button
      onClick={handleHeroListenNow}
      className="px-6 sm:px-8 py-3 rounded-full bg-[#1DB954] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-xl shadow-[#1DB954]/30 hover:scale-105 active:scale-95 transition-transform min-h-[44px]"
    >
      {isHeroArtistPlaying ? (
        <>
          <Pause size={18} fill="black" />
          <span>Pause</span>
        </>
      ) : (
        <>
          <Play size={18} fill="black" className="ml-0.5" />
          <span>Listen Now</span>
        </>
      )}
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(TRENDING_FALLBACK_TRACKS);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);

  // Recommendations state
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [recommendedSubtitle, setRecommendedSubtitle] = useState<string>('Personalized based on your taste');
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(true);

  // Isolate playQueue so HomePage never re-renders when tracks change or play/pause toggles
  const playQueue = usePlayerStore((s) => s.playQueue);

  // 1. Offline Startup Guard: automatically switch to offline vault when opened without internet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkOffline = () => {
        if (!navigator.onLine) {
          router.push('/downloads');
        }
      };
      checkOffline();
      window.addEventListener('offline', checkOffline);
      return () => window.removeEventListener('offline', checkOffline);
    }
  }, [router]);

  // 2. Dynamic Shuffled Home Feed Loader: picks 3 random seeds, fetches, & Fisher-Yates shuffles
  const loadDynamicShuffledFeed = useCallback(async () => {
    setIsRefreshingFeed(true);
    try {
      const shuffledSeeds = fisherYatesShuffle(SEED_POOL);
      const chosenSeeds = shuffledSeeds.slice(0, 3);

      const songArrays = await Promise.all(
        chosenSeeds.map((term) => searchTracks(term, 8))
      );

      const combined: Track[] = [];
      const seen = new Set<string>();
      for (const arr of songArrays) {
        for (const t of arr) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            combined.push(t);
          }
        }
      }

      if (combined.length > 0) {
        const fullyShuffled = fisherYatesShuffle(combined);
        setTrendingTracks(fullyShuffled);
      }
    } catch (err) {
      console.warn('Failed to shuffle dynamic feed:', err);
    } finally {
      setIsRefreshingFeed(false);
    }
  }, []);

  useEffect(() => {
    loadDynamicShuffledFeed();
  }, [loadDynamicShuffledFeed]);

  // Load recommendations based on top played artists in smc_play_history
  useEffect(() => {
    let isMounted = true;

    async function fetchRecommendations() {
      try {
        const topArtists = getTopArtists(2);

        if (!topArtists || topArtists.length === 0) {
          if (isMounted) {
            setRecommendedTracks(trendingTracks.slice(0, 12));
            setRecommendedSubtitle('Trending chartbusters tailored for you');
            setIsLoadingRecs(false);
          }
          return;
        }

        if (isMounted) {
          setRecommendedSubtitle(`Inspired by your favorite artists: ${topArtists.join(' & ')}`);
          setIsLoadingRecs(true);
        }

        const results = await Promise.all(
          topArtists.map(async (artist) => {
            try {
              const tracks = await searchTracks(artist, 10);
              return tracks || [];
            } catch (e) {
              console.warn('Failed to fetch recommendations for artist:', artist, e);
              return [] as Track[];
            }
          })
        );

        if (!isMounted) return;

        const merged: Track[] = [];
        const seen = new Set<string>();

        const maxLen = Math.max(...results.map((r) => r.length), 0);
        for (let i = 0; i < maxLen; i++) {
          for (const list of results) {
            if (list[i] && !seen.has(list[i].id)) {
              seen.add(list[i].id);
              merged.push(list[i]);
            }
          }
        }

        if (merged.length > 0) {
          setRecommendedTracks(merged);
        } else {
          setRecommendedTracks(trendingTracks.slice(0, 12));
        }
      } catch (err) {
        console.warn('Failed to load recommended tracks:', err);
        if (isMounted) {
          setRecommendedTracks(trendingTracks.slice(0, 12));
        }
      } finally {
        if (isMounted) setIsLoadingRecs(false);
      }
    }

    fetchRecommendations();

    const handleHistoryUpdate = () => {
      fetchRecommendations();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('smc_history_updated', handleHistoryUpdate);
    }
    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('smc_history_updated', handleHistoryUpdate);
      }
    };
  }, [trendingTracks]);

  // Load live categories & live artists via client service
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [cats, arts] = await Promise.allSettled([
          fetchCategories(),
          fetchArtists(),
        ]);

        if (isMounted) {
          if (cats.status === 'fulfilled' && cats.value && cats.value.length > 0) {
            setCategories(cats.value);
          }
          if (arts.status === 'fulfilled' && arts.value && arts.value.length > 0) {
            setArtists(arts.value);
          }
        }
      } catch (err) {
        console.warn('Using default music data:', err);
      } finally {
        if (isMounted) setIsLoadingArtists(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleArtistClick = async (artistName: string) => {
    try {
      const list = await searchTracks(artistName, 15);
      if (list && list.length > 0) {
        playQueue(list, 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0F11]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-36 md:pb-20 space-y-8 sm:space-y-10 scroll-smooth">
        <ErrorBoundary fallbackTitle="Spotlight Banner Unavailable">
          {/* 1. Sleek 2.5D/3D Styled Headline Banner */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#16191E] via-[#1a1f28] to-[#16191E] border border-[#22262F] p-5 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-[#1DB954] animate-ping" />
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#1DB954] uppercase">
                  OFFICIAL STREAM ARCHIVE &bull; 320 KBPS LOSSLESS
                </span>
              </div>

              {/* 2.5D Layered 3D Headline */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_16px_rgba(29,185,84,0.35)]">
                Welcome to Singh&apos;s Music Company
              </h1>
              <p className="text-xs sm:text-base font-medium text-neutral-300 mt-1.5 sm:mt-2">
                The Best Lag-Free Music Experience &bull; Direct Online JioSaavn Streaming
              </p>
            </div>

            {/* Creator Badge & Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 bg-[#0D0F11]/80 border border-[#1DB954]/50 px-3.5 py-1.5 rounded-full shadow-lg">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#1DB954] flex-shrink-0">
                  <Image
                    src="/creator.jpg"
                    alt="Rishabh Singh"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-mono font-bold text-[#1DB954] uppercase">
                    Creator &bull; Founder
                  </span>
                  <span className="text-xs font-bold text-white">
                    Rishabh Singh
                  </span>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="block text-base font-black text-[#1DB954]">100%</span>
                  <span className="text-[9px] text-neutral-400 uppercase font-mono">Zero Ads</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="block text-base font-black text-white">320k</span>
                  <span className="text-[9px] text-neutral-400 uppercase font-mono">Lossless</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Large Featured Artist Spotlight Card (Wiz Khalifa / Beyond Time reference) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c1410] via-[#121c16] to-[#16191E] border border-[#22262F] p-6 sm:p-10 shadow-2xl">
          {/* Ambient Blurred Glow Backdrop */}
          <div className="absolute -right-16 -top-16 w-96 h-96 bg-[#1DB954]/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left Artist Details */}
            <div className="md:col-span-7 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white">
                <CheckCircle2 size={15} className="text-[#1DB954]" />
                <span>Verified Artist</span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-none">
                  Arijit Singh
                </h2>
                <p className="text-xs sm:text-base font-semibold text-neutral-300 mt-2 sm:mt-3 flex items-center gap-2 flex-wrap">
                  <span>38,421,980 monthly listeners</span>
                  <span>&bull;</span>
                  <span className="text-[#1DB954]">#1 Most Streamed</span>
                </p>
                <p className="text-xs sm:text-sm text-neutral-400 mt-2 line-clamp-2 max-w-lg">
                  Experience the soul of Indian music with chartbuster anthems from KING, Dhurandhar, Ramayana, and classic romantic acoustic flips.
                </p>
              </div>

              {/* Action Buttons: Listen Now & Follow */}
              <div className="flex items-center gap-3 sm:gap-4 pt-2">
                <HeroArtistPlayButton trendingTracks={trendingTracks} />

                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-6 sm:px-7 py-3 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase transition-colors border min-h-[44px] ${
                    isFollowing
                      ? 'border-[#1DB954] text-[#1DB954] bg-[#1DB954]/10'
                      : 'border-white/30 text-white hover:border-white hover:bg-white/5'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>

            {/* Right Artist Cutout/Backdrop Image */}
            <div className="md:col-span-5 flex justify-center md:justify-end">
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900 group">
                <Image
                  src={artists[0]?.image || 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg'}
                  alt="Arijit Singh"
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Spotlight Edition
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        </ErrorBoundary>

        {/* 3. Dynamic Section: "Made For You (Recommended)" */}
        <ErrorBoundary fallbackTitle="Recommended Feed Unavailable">
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles size={22} className="text-emerald-400" />
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                    Made For You (Recommended)
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {recommendedSubtitle}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-wider cursor-pointer hidden sm:block">
                See all
              </span>
            </div>

            {isLoadingRecs ? (
              <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`rec-skeleton-${idx}`}
                    className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start flex flex-col p-3.5 rounded-2xl bg-[#16191E] border border-[#22262F] animate-pulse"
                  >
                    <div className="aspect-square w-full rounded-xl bg-zinc-800" />
                    <div className="mt-3 w-3/4 h-3.5 bg-zinc-800 rounded-full" />
                    <div className="mt-1.5 w-1/2 h-2.5 bg-zinc-800/60 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                {recommendedTracks.map((track) => (
                  <div
                    key={`rec-${track.id}`}
                    className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start"
                  >
                    <SongCard
                      track={track}
                      tracks={recommendedTracks}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </ErrorBoundary>

        {/* 4. Horizontal Grid / Carousel: Dynamic Shuffled Feed */}
        <ErrorBoundary fallbackTitle="Feed Unavailable">
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame size={22} className="text-emerald-400" />
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                    Fresh Discoveries
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Live randomized mix rotated across top chart seeds
                  </p>
                </div>
              </div>

              <button
                onClick={loadDynamicShuffledFeed}
                disabled={isRefreshingFeed}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 active:scale-95 transition-all text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                title="Shuffle and refresh feed"
              >
                <RefreshCw size={13} className={isRefreshingFeed ? 'animate-spin' : ''} />
                <span>{isRefreshingFeed ? 'Shuffling...' : 'Refresh Feed'}</span>
              </button>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 snap-x snap-mandatory">
              {trendingTracks.slice(0, 12).map((track) => (
                <div
                  key={track.id}
                  className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start"
                >
                  <SongCard
                    track={track}
                    tracks={trendingTracks}
                  />
                </div>
              ))}
            </div>
          </section>
        </ErrorBoundary>

        {/* 4. Circular Artist Avatars: "Fans also like" */}
        <ErrorBoundary fallbackTitle="Featured Artists Unavailable">
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                Fans also like
              </h2>
              <span className="text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-wider cursor-pointer">
                Show all
              </span>
            </div>

            {isLoadingArtists ? (
              /* Sleek Circular Skeleton Loader with Dark Shimmer */
              <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={`artist-skeleton-${idx}`}
                    className="min-w-[135px] sm:min-w-[155px] md:min-w-0 flex-shrink-0 snap-start flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl bg-[#16191E] border border-[#22262F] animate-pulse"
                  >
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full aspect-square bg-zinc-800" />
                    <div className="mt-3 w-20 h-3.5 bg-zinc-800 rounded-full" />
                    <div className="mt-1.5 w-12 h-2.5 bg-zinc-800/60 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              /* Live Dynamic Artists fetched from API */
              <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => handleArtistClick(artist.name)}
                    className="min-w-[135px] sm:min-w-[155px] md:min-w-0 flex-shrink-0 snap-start group flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl bg-[#16191E] border border-[#22262F] hover:border-neutral-500 hover:bg-[#1c2027] transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 select-none"
                  >
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full aspect-square overflow-hidden bg-neutral-900 border-2 border-transparent group-hover:border-[#1DB954] shadow-md transition-all">
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        fill
                        sizes="(max-width: 768px) 128px, 150px"
                        className="rounded-full aspect-square object-cover shadow-md group-hover:scale-105 transition-transform duration-200"
                      />
                      {/* Floating Play Overlay on Artist Avatar */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-lg">
                          <Play size={18} fill="black" className="ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 sm:mt-3 min-w-0 w-full">
                      <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                        {artist.name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-neutral-400 truncate mt-0.5">
                        {artist.role || 'Artist'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </ErrorBoundary>

        {/* 5. Dynamic Shelves (Hindi, English, Tamil, Punjabi, Lo-Fi) */}
        <ErrorBoundary fallbackTitle="Shelves Unavailable">
          {categories.map((cat) => (
            <section key={cat.id} className="space-y-3 sm:space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight hover:underline cursor-pointer">
                    {cat.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>
                <span className="text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-wider cursor-pointer hidden sm:block">
                  Show all
                </span>
              </div>

              <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 snap-x snap-mandatory">
                {cat.tracks.slice(0, 8).map((track) => (
                  <div
                    key={track.id}
                    className="min-w-[150px] sm:min-w-[170px] md:min-w-0 flex-shrink-0 snap-start"
                  >
                    <SongCard
                      track={track}
                      tracks={cat.tracks}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </ErrorBoundary>

        {/* 6. Centered Minimalist Footer: "Made with ❤️ by Rishabh Singh" */}
        <FooterSignature />
      </div>
    </div>
  );
}
