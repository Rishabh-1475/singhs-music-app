import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { Track } from '@/types/track';
import { searchTracks } from '@/services/musicService';
import { logTrackPlay } from '@/services/recommendationService';
import {
  enableBackgroundMode,
  disableBackgroundMode,
  updateBackgroundModeSettings,
} from '@/services/backgroundAudio';

let globalAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = 'auto';
  }
  return globalAudio;
}

export function useAudioPlayer() {
  const animRef = useRef<number>(0);
  const seekingRef = useRef(false);
  const loggedPlayRef = useRef<string | null>(null);

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
  const currentBlobUrlRef = useRef<string | null>(null);

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

    const trackTitle = currentTrack.name || currentTrack.title || 'Track';
    const trackArtist = currentTrack.artist || 'SMC Music';
    const trackAlbum = currentTrack.album || 'SMC Music';
    const trackImage =
      currentTrack.image ||
      currentTrack.albumArt ||
      currentTrack.artwork ||
      '/creator.jpg';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackTitle,
      artist: trackArtist,
      album: trackAlbum,
      artwork: [
        { src: trackImage, sizes: '96x96', type: 'image/jpeg' },
        { src: trackImage, sizes: '128x128', type: 'image/jpeg' },
        { src: trackImage, sizes: '192x192', type: 'image/jpeg' },
        { src: trackImage, sizes: '256x256', type: 'image/jpeg' },
        { src: trackImage, sizes: '512x512', type: 'image/jpeg' },
      ],
    });
  }, [currentTrack]);

  // ─── Native Background Mode & Foreground Notification Sync ───
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isPlaying && currentTrack) {
      enableBackgroundMode(currentTrack);
    } else {
      disableBackgroundMode();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentTrack) return;
    if (isPlaying) {
      updateBackgroundModeSettings(currentTrack);
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;
    const audioElement = audioRef.current;

    const handlePlay = () => {
      if (audioElement) {
        audioElement.play().catch(() => {});
      }
      setIsPlaying(true);
      if (currentTrack) {
        enableBackgroundMode(currentTrack);
      }
    };

    const handlePause = () => {
      if (audioElement) {
        audioElement.pause();
      }
      setIsPlaying(false);
      disableBackgroundMode();
    };

    const handlePrevious = () => {
      prevTrack();
    };

    const handleNext = () => {
      nextTrack();
    };

    ms.setActionHandler('play', () => handlePlay());
    ms.setActionHandler('pause', () => handlePause());
    ms.setActionHandler('previoustrack', () => handlePrevious());
    ms.setActionHandler('nexttrack', () => handleNext());

    ms.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && details.seekTime !== null && audioElement) {
        audioElement.currentTime = details.seekTime;
        setProgress(details.seekTime);
      }
    });

    ms.setActionHandler('seekbackward', (details) => {
      if (audioElement) {
        const skipTime = details.seekOffset || 10;
        audioElement.currentTime = Math.max(audioElement.currentTime - skipTime, 0);
        setProgress(audioElement.currentTime);
      }
    });

    ms.setActionHandler('seekforward', (details) => {
      if (audioElement) {
        const skipTime = details.seekOffset || 10;
        audioElement.currentTime = Math.min(
          audioElement.currentTime + skipTime,
          audioElement.duration || Infinity
        );
        setProgress(audioElement.currentTime);
      }
    });

    // Update position state for OS lock-screen scrubbers
    const positionInterval = setInterval(() => {
      if (audioElement && !isNaN(audioElement.duration) && audioElement.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audioElement.duration,
            playbackRate: audioElement.playbackRate || 1,
            position: Math.min(audioElement.currentTime, audioElement.duration),
          });
        } catch {
          // setPositionState may not be supported by all browsers
        }
      }
    }, 1000);

    return () => {
      clearInterval(positionInterval);
      ms.setActionHandler('play', null);
      ms.setActionHandler('pause', null);
      ms.setActionHandler('previoustrack', null);
      ms.setActionHandler('nexttrack', null);
      ms.setActionHandler('seekto', null);
      ms.setActionHandler('seekbackward', null);
      ms.setActionHandler('seekforward', null);
    };
  }, [nextTrack, prevTrack, setIsPlaying, setProgress, currentTrack]);

  // Reset logged play tracker on track change
  useEffect(() => {
    loggedPlayRef.current = null;
  }, [currentTrack?.id]);

  // Load track seamlessly without reloading if URL matches, supporting offline Blob object URLs
  useEffect(() => {
    if (!audio || !currentTrack) return;

    // Revoke previous blob object URL to prevent memory leaks
    if (currentBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      } catch {}
      currentBlobUrlRef.current = null;
    }

    let audioSrc = currentTrack.url || currentTrack.audioUrl || currentTrack.downloadUrl || '';

    // If track carries an audioBlob, create an object URL
    if (currentTrack.audioBlob) {
      try {
        const blobUrl = URL.createObjectURL(currentTrack.audioBlob);
        currentBlobUrlRef.current = blobUrl;
        audioSrc = blobUrl;
      } catch (err) {
        console.warn('Failed to create object URL from track audioBlob:', err);
      }
    }

    if (!audioSrc) return;

    // Check if the current audio source matches to prevent reloading during page navigation
    if (audio.src !== audioSrc) {
      audio.src = audioSrc;
      audio.load();
      audio.play().catch(() => {
        /* Autoplay was prevented by browser policy */
      });
    }

    return () => {
      if (currentBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(currentBlobUrlRef.current);
        } catch {}
        currentBlobUrlRef.current = null;
      }
    };
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

    const onEnded = async () => {
      // Log track completion if not already logged at 20 seconds
      if (currentTrack && loggedPlayRef.current !== currentTrack.id) {
        loggedPlayRef.current = currentTrack.id;
        logTrackPlay(currentTrack);
      }

      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        const { queue, queueIndex, repeatMode: rMode, playNextTrack } = usePlayerStore.getState();
        const isQueueAtEnd = queueIndex >= queue.length - 1;

        // If queue ends and repeat is off, automatically append 5 related tracks based on currentTrack.artist so playback never halts
        if (isQueueAtEnd && rMode !== 'all' && currentTrack) {
          try {
            const query = currentTrack.artist || 'Top Hits';
            const dataTracks = await searchTracks(query, 12);
            const fetched: Track[] = dataTracks.filter(
              (t: Track) => !queue.some((q) => q.id === t.id)
            );
            if (fetched.length > 0) {
              const tracksToAppend = fetched.slice(0, 5);
              usePlayerStore.getState().appendQueue(tracksToAppend);
              playNextTrack();
              return;
            }
          } catch (err) {
            console.warn('Auto recommendation on queue end failed:', err);
          }
        }

        playNextTrack();
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

        // Track play if current time reaches 20 seconds
        if (
          currentTrack &&
          audio.currentTime >= 20 &&
          loggedPlayRef.current !== currentTrack.id
        ) {
          loggedPlayRef.current = currentTrack.id;
          logTrackPlay(currentTrack);
        }
      }
      animRef.current = requestAnimationFrame(update);
    };
    animRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animRef.current);
  }, [audio, setProgress, currentTrack]);

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
