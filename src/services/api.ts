import { searchJioSaavn } from '@/lib/saavn';

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

export const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80';

const MIRRORS = [
  'https://saavn.me',
  'https://saavn.dev/api',
  'https://jiosavan-api.vercel.app/api',
];

function sanitizeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseSongs(rawList: any[]): Song[] {
  return rawList
    .map((item: any) => {
      // 1. Resolve Audio URL (check downloadUrl array for 320kbps at last index, then first index, fallback to media_url/url)
      let audio = '';
      if (Array.isArray(item.downloadUrl) && item.downloadUrl.length > 0) {
        const high =
          item.downloadUrl.find((d: any) => d?.quality === '320kbps') ||
          item.downloadUrl[item.downloadUrl.length - 1];
        audio = high?.url || item.downloadUrl[0]?.url || '';
      } else if (typeof item.downloadUrl === 'string') {
        audio = item.downloadUrl;
      } else {
        audio = item.media_url || item.url || '';
      }

      // 2. Resolve High-Res Artwork (check image array last index, then first index)
      let art = '';
      if (Array.isArray(item.image) && item.image.length > 0) {
        const highArt =
          item.image.find((i: any) => i?.quality === '500x500') ||
          item.image[item.image.length - 1];
        art = highArt?.url || item.image[0]?.url || '';
      } else if (typeof item.image === 'string' && item.image.startsWith('http')) {
        art = item.image;
      }

      if (!art || art.trim() === '') {
        art = DEFAULT_COVER;
      } else {
        // Boost resolution if URL specifies lower dimensions
        art = art
          .replace('http://', 'https://')
          .replace(/150x150/g, '500x500')
          .replace(/50x50/g, '500x500');
      }

      const songTitle =
        sanitizeHtml(item.name || item.title || item.song) || 'Unknown Track';
      const songArtist =
        sanitizeHtml(
          item.primaryArtists ||
            (Array.isArray(item.artists?.primary)
              ? item.artists.primary.map((a: any) => a.name).join(', ')
              : '') ||
            item.singers ||
            item.artist
        ) || 'SMC Music';
      const songAlbum =
        sanitizeHtml(item.album?.name || item.album) || 'Single';

      const rawId = String(
        item.id || `song-${Math.random().toString(36).substring(2, 9)}`
      );
      const id = rawId.startsWith('saavn-') ? rawId : `saavn-${rawId}`;

      return {
        id,
        name: songTitle,
        title: songTitle,
        artist: songArtist,
        album: songAlbum,
        image: art,
        albumArt: art,
        genre: item.language || 'Indian Music',
        duration: Number(item.duration) || 0,
        downloadUrl: audio,
        url: audio,
      };
    })
    // STRICT FILTER: Drop any tracks where downloadUrl is empty, missing, or not an http URL
    .filter((song) => Boolean(song.downloadUrl && song.downloadUrl.startsWith('http')));
}

export async function searchSongs(query: string): Promise<Song[]> {
  if (!query || !query.trim()) return [];
  const clean = encodeURIComponent(query.trim());

  for (const mirror of MIRRORS) {
    try {
      const endpoint = mirror.includes('/api')
        ? `${mirror}/search/songs?query=${clean}&page=1&limit=30`
        : `${mirror}/search/songs?query=${clean}&page=1&limit=30`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(endpoint, {
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const json = await res.json();
      const results = json?.data?.results || json?.data || [];
      if (Array.isArray(results) && results.length > 0) {
        const parsed = parseSongs(results);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(`Mirror ${mirror} failed, switching to backup...`, e);
    }
  }

  // Direct JioSaavn Scraper Fallback
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
          image: t.albumArt || t.image || DEFAULT_COVER,
          albumArt: t.albumArt || t.image || DEFAULT_COVER,
          genre: t.genre || 'Indian Music',
          duration: t.duration || 0,
          downloadUrl: t.url,
          url: t.url,
        }))
        .filter((song) => Boolean(song.downloadUrl && song.downloadUrl.startsWith('http')));
    }
  } catch (directErr) {
    console.warn('Direct search fallback failed:', directErr);
  }

  return [];
}

export async function getTrendingSongs(): Promise<Song[]> {
  const seeds = [
    'Top Hindi 2026',
    'Arijit Singh Hits',
    'Sidhu Moose Wala',
    'Karan Aujla',
    'AP Dhillon',
    'Diljit Dosanjh',
    'Bollywood Romance',
    'Punjabi Pop',
  ];
  const query = seeds[Math.floor(Math.random() * seeds.length)];
  return searchSongs(query);
}

// Aliases for compatibility across other components
export const searchTracks = searchSongs;

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
    return DEFAULT_COVER;
  }
  return url
    .replace('http://', 'https://')
    .replace(/150x150/g, '500x500')
    .replace(/50x50/g, '500x500');
}
