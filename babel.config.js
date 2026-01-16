module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Add this plugin for Drizzle migrations
    plugins: [["inline-import", { extensions: [".sql"] }]], 
  };
};