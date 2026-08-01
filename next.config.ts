import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/media/process": ["./bin/yt-dlp", "./node_modules/ffmpeg-static/ffmpeg"],
    "/api/media/upload": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "framer-motion"],
  },
};

export default nextConfig;
