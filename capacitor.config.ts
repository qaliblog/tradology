import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradology.app',
  appName: 'tradology',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    minWebViewVersion: 55
  }
};

export default config;