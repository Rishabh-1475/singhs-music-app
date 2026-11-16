import { NextResponse } from 'next/server';
import { searchJioSaavn } from '@/lib/saavn';
import { TRENDING_FALLBACK_TRACKS } from '@/data/tracks';
import { Track } from '@/types/track';

export const dynamic = 'force-dynamic';

export interface MusicCategory {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  tracks: Track[];
}

export async function GET() {
  try {
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

    const results = await Promise.all(
      categoryConfigs.map(async (cat, idx) => {
        try {
          const tracks = await searchJioSaavn(cat.query, 10);
          if (Array.isArray(tracks) && tracks.length > 0) {
            return {
              id: cat.id,
              title: cat.title,
              subtitle: cat.subtitle,
              language: cat.language,
              tracks,
            };
          }
        } catch {
          // ignore error per category and fall through to sliced fallback
        }

        // Safe fallback subset
        const sliceStart = (idx * 2) % TRENDING_FALLBACK_TRACKS.length;
        const fallbackSlice = [
          ...TRENDING_FALLBACK_TRACKS.slice(sliceStart),
          ...TRENDING_FALLBACK_TRACKS.slice(0, sliceStart),
        ].slice(0, 6);

        return {
          id: cat.id,
          title: cat.title,
          subtitle: cat.subtitle,
          language: cat.language,
          tracks: fallbackSlice,
        };
      })
    );

    return NextResponse.json({
      success: true,
      categories: results,
    });
  } catch (error) {
    console.error('Error fetching categories (fallback engaged):', error);
    // Never fail with 500: return fallback categories
    return NextResponse.json({
      success: true,
      categories: [
        {
          id: 'hindi',
          title: 'Top Hindi Hits',
          subtitle: 'Latest Bollywood chartbusters & romantic anthems',
          language: 'Hindi',
          tracks: TRENDING_FALLBACK_TRACKS,
        },
      ],
    });
  }
}
