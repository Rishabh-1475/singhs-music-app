import { Track, Artist } from '@/types/track';
import { getJioSaavnSong } from '@/lib/saavn';
import { searchTracks, searchSongs, getSimilarSongs, extractHighResArtwork } from './api';

export { searchTracks, searchSongs, getSimilarSongs, extractHighResArtwork };

export interface MusicCategory {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  query: string;
  tracks: Track[];
}

export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 2. Fetch Trending Tracks
export async function fetchTrendingTracks(): Promise<Track[]> {
  try {
    const tracks = await searchTracks('Top Hindi Trending', 25);
    if (tracks.length > 0) return fisherYatesShuffle(tracks);
  } catch (e) {
    console.warn('Failed to fetch trending tracks:', e);
  }
  return [];
}

// 3. Fetch Dynamic Mood & Language Categories
export async function fetchCategories(): Promise<MusicCategory[]> {
  const categoryConfigs = [
    {
      id: 'repeat',
      title: 'On Repeat',
      subtitle: 'Frequently played & trending chartbusters',
      language: 'Trending',
      query: 'Top Trending Hits Hindi English',
    },
    {
      id: 'workout',
      title: 'Gym / Workout',
      subtitle: 'High-BPM workout, Gym motivation & Punjabi hype',
      language: 'Workout',
      query: 'workout hindi gym punjabi',
    },
    {
      id: 'focus',
      title: 'Deep Focus',
      subtitle: 'Lo-Fi, chill instrumental & ambient study tracks',
      language: 'Focus',
      query: 'lofi hindi chill acoustic',
    },
    {
      id: 'podcasts',
      title: 'Podcasts & Talk',
      subtitle: 'Top Indian talk, stories & inspirational audio',
      language: 'Stories',
      query: 'podcast hindi talk stories audio',
    },
    {
      id: 'hindi',
      title: 'Top Hindi Hits',
      subtitle: 'Latest Bollywood chartbusters & romantic anthems',
      language: 'Hindi',
      query: 'Top Hindi Songs',
    },
    {
      id: 'punjabi',
      title: 'Punjabi Pop & Bangers',
      subtitle: 'Diljit Dosanjh, Karan Aujla, AP Dhillon & bangers',
      language: 'Punjabi',
      query: 'Punjabi Hits',
    },
    {
      id: 'english',
      title: 'Global English Hits',
      subtitle: 'International pop, rock & chart-topping favorites',
      language: 'English',
      query: 'Billboard Hot 100',
    },
  ];

  try {
    const results = await Promise.all(
      categoryConfigs.map(async (cat) => {
        try {
          const tracks = await searchTracks(cat.query, 12);
          return {
            id: cat.id,
            title: cat.title,
            subtitle: cat.subtitle,
            language: cat.language,
            query: cat.query,
            tracks: tracks.length > 0 ? fisherYatesShuffle(tracks) : [],
          };
        } catch {
          return {
            id: cat.id,
            title: cat.title,
            subtitle: cat.subtitle,
            language: cat.language,
            query: cat.query,
            tracks: [],
          };
        }
      })
    );
    return results;
  } catch {
    return categoryConfigs.map((cat) => ({
      id: cat.id,
      title: cat.title,
      subtitle: cat.subtitle,
      language: cat.language,
      query: cat.query,
      tracks: [],
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
