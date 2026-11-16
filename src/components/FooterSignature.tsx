'use client';

export default function FooterSignature() {
  return (
    <footer className="w-full py-8 mt-12 border-t border-[#22262F]/60 flex flex-col sm:flex-row items-center justify-center gap-2 text-center text-xs text-zinc-400 select-none transition-colors hover:text-zinc-200">
      <div className="flex items-center gap-1.5">
        <span>Made with</span>
        <span className="inline-block text-rose-500 animate-pulse text-sm">
          ❤️
        </span>
        <span>by</span>
        <span className="font-bold text-white tracking-wide hover:text-[#1DB954] transition-colors">
          Rishabh Singh
        </span>
      </div>
      <span className="hidden sm:inline text-zinc-600">&bull;</span>
      <span className="text-[11px] font-mono text-zinc-500">
        Singh&apos;s Music Company
      </span>
    </footer>
  );
}
