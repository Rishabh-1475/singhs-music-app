const PRIMARY_API = "https://saavn.dev/api";
const BACKUP_API = "https://jiosavan-api.vercel.app/api";

export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  albumArt: string;
  genre: string;
  duration: number;
  downloadUrl: string;
}

export async function searchSongs(query: string): Promise<Song[]> {
  if (!query || !query.trim()) return [];
  const sanitized = encodeURIComponent(query.trim());

  // 1. Try Primary Mirror
  try {
    const res = await fetch(`${PRIMARY_API}/search/songs?query=${sanitized}&page=1&limit=30`, {
      headers: { 'Accept': 'application/json' }
    });
    const json = await res.json();
    const results = json?.data?.results || json?.data || [];
    if (results.length > 0) return formatSongs(results);
  } catch (e) {
    console.warn("Primary API mirror down, trying backup...", e);
  }

  // 2. Try Backup Mirror
  try {
    const res = await fetch(`${BACKUP_API}/search/songs?query=${sanitized}`);
    const json = await res.json();
    const results = json?.data?.results || json?.data || [];
    if (results.length > 0) return formatSongs(results);
  } catch (e) {
    console.error("All song search mirrors failed", e);
  }

  return [];
}

function formatSongs(rawSongs: any[]): Song[] {
  return rawSongs.map((s) => {
    let streamUrl = "";
    if (Array.isArray(s.downloadUrl)) {
      streamUrl = s.downloadUrl[s.downloadUrl.length - 1]?.url || s.downloadUrl[0]?.url || "";
    } else if (typeof s.downloadUrl === "string") {
      streamUrl = s.downloadUrl;
    } else {
      streamUrl = s.media_url || s.url || "";
    }

    let imgUrl = "/creator.jpg";
    if (Array.isArray(s.image)) {
      imgUrl = s.image[s.image.length - 1]?.url || s.image[0]?.url || imgUrl;
    } else if (typeof s.image === "string") {
      imgUrl = s.image;
    }

    return {
      id: String(s.id),
      name: s.name?.replace(/&quot;/g, '"')?.replace(/&#039;/g, "'") || "Unknown Track",
      artist: s.primaryArtists || s.singers || s.artist || "SMC Music",
      album: s.album?.name || s.album || "Single",
      image: imgUrl,
      albumArt: imgUrl,
      genre: "Indian Pop",
      duration: Number(s.duration) || 0,
      downloadUrl: streamUrl
    };
  }).filter(song => Boolean(song.downloadUrl));
}

export async function getTrendingSongs(): Promise<Song[]> {
  const discoverySeeds = [
    "Top Hindi", "Arijit Singh", "Sidhu Moose Wala",
    "AP Dhillon", "Karan Aujla", "Bollywood Romance",
    "Punjabi Pop", "Diljit Dosanjh", "Lo-Fi Hindi"
  ];
  const randomSeed = discoverySeeds[Math.floor(Math.random() * discoverySeeds.length)];
  return searchSongs(randomSeed);
}