import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig & { bundledWebRuntime?: boolean } = {
  appId: 'com.rishabh.singhsmusicapp',
  appName: 'SMC Singhs Music Co',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
