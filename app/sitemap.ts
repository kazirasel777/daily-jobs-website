// File: app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getJobCategories, getJobs } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dailyjobs.bd';

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/question-bank`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/current-affairs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  let categoryUrls: MetadataRoute.Sitemap = [];
  try {
    const categories = await getJobCategories();
    categoryUrls = categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    }));
  } catch (err) {
    console.error('[Sitemap Categories Error]:', err);
  }

  const jobUrls: MetadataRoute.Sitemap = [];
  try {
    let currentPage = 1;
    let lastPage = 1;
    const MAX_PAGES_TO_FETCH = 20; // Safe cap (up to 1,000 published jobs)

    do {
      const jobsRes = await getJobs({
        page: currentPage,
        per_page: 50, // Strict maximum accepted by Laravel public API
      });

      const items = jobsRes.data || [];
      lastPage = jobsRes.meta?.last_page || 1;

      for (const job of items) {
        jobUrls.push({
          url: `${baseUrl}/job/${job.slug || job.id}`,
          lastModified: job.published_at ? new Date(job.published_at) : new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        });
      }

      currentPage++;
    } while (currentPage <= lastPage && currentPage <= MAX_PAGES_TO_FETCH);
  } catch (err) {
    console.error('[Sitemap Jobs Error]:', err);
  }

  return [...staticUrls, ...categoryUrls, ...jobUrls];
}