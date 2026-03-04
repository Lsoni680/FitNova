module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // IMPORTANT: reanimated plugin MUST be last
      "react-native-reanimated/plugin",
    ],
  };
};
