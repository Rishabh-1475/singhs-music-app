import { Track } from '@/types/track';
import { DEFAULT_COVER } from '@/services/api';

const DB_NAME = "SMC_Offline_Vault";
const STORE_NAME = "downloaded_tracks";
const DB_VERSION = 1;

export interface OfflineTrack {
  id: string;
  name: string;
  artist: string;
  album?: string;
  image: string;
  audioBlob: Blob;
  duration?: number;
  downloadedAt: number;
}

/**
 * Open the native browser IndexedDB database for SMC Offline Vault
 */
export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported or not running in a browser environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Fetch an audio file from downloadUrl/url, convert to Blob, and cache in IndexedDB
 */
export async function saveTrackOffline(track: {
  id: string;
  name?: string;
  title?: string;
  artist: string;
  album?: string;
  image?: string;
  albumArt?: string;
  artwork?: string;
  downloadUrl?: string;
  url?: string;
  audioUrl?: string;
  duration?: number;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const audioSourceUrl = track.downloadUrl || track.url || track.audioUrl;
  if (!audioSourceUrl) {
    throw new Error('No valid download audio URL provided');
  }

  const response = await fetch(audioSourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio stream for offline storage: ${response.statusText}`);
  }
  const blob = await response.blob();
  const db = await openOfflineDB();

  const title = track.name || track.title || 'Unknown Track';
  const albumArt = track.image || track.albumArt || track.artwork || DEFAULT_COVER;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const record: OfflineTrack = {
      id: track.id,
      name: title,
      artist: track.artist,
      album: track.album || 'Single',
      image: albumArt,
      audioBlob: blob,
      duration: track.duration || 180,
      downloadedAt: Date.now(),
    };
    const req = store.put(record);
    req.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('smc_offline_tracks_changed', { detail: { id: track.id, action: 'save' } }));
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve all offline downloaded tracks from IndexedDB
 */
export async function getDownloadedTracks(): Promise<OfflineTrack[]> {
  if (typeof window === 'undefined') return [];
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('Failed to get downloaded tracks:', error);
    return [];
  }
}

/**
 * Check if a track is cached offline in IndexedDB
 */
export async function isTrackDownloaded(id: string): Promise<boolean> {
  if (typeof window === 'undefined' || !id) return false;
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Remove a track from IndexedDB
 */
export async function deleteOfflineTrack(id: string): Promise<void> {
  if (typeof window === 'undefined' || !id) return;
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('smc_offline_tracks_changed', { detail: { id, action: 'delete' } }));
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Calculate total storage size in Megabytes (MB) used by downloaded audio blobs
 */
export async function getTotalStorageUsed(): Promise<{ bytes: number; formatted: string }> {
  try {
    const tracks = await getDownloadedTracks();
    const totalBytes = tracks.reduce((acc, t) => acc + (t.audioBlob?.size || 0), 0);
    const mb = totalBytes / (1024 * 1024);
    return {
      bytes: totalBytes,
      formatted: mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`,
    };
  } catch {
    return { bytes: 0, formatted: '0 MB' };
  }
}

/**
 * Listen for changes to the offline vault across any component
 */
export function onOfflineTracksChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('smc_offline_tracks_changed', callback);
  return () => window.removeEventListener('smc_offline_tracks_changed', callback);
}

/**
 * Converts an OfflineTrack into a playable standard Track object using a local Blob URL
 */
export function offlineTrackToTrack(offline: OfflineTrack): Track {
  const blobUrl =
    typeof window !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL
      ? URL.createObjectURL(offline.audioBlob)
      : '';
  return {
    id: offline.id,
    title: offline.name,
    name: offline.name,
    artist: offline.artist,
    album: offline.album || 'Downloaded',
    albumArt: offline.image,
    artwork: offline.image,
    image: offline.image,
    duration: offline.duration || 180,
    url: blobUrl,
    audioUrl: blobUrl,
    downloadUrl: blobUrl,
    audioBlob: offline.audioBlob,
    genre: 'Offline',
  };
}
