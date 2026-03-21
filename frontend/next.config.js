const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@swc/helpers'] = path.dirname(require.resolve('@swc/helpers/package.json'));
    return config;
  },
};

module.exports = nextConfig;
