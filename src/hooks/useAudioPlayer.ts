import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';

let globalAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = 'auto';
  }
  return globalAudio;
}

export function useAudioPlayer() {
  const animRef = useRef<number>(0);
  const seekingRef = useRef(false);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = getAudio();
    }
  }, []);

  const audio = audioRef.current;

  // ─── MediaSession API: Bluetooth / headphone / lock-screen controls ───
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentTrack) return;

    const artworkUrl = currentTrack.albumArt || currentTrack.artwork || '';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title || 'Unknown Track',
      artist: currentTrack.artist || 'Unknown Artist',
      album: currentTrack.album || 'SMC Music',
      artwork: artworkUrl
        ? [
            { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });
  }, [currentTrack]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;
    const a = audioRef.current;

    ms.setActionHandler('play', () => {
      if (a) {
        a.play().catch(() => {});
      }
      setIsPlaying(true);
    });

    ms.setActionHandler('pause', () => {
      if (a) {
        a.pause();
      }
      setIsPlaying(false);
    });

    ms.setActionHandler('previoustrack', () => {
      prevTrack();
    });

    ms.setActionHandler('nexttrack', () => {
      nextTrack();
    });

    ms.setActionHandler('seekto', (details) => {
      if (a && details.seekTime !== undefined && details.seekTime !== null) {
        a.currentTime = details.seekTime;
        setProgress(details.seekTime);
      }
    });

    ms.setActionHandler('seekbackward', (details) => {
      if (a) {
        const skipTime = details.seekOffset || 10;
        a.currentTime = Math.max(a.currentTime - skipTime, 0);
        setProgress(a.currentTime);
      }
    });

    ms.setActionHandler('seekforward', (details) => {
      if (a) {
        const skipTime = details.seekOffset || 10;
        a.currentTime = Math.min(a.currentTime + skipTime, a.duration || Infinity);
        setProgress(a.currentTime);
      }
    });

    // Update position state so the OS scrubber knows elapsed/total
    const positionInterval = setInterval(() => {
      if (a && !isNaN(a.duration) && a.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: a.duration,
            playbackRate: a.playbackRate || 1,
            position: Math.min(a.currentTime, a.duration),
          });
        } catch {
          // Some browsers may not support setPositionState
        }
      }
    }, 1000);

    return () => {
      clearInterval(positionInterval);
      // Clearing handlers prevents them from firing after unmount
      ms.setActionHandler('play', null);
      ms.setActionHandler('pause', null);
      ms.setActionHandler('previoustrack', null);
      ms.setActionHandler('nexttrack', null);
      ms.setActionHandler('seekto', null);
      ms.setActionHandler('seekbackward', null);
      ms.setActionHandler('seekforward', null);
    };
  }, [nextTrack, prevTrack, setIsPlaying, setProgress]);

  // Load track seamlessly without reloading if URL matches
  useEffect(() => {
    if (!audio || !currentTrack) return;
    const targetUrl = currentTrack.url || currentTrack.audioUrl;
    if (!targetUrl) return;

    // Check if the current audio source matches to prevent reloading during page navigation
    if (audio.src !== targetUrl) {
      audio.src = targetUrl;
      audio.load();
      audio.play().catch(() => {
        /* Autoplay was prevented by browser policy */
      });
    }
  }, [audio, currentTrack]);

  // Play/Pause
  useEffect(() => {
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.play().catch(() => {
        /* Autoplay blocked */
      });
    } else {
      audio.pause();
    }
  }, [audio, isPlaying, currentTrack]);

  // Volume
  useEffect(() => {
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [audio, volume, isMuted]);

  // Event listeners
  useEffect(() => {
    if (!audio) return;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrack();
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onError = () => {
      console.warn('Audio playback error on track:', currentTrack?.title);
      if (typeof window !== 'undefined') {
        const existingToast = document.getElementById('audio-stream-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'audio-stream-toast';
        toast.className =
          'fixed top-5 right-5 z-50 bg-[#16191E] border border-amber-500/50 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300';
        toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span><span>Unable to stream "${
          currentTrack?.title || 'track'
        }", skipping...</span>`;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.remove();
        }, 3500);
      }

      // Automatically advance to the next song in the queue without crashing
      setTimeout(() => {
        nextTrack();
      }, 400);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, [audio, repeatMode, nextTrack, setDuration, setIsPlaying, currentTrack]);

  // Smooth frame progress
  useEffect(() => {
    if (!audio) return;
    const update = () => {
      if (!seekingRef.current) {
        setProgress(audio.currentTime);
      }
      animRef.current = requestAnimationFrame(update);
    };
    animRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animRef.current);
  }, [audio, setProgress]);

  const seek = useCallback(
    (time: number) => {
      if (!audio) return;
      seekingRef.current = true;
      audio.currentTime = time;
      setProgress(time);
      setTimeout(() => {
        seekingRef.current = false;
      }, 100);
    },
    [audio, setProgress]
  );

  return { seek };
}
