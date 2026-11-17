import { Track, Artist } from '@/types/track';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';
import { searchJioSaavn, getJioSaavnSong } from '@/lib/saavn';

export interface MusicCategory {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  tracks: Track[];
}

// 1. Search Tracks (saavn.dev primary with searchJioSaavn & fallback)
export async function searchTracks(query: string, limit = 25): Promise<Track[]> {
  if (!query || !query.trim()) return [];

  // Try saavn.dev first
  try {
    const res = await fetch(
      `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query.trim())}&page=1&limit=${limit}`,
      { headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const json = await res.json();
      const results = json?.data?.results || json?.results || [];
      if (Array.isArray(results) && results.length > 0) {
        return results.map((item: any) => {
          const audioSrc =
            item.downloadUrl?.[4]?.url ||
            item.downloadUrl?.[3]?.url ||
            item.downloadUrl?.[0]?.url ||
            '';
          const art =
            item.image?.[2]?.url ||
            item.image?.[1]?.url ||
            item.image?.[0]?.url ||
            'https://picsum.photos/seed/music/500/500';

          return {
            id: String(item.id || `saavn-${Math.random().toString(36).substring(2, 9)}`),
            title: item.name || item.title || 'Unknown Track',
            artist:
              item.artists?.primary?.map((a: any) => a.name).join(', ') ||
              item.primaryArtists ||
              'Unknown Artist',
            album: item.album?.name || 'Single',
            albumArt: art,
            artwork: art,
            image: art,
            url: audioSrc,
            audioUrl: audioSrc,
            downloadUrl: audioSrc,
            duration: Number(item.duration) || 0,
            genre: item.language || 'Music',
          };
        });
      }
    }
  } catch (err) {
    console.warn('saavn.dev search fallback:', err);
  }

  // Secondary fallback: JioSaavn direct
  try {
    const fallbackTracks = await searchJioSaavn(query.trim(), limit);
    if (fallbackTracks.length > 0) return fallbackTracks;
  } catch (err) {
    console.warn('searchJioSaavn fallback:', err);
  }

  // Tertiary fallback: match query against bundled offline tracks
  const lower = query.toLowerCase();
  const matched = TRENDING_FALLBACK_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(lower) ||
      t.artist.toLowerCase().includes(lower) ||
      (t.album && t.album.toLowerCase().includes(lower))
  );
  return matched.length > 0 ? matched : TRENDING_FALLBACK_TRACKS.slice(0, limit);
}

// 2. Fetch Trending Tracks
export async function fetchTrendingTracks(): Promise<Track[]> {
  try {
    const tracks = await searchTracks('Top Hindi Trending', 25);
    if (tracks.length > 0) return tracks;
  } catch (e) {
    console.warn('Failed to fetch trending tracks:', e);
  }
  return TRENDING_FALLBACK_TRACKS;
}

// 3. Fetch Categories
export async function fetchCategories(): Promise<MusicCategory[]> {
  const categoryConfigs = [
    {
      id: 'hindi',
      title: 'Top Hindi Hits',
      subtitle: 'Latest Bollywood chartbusters & romantic anthems',
      language: 'Hindi',
      query: 'Top Hindi Songs',
    },
    {
      id: 'english',
      title: 'Global English Hits',
      subtitle: 'International pop, rock & chart-topping favorites',
      language: 'English',
      query: 'Billboard Hot 100',
    },
    {
      id: 'tamil',
      title: 'Tamil Kollywood Hits',
      subtitle: 'Anirudh, AR Rahman, Yuvan & Tamil anthems',
      language: 'Tamil',
      query: 'Tamil Top Hits',
    },
    {
      id: 'punjabi',
      title: 'Punjabi Pop & Beats',
      subtitle: 'Diljit Dosanjh, Karan Aujla, AP Dhillon & bangers',
      language: 'Punjabi',
      query: 'Punjabi Hits',
    },
    {
      id: 'lofi',
      title: 'Midnight Lo-Fi & Chill',
      subtitle: 'Mellow acoustic, soothing Indian & Western lo-fi',
      language: 'Lo-Fi',
      query: 'Bollywood Lofi',
    },
  ];

  try {
    const results = await Promise.all(
      categoryConfigs.map(async (cat, idx) => {
        try {
          const tracks = await searchTracks(cat.query, 10);
          return {
            id: cat.id,
            title: cat.title,
            subtitle: cat.subtitle,
            language: cat.language,
            tracks: tracks.length > 0 ? tracks : TRENDING_FALLBACK_TRACKS.slice(idx * 2, idx * 2 + 5),
          };
        } catch {
          return {
            id: cat.id,
            title: cat.title,
            subtitle: cat.subtitle,
            language: cat.language,
            tracks: TRENDING_FALLBACK_TRACKS.slice(idx * 2, idx * 2 + 5),
          };
        }
      })
    );
    return results;
  } catch {
    return categoryConfigs.map((cat, idx) => ({
      id: cat.id,
      title: cat.title,
      subtitle: cat.subtitle,
      language: cat.language,
      tracks: TRENDING_FALLBACK_TRACKS.slice(idx * 2, idx * 2 + 5),
    }));
  }
}

// 4. Fetch Featured Artists
export async function fetchArtists(): Promise<Artist[]> {
  const ARTIST_NAMES = [
    'Arijit Singh',
    'Diljit Dosanjh',
    'Sidhu Moose Wala',
    'Anirudh Ravichander',
    'The Weeknd',
    'AP Dhillon',
    'Karan Aujla',
    'Shreya Ghoshal',
  ];

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

  const artists = await Promise.all(
    ARTIST_NAMES.map(async (name, index) => {
      let image = '';
      let id = `artist-${index}`;
      let role = 'Artist';
      let monthlyListeners = '10,000,000+ monthly listeners';

      try {
        const res = await fetch(
          `https://saavn.dev/api/search/artists?query=${encodeURIComponent(name)}&limit=1`
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
            if (Array.isArray(first.image) && first.image.length > 0) {
              image =
                first.image[2]?.url ||
                first.image[1]?.url ||
                first.image[0]?.url ||
                '';
            }
          }
        }
      } catch {
        // fallback
      }

      if (!image) image = getInitialsAvatar(name);

      return {
        id,
        name,
        image,
        role,
        monthlyListeners,
      };
    })
  );

  return artists;
}

// 5. Fetch Single Song Details
export async function fetchSongDetails(id: string): Promise<Track | null> {
  try {
    return await getJioSaavnSong(id);
  } catch (err) {
    console.error('fetchSongDetails error:', err);
    return null;
  }
}
