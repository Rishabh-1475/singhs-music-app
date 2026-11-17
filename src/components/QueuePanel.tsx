'use client';

import Image from 'next/image';
import { X, Play, Music2, Radio, Sparkles } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

export default function QueuePanel() {
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const upNextQueue = usePlayerStore((s) => s.upNextQueue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const showQueue = usePlayerStore((s) => s.showQueue);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  if (!showQueue) return null;

  return (
    <div className="fixed right-0 top-0 bottom-24 z-50 flex w-80 sm:w-96 flex-col border-l border-[#282828] bg-[#121212] shadow-2xl transition-all select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#282828]">
        <div>
          <h3 className="text-sm font-bold text-white">Queue</h3>
          <p className="text-xs text-neutral-400">{queue.length} songs</p>
        </div>
        <button
          onClick={toggleQueue}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Currently Playing Track */}
      {currentTrack && (
        <div className="p-4 bg-[#181818] border-b border-[#282828]">
          <p className="mb-2 text-xs font-bold text-[#1db954] uppercase tracking-wider">
            Now Playing
          </p>
          <div className="flex items-center gap-3 rounded p-2 bg-[#282828]">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-neutral-800">
              <Image
                src={
                  currentTrack.albumArt ||
                  currentTrack.artwork ||
                  'https://picsum.photos/seed/song/300/300'
                }
                alt={currentTrack.title}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {currentTrack.title}
              </p>
              <p className="truncate text-xs text-neutral-400 mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Up Next & Song Radio Lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Next in Current Queue */}
        {queue.slice(queueIndex + 1).length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Next Up
            </p>
            <div className="space-y-1">
              {queue.slice(queueIndex + 1).map((track, i) => (
                <button
                  key={`${track.id}-queue-${i}`}
                  onClick={() => {
                    const realIdx = queueIndex + 1 + i;
                    if (currentTrack?.id === track.id && realIdx === queueIndex) {
                      togglePlay();
                    } else {
                      playQueue(queue, realIdx);
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#282828] group"
                >
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-800 shadow-sm">
                    <Image
                      src={
                        track.albumArt ||
                        track.artwork ||
                        track.image ||
                        'https://picsum.photos/seed/song/300/300'
                      }
                      alt={track.title}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white group-hover:text-emerald-400">
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      {track.artist}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Algorithmic Up Next / Song Radio */}
        {upNextQueue.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-emerald-400" />
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Similar Songs (Autoplay)
              </p>
            </div>
            <div className="space-y-1">
              {upNextQueue.map((track, i) => (
                <button
                  key={`${track.id}-upnext-${i}`}
                  onClick={() => {
                    // Instantly play this recommended track
                    playQueue([track, ...upNextQueue.filter((t) => t.id !== track.id)], 0);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 group"
                >
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-800 shadow-sm">
                    <Image
                      src={
                        track.albumArt ||
                        track.artwork ||
                        track.image ||
                        'https://picsum.photos/seed/song/300/300'
                      }
                      alt={track.title}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white group-hover:text-emerald-400">
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      {track.artist}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {queue.slice(queueIndex + 1).length === 0 && upNextQueue.length === 0 && (
          <div className="py-8 text-center text-neutral-500 text-xs">
            No upcoming songs in the queue.
          </div>
        )}
      </div>
    </div>
  );
}
