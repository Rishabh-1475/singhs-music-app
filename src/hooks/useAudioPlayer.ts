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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = getAudio();
    }
  }, []);

  const audio = audioRef.current;

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
