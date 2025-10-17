/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
  basePath: '/enhanced-bathymetry',
  assetPrefix: '/enhanced-bathymetry',
  distDir: 'out',
}

export default nextConfig
