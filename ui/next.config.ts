import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
  },
  async rewrites() {
    return [
      { source: '/ask', destination: 'http://127.0.0.1:8000/ask' },
      { source: '/health', destination: 'http://127.0.0.1:8000/health' },
      { source: '/api/threads/:path*', destination: 'http://127.0.0.1:8000/api/threads/:path*' },
      { source: '/api/upload', destination: 'http://127.0.0.1:8000/api/upload' }
    ];
  }
};

export default nextConfig;
