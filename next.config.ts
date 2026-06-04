import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Explicitly permit embedding in any iframe so the tool works
            // when dropped into the housing org's website (or any other site).
            // frame-ancestors * is the CSP equivalent of X-Frame-Options: ALLOWALL.
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
