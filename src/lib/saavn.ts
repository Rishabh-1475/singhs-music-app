import CryptoJS from 'crypto-js';
import { Track } from '@/types/track';

const DES_KEY = '38346591';

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function decryptMediaUrl(encryptedUrl: string): string {
  if (!encryptedUrl) return '';
  try {
    const key = CryptoJS.enc.Utf8.parse(DES_KEY);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl),
    });

    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedUrl = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedUrl) return '';

    // Upgrade quality to 320kbps MP4/MP3 or keep 160kbps
    const highQuality = decryptedUrl.replace(
      /_96\.(mp4|mp3)|_48\.(mp4|mp3)|_12\.(mp4|mp3)/,
      '_320.$1'
    );
    return highQuality || decryptedUrl;
  } catch (error) {
    console.error('Failed to decrypt JioSaavn media URL:', error);
    return '';
  }
}

export function getHighResImage(imageUrl: string, fallbackSeed = 'music'): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return `https://picsum.photos/seed/${encodeURIComponent(fallbackSeed)}/500/500`;
  }
  const cleanUrl = imageUrl.replace('http://', 'https://');
  // Match both -150x150, _150x150, -50x50, etc. and upgrade to -500x500
  return cleanUrl.replace(/[_-]\d+x\d+\.(jpg|jpeg|png|webp)/i, '-500x500.$1');
}

export interface RawSaavnSong {
  id: string;
  song?: string;
  title?: string;
  album?: string;
  year?: string;
  primary_artists?: string;
  singers?: string;
  music?: string;
  image?: string;
  duration?: string | number;
  encrypted_media_url?: string;
  media_preview_url?: string;
  language?: string;
  play_count?: string | number;
  copyright_text?: string;
}

export function formatSaavnSong(raw: RawSaavnSong): Track | null {
  const mediaUrl =
    (raw.encrypted_media_url ? decryptMediaUrl(raw.encrypted_media_url) : '') ||
    raw.media_preview_url ||
    '';

  if (!mediaUrl) return null;

  const rawTitle = raw.song || raw.title || 'Unknown Track';
  const rawArtist =
    raw.primary_artists || raw.singers || raw.music || 'Unknown Artist';
  const rawAlbum = raw.album || rawTitle;
  const albumArt = getHighResImage(raw.image || '', rawTitle);
  const duration =
    typeof raw.duration === 'string'
      ? parseInt(raw.duration, 10) || 0
      : Number(raw.duration) || 0;

  const lang = raw.language
    ? raw.language.charAt(0).toUpperCase() + raw.language.slice(1)
    : 'Music';

  return {
    id: `saavn-${raw.id}`,
    title: decodeHtmlEntities(rawTitle),
    artist: decodeHtmlEntities(rawArtist),
    album: decodeHtmlEntities(rawAlbum),
    albumArt,
    artwork: albumArt,
    duration,
    url: mediaUrl,
    audioUrl: mediaUrl,
    genre: lang,
  };
}

export async function searchJioSaavn(
  query: string,
  limit = 25
): Promise<Track[]> {
  try {
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&p=1&n=${limit}&q=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`JioSaavn API error: ${response.status}`);
    }

    const data = await response.json();
    const results: RawSaavnSong[] = data.results || [];

    const tracks: Track[] = [];
    for (const item of results) {
      const formatted = formatSaavnSong(item);
      if (formatted) tracks.push(formatted);
    }

    return tracks;
  } catch (error) {
    console.error('searchJioSaavn error:', error);
    return [];
  }
}

export async function getJioSaavnSong(id: string): Promise<Track | null> {
  try {
    const cleanId = id.replace(/^saavn-/, '');
    const url = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${encodeURIComponent(
      cleanId
    )}&_format=json&_marker=0&cc=in`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const songData = data[cleanId];
    if (!songData) return null;

    return formatSaavnSong(songData);
  } catch (error) {
    console.error('getJioSaavnSong error:', error);
    return null;
  }
}
