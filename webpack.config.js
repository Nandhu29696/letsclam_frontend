const { withExpoWebpack } = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await withExpoWebpack(env, argv);
  // Customize the config here
  return config;
};
