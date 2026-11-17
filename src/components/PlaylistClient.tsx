'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Play, Pause, Plus, Search, Loader2, Music, Clock } from 'lucide-react';
import TopNav from '@/components/TopNav';
import TrackRow from '@/components/TrackRow';
import FooterSignature from '@/components/FooterSignature';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useState, useMemo, useEffect } from 'react';
import { Track } from '@/types/track';
import { searchTracks } from '@/services/musicService';

export default function PlaylistClient() {
  const [isMounted, setIsMounted] = useState(false);
  const params = useParams();
  const id = (params?.id as string) || '';

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const playlists = useLibraryStore((s) => s.playlists);
  const savedTracks = useLibraryStore((s) => s.savedTracks);
  const importedTracks = useLibraryStore((s) => s.importedTracks);
  const addToPlaylist = useLibraryStore((s) => s.addToPlaylist);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const [showAddTrack, setShowAddTrack] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [onlineSearchResults, setOnlineSearchResults] = useState<Track[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const playlist = playlists.find((p) => p.id === id);

  const tracks = useMemo(() => {
    if (!playlist) return [] as Track[];
    return playlist.trackIds
      .map(
        (tid) =>
          savedTracks[tid] ||
          importedTracks.find((t) => t.id === tid)
      )
      .filter((t): t is Track => t !== undefined);
  }, [playlist, savedTracks, importedTracks]);

  const handleSearchOnline = async () => {
    if (!addQuery.trim()) return;
    setIsSearchingOnline(true);
    try {
      const results = await searchTracks(addQuery.trim(), 10);
      setOnlineSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const isPlaylistPlaying =
    tracks.some((t) => t.id === currentTrack?.id) && isPlaying;

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (isPlaylistPlaying) {
      togglePlay();
    } else {
      playQueue(tracks, 0);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#0D0F11] p-8 text-white">
        <TopNav />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#1DB954]" />
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#0D0F11] p-8 text-white">
        <TopNav />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-neutral-400">Playlist not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0F11]">
      <TopNav />

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-36 md:pb-20 space-y-6 scroll-smooth">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-r from-neutral-900 via-[#16191E] to-[#16191E] border border-[#22262F] shadow-xl">
          <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-2xl shadow-2xl flex-shrink-0 bg-neutral-900 border border-[#22262F] flex items-center justify-center text-neutral-400">
            <Music size={68} />
          </div>

          <div className="flex flex-col text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1DB954]">
              PLAYLIST
            </span>
            <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight mt-1">
              {playlist.name}
            </h1>
            <p className="text-xs text-neutral-300 font-medium mt-3">
              <span className="font-bold text-white">Singh&apos;s Music Company</span> &bull;{' '}
              {tracks.length} songs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 py-2">
          <button
            onClick={handlePlayAll}
            disabled={tracks.length === 0}
            className="w-14 h-14 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
            title={isPlaylistPlaying ? 'Pause' : 'Play'}
          >
            {isPlaylistPlaying ? (
              <Pause size={26} fill="black" />
            ) : (
              <Play size={26} fill="black" className="ml-1" />
            )}
          </button>

          <button
            onClick={() => setShowAddTrack(!showAddTrack)}
            className="px-5 py-2.5 rounded-full border border-neutral-600 text-xs font-bold uppercase tracking-wider text-white hover:border-white transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Find more songs</span>
          </button>
        </div>

        {showAddTrack && (
          <div className="bg-[#16191E] rounded-2xl p-5 border border-[#22262F] space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-white">
              Search JioSaavn & Add to &quot;{playlist.name}&quot;
            </h3>
            <div className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchOnline()}
                  placeholder="Search Hindi, Tamil, English track..."
                  className="w-full bg-[#0D0F11] text-sm text-white pl-9 pr-3 py-2 rounded-xl outline-none border border-[#22262F] focus:border-[#1DB954]"
                />
              </div>
              <button
                onClick={handleSearchOnline}
                className="px-5 py-2 bg-white text-black font-bold text-xs uppercase rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
              >
                {isSearchingOnline ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>

            {onlineSearchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-1 pt-2 border-t border-[#22262F]">
                {onlineSearchResults.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-[#22262F]">
                        <Image
                          src={t.albumArt || t.artwork || 'https://picsum.photos/seed/playlist/300/300'}
                          alt={t.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {t.title}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {t.artist}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addToPlaylist(playlist.id, t)}
                      className="px-3.5 py-1 rounded-full border border-neutral-600 text-xs font-bold text-white hover:border-[#1DB954] hover:text-[#1DB954] transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tracks.length > 0 ? (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-4 px-3.5 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-[#22262F] select-none">
              <div className="col-span-8 sm:col-span-6 flex items-center gap-3">
                <span className="w-5 text-center">#</span>
                <span>Title</span>
              </div>
              <div className="hidden sm:block sm:col-span-4">Album</div>
              <div className="col-span-4 sm:col-span-2 text-right">
                <Clock size={16} className="inline ml-auto" />
              </div>
            </div>

            {tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                tracks={tracks}
                showAlbum={true}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-neutral-400 space-y-2">
            <Music size={48} className="mx-auto text-neutral-600" />
            <h2 className="text-xl font-bold text-white">This playlist is empty</h2>
            <p className="text-xs text-neutral-400">
              Click &quot;Find more songs&quot; to search JioSaavn and add tracks to this playlist.
            </p>
          </div>
        )}

        <FooterSignature />
      </div>
    </div>
  );
}
