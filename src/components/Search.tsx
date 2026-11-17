'use client';

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Loader2, Music2 } from 'lucide-react';
import Image from 'next/image';
import { Track } from '@/types/track';
import { searchTracks } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { usePlayerStore } from '@/store/playerStore';

export interface SearchProps {
  initialQuery?: string;
  placeholder?: string;
  onResults?: (results: Track[]) => void;
  onSelectTrack?: (track: Track, allTracks: Track[]) => void;
  showInlineResults?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export default function Search({
  initialQuery = '',
  placeholder = 'Search songs, artists, albums...',
  onResults,
  onSelectTrack,
  showInlineResults = false,
  className = '',
  autoFocus = false,
}: SearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 250);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const playQueue = usePlayerStore((s) => s.playQueue);

  // Sync external initialQuery if updated
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Execute two-tier debounced search automatically as user types (250ms)
  useEffect(() => {
    let isCancelled = false;

    const performSearch = async () => {
      const trimmed = debouncedQuery.trim();
      if (!trimmed) {
        setResults([]);
        setIsLoading(false);
        if (onResults) onResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const fetched = await searchTracks(trimmed, 20);
        if (!isCancelled) {
          setResults(fetched);
          if (onResults) onResults(fetched);
        }
      } catch (err) {
        console.warn('Real-time search error:', err);
        if (!isCancelled) {
          setResults([]);
          if (onResults) onResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, onResults]);

  // Close inline dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    if (onResults) onResults([]);
  };

  const handleTrackClick = (track: Track, index: number) => {
    if (onSelectTrack) {
      onSelectTrack(track, results);
    } else {
      playQueue(results, index);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center w-full">
        <SearchIcon
          size={18}
          className="absolute left-3.5 text-neutral-400 pointer-events-none transition-colors"
        />
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#12151c]/90 hover:bg-[#161a23] focus:bg-[#181d28] text-white text-xs sm:text-sm pl-10 pr-9 py-2.5 rounded-full border border-white/10 focus:border-emerald-500/80 outline-none transition-all placeholder:text-neutral-500 shadow-inner"
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute right-3 flex items-center">
          {isLoading ? (
            <Loader2 size={16} className="text-emerald-400 animate-spin" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-0.5"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Optional Inline Dropdown Results */}
      {showInlineResults && isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#16191E]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto divide-y divide-white/5 animate-in fade-in slide-in-from-top-2 duration-150">
          {isLoading && results.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin text-emerald-400" />
              <span>Searching JioSaavn live database...</span>
            </div>
          ) : results.length > 0 ? (
            results.slice(0, 8).map((track, idx) => (
              <div
                key={`inline-${track.id}-${idx}`}
                onClick={() => handleTrackClick(track, idx)}
                className="flex items-center gap-3 p-2.5 hover:bg-white/10 transition-colors cursor-pointer select-none group"
              >
                <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10">
                  <Image
                    src={track.albumArt || track.artwork || track.image || 'https://picsum.photos/seed/music/200/200'}
                    alt={track.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {track.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {track.artist} &bull; {track.album}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-neutral-400">
              No matching songs found for &quot;{query}&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
