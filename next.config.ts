import type { NextConfig } from "next";

// O app é estático: todas as telas rodam no celular e falam direto com a Supabase.
// Assim o service worker consegue guardar tudo e o app abre sem internet.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
