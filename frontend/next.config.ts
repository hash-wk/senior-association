import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/members", permanent: false }];
  },
};

export default nextConfig;