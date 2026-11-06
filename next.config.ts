import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false, // Disables the dev floating indicator badge in bottom corner
};

export default nextConfig;
