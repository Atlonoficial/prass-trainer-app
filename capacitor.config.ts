import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prasstrainer.app',
  appName: 'Prass Trainer',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false
  },
  server: {
    iosScheme: 'capacitor',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false
    }
  }
};

export default config;

