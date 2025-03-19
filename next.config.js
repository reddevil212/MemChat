/** @type {import('next').NextConfig} */
const nextConfig = {

    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },


    

  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
};

module.exports = nextConfig;