import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dex-terminal/ui", "@dex-terminal/types"],
};

export default nextConfig;
