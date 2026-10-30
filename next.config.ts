import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/.next/**",
          "**/node_modules/**",
          "**/Archive.zip",
          "**/.DS_Store",
        ],
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_URL}/api/v1/:path*`,
      },
      {
        source: "/images/:path*",
        destination: `${API_URL}/images/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        // DigitalOcean Spaces (origin and CDN), where the backend stores uploads.
        protocol: "https",
        hostname: "**.digitaloceanspaces.com",
      },
      {
        // Older uploads that were stored on Cloudinary.
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "apireact.digitalever.com.bd",
        pathname: "/images/**",
      },

      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
