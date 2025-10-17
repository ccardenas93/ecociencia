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
  basePath: '/ecociencia/enhanced-bathymetry',
  assetPrefix: '/ecociencia/enhanced-bathymetry',
}

export default nextConfig
