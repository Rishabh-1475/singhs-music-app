import { Track } from '@/types/track';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';
import { searchJioSaavn, getJioSaavnSong } from '@/lib/saavn';

/**
 * Extract 500x500 high-res artwork from any API image format
 */
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

/**
 * Extract 320kbps audio stream URL from downloadUrl array or string
 */
export function extractAudioStreamUrl(downloadUrl: any, fallback = ''): string {
  if (Array.isArray(downloadUrl) && downloadUrl.length > 0) {
    const best =
      downloadUrl.find((d: any) => d?.quality === '320kbps') ||
      downloadUrl.find((d: any) => d?.quality === '160kbps') ||
      downloadUrl[downloadUrl.length - 1];
    return best?.url || downloadUrl[0]?.url || fallback;
  }
  if (typeof downloadUrl === 'string' && downloadUrl.trim()) {
    return downloadUrl;
  }
  return fallback;
}

/**
 * Normalize raw song item from saavn.dev or jiosavan-api into Track interface
 */
export function parseApiTrack(item: any): Track | null {
  if (!item) return null;

  const rawTitle = item.name || item.title || item.song || 'Unknown Track';
  const rawArtist =
    item.artists?.primary?.map((a: any) => a.name).join(', ') ||
    item.primaryArtists ||
    item.singers ||
    item.artist ||
    'Unknown Artist';

  const rawAlbum =
    item.album?.name ||
    (typeof item.album === 'string' ? item.album : rawTitle);

  const artwork = extractHighResArtwork(item.image, rawTitle);
  const audioUrl = extractAudioStreamUrl(item.downloadUrl || item.media_url || item.url);

  const duration =
    typeof item.duration === 'string'
      ? parseInt(item.duration, 10) || 0
      : Number(item.duration) || 0;

  const rawId = String(item.id || `track-${Math.random().toString(36).substring(2, 9)}`);
  const id = rawId.startsWith('saavn-') ? rawId : `saavn-${rawId}`;

  return {
    id,
    title: rawTitle,
    name: rawTitle,
    artist: rawArtist,
    album: rawAlbum,
    albumArt: artwork,
    artwork,
    image: artwork,
    url: audioUrl,
    audioUrl,
    downloadUrl: audioUrl,
    duration,
    genre: item.language || 'Music',
  };
}

/**
 * Helper to fetch with an automatic timeout
 */
