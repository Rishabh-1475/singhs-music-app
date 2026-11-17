import { create } from 'zustand';
import { Song, DEFAULT_COVER } from '@/services/api';

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentTrack: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isQueueOpen: boolean;
  showQueue?: boolean;
  showFullScreen?: boolean;

  playTrack: (song: any, queueList?: any[]) => void;
  playQueue: (songs: any[], startIndex?: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  nextTrack: () => void;
  playPrev: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setProgress: (prog: number) => void;
  setDuration?: (dur: number) => void;
  setIsPlaying?: (playing: boolean) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleQueue: () => void;
  toggleFullScreen?: () => void;
  clearQueue: () => void;

  [key: string]: any;
}

// Global Singleton HTML5 Audio instance
let globalAudio: HTMLAudioElement | null = null;
if (typeof window !== 'undefined') {
  globalAudio = new Audio();
  globalAudio.preload = 'auto';
  globalAudio.crossOrigin = 'anonymous';
}
export { globalAudio };

function normalizeSong(raw: any): Song {
  const art =
    raw.albumArt ||
    raw.image ||
    raw.artwork ||
    DEFAULT_COVER;
  const name = raw.name || raw.title || 'Unknown Track';
  const artist = raw.artist || raw.singers || 'SMC Music';
  const album = raw.album?.name || raw.album || 'Single';
  const audio = raw.downloadUrl || raw.url || raw.media_url || '';

  return {
    ...raw,
    id: String(raw.id || `song-${Math.random().toString(36).substring(2, 9)}`),
    name,
    title: name,
    artist,
    album,
    image: art,
    albumArt: art,
    genre: raw.genre || 'Indian Music',
    duration: Number(raw.duration) || 0,
    downloadUrl: audio,
    url: audio,
  };
}

