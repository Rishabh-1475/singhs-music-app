'use client';

import { useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

export default function KeyboardShortcuts() {
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const progress = usePlayerStore((s) => s.progress);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { seek } = useAudioPlayer();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (currentTrack) togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, progress - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(progress + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, seek, progress, volume, setVolume, currentTrack]);

  return null;
}
