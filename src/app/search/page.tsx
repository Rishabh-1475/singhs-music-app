'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Play, Pause, Loader2, Music2, Heart, CheckCircle2 } from 'lucide-react';
import TopNav from '@/components/TopNav';
import TrackRow from '@/components/TrackRow';
import FooterSignature from '@/components/FooterSignature';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Track } from '@/types/track';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useAuthStore } from '@/store/authStore';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';
import { searchTracks } from '@/services/musicService';

const BROWSE_GENRES = [
  { name: 'Bollywood & Hindi', query: 'Top Hindi Songs', color: 'from-orange-600 to-amber-700' },
  { name: 'Global English Pop', query: 'Billboard Hot 100', color: 'from-emerald-600 to-teal-800' },
  { name: 'Tamil Kollywood', query: 'Tamil Top Hits', color: 'from-purple-600 to-indigo-800' },
  { name: 'Punjabi Bangers', query: 'Punjabi Hits', color: 'from-red-600 to-rose-800' },
  { name: 'Hip-Hop & Rap', query: 'Indian Hip Hop', color: 'from-stone-700 to-neutral-900' },
  { name: 'Midnight Lo-Fi', query: 'Bollywood Lofi', color: 'from-blue-700 to-sky-900' },
  { name: 'Romantic Anthems', query: 'Arijit Singh Romance', color: 'from-pink-600 to-rose-700' },
  { name: 'Dance & Party', query: 'Party Dance Hits', color: 'from-fuchsia-600 to-purple-800' },
  { name: 'Acoustic & Coffeehouse', query: 'Acoustic Hindi', color: 'from-cyan-700 to-blue-900' },
  { name: 'Devotional Anthems', query: 'Shree Hanuman Chalisa', color: 'from-amber-600 to-yellow-800' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const data = await searchTracks(searchQuery.trim(), 30);
      setResults(data && data.length > 0 ? data : TRENDING_FALLBACK_TRACKS);
    } catch (err) {
      console.error('Search error:', err);
      setResults(TRENDING_FALLBACK_TRACKS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Read initial query from window.location on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q =
        new URLSearchParams(window.location.search).get('q') ||
        new URLSearchParams(window.location.search).get('query') ||
        '';
      if (q.trim()) {
        setQuery(q.trim());
        executeSearch(q.trim());
      }
    }
  }, [executeSearch]);

  const handleSearchChange = (val: string) => {
    setQuery(val);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!val.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  const handleSearchClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setIsLoading(false);
  };

  const handleGenreClick = (genreQuery: string) => {
    setQuery(genreQuery);
    executeSearch(genreQuery);
  };

  const topResult = results[0];
  const otherSongs = results.slice(1, 5);
  const fullList = results;

  const isTopPlaying =
    topResult && currentTrack?.id === topResult.id && isPlaying;
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const showAuthToast = useAuthStore((s) => s.showAuthToast);

  const handlePlayTopResult = () => {
    if (!user) {
      showAuthToast('Sign in required to stream music and save playlists.');
      openAuthModal();
      return;
    }
    if (!topResult) return;
    if (isTopPlaying) {
      togglePlay();
    } else {
      playQueue(results, 0);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0F11]">
      {/* Top Navbar with Embedded Search Bar */}
      <TopNav
        searchQuery={query}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
      />

      {/* Scrollable View Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-36 md:pb-20 space-y-8 scroll-smooth">
        <ErrorBoundary fallbackTitle="Search Content Unavailable">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-neutral-400 space-y-3">
            <Loader2 className="animate-spin text-[#1DB954]" size={36} />
            <p className="text-xs font-mono tracking-widest uppercase">
              Searching JioSaavn Live Database...
            </p>
          </div>
        ) : hasSearched && results.length > 0 ? (
          <>
            {/* Top Result + Songs Side-by-Side (Spotify Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Top Result Card */}
              {topResult && (
                <div className="lg:col-span-5 space-y-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Top result
                  </h2>
                  <div
                    onClick={handlePlayTopResult}
                    className="group relative rounded-2xl bg-[#16191E] border border-[#22262F] hover:border-neutral-500 hover:bg-[#1c2027] p-5 cursor-pointer transition-all duration-200 select-none shadow-xl hover:-translate-y-0.5"
                  >
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden bg-neutral-900 shadow-md border border-[#22262F]">
                      <Image
                        src={topResult.albumArt || topResult.artwork || 'https://picsum.photos/seed/spotify/400/400'}
                        alt={topResult.title}
                        fill
                        priority
                        className="object-cover"
                      />
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate mt-4">
                      {topResult.title}
                    </h3>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 uppercase tracking-wider">
                        Song
                      </span>
                      <p className="text-sm font-semibold text-neutral-400 truncate">
                        {topResult.artist}
                      </p>
                    </div>

                    {/* Floating Green Play Button */}
                    <div className="absolute bottom-5 right-5">
                      <div
                        className={`w-12 h-12 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                          isTopPlaying
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                        }`}
                      >
                        {isTopPlaying ? (
                          <Pause size={22} fill="currentColor" />
                        ) : (
                          <Play size={22} fill="currentColor" className="ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Column: Top 4 Songs */}
              <div className="lg:col-span-7 space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Songs
                </h2>
                <div className="space-y-1">
                  {otherSongs.map((track, i) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={i}
                      tracks={results}
                      showAlbum={false}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Below: Featuring All Matching Songs Table */}
            <section className="space-y-3 pt-4 border-t border-[#22262F]">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                All matching tracks
              </h2>

              {/* Table Headers */}
              <div className="grid grid-cols-12 gap-4 px-3.5 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-[#22262F] select-none">
                <div className="col-span-8 sm:col-span-6 flex items-center gap-3">
                  <span className="w-5 text-center">#</span>
                  <span>Title</span>
                </div>
                <div className="hidden sm:block sm:col-span-4">Album</div>
                <div className="col-span-4 sm:col-span-2 text-right">Duration</div>
              </div>

              {/* Track Rows */}
              <div className="space-y-1">
                {fullList.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i}
                    tracks={fullList}
                    showAlbum={true}
                  />
                ))}
              </div>
            </section>
          </>
        ) : hasSearched && results.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 space-y-2">
            <Music2 size={42} className="mx-auto text-neutral-600" />
            <h3 className="text-lg font-bold text-white">No results found for &quot;{query}&quot;</h3>
            <p className="text-xs text-neutral-400">
              Please check your spelling or search for another artist or song.
            </p>
          </div>
        ) : (
          /* Empty Query: "Browse all" with Colorful Genre Cards */
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Browse all
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {BROWSE_GENRES.map((g) => (
                <div
                  key={g.name}
                  onClick={() => handleGenreClick(g.query)}
                  className={`relative aspect-[16/10] rounded-2xl bg-gradient-to-br ${g.color} p-4 cursor-pointer overflow-hidden transition-all duration-200 hover:scale-[1.02] shadow-md select-none group border border-white/10`}
                >
                  <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                    {g.name}
                  </h3>
                  <div className="absolute -bottom-2 -right-3 w-16 h-16 rounded-xl bg-black/20 shadow-2xl rotate-25 flex items-center justify-center text-white/50 group-hover:rotate-12 transition-transform">
                    <Music2 size={24} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </ErrorBoundary>

        <FooterSignature />
      </div>
    </div>
  );
}
