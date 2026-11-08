const { getDefaultConfig } = require('expo/metro-config');
const { withRozenite } = require('@rozenite/metro');

// Rozenite panels in React Native DevTools (EXPO_PUBLIC_WITH_ROZENITE=true pnpm start).
// EXPO_PUBLIC_ also inlines the flag into the app, which connects the Reflex panel only then.
module.exports = withRozenite(getDefaultConfig(__dirname), {
  enabled: process.env.EXPO_PUBLIC_WITH_ROZENITE === 'true',
});
