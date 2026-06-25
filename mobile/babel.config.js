module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
  overrides: [
    {
      test: /[\\/]node_modules[/\\/](react-native-reanimated|react-native-worklets)[/\\/]/,
      plugins: ['react-native-reanimated/plugin'],
    },
  ],
};
