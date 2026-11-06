import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  devIndicators: false, // Disables the dev floating indicator badge in bottom corner
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@xyflow/react"],
  },
};

export default nextConfig;
