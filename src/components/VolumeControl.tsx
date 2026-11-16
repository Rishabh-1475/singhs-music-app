'use client';

import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import ProgressBar from './ProgressBar';

export default function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        className="text-smc-dark-muted transition-colors hover:text-white"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <VolumeIcon size={18} />
      </button>
      <div className="w-20 sm:w-24">
        <ProgressBar
          value={isMuted ? 0 : volume}
          max={1}
          onChange={(v) => setVolume(v)}
        />
      </div>
    </div>
  );
}
