const fs = require('fs');
const path = require('path');
const sharp = require('../node_modules/sharp');

async function main() {
  console.log('Generating high-resolution 1024x1024 SMC Music icons...');

  const resourcesDir = path.resolve(__dirname, '../resources');
  const androidResourcesDir = path.resolve(resourcesDir, 'android');

  if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true });
  if (!fs.existsSync(androidResourcesDir)) fs.mkdirSync(androidResourcesDir, { recursive: true });

  // 1. High-resolution 1024x1024 Full Icon (resources/icon.png)
  // Emerald glowing ring + 5 equalizer spectrum bars on luxury dark background
  const fullIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14181F"/>
      <stop offset="50%" stop-color="#0D0F12"/>
      <stop offset="100%" stop-color="#08090C"/>
    </linearGradient>
    <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
      <stop offset="45%" stop-color="#059669" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0D0F12" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="emeraldBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="35%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6EE7B7"/>
      <stop offset="30%" stop-color="#10B981"/>
      <stop offset="70%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <filter id="neonBlur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1024" height="1024" fill="url(#bgGrad)"/>
  <circle cx="512" cy="512" r="460" fill="url(#ambientGlow)"/>

  <!-- Outer Neon Ring Frame -->
  <circle cx="512" cy="512" r="390" fill="none" stroke="url(#ringGrad)" stroke-width="26" filter="url(#neonBlur)" opacity="0.9"/>
  <circle cx="512" cy="512" r="390" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.35"/>

  <!-- 5 Equalizer Spectrum Bars (SMC Signature) -->
  <!-- Center Bar (Tallest) -->
  <rect x="486" y="252" width="52" height="520" rx="26" fill="url(#emeraldBarGrad)" filter="url(#softGlow)"/>
  
  <!-- Mid-Left Bar -->
  <rect x="402" y="328" width="52" height="368" rx="26" fill="url(#emeraldBarGrad)" filter="url(#softGlow)"/>
  
  <!-- Mid-Right Bar -->
  <rect x="570" y="328" width="52" height="368" rx="26" fill="url(#emeraldBarGrad)" filter="url(#softGlow)"/>
  
  <!-- Outer-Left Bar -->
  <rect x="318" y="412" width="52" height="200" rx="26" fill="url(#emeraldBarGrad)" filter="url(#softGlow)"/>
  
  <!-- Outer-Right Bar -->
  <rect x="654" y="412" width="52" height="200" rx="26" fill="url(#emeraldBarGrad)" filter="url(#softGlow)"/>
</svg>
`;

  // 2. Android Adaptive Foreground (1024x1024 with transparent background, centered in safe zone ~66%)
  // Scale emblem slightly (approx 0.72) so everything fits comfortably within the 66% circular mask
  const fgSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ambientGlowFg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
      <stop offset="60%" stop-color="#059669" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="emeraldBarGradFg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="35%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="ringGradFg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6EE7B7"/>
      <stop offset="30%" stop-color="#10B981"/>
      <stop offset="70%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <filter id="neonBlurFg" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softGlowFg" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <g transform="translate(512, 512) scale(0.72) translate(-512, -512)">
    <!-- Ambient Inner Glow -->
    <circle cx="512" cy="512" r="420" fill="url(#ambientGlowFg)"/>

    <!-- Outer Ring -->
    <circle cx="512" cy="512" r="390" fill="none" stroke="url(#ringGradFg)" stroke-width="28" filter="url(#neonBlurFg)" opacity="0.95"/>
    <circle cx="512" cy="512" r="390" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.4"/>

    <!-- 5 Equalizer Spectrum Bars -->
    <rect x="486" y="252" width="52" height="520" rx="26" fill="url(#emeraldBarGradFg)" filter="url(#softGlowFg)"/>
    <rect x="402" y="328" width="52" height="368" rx="26" fill="url(#emeraldBarGradFg)" filter="url(#softGlowFg)"/>
    <rect x="570" y="328" width="52" height="368" rx="26" fill="url(#emeraldBarGradFg)" filter="url(#softGlowFg)"/>
    <rect x="318" y="412" width="52" height="200" rx="26" fill="url(#emeraldBarGradFg)" filter="url(#softGlowFg)"/>
    <rect x="654" y="412" width="52" height="200" rx="26" fill="url(#emeraldBarGradFg)" filter="url(#softGlowFg)"/>
  </g>
</svg>
`;

  // 3. Android Adaptive Background (1024x1024 dark luxury gradient)
  const bgSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgRadial" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#181D25"/>
      <stop offset="50%" stop-color="#0E1116"/>
      <stop offset="100%" stop-color="#07080A"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgRadial)"/>
</svg>
`;

  const fullIconBuf = await sharp(Buffer.from(fullIconSvg)).png().toBuffer();
  const fgBuf = await sharp(Buffer.from(fgSvg)).png().toBuffer();
  const bgBuf = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  // Write to resources/
  fs.writeFileSync(path.join(resourcesDir, 'icon.png'), fullIconBuf);
  fs.writeFileSync(path.join(resourcesDir, 'icon-only.png'), fullIconBuf);
  fs.writeFileSync(path.join(resourcesDir, 'icon-foreground.png'), fgBuf);
  fs.writeFileSync(path.join(resourcesDir, 'icon-background.png'), bgBuf);

  // Write to resources/android/
  fs.writeFileSync(path.join(androidResourcesDir, 'icon.png'), fullIconBuf);
  fs.writeFileSync(path.join(androidResourcesDir, 'icon-foreground.png'), fgBuf);
  fs.writeFileSync(path.join(androidResourcesDir, 'icon-background.png'), bgBuf);

  // Also copy to root resources/ for root tooling visibility
  const rootResourcesDir = path.resolve(__dirname, '../../resources');
  const rootAndroidResourcesDir = path.resolve(rootResourcesDir, 'android');
  if (!fs.existsSync(rootResourcesDir)) fs.mkdirSync(rootResourcesDir, { recursive: true });
  if (!fs.existsSync(rootAndroidResourcesDir)) fs.mkdirSync(rootAndroidResourcesDir, { recursive: true });
  fs.writeFileSync(path.join(rootResourcesDir, 'icon.png'), fullIconBuf);
  fs.writeFileSync(path.join(rootAndroidResourcesDir, 'icon-foreground.png'), fgBuf);
  fs.writeFileSync(path.join(rootAndroidResourcesDir, 'icon-background.png'), bgBuf);

  console.log('✓ Successfully generated all 1024x1024 icon assets:');
  console.log('  - resources/icon.png (1024x1024)');
  console.log('  - resources/android/icon-foreground.png (1024x1024)');
  console.log('  - resources/android/icon-background.png (1024x1024)');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
