// File: app/sitemap.ts
// Only canonical, indexable pages. Jobs come from every page of the public API;
// if the API fails the sitemap answers with an error (crawlers retry later)
// instead of publishing a truncated or empty list. Rendered on demand with Next.js
// data caching (15-minute bounded revalidation) so a deploy never depends on the
// API being reachable at build time.
import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import {
  getAllJobs,
  getCurrentAffairs,
  getJobCategoriesSafe,
  getStudyCollections,
  getStudyQuestions,
  getStudySubjects,
} from '@/lib/api';
import {
  fetchLiveStudySitemapData,
  generateSitemapWithResilience,
  handleSitemapRoute,
  resolveStudySitemapData,
  SITEMAP_REVALIDATE_SECONDS,
  MAX_STALE_AGE_MS,
  MemoryCacheAdapter,
  type SitemapPayload,
  type StudySitemapData,
} from '@/lib/sitemap-builder';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

// Process-local L1 cache for the running instance (fallback within worker)
const processCache = new MemoryCacheAdapter();

// Framework-supported durable cache for study metadata.
// Persisted across serverless instances and cold starts in the Next.js Data Cache.
const getFrameworkCachedStudyData = unstable_cache(
  async (): Promise<StudySitemapData> => {
    return fetchLiveStudySitemapData({
      fetchStudySubjects: getStudySubjects,
      fetchStudyCollections: getStudyCollections,
      fetchStudyQuestions: () => getStudyQuestions({ per_page: 1 }),
      fetchCurrentAffairs: () => getCurrentAffairs({ per_page: 1 }),
    });
  },
  ['dailyjobs-study-sitemap-framework-v3'],
  {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: ['study-sitemap'],
  }
);

async function getStudyDataWithFallback(): Promise<StudySitemapData> {
  return resolveStudySitemapData({
    fetchLiveStudy: getFrameworkCachedStudyData,
    cache: processCache,
    maxStaleAgeMs: MAX_STALE_AGE_MS,
  });
}

async function generateProductionSitemap(): Promise<SitemapPayload> {
  return generateSitemapWithResilience({
    fetchJobs: getAllJobs,
    fetchCategories: getJobCategoriesSafe,
    fetchStudyData: getStudyDataWithFallback,
    cache: processCache,
    siteUrl: getSiteUrl(),
    maxStaleAgeMs: MAX_STALE_AGE_MS,
  });
}

// Framework-supported durable cache for the sitemap payload.
// Returns SitemapPayload containing entries and the original successful generatedAt timestamp.
const getCachedSitemap = unstable_cache(
  async (): Promise<SitemapPayload> => {
    return generateProductionSitemap();
  },
  ['dailyjobs-sitemap-payload-v4'],
  {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: ['sitemap'],
  }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Validates age against MAX_STALE_AGE_MS before returning the response
  return handleSitemapRoute({
    fetchPayload: getCachedSitemap,
    maxStaleAgeMs: MAX_STALE_AGE_MS,
  });
}
