export interface Track {
  id: string;
  title: string;
  name?: string;
  artist: string;
  album: string;
  albumArt: string;
  artwork?: string;
  image?: string;
  duration: number;
  url: string;
  audioUrl?: string;
  downloadUrl?: string;
  audioBlob?: Blob;
  genre: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface Artist {
  id: string;
  name: string;
  role: string;
  image: string;
  monthlyListeners?: string;
  verified?: boolean;
}
