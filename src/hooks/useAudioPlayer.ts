'use client';

import { usePlayerStore, globalAudio } from '@/store/playerStore';

export function useAudioPlayer() {
  const seek = usePlayerStore((s) => s.seek);
  return { seek, audio: globalAudio };
}
