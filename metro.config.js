// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Remotion demo-video project lives in ./video with its own node_modules;
// keep it out of the app bundle and file watcher.
config.resolver.blockList = [/\/video\/.*/];

module.exports = config;
