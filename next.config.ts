import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/lottery-time-machine",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
