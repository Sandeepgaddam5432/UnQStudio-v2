import type { CapacitorConfig } from '@capacitor/cli';

const appId = process.env.APP_ID || 'com.aistudio.app';
const appName = process.env.APP_NAME || process.env.VITE_APP_NAME || 'AI Studio';
const appDomain = process.env.APP_DOMAIN || process.env.VITE_APP_DOMAIN || 'localhost';

const config: CapacitorConfig = {
  appId,
  appName,
  webDir: 'dist',
  server: {
    hostname: appDomain,
    androidScheme: 'https',
    iosScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#09090b',
  },
  ios: {
    backgroundColor: '#09090b',
    contentInset: 'automatic',
    scheme: appName.replace(/\s+/g, ''),
  },
};

export default config;
