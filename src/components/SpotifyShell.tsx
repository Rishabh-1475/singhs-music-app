'use client';

import { useEffect } from 'react';
import { Lock, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Player from './Player';
import QueuePanel from './QueuePanel';
import KeyboardShortcuts from './KeyboardShortcuts';
import MobileBottomNav from './MobileBottomNav';
import ErrorBoundary from './ErrorBoundary';
import AuthModal from './AuthModal';
import { useAuthStore } from '@/store/authStore';

export default function SpotifyShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const toastMessage = useAuthStore((s) => s.toastMessage);
  const clearAuthToast = useAuthStore((s) => s.clearAuthToast);

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

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Floating Auth Toast Notice */}
      {toastMessage && (
        <aside
          aria-live="polite"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-neutral-900/95 border border-emerald-500/50 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Lock size={13} />
          </span>
          <span className="text-xs sm:text-sm font-semibold text-emerald-300">
            {toastMessage}
          </span>
          <button
            onClick={clearAuthToast}
            className="ml-2 p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </aside>
      )}
    </div>
  );
}
