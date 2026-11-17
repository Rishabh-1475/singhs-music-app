'use client';

import { create } from 'zustand';
import { User, onAuthChange, logoutUser } from '@/lib/firebase';
import { Track } from '@/types/track';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  userLikedSongs: Track[];
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  syncUserLikedSongs: (uid: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthModalOpen: false,
  userLikedSongs: [],

  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  setUser: (user) => {
    set({ user, isLoading: false });
    if (user?.uid) {
      get().syncUserLikedSongs(user.uid);
    }
  },

  syncUserLikedSongs: (uid: string) => {
    if (typeof window === 'undefined') return;
    try {
      const userKey = `smc_liked_songs_${uid}`;
      const generalKey = 'smc_liked_songs';

      const userStored = localStorage.getItem(userKey);
      const generalStored = localStorage.getItem(generalKey);

      let mergedSongs: Track[] = [];

      if (userStored) {
        mergedSongs = JSON.parse(userStored);
      }

      if (generalStored) {
        const guestSongs: Track[] = JSON.parse(generalStored);
        const map = new Map<string, Track>();
        mergedSongs.forEach((t) => map.set(t.id, t));
        guestSongs.forEach((t) => {
          if (!map.has(t.id)) {
            map.set(t.id, t);
          }
        });
        mergedSongs = Array.from(map.values());
      }

      localStorage.setItem(userKey, JSON.stringify(mergedSongs));
      localStorage.setItem(generalKey, JSON.stringify(mergedSongs));

      set({ userLikedSongs: mergedSongs });

      window.dispatchEvent(
        new CustomEvent('smc_liked_songs_changed', {
          detail: { syncedUid: uid, count: mergedSongs.length },
        })
      );
    } catch (err) {
      console.warn('Failed to sync user liked songs:', err);
    }
  },

  signOut: async () => {
    await logoutUser();
    set({ user: null, userLikedSongs: [] });
  },
}));

// Initialize client-side auth state listener
if (typeof window !== 'undefined') {
  onAuthChange((user) => {
    useAuthStore.getState().setUser(user);
  });
}
