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
  images: {
    remotePatterns: allowedPatterns,
  },
};

export default nextConfig;
