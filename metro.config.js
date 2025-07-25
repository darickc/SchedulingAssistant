const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite
config.resolver.assetExts.push('wasm');

// Ensure proper module resolution for web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;