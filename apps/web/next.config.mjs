/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@astraya/db", "@astraya/shared"],
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.astraya.io" },
    ],
  },
  // RainbowKit / wagmi / WalletConnect pull in a handful of optional deps
  // (pino-pretty, lokijs, encoding) that Next tries to statically resolve.
  // They are genuinely optional — the libraries fall back to default impls
  // when they're missing — so we mark them as externals to silence the
  // webpack "Module not found" warnings during build.
  webpack: (config) => {
    config.externals = [...(config.externals ?? []), "pino-pretty", "lokijs", "encoding"];
    return config;
  },
};

export default nextConfig;
