import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>[number];

const allowedPatterns: RemotePattern[] = [
  { protocol: 'https', hostname: 'jobs.kazitechsolutions.com', pathname: '/storage/**' },
  { protocol: 'http', hostname: 'localhost', pathname: '/storage/**' },
  { protocol: 'http', hostname: '127.0.0.1', pathname: '/storage/**' },
];

if (process.env.API_BASE_URL) {
  try {
    const parsed = new URL(process.env.API_BASE_URL);
    const protocol = parsed.protocol.replace(':', '') as 'http' | 'https';
    if (!allowedPatterns.some((p) => p.hostname === parsed.hostname && p.protocol === protocol)) {
      allowedPatterns.push({
        protocol,
        hostname: parsed.hostname,
        pathname: '/storage/**',
      });
    }
  } catch {
    // Ignore invalid API_BASE_URL during build/setup
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: allowedPatterns,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  async redirects() {
    return [
      // One canonical host: www → apex (also configure this in the Vercel domain settings).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.dailyjobs.bd' }],
        destination: 'https://dailyjobs.bd/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
