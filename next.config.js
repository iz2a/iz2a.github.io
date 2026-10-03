/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  images: { domains: ['supabase.co'] },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['jspdf', 'jspdf-autotable', 'canvas'],
  },
}
module.exports = config
