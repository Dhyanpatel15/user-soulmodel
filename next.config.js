/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["i.pravatar.cc", "picsum.photos"],
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ ADD THIS
  },
};

module.exports = nextConfig;