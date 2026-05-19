const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('bin');
config.resolver.assetExts.push('bin');

module.exports = config;
