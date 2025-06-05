module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "path": require.resolve("path-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "util": require.resolve("util/"),
    "fs": false
  };
  return config;
}; 