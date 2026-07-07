module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // You only need this plugins array if you are on SDK 49 or older.
    // If you are on SDK 50+, you can remove the plugins array entirely.
    plugins: ["expo-router/babel"],
  };
};
