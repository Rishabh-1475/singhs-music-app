# Singh's Music Company – Zero-Lag High-Fidelity Music Streaming

A modern, high-contrast, zero-lag music streaming web application built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, and **Zustand**, streaming online music powered by the **JioSaavn Music API** and styled after Apple CarPlay / iOS Now Playing widgets.

---

## 🎨 Zero-Lag UI Design (References from Uploaded Templates)

1. **Now Playing Card**:
   - Deep obsidian frosted glass container (`bg-[#161619]` with rounded corners and subtle border).
   - Crisp, high-resolution square album artwork thumbnail (`rounded-2xl`).
   - Clean typography: bold white song title and soft neutral artist name.
   - Sleek scrub bar with live current and remaining timestamps (`2:47` and `-2:39`).
   - **Large, ultra-visible solid white transport controls**:
     - `<<` Previous track
     - `||` / `▶` Play/Pause toggle
     - `>>` Next track
   - Smooth volume slider with speaker icons.
   - Connected device badge: `🔊 Singh's Music Co. • WH-1000XM4`.

2. **Ambient Backdrop & Typographic Quotes**:
   - Soft ambient background reflection derived from active album artwork.
   - Minimalist clock badge (e.g. `3:41 PM`).
   - Typographic lyric quotes (*"I know a place... it's somewhere I go when I need to remember your face"*).

3. **Curated & Live Tracklist with Proper Thumbnails**:
   - Every single track row displays a proper square album art thumbnail.
   - Real-time debounced search for any artist or track (*Arijit Singh*, *Diljit Dosanjh*, *The 1975*, *Bollywood Top Hits*).
   - 1-click instant playback with uninterrupted continuous audio across pages.

---

## 🚀 Running Locally

```bash
cd d:\Developer\Reconvision\music-app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to stream.
