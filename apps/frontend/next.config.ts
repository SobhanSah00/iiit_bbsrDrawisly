import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*", // Matches any request starting with /api/
        destination: "http://localhost:5050/api/:path*", // Proxies to your backend API
      },
      // You can add more rewrite rules here for other proxies
      // {
      //   source: '/images/:path*',
      //   destination: 'https://cdn.example.com/images/:path*',
      // },
    ];
  },
};

export default nextConfig;
