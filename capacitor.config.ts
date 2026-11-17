import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.singhsmusic.app',
  appName: 'SMC Singhs Music Co',
  webDir: 'out',
  // Local embedded webview packaging - zero internet required to launch & play offline vault
  // server: {
  //   url: 'https://singh-musix-01.vercel.app',
  //   cleartext: true
  // },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0D0F11'
  }
};

export default config;