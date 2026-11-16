'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleInputChange = (val: string) => {
    setLocalQuery(val);

    if (externalOnChange) {
      externalOnChange(val);
      return;
    }

    // If outside search page, typing redirects to /search?q=... smoothly
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
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-[#0D0F11]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between text-white border-b border-[#22262F] select-none gap-4">
      {/* Left: History Navigation Buttons & Search Input */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-2xl">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#16191E] border border-[#22262F] flex items-center justify-center text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
            title="Go back"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => router.forward()}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#16191E] border border-[#22262F] flex items-center justify-center text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Right: Creator Profile Tag (Rishabh Singh • Founder / PRO with subtle green online status dot) */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 bg-[#16191E] border border-[#22262F] hover:border-neutral-600 px-3.5 py-1.5 rounded-full shadow-md transition-colors">
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border-2 border-[#1DB954]/70 flex-shrink-0">
            <Image
              src="/creator.jpg"
              alt="Rishabh Singh"
              fill
              priority
              className="object-cover"
            />
            {/* Subtle green online status dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#1DB954] ring-2 ring-[#16191E]" />
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight">
                Hello, Rishabh Singh
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#1DB954]/20 text-[#1DB954] text-[9px] font-mono font-bold border border-[#1DB954]/30 uppercase">
                Founder
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#1DB954] text-black text-[9px] font-black uppercase">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono tracking-wider mt-0.5">
              Singh&apos;s Music Company
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
