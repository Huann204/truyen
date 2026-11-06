import type { NextConfig } from "next";

const API = process.env.API_BASE_URL || "https://api.khotruyen.site";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // Ảnh bìa / ảnh trang truyện dùng URL tương đối đã ký -> proxy qua site của mình
    return [{ source: "/api/assets/:path*", destination: `${API}/api/assets/:path*` }];
  },
};

export default nextConfig;
