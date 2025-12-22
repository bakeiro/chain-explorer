/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/chain-explorer',
  assetPrefix: '/chain-explorer',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
