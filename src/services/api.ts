import { searchJioSaavn } from '@/lib/saavn';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';

const PRIMARY_API = "https://saavn.dev/api";
const BACKUP_API = "https://jiosavan-api.vercel.app/api";

export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  duration: number;
  downloadUrl: string;
  // Compatibility fields for Track interface
  title: string;
  albumArt: string;
  artwork?: string;
  url: string;
  audioUrl?: string;
  genre: string;
}

export function extractHighResArtwork(images: any, fallbackSeed = 'music'): string {
  let url = '';
  if (Array.isArray(images) && images.length > 0) {
    const high =
      images.find((i: any) => i?.quality === '500x500') ||
      images[images.length - 1];
    url = high?.url || images[0]?.url || '';
  } else if (typeof images === 'string') {
    url = images;
  }
  if (!url || url.trim() === '') {
    return `https://picsum.photos/seed/${encodeURIComponent(fallbackSeed)}/500/500`;
  }
  return url
    .replace('http://', 'https://')
    .replace(/150x150/g, '500x500')
    .replace(/50x50/g, '500x500');
}

function formatSongs(rawSongs: any[]): Song[] {
  return rawSongs.map((s) => {
    // Pick highest quality audio URL (320kbps -> 160kbps -> fallback)
    let streamUrl = "";
    if (Array.isArray(s.downloadUrl)) {
      streamUrl = s.downloadUrl[s.downloadUrl.length - 1]?.url || s.downloadUrl[0]?.url || "";
    } else if (typeof s.downloadUrl === "string") {
      streamUrl = s.downloadUrl;
    } else {
      streamUrl = s.media_url || s.url || "";
    }

    // Pick highest quality cover art (500x500)
    let imgUrl = "/creator.jpg";
    if (Array.isArray(s.image)) {
      imgUrl = s.image[s.image.length - 1]?.url || s.image[0]?.url || imgUrl;
    } else if (typeof s.image === "string") {
      imgUrl = s.image;
    }

    const songName = s.name?.replace(/&quot;/g, '"')?.replace(/&#039;/g, "'") || s.title || "Unknown Track";
    const songArtist = s.primaryArtists || s.singers || s.artist || "SMC Music";
    const songAlbum = s.album?.name || s.album || "Single";

    return {
      id: String(s.id),
      name: songName,
      title: songName,
      artist: songArtist,
      album: songAlbum,
      image: imgUrl,
      albumArt: imgUrl,
      artwork: imgUrl,
      duration: Number(s.duration) || 0,
      downloadUrl: streamUrl,
      url: streamUrl,
      audioUrl: streamUrl,
      genre: s.language || "Music"
    };
  }).filter((song) => Boolean(song.downloadUrl));
}

export async function searchSongs(query: string): Promise<Song[]> {
  if (!query || !query.trim()) return [];
  const sanitized = encodeURIComponent(query.trim());

  // 1. Try Primary Mirror
  try {
    const res = await fetch(`${PRIMARY_API}/search/songs?query=${sanitized}&page=1&limit=30`, {
      headers: { 'Accept': 'application/json' }
    });
    const json = await res.json();
    const results = json?.data?.results || json?.data || [];
    if (results.length > 0) return formatSongs(results);
  } catch (e) {
    console.warn("Primary API mirror down, trying backup...", e);
  }

  // 2. Try Backup Mirror
  try {
    const res = await fetch(`${BACKUP_API}/search/songs?query=${sanitized}`);
    const json = await res.json();
    const results = json?.data?.results || json?.data || [];
    if (results.length > 0) return formatSongs(results);
  } catch (e) {
    console.error("All song search mirrors failed", e);
  }

  // 3. Fallback: Direct JioSaavn Search Scraper
  try {
    const directResults = await searchJioSaavn(query.trim(), 30);
    if (directResults && directResults.length > 0) {
      return directResults.map((t) => ({
        id: t.id,
        name: t.name || t.title,
        title: t.title,
        artist: t.artist,
        album: t.album,
        image: t.albumArt || t.image || "/creator.jpg",
        albumArt: t.albumArt,
        artwork: t.artwork,
        duration: t.duration,
        downloadUrl: t.url,
        url: t.url,
        audioUrl: t.url,
        genre: t.genre
      }));
    }
  } catch (directErr) {
    console.warn("Direct search fallback failed:", directErr);
  }

  // 4. Bundled Offline Fallback
  const lower = query.trim().toLowerCase();
  const matched = TRENDING_FALLBACK_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(lower) ||
      t.artist.toLowerCase().includes(lower) ||
      (t.album && t.album.toLowerCase().includes(lower))
  );

  return (matched.length > 0 ? matched : []).map((t) => ({
    id: t.id,
    name: t.title,
    title: t.title,
    artist: t.artist,
    album: t.album,
    image: t.albumArt,
    albumArt: t.albumArt,
    artwork: t.albumArt,
    duration: t.duration,
    downloadUrl: t.url,
    url: t.url,
    audioUrl: t.url,
    genre: t.genre
  }));
}

export async function getTrendingSongs(): Promise<Song[]> {
  // Rotating discovery seeds for fresh, diverse home screen feeds
  const discoverySeeds = [
    "Top Hindi", "Arijit Singh", "Sidhu Moose Wala", 
    "AP Dhillon", "Karan Aujla", "Bollywood Romance", 
    "Punjabi Pop 2026", "Diljit Dosanjh", "Lo-Fi Hindi"
  ];
  const randomSeed = discoverySeeds[Math.floor(Math.random() * discoverySeeds.length)];
  return searchSongs(randomSeed);
}

export async function searchTracks(query: string, limit = 30): Promise<Song[]> {
  const songs = await searchSongs(query);
  return limit ? songs.slice(0, limit) : songs;
}

export async function getSimilarSongs(songId: string, artist?: string): Promise<Song[]> {
  if (artist) {
    const primaryArtist = artist.split(',')[0].split('&')[0].trim();
    if (primaryArtist) {
      const results = await searchSongs(primaryArtist);
      const filtered = results.filter((s) => s.id !== songId);
      if (filtered.length > 0) return filtered.slice(0, 10);
    }
  }
  return getTrendingSongs();
}
