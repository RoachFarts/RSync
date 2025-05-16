// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ---- Additions for Firebase JS SDK v9+ ----

// 1. Add support for .cjs and .mjs file extensions.
// Firebase v9 and later use .mjs files for its modules.
// While newer Expo defaults might be better, being explicit is safer.
if (!config.resolver) {
  config.resolver = {};
}
if (!config.resolver.sourceExts) {
  config.resolver.sourceExts = []; // Initialize if it doesn't exist, though getDefaultConfig usually does
}

const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts;
config.resolver.sourceExts = process.env.EXPO_DEBUG
  ? [...defaultSourceExts, 'cjs', 'mjs'] // Ensuring defaults are there
  : [...defaultSourceExts, 'cjs', 'mjs']; // Same for release

// 2. Enable unstable_enablePackageExports.
// This helps Metro resolve package exports correctly, which Firebase SDK relies on.


// ---- End of additions ----

module.exports = config;