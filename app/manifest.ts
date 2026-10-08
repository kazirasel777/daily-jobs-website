// File: app/manifest.ts
import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.nameEn}`,
    short_name: SITE.name,
    description: SITE.description,
    lang: 'bn',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f5ef',
    theme_color: '#062519',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/logo-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
