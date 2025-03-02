const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default configuration for Expo
// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname);

// Export the config with NativeWind support
module.exports = withNativeWind(config, {
  input: './global.css',
});
