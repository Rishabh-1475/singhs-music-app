'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import SongCard from '@/components/SongCard';
import FooterSignature from '@/components/FooterSignature';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Track, Artist } from '@/types/track';
import { usePlayerStore } from '@/store/playerStore';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';

interface CategoryData {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  tracks: Track[];
}

export default function HomePage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(TRENDING_FALLBACK_TRACKS);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  // Load live categories & live artists with fallback guarantee
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [catRes, artistRes] = await Promise.allSettled([
          fetch('/api/music/categories'),
          fetch('/api/music/artists'),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value.ok) {
          const data = await catRes.value.json();
          if (isMounted && data.categories && data.categories.length > 0) {
            setCategories(data.categories);
            const firstTracks = data.categories[0]?.tracks;
            if (firstTracks && firstTracks.length > 0) {
              setTrendingTracks(firstTracks);
            }
          }
        }

        if (artistRes.status === 'fulfilled' && artistRes.value.ok) {
          const aData = await artistRes.value.json();
          if (isMounted && aData?.data && Array.isArray(aData.data) && aData.data.length > 0) {
            setArtists(aData.data);
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

  const isHeroArtistPlaying =
    currentTrack &&
    (currentTrack.artist.toLowerCase().includes('arijit') ||
      currentTrack.id === trendingTracks[0]?.id) &&
    isPlaying;

  const handleHeroListenNow = () => {
    if (isHeroArtistPlaying) {
      togglePlay();
    } else {
      playQueue(trendingTracks, 0);
    }
  };

  const handleArtistClick = async (artistName: string) => {
    try {
      const res = await fetch(
        `/api/music/search?q=${encodeURIComponent(artistName)}&limit=15`
      );
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        if (list.length > 0) {
          playQueue(list, 0);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0F11]">
      {/* Top Navbar */}
      <TopNav />

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

        {/* 3. Horizontal Grid / Carousel: "Recently Played" */}
        <ErrorBoundary fallbackTitle="Recently Played Unavailable">
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-[#1DB954]" />
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  Recently Played
                </h2>
              </div>
              <span className="text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-wider cursor-pointer">
                See all
              </span>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 snap-x snap-mandatory">
              {trendingTracks.slice(0, 8).map((track) => (
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
