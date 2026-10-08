// File: lib/seo.ts
// Metadata and structured-data builders. Structured data only states what the API
// reliably provides; nothing is guessed.
import type { Metadata } from 'next';
import type { JobDetail } from '@/types/job';
import { SITE, absoluteUrl, getSiteUrl } from '@/lib/site';
import { daysUntil, stripHtml } from '@/lib/format';
import { sanitizeRichText } from '@/lib/sanitize';

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  /** false → noindex, follow (thin, empty or internal-search pages). */
  index?: boolean;
  type?: 'website' | 'article';
  images?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  /** Set when the title already carries the brand and must skip the layout template. */
  absoluteTitle?: boolean;
}

export function pageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  const ogTitle = input.absoluteTitle ? input.title : `${input.title} | ${SITE.name}`;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.index === false ? { index: false, follow: true } : undefined,
    openGraph: {
      title: ogTitle,
      description: input.description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      type: input.type ?? 'website',
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
      ...(input.images?.length ? { images: input.images.map((src) => ({ url: src })) } : {}),
    },
    twitter: {
      card: input.images?.length ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: input.description,
      ...(input.images?.length ? { images: input.images } : {}),
    },
  };
}

/** Serialises JSON-LD for a <script> tag without allowing markup injection. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function siteSchema() {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${url}/#organization`,
        name: SITE.name,
        alternateName: SITE.nameEn,
        url,
        logo: absoluteUrl('/brand/logo-512.png'),
      },
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        name: SITE.name,
        alternateName: SITE.nameEn,
        url,
        inLanguage: 'bn-BD',
        publisher: { '@id': `${url}/#organization` },
      },
    ],
  };
}

// Titles that announce several different posts in one circular ("৬ পদে", "১০ ক্যাটাগরিতে",
// "বিভিন্ন পদে"). Google asks for one JobPosting per job, so these get no JobPosting.
const MULTI_ROLE_PATTERNS = [
  /বিভিন্ন\s*পদ/,
  /একাধিক\s*পদ/,
  /বহু\s*পদ/,
  /ক্যাটাগরি/,
  /[০-৯0-9]+\s*(?:টি\s*)?পদে/,
  /[০-৯0-9]+\s*টি\s*পদ/,
];

// Locations that describe "anywhere in the country" rather than a workplace.
const NON_SPECIFIC_LOCATIONS = /^(সারাদেশ|সারা\s*দেশ|বাংলাদেশ|দেশব্যাপী|বিভিন্ন\s*স্থান|উল্লেখ\s*নেই)$/;

export function isMultiRoleTitle(title: string): boolean {
  return MULTI_ROLE_PATTERNS.some((pattern) => pattern.test(title));
}

/**
 * JobPosting for a single, open job with a confirmed employer, workplace, exact
 * deadline and a real description. Returns null otherwise; the page itself is still
 * indexable with normal metadata.
 */
export function jobPostingSchema(job: JobDetail): Record<string, unknown> | null {
  const orgName = job.organization_name?.trim();
  if (!orgName || /dailyjobs|দৈনিক\s*চাকরি/i.test(orgName)) return null;

  const location = job.location?.trim();
  if (!location || NON_SPECIFIC_LOCATIONS.test(location)) return null;

  if (!job.deadline || job.deadline_precision !== 'exact') return null;
  const daysLeft = daysUntil(job.deadline);
  if (daysLeft === null || daysLeft < 0) return null;

  // The API has no position-level fields, so only headlines that name one post
  // ("… প্রধান অর্থনীতিবিদ পদে নিয়োগ") qualify. Headcount headlines such as
  // "… ২২ জন নিয়োগ" usually cover several posts and are left without markup.
  const title = job.title.trim();
  if (!/পদে/.test(title) || isMultiRoleTitle(title)) return null;

  const description = stripHtml(job.description);
  if (description.length < 120) return null;

  const posted = job.circular_published_date || job.published_at;
  if (!posted || isNaN(new Date(posted).getTime())) return null;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    // Same sanitised HTML the page shows, so schema and visible text match.
    description: sanitizeRichText(job.description ?? ''),
    datePosted: posted,
    validThrough: `${job.deadline}T23:59:59+06:00`,
    hiringOrganization: { '@type': 'Organization', name: orgName },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: location, addressCountry: 'BD' },
    },
  };

  if (job.vacancies && job.vacancies > 0) schema.totalJobOpenings = job.vacancies;

  return schema;
}
