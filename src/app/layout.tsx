import type { Metadata, Viewport } from 'next';
import './globals.css';
import SpotifyShell from '@/components/SpotifyShell';

export const metadata: Metadata = {
  title: "Singh's Music Company • Spotify Premium Web Experience",
  description:
    "Singh's Music Company – Ad-free lossless streaming powered by JioSaavn across Hindi, Tamil, English & Punjabi music.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SMC',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d0f11',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d0f11" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration error:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#0d0f11] text-white flex flex-col antialiased overflow-hidden selection:bg-[#1db954] selection:text-black">
        {/* Global application shell hosting Navbar, Sidebar, Player, and AuthModal */}
        <SpotifyShell>{children}</SpotifyShell>
      </body>
    </html>
  );
}
