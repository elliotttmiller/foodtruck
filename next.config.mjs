/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') ?? '';

const nextConfig = {
  // GitHub Pages is a static host. `next build` must emit a fully static site.
  output: 'export',
  trailingSlash: true,
  poweredByHeader: false,

  // Project Pages are served from /foodtruck. Keeping this environment-driven
  // makes a future custom-domain migration a one-line configuration change.
  basePath,

  // GitHub Pages cannot run the Next.js image optimization server.
  images: {
    unoptimized: true,
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
