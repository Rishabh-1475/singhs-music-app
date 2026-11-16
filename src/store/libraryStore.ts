import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';

interface LibraryState {
  playlists: Playlist[];
  likedTrackIds: string[];
  savedTracks: Record<string, Track>;
  importedTracks: Track[];

  createPlaylist: (name: string, description?: string) => string;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  toggleLike: (track: Track | string) => void;
  isLiked: (trackId: string) => boolean;
  getTrack: (trackId: string) => Track | undefined;
  importTrack: (track: Track) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      playlists: [],
      likedTrackIds: [],
      savedTracks: {},
      importedTracks: [],

      createPlaylist: (name, description = '') => {
        const id = `playlist-${Date.now()}`;
        const playlist: Playlist = {
          id,
          name,
          description,
          coverImage: `https://picsum.photos/seed/${id}/300/300`,
          trackIds: [],
          createdAt: Date.now(),
        };
        set((s) => ({ playlists: [...s.playlists, playlist] }));
        return id;
      },

      deletePlaylist: (id) =>
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

      renamePlaylist: (id, name) =>
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      addToPlaylist: (playlistId, track) =>
        set((s) => ({
          savedTracks: { ...s.savedTracks, [track.id]: track },
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.trackIds.includes(track.id)
              ? { ...p, trackIds: [...p.trackIds, track.id] }
              : p
          ),
        })),

      removeFromPlaylist: (playlistId, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, trackIds: p.trackIds.filter((t) => t !== trackId) }
              : p
          ),
        })),

      toggleLike: (trackOrId) =>
        set((s) => {
          const trackId = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;
          const isCurrentlyLiked = s.likedTrackIds.includes(trackId);
          const newSaved =
            typeof trackOrId !== 'string'
              ? { ...s.savedTracks, [trackId]: trackOrId }
              : s.savedTracks;

          return {
            savedTracks: newSaved,
            likedTrackIds: isCurrentlyLiked
              ? s.likedTrackIds.filter((id) => id !== trackId)
              : [...s.likedTrackIds, trackId],
          };
        }),

      isLiked: (trackId) => get().likedTrackIds.includes(trackId),

      getTrack: (trackId) => get().savedTracks[trackId],

      importTrack: (track) =>
        set((s) => {
          if (s.importedTracks.some((t) => t.id === track.id)) return s;
          return {
            importedTracks: [...s.importedTracks, track],
            savedTracks: { ...s.savedTracks, [track.id]: track },
          };
        }),
    }),
    { name: 'sp-library' }
  )
);
