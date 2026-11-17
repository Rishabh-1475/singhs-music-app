import { Track } from '@/types/track';
import { useLibraryStore } from '@/store/libraryStore';
import { auth } from '@/lib/firebase';

const PLAY_HISTORY_KEY = 'smc_play_history';
const LIKED_SONGS_KEY = 'smc_liked_songs';

export interface PlayHistoryItem {
  trackId: string;
  title: string;
  artist: string;
  genre?: string;
  playCount: number;
  lastPlayedAt: number;
}

/**
 * Log a track play when played past 20 seconds or completed
 */
export function logTrackPlay(track: Track): void {
  if (typeof window === 'undefined' || !track?.id) return;

  try {
    const raw = localStorage.getItem(PLAY_HISTORY_KEY);
    const history: Record<string, PlayHistoryItem> = raw ? JSON.parse(raw) : {};

    const existing = history[track.id];
    if (existing) {
      existing.playCount += 1;
      existing.lastPlayedAt = Date.now();
      existing.title = track.title || existing.title;
      existing.artist = track.artist || existing.artist;
      existing.genre = track.genre || existing.genre;
    } else {
      history[track.id] = {
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        genre: track.genre || 'Music',
        playCount: 1,
        lastPlayedAt: Date.now(),
      };
    }

    localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('smc_history_updated', { detail: { trackId: track.id } }));
  } catch (err) {
    console.warn('Failed to log play history:', err);
  }
}

/**
 * Get the full play history list sorted by last played or most played
 */
export function getPlayHistory(): PlayHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PLAY_HISTORY_KEY);
    if (!raw) return [];
    const history: Record<string, PlayHistoryItem> = JSON.parse(raw);
    return Object.values(history).sort((a, b) => b.playCount - a.playCount);
  } catch {
    return [];
  }
}

/**
 * Get the top N most frequently played artists from play history
 */
export function getTopArtists(limit = 2): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const history = getPlayHistory();
    if (history.length === 0) return [];

    const artistCounts: Record<string, number> = {};

    history.forEach((item) => {
      if (!item.artist) return;
      // Handle multi-artist strings (e.g. "Arijit Singh, Pritam")
      const primaryArtist = item.artist.split(',')[0].trim();
      artistCounts[primaryArtist] = (artistCounts[primaryArtist] || 0) + item.playCount;
    });

    return Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([artist]) => artist);
  } catch (err) {
    console.warn('Failed to get top artists:', err);
    return [];
  }
}

/**
 * Get all full liked songs stored in smc_liked_songs
 */
export function getLikedSongs(): Track[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LIKED_SONGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Check if a track is liked
 */
export function isSongLiked(trackId: string): boolean {
  if (typeof window === 'undefined' || !trackId) return false;
  try {
    const liked = getLikedSongs();
    return liked.some((t) => t.id === trackId);
  } catch {
    return false;
  }
}

/**
 * Toggle like for a track, saving full song objects to smc_liked_songs
 * Returns true if liked, false if removed
 */
export function toggleSongLike(track: Track): boolean {
  if (typeof window === 'undefined' || !track?.id) return false;

  try {
    const liked = getLikedSongs();
    const index = liked.findIndex((t) => t.id === track.id);
    let isNowLiked = false;
    let updated: Track[];

    if (index >= 0) {
      // Remove from liked
      updated = liked.filter((t) => t.id !== track.id);
      isNowLiked = false;
    } else {
      // Add to liked
      updated = [track, ...liked];
      isNowLiked = true;
    }

    localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(updated));

    // Also sync to user's unique auth ID if signed in
    try {
      const currentUid = auth?.currentUser?.uid;
      if (currentUid) {
        localStorage.setItem(`smc_liked_songs_${currentUid}`, JSON.stringify(updated));
      }
    } catch {
      // Ignore
    }

    // Also sync with Zustand libraryStore if available
    try {
      const libStore = useLibraryStore.getState();
      const inStore = libStore.isLiked(track.id);
      if (inStore !== isNowLiked) {
        libStore.toggleLike(track);
      }
    } catch {
      // Ignore if store is inaccessible
    }

    // Broadcast instant event across all components
    window.dispatchEvent(
      new CustomEvent('smc_liked_songs_changed', {
        detail: { trackId: track.id, isLiked: isNowLiked, track },
      })
    );

    return isNowLiked;
  } catch (err) {
    console.warn('Failed to toggle song like:', err);
    return false;
  }
}

/**
 * Subscribe to like state changes across any UI component
 */
export function onLikedSongsChange(
  callback: (trackId: string, isLiked: boolean, track?: Track) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ trackId: string; isLiked: boolean; track?: Track }>;
    if (custom.detail) {
      callback(custom.detail.trackId, custom.detail.isLiked, custom.detail.track);
    }
  };

  window.addEventListener('smc_liked_songs_changed', handler);
  return () => window.removeEventListener('smc_liked_songs_changed', handler);
}
