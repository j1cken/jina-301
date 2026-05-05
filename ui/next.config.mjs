/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/horizon',
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@google/genai'],
  },
};

export default nextConfig;
