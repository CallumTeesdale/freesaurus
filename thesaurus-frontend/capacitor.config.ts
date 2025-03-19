import {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.yourdomain.thesaurusapp',
    appName: 'FreeSaurus',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: "#ffffffff",
            androidSplashResourceName: "splash",
            androidScaleType: "CENTER_CROP",
            showSpinner: true,
            spinnerColor: "#999999",
            splashFullScreen: true,
            splashImmersive: true
        }
    }
};

export default config;