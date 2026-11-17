import { create } from 'zustand';

export interface Song {
  id: string;
  name?: string;
  title?: string;
  artist?: string;
  album?: string;
  image?: string;
  albumArt?: string;
  genre?: string;
  duration?: number;
  downloadUrl?: string;
  url?: string;
  [key: string]: any;
}

let globalAudio: HTMLAudioElement | null = null;

if (typeof window !== 'undefined') {
  globalAudio = new Audio();
  globalAudio.preload = 'auto';
}

export { globalAudio };

export function syncMediaSession(
  song: Song,
  onPlay: () => void,
  onPause: () => void,
  onNext: () => void,
  onPrev: () => void
) {
  if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
    const trackName = song.name || song.title || 'Unknown Track';
    const artistName = song.artist || 'SMC Music';
    const albumName = song.album || 'Single';
    const artUrl = song.albumArt || song.image || '/creator.jpg';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackName,
      artist: artistName,
      album: albumName,
      artwork: [
        { src: artUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: artUrl, sizes: '192x192', type: 'image/jpeg' },
        { src: artUrl, sizes: '512x512', type: 'image/jpeg' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', onPlay);
    navigator.mediaSession.setActionHandler('pause', onPause);
    navigator.mediaSession.setActionHandler('nexttrack', onNext);
    navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime && globalAudio) {
        globalAudio.currentTime = details.seekTime;
      }
    });
  }
}

function sanitizeSong(raw: any): Song {
  const cover = raw.albumArt || raw.image || '/creator.jpg';
  return {
    ...raw,
    id: String(raw.id || Math.random()),
    name: raw.name || raw.title || 'Unknown Track',
    artist: raw.artist || raw.singers || 'SMC Music',
    album: raw.album?.name || raw.album || 'Single',
    image: cover,
    albumArt: cover,
    genre: raw.genre || 'Indian Pop',
    duration: Number(raw.duration) || 0,
    downloadUrl: raw.downloadUrl || raw.url || raw.media_url || '',
  };
}

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
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
  playTrack: (song: any, queueList?: any[]) => void;
  playQueue: (songs: any[], startIndex?: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setProgress: (prog: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleQueue: () => void;
  clearQueue: () => void;
  [key: string]: any;
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
      set({
        currentTime: cur,
        duration: dur,
        progress: (cur / dur) * 100,
      });
    };
  }

  const handlePlayNext = () => {
    const { queue, currentIndex, playTrack, isShuffled, repeatMode } = get();
    if (queue.length === 0) return;

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
      }
      return;
    }

    playTrack(queue[nextIndex], queue);
  };

  const handlePlayPrev = () => {
    const { queue, currentIndex, playTrack } = get();
    if (queue.length === 0) return;

    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(queue[prevIndex], queue);
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

    toggleFullScreen: () => {
      set((state) => ({ showFullScreen: !state.showFullScreen }));
    },

    setDuration: (duration: number) => {
      set({ duration });
    },

    setIsPlaying: (isPlaying: boolean) => {
      set({ isPlaying });
    },

    playTrack: (rawSong: any, rawQueue: any[] = []) => {
      if (!globalAudio || !rawSong) return;

      const song = sanitizeSong(rawSong);
      const queue = rawQueue.length > 0 ? rawQueue.map(sanitizeSong) : [song];
      const index = queue.findIndex((t) => t.id === song.id);

      set({
        currentTrack: song,
        isPlaying: true,
        queue: queue,
        currentIndex: index !== -1 ? index : 0,
        progress: 0,
        currentTime: 0,
      });

      if (song.downloadUrl) {
        globalAudio.src = song.downloadUrl;
        globalAudio.play().catch((err) => console.error("Audio playback error:", err));
      }

      syncMediaSession(
        song,
        () => get().togglePlay(),
        () => get().togglePlay(),
        () => handlePlayNext(),
        () => handlePlayPrev()
      );
    },

    playQueue: (songs: any[], startIndex = 0) => {
      if (!songs || songs.length === 0) return;
      const targetIndex = startIndex >= 0 && startIndex < songs.length ? startIndex : 0;
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
        globalAudio.play().catch((err) => console.error("Playback resume error:", err));
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

    seek: (seconds: number) => {
      if (!globalAudio) return;
      globalAudio.currentTime = seconds;
      set({ currentTime: seconds });
    },

    setVolume: (vol: number) => {
      const clamped = Math.max(0, Math.min(1, vol));
      if (globalAudio) globalAudio.volume = clamped;
      set({ volume: clamped, isMuted: clamped === 0 });
    },

    toggleMute: () => {
      if (!globalAudio) return;
      const { isMuted, volume } = get();
      if (isMuted) {
        globalAudio.volume = volume || 0.5;
        set({ isMuted: false });
      } else {
        globalAudio.volume = 0;
        set({ isMuted: true });
      }
    },

    setProgress: (prog: number) => {
      if (!globalAudio || !globalAudio.duration) return;
      const targetSec = (prog / 100) * globalAudio.duration;
      globalAudio.currentTime = targetSec;
      set({ progress: prog, currentTime: targetSec });
    },

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
      set((state) => ({ isQueueOpen: !state.isQueueOpen }));
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