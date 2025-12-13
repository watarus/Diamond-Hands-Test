/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/icon.png',
        destination: '/api/icon',
      },
      {
        source: '/api/og.png',
        destination: '/api/og',
      },
    ]
  },
}

module.exports = nextConfig