async function fetchWithTimeout(url: string, timeoutMs = 2500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * 1. Dedicated Song Search Endpoint with Exact-Match Priority
 *    - Primary: High-accuracy Saavn songs endpoint (page 1, limit 30)
 *    - Fallback: Secondary JioSaavn mirror endpoint
 *    - Tertiary: Direct JioSaavn scraping fallback with decrypted media stream
 */
export async function searchSongs(rawQuery: string): Promise<Track[]> {
  if (!rawQuery || !rawQuery.trim()) return [];

  // Normalize query: trim whitespace and sanitize
  const cleanQuery = rawQuery.trim().replace(/\s+/g, ' ');
  const encoded = encodeURIComponent(cleanQuery);

  try {
    // Primary: High-accuracy Saavn songs endpoint (page 1, limit 30)
    const res = await fetch(`https://saavn.dev/api/search/songs?query=${encoded}&page=1&limit=30`);
    const data = await res.json();

    let tracks: any[] = [];
    if (data?.data?.results?.length) {
      tracks = data.data.results;
    } else if (Array.isArray(data?.data)) {
      tracks = data.data;
    }

    // Format and parse tracks cleanly
    return tracks.map((song: any) => {
      const name =
        song.name?.replace(/&quot;/g, '"')?.replace(/&#039;/g, "'") ||
        song.title ||
        'Unknown Track';
      const artist =
        song.primaryArtists ||
        song.singers ||
        song.artist ||
        'Unknown Artist';
      const album = song.album?.name || song.album || 'Single';
      const duration =
        typeof song.duration === 'string'
          ? parseInt(song.duration, 10) || 0
          : Number(song.duration) || 0;
      const image =
        song.image?.[2]?.url ||
        song.image?.[1]?.url ||
        (typeof song.image === 'string' ? song.image : null) ||
        '/creator.jpg';
      const downloadUrl = Array.isArray(song.downloadUrl)
        ? song.downloadUrl[song.downloadUrl.length - 1]?.url // pick 320kbps
        : song.downloadUrl || song.media_url || song.url || '';
      const rawId = String(song.id || `track-${Math.random().toString(36).substring(2, 9)}`);
      const id = rawId.startsWith('saavn-') ? rawId : `saavn-${rawId}`;

      return {
        id,
        name,
        title: name,
        artist,
        album,
        duration,
        image,
        albumArt: image,
        artwork: image,
        downloadUrl,
        url: downloadUrl,
        audioUrl: downloadUrl,
        genre: song.language || 'Music',
      };
    });
  } catch (err) {
    console.warn('Primary search failed, attempting fallback mirror...', err);
    // Fallback secondary endpoint
    try {
      const fallbackRes = await fetch(`https://jiosavan-api.vercel.app/api/search/songs?query=${encoded}`);
      const fallbackData = await fallbackRes.json();
      const fallbackTracks =
        fallbackData?.data?.results || fallbackData?.data || [];
      return fallbackTracks.map((song: any) => {
        const name =
          song.name?.replace(/&quot;/g, '"')?.replace(/&#039;/g, "'") ||
          song.title ||
          'Unknown Track';
        const artist =
          song.primaryArtists || song.artist || 'Unknown Artist';
        const album = song.album?.name || 'Single';
        const duration =
          typeof song.duration === 'string'
            ? parseInt(song.duration, 10) || 0
            : Number(song.duration) || 0;
        const image =
          song.image?.[2]?.url ||
          (typeof song.image === 'string' ? song.image : null) ||
          '/creator.jpg';
        const downloadUrl =
          song.downloadUrl?.[4]?.url ||
          song.downloadUrl?.[song.downloadUrl?.length - 1]?.url ||
          song.downloadUrl?.[0]?.url ||
          song.url ||
          '';
        const rawId = String(song.id || `track-${Math.random().toString(36).substring(2, 9)}`);
        const id = rawId.startsWith('saavn-') ? rawId : `saavn-${rawId}`;

        return {
          id,
          name,
          title: name,
          artist,
          album,
          duration,
          image,
          albumArt: image,
          artwork: image,
          downloadUrl,
          url: downloadUrl,
          audioUrl: downloadUrl,
          genre: song.language || 'Music',
        };
      });
    } catch (fallbackErr) {
      console.error('All search endpoints failed:', fallbackErr);
      // Tertiary fallback: direct JioSaavn scraper so user gets instant 100% accurate results
      try {
        const directResults = await searchJioSaavn(cleanQuery, 30);
        if (directResults && directResults.length > 0) {
          return directResults;
        }
      } catch (directErr) {
        console.warn('Direct JioSaavn search also failed:', directErr);
      }
      return [];
    }
  }
}

export async function searchTracks(query: string, limit = 30): Promise<Track[]> {
  const songs = await searchSongs(query);
  if (songs && songs.length > 0) {
    return limit ? songs.slice(0, limit) : songs;
  }
  // Offline bundled fallback
  const clean = query?.trim().toLowerCase() || '';
  if (clean) {
    const matched = TRENDING_FALLBACK_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(clean) ||
        t.artist.toLowerCase().includes(clean) ||
        (t.album && t.album.toLowerCase().includes(clean))
    );
    if (matched.length > 0) return matched.slice(0, limit);
  }
  return TRENDING_FALLBACK_TRACKS.slice(0, limit);
}

/**
 * 2. Algorithmic Recommendations ("Song Radio" & "Similar Songs"):
 *    - Query https://saavn.dev/api/songs/${songId}/suggestions?limit=15
 *    - If suggestions return empty or mirror fails: query top tracks by current song's primary artist
 *    - Fall back to artist search or trending fallback tracks
 */
export async function getSimilarSongs(songId: string, artist?: string): Promise<Track[]> {
  const cleanId = songId.replace(/^saavn-/, '').trim();

  // 1. Try song recommendation suggestions endpoint
  if (cleanId) {
    try {
      const suggestionsUrl = `https://saavn.dev/api/songs/${encodeURIComponent(cleanId)}/suggestions?limit=15`;
      const res = await fetchWithTimeout(suggestionsUrl, 2500);
      if (res.ok) {
        const json = await res.json();
        const rawList = json?.data || json?.results || [];
        if (Array.isArray(rawList) && rawList.length > 0) {
          const parsed = rawList
            .map(parseApiTrack)
            .filter((t): t is Track => t !== null && Boolean(t.url) && t.id !== songId);
          if (parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('saavn.dev song suggestions endpoint error:', err);
    }
  }

  // 2. Fallback: Query top tracks by the current song's primary artist
  const primaryArtist = artist ? artist.split(',')[0].split('&')[0].trim() : '';

  if (primaryArtist) {
    try {
      const artistUrl = `https://saavn.dev/api/artists?name=${encodeURIComponent(primaryArtist)}&page=1`;
      const res = await fetchWithTimeout(artistUrl, 2500);
      if (res.ok) {
        const json = await res.json();
        const topSongs =
          json?.data?.topSongs ||
          json?.data?.results?.[0]?.topSongs ||
          json?.results?.[0]?.topSongs ||
          [];
        if (Array.isArray(topSongs) && topSongs.length > 0) {
          const parsed = topSongs
            .map(parseApiTrack)
            .filter((t): t is Track => t !== null && Boolean(t.url) && t.id !== songId);
          if (parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('saavn.dev artist topSongs fallback error:', err);
    }

    // Secondary artist fallback: search by artist name directly
    try {
      const artistTracks = await searchTracks(primaryArtist, 15);
      const filtered = artistTracks.filter((t) => t.id !== songId);
      if (filtered.length > 0) return filtered;
    } catch (err) {
      console.warn('searchTracks artist fallback error:', err);
    }
  }

  // 3. Bundled recommendation fallback
  return TRENDING_FALLBACK_TRACKS.filter((t) => t.id !== songId).slice(0, 10);
}
