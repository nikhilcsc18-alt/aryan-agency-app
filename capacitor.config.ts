import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aryanagency.fmcg',
  appName: 'Aryan Agency',
  webDir: 'dist',
  server: {
    url: 'https://ais-pre-56ktpfi5kyykyubymhw3f5-703386228811.asia-east1.run.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'ais-pre-56ktpfi5kyykyubymhw3f5-703386228811.asia-east1.run.app',
      'ais-dev-56ktpfi5kyykyubymhw3f5-703386228811.asia-east1.run.app',
      '*.run.app'
    ]
  }
};

export default config;
