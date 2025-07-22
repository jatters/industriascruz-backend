const { mergeConfig } = require('vite');

module.exports = (config) => {
  return mergeConfig(config, {
    server: {
      allowedHosts: ['manager.industriascruz.co', 'dev.einscube.com'],
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  });
};
