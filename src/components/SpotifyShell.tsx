'use client';

import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Player from './Player';
import QueuePanel from './QueuePanel';
import KeyboardShortcuts from './KeyboardShortcuts';
import MobileBottomNav from './MobileBottomNav';
import ErrorBoundary from './ErrorBoundary';

export default function SpotifyShell({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }
  }, []);
  return (
    <div className="flex h-screen w-screen flex-col bg-[#0D0F11] text-white overflow-hidden select-none font-sans">
      <KeyboardShortcuts />

      {/* Main Body: Left Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden p-0 sm:p-2.5 gap-0 sm:gap-2.5">
        <ErrorBoundary fallbackTitle="Sidebar unavailable">
          <Sidebar />
        </ErrorBoundary>

        {/* Main Content Pane */}
        <div className="flex-1 rounded-none sm:rounded-2xl bg-[#0D0F11] flex flex-col overflow-hidden relative border-0 sm:border border-[#22262F] shadow-2xl">
          <ErrorBoundary fallbackTitle="Page view unavailable">
            {children}
          </ErrorBoundary>
        </div>
      </div>

      {/* Persistent Bottom Player Bar & Mobile Mini-Player */}
      <ErrorBoundary fallbackTitle="Player unavailable">
        <Player />
      </ErrorBoundary>
      <QueuePanel />

      {/* Mobile Bottom Navigation (< 768px) */}
      <MobileBottomNav />
    </div>
  );
}
