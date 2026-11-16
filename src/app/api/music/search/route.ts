import { NextRequest, NextResponse } from 'next/server';
import { searchJioSaavn } from '@/lib/saavn';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';
import { Track } from '@/types/track';

export const dynamic = 'force-dynamic';

interface RawSaavnSong {
  id?: string | number;
  name?: string;
  title?: string;
  song?: string;
  primaryArtists?: string;
  artist?: string;
  singers?: string;
  artists?: {
    primary?: Array<{ name?: string }>;
  };
  album?: { name?: string } | string;
  image?: Array<{ quality?: string; url?: string }> | string;
  downloadUrl?: Array<{ quality?: string; url?: string }> | string;
  url?: string;
  media_url?: string;
  duration?: string | number;
  language?: string;
  genre?: string;
  primary_artists?: string;
  more_info?: {
    vlink?: string;
    encrypted_media_url?: string;
  };
}

// Helper to sanitize and defensively map song items from saavn.dev or similar endpoints
function mapSaavnDevSong(song: RawSaavnSong, index: number): Track | null {
  try {
    if (!song || typeof song !== 'object') return null;

    const id = String(song?.id ?? `saavn-track-${index}-${Date.now()}`);
    const title = String(song?.name ?? song?.title ?? song?.song ?? 'Unknown Track').trim();
    if (!title) return null;

    let artist = 'Unknown Artist';
    if (typeof song?.primaryArtists === 'string' && song.primaryArtists.trim()) {
      artist = song.primaryArtists.trim();
    } else if (Array.isArray(song?.artists?.primary) && song.artists.primary.length > 0) {
      artist = song.artists.primary
        .map((a) => a?.name ?? '')
        .filter(Boolean)
        .join(', ');
    } else if (typeof song?.artist === 'string' && song.artist.trim()) {
      artist = song.artist.trim();
    } else if (typeof song?.singers === 'string' && song.singers.trim()) {
      artist = song.singers.trim();
    }

    // Defensive artwork resolution (favor 500x500 or highest available)
    let artwork = 'https://picsum.photos/seed/spotify/400/400';
    if (Array.isArray(song?.image) && song.image.length > 0) {
      const highRes = song.image.find(
        (img) => img?.quality === '500x500' || img?.quality === 'large'
      );
      artwork =
        highRes?.url ??
        song.image[song.image.length - 1]?.url ??
        song.image[0]?.url ??
        artwork;
    } else if (typeof song?.image === 'string' && song.image.trim()) {
      artwork = song.image.trim();
    }

    // Defensive audio url resolution (favor 320kbps or highest quality downloadUrl)
    let audioUrl = '';
    if (Array.isArray(song?.downloadUrl) && song.downloadUrl.length > 0) {
      const match320 = song.downloadUrl.find(
        (u) => u?.quality === '320kbps' || u?.quality === '320'
      );
      const match160 = song.downloadUrl.find(
        (u) => u?.quality === '160kbps' || u?.quality === '160'
      );
      audioUrl =
        match320?.url ??
        match160?.url ??
        song.downloadUrl[song.downloadUrl.length - 1]?.url ??
        song.downloadUrl[0]?.url ??
        '';
    } else if (typeof song?.downloadUrl === 'string' && song.downloadUrl.trim()) {
      audioUrl = song.downloadUrl.trim();
    } else if (typeof song?.url === 'string' && song.url.trim()) {
      audioUrl = song.url.trim();
    } else if (typeof song?.media_url === 'string' && song.media_url.trim()) {
      audioUrl = song.media_url.trim();
    }

    if (!audioUrl) return null;

    const album = String(
      typeof song?.album === 'object' && song?.album !== null
        ? song.album.name ?? title
        : typeof song?.album === 'string'
        ? song.album
        : title
    );
    const duration = parseInt(String(song?.duration ?? '180'), 10) || 180;
    const genre = String(song?.language ?? song?.genre ?? 'Indian');

    return {
      id,
      title,
      artist,
      album,
      artwork,
      albumArt: artwork,
      audioUrl,
      url: audioUrl,
      duration,
      genre,
    };
  } catch (err) {
    console.warn('Error parsing song item safely:', err);
    return null;
  }
}

