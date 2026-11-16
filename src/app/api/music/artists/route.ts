import { NextRequest, NextResponse } from 'next/server';
import { Artist } from '@/types/track';

export const dynamic = 'force-dynamic';

const DEFAULT_ARTISTS = [
  'Arijit Singh',
  'Diljit Dosanjh',
  'Sidhu Moose Wala',
  'Anirudh Ravichander',
  'The Weeknd',
  'AP Dhillon',
  'Karan Aujla',
  'Shreya Ghoshal',
];

// Helper to generate a clean gradient/SVG avatar fallback with initials
function getInitialsAvatar(name: string): string {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#16191E"/><stop offset="50%" stop-color="#1DB954"/><stop offset="100%" stop-color="#0D0F11"/></linearGradient></defs><rect width="500" height="500" rx="250" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-weight="900" font-size="160" fill="#ffffff">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function fetchArtistData(name: string, index: number): Promise<Artist> {
  const trimmed = name.trim();
  let image = '';
  let id = `artist-${index}-${Date.now()}`;
  let role = 'Artist';
  let monthlyListeners = '10,000,000+ monthly listeners';

  // 1. Primary candidate: saavn.dev
  try {
    const res = await fetch(
      `https://saavn.dev/api/search/artists?query=${encodeURIComponent(trimmed)}&limit=1`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const first = data?.data?.results?.[0] || data?.results?.[0];
      if (first) {
        if (first.id) id = String(first.id);
        if (first.role) role = first.role;
        if (first.followerCount) {
          monthlyListeners = `${Number(first.followerCount).toLocaleString()} followers`;
        }

        // Image resolution: primary candidate image[2] (500x500), fallback image[1] or image[0]
        if (Array.isArray(first.image) && first.image.length > 0) {
          image =
            first.image[2]?.url ||
            first.image[1]?.url ||
            first.image[0]?.url ||
            first.image[first.image.length - 1]?.url ||
            '';
        } else if (typeof first.image === 'string') {
          image = first.image;
        }
      }
    }
  } catch {
    // Fall through to mirror
  }

  // 2. Fallback Mirror: JioSaavn search.getArtistResults (direct official high-speed endpoint)
  if (!image) {
    try {
      const res = await fetch(
        `https://www.jiosaavn.com/api.php?__call=search.getArtistResults&q=${encodeURIComponent(trimmed)}&_format=json&_marker=0&n=5`,
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 86400 },
          signal: AbortSignal.timeout(3500),
        }
      );
      if (res.ok) {
        const data = await res.json();
        // Prefer an artist result with a real picture rather than an empty default placeholder
        const first =
          data?.results?.find(
            (r: { name?: string; image?: string }) =>
              r?.image &&
              !r.image.includes('artist-default') &&
              r.name?.toLowerCase() === trimmed.toLowerCase()
          ) ||
          data?.results?.find(
            (r: { name?: string; image?: string }) =>
              r?.image && !r.image.includes('artist-default')
          ) ||
          data?.results?.[0];

        if (first) {
          if (first.id) id = String(first.id);
          if (first.role) role = first.role;
          if (first.ctr) {
            monthlyListeners = `${(Number(first.ctr) * 1200).toLocaleString()} monthly listeners`;
          }
          if (typeof first.image === 'string') {
            image = first.image
              .replace('50x50', '500x500')
              .replace('150x150', '500x500');
          }
        }
      }
    } catch {
      // Fall through to autocomplete
    }
  }

  // 3. Fallback Mirror 2: JioSaavn autocomplete.get
  if (!image) {
    try {
      const res = await fetch(
        `https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${encodeURIComponent(trimmed)}&_format=json&_marker=0&ctx=android`,
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 86400 },
          signal: AbortSignal.timeout(3500),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const top = data?.topquery?.data?.[0];
        const artistItem = data?.artists?.data?.[0];
        const target = top?.type === 'artist' ? top : artistItem;
        if (target) {
          if (target.id) id = String(target.id);
          if (target.description) role = target.description;
          if (typeof target.image === 'string') {
            image = target.image
              .replace('50x50', '500x500')
              .replace('150x150', '500x500');
          }
        }
      }
    } catch {
      // Fall through to SVG fallback
    }
  }

  // 4. Defensive SVG/Gradient Initial Avatar
  if (!image || image.includes('artist-default')) {
    image = getInitialsAvatar(trimmed);
  }

  return {
    id,
    name: trimmed,
    role,
    image,
    monthlyListeners,
    verified: true,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query =
      searchParams.get('q') ||
      searchParams.get('query') ||
      searchParams.get('name') ||
      searchParams.get('artist');

    if (query && query.trim()) {
      const artist = await fetchArtistData(query.trim(), 0);
      return NextResponse.json({
        success: true,
        data: artist,
      });
    }

    // Batch fetch for top artists
    const artists = await Promise.all(
      DEFAULT_ARTISTS.map((name, i) => fetchArtistData(name, i))
    );

    return NextResponse.json({
      success: true,
      count: artists.length,
      data: artists,
    });
  } catch (error) {
    console.error('Error in /api/music/artists route (prevented crash):', error);
    // Never crash: return default artists with fallback avatars
    const fallbackArtists: Artist[] = DEFAULT_ARTISTS.map((name, i) => ({
      id: `fallback-artist-${i}`,
      name,
      role: 'Featured Artist',
      image: getInitialsAvatar(name),
      monthlyListeners: 'Verified Artist',
      verified: true,
    }));

    return NextResponse.json({
      success: true,
      count: fallbackArtists.length,
      data: fallbackArtists,
    });
  }
}
