import { create } from 'zustand';
import { Track, RepeatMode } from '@/types/track';
import {
  enableBackgroundMode,
  disableBackgroundMode,
  updateBackgroundModeSettings,
} from '@/services/backgroundAudio';
import { useAuthStore } from '@/store/authStore';

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

  setTrack: (track) => {
    if (!checkAuthGate()) {
      disableBackgroundMode();
      set({ currentTrack: null, isPlaying: false, progress: 0, duration: 0 });
      return;
    }
    enableBackgroundMode(track);
    set({ currentTrack: track, isPlaying: true, progress: 0, duration: 0 });
  },

  playQueue: (tracks, startIndex = 0) => {
    if (!checkAuthGate()) {
      disableBackgroundMode();
      set({
        currentTrack: null,
        isPlaying: false,
        queue: [],
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
    const targetTrack = q[idx];
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
    const { queue, queueIndex, repeatMode } = get();
    if (queue.length === 0) return;
    let next = queueIndex + 1;
    if (next >= queue.length) {
      if (repeatMode === 'all') next = 0;
      else {
        disableBackgroundMode();
        set({ isPlaying: false });
        return;
      }
    }
    const nextSong = queue[next];
    updateBackgroundModeSettings(nextSong);
    set({
      queueIndex: next,
      currentTrack: nextSong,
      isPlaying: true,
      progress: 0,
      duration: 0,
    });
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
