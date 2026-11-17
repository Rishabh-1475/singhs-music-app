import { searchJioSaavn } from '@/lib/saavn';

const PRIMARY_API = "https://saavn.dev/api";
const BACKUP_API = "https://jiosavan-api.vercel.app/api";

export interface Song {
  id: string;
  name: string;
  title: string;
  artist: string;
  album: string;
  image: string;
  albumArt: string;
  genre: string;
  duration: number;
  downloadUrl: string;
  url: string;
  [key: string]: any;
}

function formatSongs(rawSongs: any[]): Song[] {
  return rawSongs
    .map((s) => {
      // Pick highest quality audio URL (prioritize 320kbps .mp4/.m4a, fallback to 160kbps)
      let streamUrl = "";
      if (Array.isArray(s.downloadUrl) && s.downloadUrl.length > 0) {
        const bestAudio =
          s.downloadUrl.find((d: any) => d?.quality === "320kbps") ||
          s.downloadUrl.find((d: any) => d?.quality === "160kbps") ||
          s.downloadUrl[s.downloadUrl.length - 1];
        streamUrl = bestAudio?.url || s.downloadUrl[0]?.url || "";
      } else if (typeof s.downloadUrl === "string") {
        streamUrl = s.downloadUrl;
      } else {
        streamUrl = s.media_url || s.url || "";
      }

      // Pick highest quality cover art (500x500). If missing, fallback to /creator.jpg
      let imgUrl = "/creator.jpg";
      if (Array.isArray(s.image) && s.image.length > 0) {
        const bestImg =
          s.image.find((i: any) => i?.quality === "500x500") ||
          s.image[s.image.length - 1];
        imgUrl = bestImg?.url || s.image[0]?.url || imgUrl;
      } else if (typeof s.image === "string" && s.image.trim()) {
        imgUrl = s.image;
      }

      if (imgUrl && imgUrl !== "/creator.jpg") {
        imgUrl = imgUrl
          .replace("http://", "https://")
          .replace(/150x150/g, "500x500")
          .replace(/50x50/g, "500x500");
      }

      const songName =
        s.name?.replace(/&quot;/g, '"')?.replace(/&#039;/g, "'") ||
        s.title ||
        "Unknown Track";
      const songArtist =
        s.primaryArtists ||
        s.singers ||
        s.artist ||
        "SMC Music";
      const songAlbum = s.album?.name || s.album || "Single";
      const rawId = String(s.id || `song-${Math.random().toString(36).substring(2, 9)}`);
      const id = rawId.startsWith("saavn-") ? rawId : `saavn-${rawId}`;

      return {
        id,
        name: songName,
        title: songName,
        artist: songArtist,
        album: songAlbum,
        image: imgUrl,
        albumArt: imgUrl,
        genre: s.language || "Indian Pop",
        duration: Number(s.duration) || 0,
        downloadUrl: streamUrl,
        url: streamUrl,
      };
    })
    // STRICT FILTER: Drop any item where downloadUrl is empty, broken, or null
    .filter((song) => Boolean(song.downloadUrl && song.downloadUrl.trim() !== ""));
}

export async function searchSongs(query: string): Promise<Song[]> {
  if (!query || !query.trim()) return [];
  const sanitized = encodeURIComponent(query.trim());

  // 1. Try Primary Mirror: saavn.dev
  try {
    const res = await fetch(`${PRIMARY_API}/search/songs?query=${sanitized}&page=1&limit=30`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      const results = json?.data?.results || json?.data || [];
      if (results.length > 0) return formatSongs(results);
    }
  } catch (e) {
    console.warn("Primary API mirror down, trying backup...", e);
  }

  // 2. Try Backup Mirror: jiosavan-api.vercel.app
  try {
    const res = await fetch(`${BACKUP_API}/search/songs?query=${sanitized}`);
    if (res.ok) {
      const json = await res.json();
      const results = json?.data?.results || json?.data || [];
      if (results.length > 0) return formatSongs(results);
    }
  } catch (e) {
    console.warn("Secondary API mirror failed, trying direct fallback...", e);
  }

  // 3. Fallback: Direct JioSaavn Search Scraper
  try {
    const directResults = await searchJioSaavn(query.trim(), 30);
    if (directResults && directResults.length > 0) {
      return directResults
        .map((t) => ({
          id: t.id,
          name: t.name || t.title,
          title: t.title,
          artist: t.artist,
          album: t.album,
          image: t.albumArt || t.image || "/creator.jpg",
          albumArt: t.albumArt || t.image || "/creator.jpg",
          genre: t.genre || "Indian Pop",
          duration: t.duration || 0,
          downloadUrl: t.url,
          url: t.url,
        }))
        .filter((song) => Boolean(song.downloadUrl && song.downloadUrl.trim() !== ""));
    }
  } catch (directErr) {
    console.warn("Direct search fallback failed:", directErr);
  }

  return [];
}

export async function getTrendingSongs(): Promise<Song[]> {
  // Rotating array of trending search seeds
  const discoverySeeds = [
    'Top Hindi',
    'Sidhu Moose Wala',
    'Arijit Singh',
    'AP Dhillon',
    'Karan Aujla',
    'Bollywood Hits',
    'Punjabi Pop',
    'Diljit Dosanjh',
    'Lo-Fi Hindi',
  ];
  const randomSeed = discoverySeeds[Math.floor(Math.random() * discoverySeeds.length)];
  return searchSongs(randomSeed);
}

// Aliases for compatibility
export const searchTracks = searchSongs;

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
    return '/creator.jpg';
  }
  return url
    .replace('http://', 'https://')
    .replace(/150x150/g, '500x500')
    .replace(/50x50/g, '500x500');
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
