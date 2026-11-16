import { NextResponse } from 'next/server';
import { searchJioSaavn } from '@/lib/saavn';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';
import { Track } from '@/types/track';

export const dynamic = 'force-dynamic';

interface RawSaavnSong {
  id?: string | number;
  name?: string;
  title?: string;
  primaryArtists?: string;
  artists?: {
    primary?: Array<{ name?: string }>;
  };
  album?: { name?: string };
  image?: Array<{ quality?: string; url?: string }>;
  downloadUrl?: Array<{ quality?: string; url?: string }>;
  duration?: string | number;
  language?: string;
}

export async function GET() {
  try {
    const tracks: Track[] = [];

    // 1. Primary endpoint: saavn.dev
    try {
      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=Top%20Hindi%20Trending&page=1&limit=25`,
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(3500),
        }
      );
      if (res.ok) {
        const json = await res.json();
        const results: RawSaavnSong[] = Array.isArray(json?.data?.results)
          ? json.data.results
          : Array.isArray(json?.results)
          ? json.results
          : [];

        for (const item of results) {
          const id = String(item?.id ?? `saavn-${Math.random().toString(36).substring(2, 9)}`);
          const title = String(item?.name ?? item?.title ?? '').trim();
          if (!title) continue;

          let artist = 'Unknown Artist';
          if (typeof item?.primaryArtists === 'string' && item.primaryArtists.trim()) {
            artist = item.primaryArtists.trim();
          } else if (Array.isArray(item?.artists?.primary) && item.artists.primary.length > 0) {
            artist = item.artists.primary
              .map((a) => a?.name ?? '')
              .filter(Boolean)
              .join(', ');
          }

          let artwork = 'https://picsum.photos/seed/spotify/400/400';
          if (Array.isArray(item?.image) && item.image.length > 0) {
            artwork =
              item.image[item.image.length - 1]?.url ??
              item.image[0]?.url ??
              artwork;
          }

          let audioUrl = '';
          if (Array.isArray(item?.downloadUrl) && item.downloadUrl.length > 0) {
            const high = item.downloadUrl.find(
              (u) => u?.quality === '320kbps' || u?.quality === '160kbps'
            );
            audioUrl =
              high?.url ??
              item.downloadUrl[item.downloadUrl.length - 1]?.url ??
              item.downloadUrl[0]?.url ??
              '';
          }

          if (audioUrl) {
            tracks.push({
              id,
              title,
              artist,
              album: String(item?.album?.name ?? title),
              artwork,
              albumArt: artwork,
              audioUrl,
              url: audioUrl,
              duration: parseInt(String(item?.duration ?? '180'), 10) || 180,
              genre: String(item?.language ?? 'Hindi'),
            });
          }
        }
      }
    } catch (err) {
      console.warn('Trending primary endpoint failed, trying fallback mirror:', err);
    }

    // 2. Fallback Mirror: direct JioSaavn 320k DES
    if (tracks.length === 0) {
      try {
        const direct = await searchJioSaavn('Top Hindi Songs', 20);
        if (Array.isArray(direct) && direct.length > 0) {
          tracks.push(...direct);
        }
      } catch (err) {
        console.warn('Direct Saavn DES trending failed:', err);
      }
    }

    // 3. Fallback: Curated working tracks
    const finalTracks = tracks.length > 0 ? tracks : TRENDING_FALLBACK_TRACKS;

    return NextResponse.json({
      success: true,
      count: finalTracks.length,
      data: finalTracks,
    });
  } catch (error) {
    console.error('Unhandled trending route error (recovered):', error);
    return NextResponse.json({
      success: true,
      count: TRENDING_FALLBACK_TRACKS.length,
      data: TRENDING_FALLBACK_TRACKS,
    });
  }
}
