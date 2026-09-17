import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permit the quality values we use in components
    qualities: [75, 85, 90],
    // Large image — allow up to 6688px wide (native res of background_image.png)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
