import { create } from 'zustand';
import { Track, RepeatMode } from '@/types/track';
import {
  enableBackgroundMode,
  disableBackgroundMode,
  updateBackgroundModeSettings,
} from '@/services/backgroundAudio';
import { useAuthStore } from '@/store/authStore';
import { getSimilarSongs } from '@/services/api';

function checkAuthGate(): boolean {
  const user = useAuthStore.getState().user;
  if (!user) {
    useAuthStore.getState().showAuthToast('Sign in required to stream music and save playlists.');
    useAuthStore.getState().openAuthModal();
    return false;
  }
  return true;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[];
  upNextQueue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  showQueue: boolean;
  showFullScreen: boolean;

  setTrack: (track: Track) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  appendQueue: (tracks: Track[]) => void;
  setUpNextQueue: (tracks: Track[]) => void;
  fetchSimilarUpNext: (track: Track) => Promise<void>;
  togglePlay: () => void;
  setIsPlaying: (v: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setProgress: (v: number) => void;
  setDuration: (v: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleQueue: () => void;
  toggleFullScreen: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadVolume(): number {
  if (typeof window === 'undefined') return 0.7;
  const saved = localStorage.getItem('sp-volume');
  return saved ? parseFloat(saved) : 0.7;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  originalQueue: [],
  upNextQueue: [],
  queueIndex: -1,
  isPlaying: false,
  volume: loadVolume(),
  isMuted: false,
  progress: 0,
  duration: 0,
  repeatMode: 'off',
  isShuffled: false,
  showQueue: false,
  showFullScreen: false,

  setUpNextQueue: (tracks) => set({ upNextQueue: tracks }),

  fetchSimilarUpNext: async (track) => {
    if (!track?.id) return;
    try {
      const similar = await getSimilarSongs(track.id, track.artist);
      const { queue, currentTrack } = get();
      const currentId = currentTrack?.id;
      const filtered = similar.filter(
        (t) => t.id !== currentId && !queue.some((q) => q.id === t.id)
      );
      set({ upNextQueue: filtered.slice(0, 10) });
    } catch (err) {
      console.warn('Failed to pre-fetch similar up-next tracks:', err);
    }
  },

  setTrack: (track) => {
    if (!checkAuthGate()) {
      disableBackgroundMode();
      set({ currentTrack: null, isPlaying: false, progress: 0, duration: 0 });
      return;
    }
    enableBackgroundMode(track);
    set({
      currentTrack: track,
      queue: [track],
      originalQueue: [track],
      queueIndex: 0,
      isPlaying: true,
      progress: 0,
      duration: 0,
    });
    get().fetchSimilarUpNext(track);
  },

  playQueue: (tracks, startIndex = 0) => {
    if (!checkAuthGate()) {
      disableBackgroundMode();
      set({
        currentTrack: null,
        isPlaying: false,
        queue: [],
        originalQueue: [],
        upNextQueue: [],
        queueIndex: -1,
        progress: 0,
        duration: 0,
      });
      return;
    }
    const { isShuffled } = get();
    const q = isShuffled ? shuffleArray(tracks) : tracks;
    const idx = isShuffled
      ? q.findIndex((t) => t.id === tracks[startIndex].id)
      : startIndex;
    const targetTrack = q[idx] || tracks[0];
    enableBackgroundMode(targetTrack);
    set({
      queue: q,
      originalQueue: tracks,
      queueIndex: idx,
      currentTrack: targetTrack,
      isPlaying: true,
      progress: 0,
      duration: 0,
    });
    if (targetTrack) {
      get().fetchSimilarUpNext(targetTrack);
    }
  },

  appendQueue: (newTracks) => {
    const { queue, originalQueue } = get();
    set({
      queue: [...queue, ...newTracks],
      originalQueue: [...originalQueue, ...newTracks],
    });
  },

  togglePlay: () => {
    const nextPlaying = !get().isPlaying;
    if (nextPlaying) {
      if (!checkAuthGate()) {
        disableBackgroundMode();
        set({ isPlaying: false, currentTrack: null });
        return;
      }
      enableBackgroundMode(get().currentTrack);
    } else {
      disableBackgroundMode();
    }
    set({ isPlaying: nextPlaying });
  },

  setIsPlaying: (v) => {
    if (v) {
      if (!checkAuthGate()) {
        disableBackgroundMode();
        set({ isPlaying: false, currentTrack: null });
        return;
      }
      enableBackgroundMode(get().currentTrack);
    } else {
      disableBackgroundMode();
    }
    set({ isPlaying: v });
  },

  nextTrack: () => {
    const { queue, originalQueue, queueIndex, repeatMode, upNextQueue } = get();

    // 1. If queue has remaining songs, play next one
    if (queue.length > 0 && queueIndex + 1 < queue.length) {
      const nextIdx = queueIndex + 1;
      const nextSong = queue[nextIdx];
      updateBackgroundModeSettings(nextSong);
      set({
        queueIndex: nextIdx,
        currentTrack: nextSong,
        isPlaying: true,
        progress: 0,
        duration: 0,
      });
      get().fetchSimilarUpNext(nextSong);
      return;
    }

    // 2. If at end of queue and repeat 'all' is active, loop back to start
    if (repeatMode === 'all' && queue.length > 0) {
      const nextSong = queue[0];
      updateBackgroundModeSettings(nextSong);
      set({
        queueIndex: 0,
        currentTrack: nextSong,
        isPlaying: true,
        progress: 0,
        duration: 0,
      });
      get().fetchSimilarUpNext(nextSong);
      return;
    }

    // 3. Continuous Algorithmic Radio: Transition seamlessly to upNextQueue
    if (upNextQueue.length > 0) {
      const nextSong = upNextQueue[0];
      const remainingUpNext = upNextQueue.slice(1);
      const updatedQueue = [...queue, nextSong];
      const updatedOriginal = [...originalQueue, nextSong];
      updateBackgroundModeSettings(nextSong);
      set({
        queue: updatedQueue,
        originalQueue: updatedOriginal,
        queueIndex: updatedQueue.length - 1,
        currentTrack: nextSong,
        upNextQueue: remainingUpNext,
        isPlaying: true,
        progress: 0,
        duration: 0,
      });
      get().fetchSimilarUpNext(nextSong);
      return;
    }

    // 4. No more tracks available
    disableBackgroundMode();
    set({ isPlaying: false });
  },

  prevTrack: () => {
    const { queue, queueIndex, progress } = get();
    if (queue.length === 0) return;
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }
    let prev = queueIndex - 1;
    if (prev < 0) prev = queue.length - 1;
    const prevSong = queue[prev];
    updateBackgroundModeSettings(prevSong);
    set({
      queueIndex: prev,
      currentTrack: prevSong,
      isPlaying: true,
      progress: 0,
      duration: 0,
    });
  },

  playNextTrack: () => {
    get().nextTrack();
  },

  playPreviousTrack: () => {
    get().prevTrack();
  },

  setVolume: (v) => {
    if (typeof window !== 'undefined') localStorage.setItem('sp-volume', String(v));
    set({ volume: v, isMuted: v === 0 });
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setProgress: (v) => set({ progress: v }),
  setDuration: (v) => set({ duration: v }),

  toggleRepeat: () =>
    set((s) => ({
      repeatMode:
        s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off',
    })),

  toggleShuffle: () => {
    const { isShuffled, originalQueue, queue, currentTrack } = get();
    if (isShuffled) {
      const idx = currentTrack
        ? originalQueue.findIndex((t) => t.id === currentTrack.id)
        : 0;
      set({ queue: originalQueue, queueIndex: idx, isShuffled: false });
    } else {
      const shuffled = shuffleArray(queue);
      const idx = currentTrack
        ? shuffled.findIndex((t) => t.id === currentTrack.id)
        : 0;
      set({ queue: shuffled, queueIndex: idx, isShuffled: true });
    }
  },

  toggleQueue: () => set((s) => ({ showQueue: !s.showQueue })),
  toggleFullScreen: () => set((s) => ({ showFullScreen: !s.showFullScreen })),
}));
