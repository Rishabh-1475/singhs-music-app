'use client';

import { Track } from '@/types/track';

let wakeLockSentinel: any = null;

/**
 * Native Web Wake-Lock and audio playback keep-alive
 */
export async function enableBackgroundMode(track?: Track | null): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
      if (!wakeLockSentinel) {
        wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      }
    }
  } catch (err) {
    // Non-fatal if WakeLock is not granted
  }
}

/**
 * Update background metadata (handled natively by MediaSession)
 */
export function updateBackgroundModeSettings(track?: Track | null): void {
  // Handled cleanly via standard navigator.mediaSession
}

/**
 * Release WakeLock when audio stops
 */
export function disableBackgroundMode(): void {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
}
