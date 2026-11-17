'use client';

import { useState, useEffect } from 'react';
import { ArrowDownToLine, Check, Loader2 } from 'lucide-react';
import { Track } from '@/types/track';
import {
  saveTrackOffline,
  deleteOfflineTrack,
  isTrackDownloaded,
  onOfflineTracksChange,
} from '@/services/offlineStorage';
import { useAuthStore } from '@/store/authStore';

interface DownloadButtonProps {
  track: Track;
  size?: number;
  className?: string;
  iconClassName?: string;
}

export default function DownloadButton({
  track,
  size = 18,
  className = '',
  iconClassName = '',
}: DownloadButtonProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const showAuthToast = useAuthStore((s) => s.showAuthToast);

  useEffect(() => {
    let isMounted = true;
    isTrackDownloaded(track.id).then((isDown) => {
      if (isMounted) setDownloaded(isDown);
    });

    const unsubscribe = onOfflineTracksChange(() => {
      isTrackDownloaded(track.id).then((isDown) => {
        if (isMounted) setDownloaded(isDown);
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [track.id]);

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showAuthToast('Sign in required to stream music and save playlists.');
      openAuthModal();
      return;
    }
    if (isDownloading) return;

    if (downloaded) {
      await deleteOfflineTrack(track.id);
      setDownloaded(false);
    } else {
      setIsDownloading(true);
      try {
        const urlToFetch = track.downloadUrl || track.url || track.audioUrl;
        if (!urlToFetch) {
          throw new Error('No audio URL found for track');
        }
        await saveTrackOffline({
          id: track.id,
          name: track.title || track.name,
          artist: track.artist,
          album: track.album,
          image: track.albumArt || track.artwork || track.image || '/creator.jpg',
          downloadUrl: urlToFetch,
          duration: track.duration,
        });
        setDownloaded(true);
      } catch (err) {
        console.warn('Failed to download track offline:', err);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  return (
    <button
      onClick={handleDownloadClick}
      disabled={isDownloading}
      className={`transition-all duration-200 cursor-pointer flex items-center justify-center ${className}`}
      title={
        isDownloading
          ? 'Downloading audio...'
          : downloaded
          ? 'Downloaded offline (Click to delete)'
          : 'Download for offline playback'
      }
      aria-label={
        isDownloading
          ? 'Downloading audio'
          : downloaded
          ? 'Downloaded offline'
          : 'Download track'
      }
    >
      {isDownloading ? (
        <Loader2 size={size} className={`animate-spin text-emerald-400 ${iconClassName}`} />
      ) : downloaded ? (
        <Check size={size} className={`text-[#1DB954] stroke-[2.5px] ${iconClassName}`} />
      ) : (
        <ArrowDownToLine size={size} className={`text-neutral-400 hover:text-white transition-colors ${iconClassName}`} />
      )}
    </button>
  );
}