// Helper to map secondary mirror results (privatecvc2 or similar)
function mapMirrorSong(item: RawSaavnSong, index: number): Track | null {
  try {
    if (!item || typeof item !== 'object') return null;

    const id = String(item?.id ?? `mirror-${index}-${Date.now()}`);
    const title = String(item?.song ?? item?.title ?? item?.name ?? 'Unknown Track').trim();
    if (!title) return null;

    const artist = String(
      item?.primary_artists ?? item?.singers ?? item?.artist ?? 'Unknown Artist'
    );

    let artwork = 'https://picsum.photos/seed/spotify/400/400';
    if (typeof item?.image === 'string' && item.image.trim()) {
      artwork = item.image.replace('150x150', '500x500').trim();
    }

    const audioUrl = String(
      item?.media_url ??
        item?.downloadUrl ??
        item?.url ??
        item?.more_info?.vlink ??
        ''
    ).trim();

    if (!audioUrl) return null;

    const album = String(
      typeof item?.album === 'string' ? item.album : title
    );
    const duration = parseInt(String(item?.duration ?? '180'), 10) || 180;

    return {
      id,
      title,
      artist,
      album,
      artwork,
      albumArt: artwork,
      audioUrl,
      url: audioUrl,
      duration,
      genre: String(item?.language ?? 'Music'),
    };
  } catch (err) {
    console.warn('Error mapping mirror song:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query =
      searchParams.get('q') ||
      searchParams.get('query') ||
      searchParams.get('search');
    const limitParam = searchParams.get('limit') || searchParams.get('n');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 25;

    // If query is blank, immediately provide curated fallback tracks
    if (!query || !query.trim()) {
      return NextResponse.json({
        success: true,
        source: 'curated-fallback',
        query: '',
        count: TRENDING_FALLBACK_TRACKS.length,
        data: TRENDING_FALLBACK_TRACKS,
      });
    }

    const trimmedQuery = query.trim();
    const tracks: Track[] = [];

    // ==========================================
    // 1. PRIMARY ENDPOINT: saavn.dev Public API
    // ==========================================
    try {
      const primaryRes = await fetch(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(trimmedQuery)}&page=1&limit=${limit}`,
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(3500),
        }
      );

      if (primaryRes.ok) {
        const primaryData = await primaryRes.json();
        const results = Array.isArray(primaryData?.data?.results)
          ? primaryData.data.results
          : Array.isArray(primaryData?.results)
          ? primaryData.results
          : [];

        results.forEach((item: RawSaavnSong, i: number) => {
          const parsed = mapSaavnDevSong(item, i);
          if (parsed) tracks.push(parsed);
        });
      }
    } catch (primaryErr) {
      console.warn('Primary saavn.dev search timed out or failed:', primaryErr);
    }

    // ==========================================
    // 2. FALLBACK MIRROR: jiosaavn-api-privatecvc2
    // ==========================================
    if (tracks.length === 0) {
      try {
        const mirrorRes = await fetch(
          `https://jiosaavn-api-privatecvc2.vercel.app/search?query=${encodeURIComponent(trimmedQuery)}`,
          {
            headers: { Accept: 'application/json' },
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(3500),
          }
        );

        if (mirrorRes.ok) {
          const mirrorData = await mirrorRes.json();
          const items = Array.isArray(mirrorData?.data)
            ? mirrorData.data
            : Array.isArray(mirrorData?.result)
            ? mirrorData.result
            : Array.isArray(mirrorData)
            ? mirrorData
            : [];

          items.forEach((item: RawSaavnSong, i: number) => {
            const parsed = mapMirrorSong(item, i);
            if (parsed) tracks.push(parsed);
          });
        }
      } catch (mirrorErr) {
        console.warn('Fallback mirror search failed:', mirrorErr);
      }
    }

    // ==========================================
    // 3. TERTIARY MIRROR: Direct JioSaavn 320k DES
    // ==========================================
    if (tracks.length === 0) {
      try {
        const directTracks = await searchJioSaavn(trimmedQuery, limit);
        if (Array.isArray(directTracks) && directTracks.length > 0) {
          tracks.push(...directTracks);
        }
      } catch (directErr) {
        console.warn('Direct Saavn DES search failed:', directErr);
      }
    }

    // ==========================================
    // 4. EMERGENCY FALLBACK: Curated Working Tracks
    // ==========================================
    if (tracks.length === 0) {
      const qLower = trimmedQuery.toLowerCase();
      const matched = TRENDING_FALLBACK_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(qLower) ||
          t.artist.toLowerCase().includes(qLower) ||
          t.genre?.toLowerCase().includes(qLower)
      );
      const emergencyList = matched.length > 0 ? matched : TRENDING_FALLBACK_TRACKS;
      return NextResponse.json({
        success: true,
        source: 'emergency-fallback',
        query: trimmedQuery,
        count: emergencyList.length,
        data: emergencyList,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'live-stream',
      query: trimmedQuery,
      count: tracks.length,
      data: tracks,
    });
  } catch (error) {
    console.error('Unhandled search route error (prevented crash):', error);
    // Never crash or return 500: always return emergency fallback data
    return NextResponse.json({
      success: true,
      source: 'emergency-fallback-rescue',
      query: '',
      count: TRENDING_FALLBACK_TRACKS.length,
      data: TRENDING_FALLBACK_TRACKS,
    });
  }
}
