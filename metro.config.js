const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      'css-tree': path.resolve(__dirname, 'node_modules/css-tree'),
      'css-select': path.resolve(__dirname, 'node_modules/css-select'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
