import type { NextConfig } from 'next'

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true'
const repoName = 'figma-design-system-agent'

const nextConfig: NextConfig = {
  ...(isStaticExport && {
    output: 'export',
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
    images: { unoptimized: true },
  }),
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig
