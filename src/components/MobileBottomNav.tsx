'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, User } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/library', label: 'Your Library', icon: Library },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0D0F11]/95 backdrop-blur-2xl border-t border-[#22262F] flex items-center justify-around px-3 select-none">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-colors ${
              isActive ? 'text-[#1DB954]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Icon size={20} className={isActive ? 'stroke-[2.5px]' : ''} />
            <span className="text-[10px] font-medium tracking-tight mt-1">
              {label}
            </span>
          </Link>
        );
      })}

      {/* Creator Profile shortcut */}
      <Link
        href="/library"
        className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-neutral-400 hover:text-white transition-colors"
      >
        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#1DB954]/80">
          <Image
            src="/creator.jpg"
            alt="Rishabh Singh"
            fill
            className="object-cover"
          />
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-[#1DB954] ring-1 ring-black" />
        </div>
        <span className="text-[10px] font-medium tracking-tight mt-1">
          Profile
        </span>
      </Link>
    </nav>
  );
}
