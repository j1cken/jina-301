/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/horizon',
  output: 'standalone',
  serverExternalPackages: ['@google/genai'],
};

export default nextConfig;
