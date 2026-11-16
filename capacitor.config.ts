import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.singhsmusic.app',
  appName: 'SMC Singhs Music Co',
  webDir: 'public',
  server: {
    url: 'https://singh-musix-01.vercel.app',
    cleartext: true
  }
};

export default config;