function syncMediaSession(
  song: Song,
  onPlay: () => void,
  onPause: () => void,
  onNext: () => void,
  onPrev: () => void,
  onSeek: (time: number) => void
) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  const artUrl = song.albumArt || song.image || DEFAULT_COVER;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.name || song.title || 'Unknown Track',
    artist: song.artist || 'SMC Music',
    album: song.album || 'Single',
    artwork: [
      { src: artUrl, sizes: '96x96', type: 'image/jpeg' },
      { src: artUrl, sizes: '128x128', type: 'image/jpeg' },
      { src: artUrl, sizes: '192x192', type: 'image/jpeg' },
      { src: artUrl, sizes: '256x256', type: 'image/jpeg' },
      { src: artUrl, sizes: '384x384', type: 'image/jpeg' },
      { src: artUrl, sizes: '512x512', type: 'image/jpeg' },
    ],
  });

  navigator.mediaSession.setActionHandler('play', onPlay);
  navigator.mediaSession.setActionHandler('pause', onPause);
  navigator.mediaSession.setActionHandler('nexttrack', onNext);
  navigator.mediaSession.setActionHandler('previoustrack', onPrev);
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (typeof details.seekTime === 'number') {
      onSeek(details.seekTime);
    }
  });
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  if (typeof window !== 'undefined' && globalAudio) {
    globalAudio.onended = () => {
      const { repeatMode, playNext, currentTrack, playTrack, queue } = get();
      if (repeatMode === 'one' && currentTrack) {
        playTrack(currentTrack, queue);
      } else {
        playNext();
      }
    };

    globalAudio.ontimeupdate = () => {
      if (!globalAudio) return;
      const cur = globalAudio.currentTime || 0;
      const dur = globalAudio.duration || 1;
      const prog = (cur / dur) * 100;
      set({
        currentTime: cur,
        duration: dur,
        progress: isFinite(prog) ? prog : 0,
      });
    };

    globalAudio.onplay = () => {
      set({ isPlaying: true });
      if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };

    globalAudio.onpause = () => {
      set({ isPlaying: false });
      if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };
  }

  const handlePlayNext = () => {
    const { queue, currentIndex, playTrack, isShuffled, repeatMode } = get();
    if (!queue || queue.length === 0) return;

    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playTrack(queue[randomIndex], queue);
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        playTrack(queue[0], queue);
      } else {
        set({ isPlaying: false });
        if (globalAudio) globalAudio.pause();
      }
      return;
    }

    playTrack(queue[nextIndex], queue);
  };

  const handlePlayPrev = () => {
    const { queue, currentIndex, playTrack } = get();
    if (!queue || queue.length === 0) return;

    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(queue[prevIndex], queue);
  };

  const handleSeek = (seconds: number) => {
    if (!globalAudio) return;
    const dur = globalAudio.duration || 1;
    const clamped = Math.max(0, Math.min(seconds, dur));
    globalAudio.currentTime = clamped;
    set({ currentTime: clamped, progress: (clamped / dur) * 100 });
  };

  return {
    currentTrack: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    progress: 0,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    repeatMode: 'off',
    isShuffled: false,
    isQueueOpen: false,
    showQueue: false,
    showFullScreen: false,

    playTrack: (rawSong: any, rawQueue: any[] = []) => {
      if (!rawSong) return;

      const song = normalizeSong(rawSong);
      const queueList =
        rawQueue && rawQueue.length > 0
          ? rawQueue.map(normalizeSong)
          : [song];
      const index = queueList.findIndex((t) => t.id === song.id);

      set({
        currentTrack: song,
        isPlaying: true,
        queue: queueList,
        currentIndex: index !== -1 ? index : 0,
        progress: 0,
        currentTime: 0,
      });

      if (globalAudio && song.downloadUrl) {
        if (globalAudio.src !== song.downloadUrl) {
          globalAudio.src = song.downloadUrl;
        }
        globalAudio
          .play()
          .catch((err) => console.warn('Audio playback error:', err));
      }

      syncMediaSession(
        song,
        () => get().togglePlay(),
        () => get().togglePlay(),
        () => handlePlayNext(),
        () => handlePlayPrev(),
        (time) => handleSeek(time)
      );
    },

    playQueue: (songs: any[], startIndex = 0) => {
      if (!songs || songs.length === 0) return;
      const targetIndex =
        startIndex >= 0 && startIndex < songs.length ? startIndex : 0;
      get().playTrack(songs[targetIndex], songs);
    },

    togglePlay: () => {
      if (!globalAudio || !get().currentTrack) return;

      if (get().isPlaying) {
        globalAudio.pause();
        set({ isPlaying: false });
        if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      } else {
        globalAudio
          .play()
          .catch((err) => console.warn('Playback resume error:', err));
        set({ isPlaying: true });
        if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      }
    },

    playNext: handlePlayNext,
    nextTrack: handlePlayNext,

    playPrev: handlePlayPrev,
    prevTrack: handlePlayPrev,

    seek: handleSeek,

    setVolume: (vol: number) => {
      const clamped = Math.max(0, Math.min(1, vol));
      if (globalAudio) globalAudio.volume = clamped;
      set({ volume: clamped, isMuted: clamped === 0 });
    },

    toggleMute: () => {
      if (!globalAudio) return;
      const { isMuted, volume } = get();
      if (isMuted) {
        const restoreVol = volume > 0 ? volume : 0.7;
        globalAudio.volume = restoreVol;
        set({ isMuted: false, volume: restoreVol });
      } else {
        globalAudio.volume = 0;
        set({ isMuted: true });
      }
    },

    setProgress: (prog: number) => {
      if (!globalAudio || !globalAudio.duration) return;
      const targetSec = (prog / 100) * globalAudio.duration;
      handleSeek(targetSec);
    },

    setDuration: (dur: number) => set({ duration: dur }),
    setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

    toggleRepeat: () => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const current = get().repeatMode;
      const next = modes[(modes.indexOf(current) + 1) % modes.length];
      set({ repeatMode: next });
    },

    toggleShuffle: () => {
      set((state) => ({ isShuffled: !state.isShuffled }));
    },

    toggleQueue: () => {
      set((state) => ({
        isQueueOpen: !state.isQueueOpen,
        showQueue: !state.showQueue,
      }));
    },

    toggleFullScreen: () => {
      set((state) => ({ showFullScreen: !state.showFullScreen }));
    },

    clearQueue: () => {
      if (globalAudio) globalAudio.pause();
      set({
        currentTrack: null,
        isPlaying: false,
        queue: [],
        currentIndex: -1,
        progress: 0,
        currentTime: 0,
      });
    },
  };
});
