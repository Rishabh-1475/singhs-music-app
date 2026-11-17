'use client';

import { BackgroundMode } from '@awesome-cordova-plugins/background-mode';
import { Track } from '@/types/track';

export interface BackgroundSettings {
  title?: string;
  text?: string;
  icon?: string;
  color?: string;
  resume?: boolean;
  hidden?: boolean;
  bigText?: boolean;
}

/**
 * Enable background execution so Android does not freeze JS audio timers or WebAudio
 */
export function enableBackgroundMode(track?: Track | null): void {
  if (typeof window === 'undefined') return;

  const title = track?.name || track?.title || "SMC Music";
  const text = track?.artist || "Playing in background";

  const settings: BackgroundSettings = {
    title,
    text,
    icon: "icon",
    color: "10b981", // Emerald theme
    resume: true,
    hidden: false,
    bigText: true,
  };

  try {
    const win = window as unknown as {
      cordova?: {
        plugins?: {
          backgroundMode?: typeof BackgroundMode;
        };
      };
    };

    const cordovaBg = win.cordova?.plugins?.backgroundMode;

    if (cordovaBg) {
      if (typeof cordovaBg.enable === 'function') {
        cordovaBg.enable();
      }
      if (typeof cordovaBg.setDefaults === 'function') {
        cordovaBg.setDefaults(settings);
      }
      return;
    }

    if (BackgroundMode) {
      if (typeof BackgroundMode.enable === 'function') {
        BackgroundMode.enable();
      }
      if (typeof BackgroundMode.setDefaults === 'function') {
        BackgroundMode.setDefaults(settings);
      }
    }
  } catch (err) {
    // Non-fatal in standard web/desktop browsers
    console.debug('BackgroundMode available in native runtime:', err);
  }
}

/**
 * Update background notification metadata
 */
export function updateBackgroundModeSettings(track?: Track | null): void {
  if (typeof window === 'undefined' || !track) return;

  const title = track.name || track.title || "SMC Music";
  const text = track.artist || "Playing in background";

  const settings: BackgroundSettings = {
    title,
    text,
    icon: "icon",
    color: "10b981",
    resume: true,
    hidden: false,
    bigText: true,
  };

  try {
    const win = window as unknown as {
      cordova?: {
        plugins?: {
          backgroundMode?: typeof BackgroundMode;
        };
      };
    };

    const cordovaBg = win.cordova?.plugins?.backgroundMode;

    if (cordovaBg && typeof cordovaBg.setDefaults === 'function') {
      cordovaBg.setDefaults(settings);
      return;
    }

    if (BackgroundMode && typeof BackgroundMode.setDefaults === 'function') {
      BackgroundMode.setDefaults(settings);
    }
  } catch {
    // Ignore
  }
}

/**
 * Disable or silence background foreground service when audio is paused
 */
export function disableBackgroundMode(): void {
  if (typeof window === 'undefined') return;

  try {
    const win = window as unknown as {
      cordova?: {
        plugins?: {
          backgroundMode?: typeof BackgroundMode;
        };
      };
    };

    const cordovaBg = win.cordova?.plugins?.backgroundMode;

    if (cordovaBg && typeof cordovaBg.disable === 'function') {
      cordovaBg.disable();
      return;
    }

    if (BackgroundMode && typeof BackgroundMode.disable === 'function') {
      BackgroundMode.disable();
    }
  } catch {
    // Ignore
  }
}
