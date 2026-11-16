'use client';

import { useRef, useCallback, useState } from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  onChange,
  className = '',
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getPercent = useCallback(
    (clientX: number) => {
      if (!barRef.current || max === 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const pct = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(1, pct));
    },
    [max]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pct = getPercent(e.clientX);
      onChange(pct * max);
      setIsDragging(true);

      const onMove = (ev: MouseEvent) => {
        const p = getPercent(ev.clientX);
        onChange(p * max);
      };
      const onUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [getPercent, max, onChange]
  );

  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div
      ref={barRef}
      className={`group relative h-1.5 cursor-pointer rounded-full bg-neutral-700/90 ${className}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-smc-accent transition-all duration-75"
        style={{ width: `${pct}%` }}
      />
      <div
        className={`absolute top-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md border-2 border-smc-accent transition-opacity ${
          isDragging || isHovered ? 'opacity-100 scale-110' : 'opacity-0'
        }`}
        style={{
          left: `${pct}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}
