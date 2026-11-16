/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.saavncdn.com' },
      { protocol: 'https', hostname: 'c.saavncdn.com' },
      { protocol: 'https', hostname: 'aac.saavncdn.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
