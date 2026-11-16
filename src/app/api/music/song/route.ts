import { NextRequest, NextResponse } from 'next/server';
import { getJioSaavnSong } from '@/lib/saavn';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Song id parameter is required',
        },
        { status: 400 }
      );
    }

    const track = await getJioSaavnSong(id.trim());

    if (!track) {
      return NextResponse.json(
        {
          success: false,
          error: 'Song not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: track,
    });
  } catch (error) {
    console.error('Error in /api/music/song:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve song details',
      },
      { status: 500 }
    );
  }
}
