/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/requests?type=sitemap',
      },
    ];
  },
};

module.exports = nextConfig;