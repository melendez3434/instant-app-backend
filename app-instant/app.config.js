module.exports = {
  expo: {
    name: process.env.APP_NAME || 'test',
    slug: 'app-builder',
    version: process.env.APP_VERSION || '1.0.0',
    orientation: 'portrait',
    icon: 'https://aroundsketch.github.io/Apple-App-Icons/App%20Icon/Apple/AppStore/@PNG.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: process.env.BUNDLE_ID || 'com.b7r.appbuilder',
      supportsTablet: true,
    },

    android: {
      package: process.env.BUNDLE_ID || 'com.b7r.appbuilder',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'f9e1b32d-44c4-4e8a-9996-f1b540ff6105',
      },
    },
  },
}
