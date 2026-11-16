'use client';

import Image from 'next/image';
import { usePlayerStore } from '@/store/playerStore';

export default function DjTurntable() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const imageSrc =
    currentTrack?.albumArt ||
    currentTrack?.artwork ||
    'https://picsum.photos/seed/turntable/500/500';

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[1.25/1] rounded-2xl metallic-chassis p-4 sm:p-5 flex items-center justify-between border-2 border-neutral-400 select-none">
      {/* 4 Corner Screws */}
      <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center shadow-inner">
        <span className="w-1.5 h-0.5 bg-neutral-600 rotate-45" />
      </div>
      <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center shadow-inner">
        <span className="w-1.5 h-0.5 bg-neutral-600 -rotate-45" />
      </div>
      <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center shadow-inner">
        <span className="w-1.5 h-0.5 bg-neutral-600 -rotate-45" />
      </div>
      <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center shadow-inner">
        <span className="w-1.5 h-0.5 bg-neutral-600 rotate-45" />
      </div>

      {/* Main Platter & Vinyl Section (Left) */}
      <div className="relative w-[70%] aspect-square flex items-center justify-center">
        {/* Platter Strobe Rim with Stroboscopic Dots */}
        <div className="absolute inset-0 rounded-full turntable-platter flex items-center justify-center shadow-2xl">
          {/* Stroboscopic Dots Pattern around the platter edge */}
          <div
            className="absolute inset-1 rounded-full opacity-60 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-conic-gradient(from 0deg, #666 0deg 2deg, transparent 2deg 4deg)',
            }}
          />
        </div>

        {/* Strobe Light Beam on Platter Edge (Red Dot/Bevel) */}
        <div className="absolute -bottom-1 left-3 flex items-center gap-1.5 z-20">
          <div className="w-4 h-4 rounded-full bg-neutral-300 border-2 border-neutral-600 shadow flex items-center justify-center">
            <div
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-red-500 shadow-md shadow-red-500 animate-pulse' : 'bg-red-900'
              }`}
            />
          </div>
          <span className="font-mono text-[8px] text-neutral-600 uppercase font-bold">
            STROBE
          </span>
        </div>

        {/* Vinyl Record */}
        <div
          onClick={togglePlay}
          className={`relative w-[88%] h-[88%] rounded-full vinyl-disc shadow-2xl flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.01] z-10 ${
            isPlaying ? 'animate-spin-slow' : ''
          }`}
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
          title="Click to Play / Pause Vinyl"
        >
          {/* Concentric Grooves */}
          <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute inset-9 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />

          {/* Vinyl Sheen Overlay */}
          <div
            className="absolute inset-0 rounded-full opacity-25 pointer-events-none"
            style={{
              background:
                'conic-gradient(from 30deg, transparent 0deg, rgba(255,255,255,0.3) 60deg, transparent 120deg, rgba(255,255,255,0.35) 240deg, transparent 300deg)',
            }}
          />

          {/* Center Record Label with Album Art Thumbnail */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-neutral-900 shadow-inner bg-neutral-900 flex items-center justify-center">
            <Image
              src={imageSrc}
              alt={currentTrack?.title || 'Record Label'}
              fill
              sizes="96px"
              className="object-cover"
            />
            {/* Center Text Banner & Spindle Hole */}
            <div className="absolute bottom-1 bg-white/80 px-1.5 py-0.2 rounded text-[7px] font-mono font-bold text-black uppercase">
              33⅓ RPM
            </div>
            <div className="absolute w-3.5 h-3.5 rounded-full bg-neutral-200 border-2 border-neutral-700 shadow-inner z-10" />
          </div>
        </div>

        {/* Start / Stop Button at Bottom Left */}
        <button
          onClick={togglePlay}
          className="absolute -bottom-2 -left-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-neutral-200 to-neutral-400 border-2 border-neutral-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
          title="Start / Stop"
        >
          <div
            className={`w-3.5 h-3.5 rounded-full border border-neutral-500 ${
              isPlaying ? 'bg-red-500' : 'bg-neutral-600'
            }`}
          />
        </button>
      </div>

      {/* Tonearm & DJ Controls Section (Right) */}
      <div className="relative w-[28%] h-full flex flex-col justify-between py-1 pl-2">
        {/* Tonearm Assembly */}
        <div className="relative h-44 sm:h-52 w-full">
          {/* Tonearm Pivot Base */}
          <div className="absolute top-1 right-3 w-10 h-10 rounded-full bg-gradient-to-br from-neutral-300 via-neutral-400 to-neutral-500 border-2 border-neutral-600 shadow-lg flex items-center justify-center">
            {/* Counterweight */}
            <div className="w-5 h-5 rounded-full bg-neutral-700 border border-neutral-400 shadow-inner" />
          </div>

          {/* Tonearm S-Arm Wand */}
          <svg
            className="absolute top-6 right-6 w-24 h-40 pointer-events-none transition-transform duration-700 origin-top-right"
            style={{
              transform: isPlaying ? 'rotate(-6deg)' : 'rotate(0deg)',
            }}
            viewBox="0 0 100 160"
          >
            {/* Curved Arm Rod */}
            <path
              d="M 85 10 C 65 30, 75 70, 50 110 L 30 145"
              fill="none"
              stroke="#B0B0B0"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 85 10 C 65 30, 75 70, 50 110 L 30 145"
              fill="none"
              stroke="#E8E8E8"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Arm Clip Rest */}
            <circle cx="85" cy="55" r="4" fill="#333" />

            {/* Headshell & Cartridge Needle */}
            <g transform="translate(18, 140) rotate(25)">
              <rect
                x="0"
                y="0"
                width="14"
                height="22"
                rx="2"
                fill="#222"
                stroke="#666"
                strokeWidth="1"
              />
              <rect x="4" y="20" width="6" height="5" rx="1" fill="#bbb" />
              <circle cx="7" cy="24" r="1" fill="#fff" />
            </g>
          </svg>
        </div>

        {/* Pitch Fader Slider & Controls on the Right */}
        <div className="mt-auto space-y-3 pb-1">
          {/* Pitch Slider Groove */}
          <div className="relative h-20 w-3 mx-auto bg-neutral-800 rounded-full border border-neutral-600 p-0.5 shadow-inner">
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-6 h-3 bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-400 border border-neutral-700 rounded shadow-md cursor-pointer hover:bg-neutral-200">
              <div className="w-full h-0.5 bg-black mt-1" />
            </div>
          </div>

          {/* Speed & Power Knobs */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-400 border border-neutral-600 shadow text-[7px] font-mono font-bold flex items-center justify-center text-black">
              33
            </div>
            <div className="w-3.5 h-3.5 rounded bg-neutral-700 border border-neutral-900 shadow-inner" />
          </div>
        </div>
      </div>
    </div>
  );
}
