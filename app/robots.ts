// File: app/robots.ts
import type { MetadataRoute } from 'next';
import { absoluteUrl, isPreviewDeployment } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    // Search results stay crawlable so their noindex tag can be read; only the
    // internal view-count endpoint is excluded.
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
