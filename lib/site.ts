// File: lib/site.ts
// Site identity and canonical URL helpers.

export const SITE = {
  name: 'দৈনিক চাকরি',
  nameEn: 'DailyJobs.bd',
  tagline: 'সরকারি, ব্যাংক ও বেসরকারি চাকরির বিজ্ঞপ্তি',
  description:
    'জাতীয় দৈনিক ও প্রতিষ্ঠানের অফিশিয়াল উৎস থেকে সংগ্রহ করা সরকারি, ব্যাংক, ডিফেন্স ও বেসরকারি চাকরির নিয়োগ বিজ্ঞপ্তি — আবেদনের শেষ তারিখ, পদসংখ্যা ও আবেদন পদ্ধতিসহ।',
  // Contact address already published on the previous site; confirm before launch.
  email: 'info@dailyjobs.bd',
  locale: 'bn_BD',
} as const;

const DEFAULT_SITE_URL = 'https://dailyjobs.bd';

/** Canonical origin, without a trailing slash. Always the production apex unless overridden. */
export function getSiteUrl(): string {
  return (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Path with an optional ?page=N (page 1 has no parameter). */
export function pagedPath(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

export function jobPath(job: { slug?: string | null; id: number }): string {
  return `/job/${job.slug || job.id}`;
}

/** Vercel preview deployments must never be indexed. */
export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === 'preview';
}
