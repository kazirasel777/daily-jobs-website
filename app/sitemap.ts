// File: app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getJobCategories, getJobs } from '@/lib/api';

export const dynamic = 'force-dynamic';

function parseValidDate(dateValue?: string | null): Date | undefined {
  if (!dateValue) return undefined;
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dailyjobs.bd';

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/question-bank`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/current-affairs`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  let categoryUrls: MetadataRoute.Sitemap = [];
  try {
    const categories = await getJobCategories();
    categoryUrls = categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
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
    const MAX_PAGES_SAFETY_CAP = 100; // Safe upper bound (up to 5,000 published jobs)
    let latestJobDate: Date | undefined;

    do {
      const jobsRes = await getJobs({
        page: currentPage,
        per_page: 50, // Strict maximum accepted by Laravel public API
      });

      const items = jobsRes.data || [];
      lastPage = jobsRes.meta?.last_page || 1;

      for (const job of items) {
        const rawDate = job.updated_at || job.published_at;
        const validDate = parseValidDate(rawDate);

        if (validDate && (!latestJobDate || validDate > latestJobDate)) {
          latestJobDate = validDate;
        }

        const entry: MetadataRoute.Sitemap[number] = {
          url: `${baseUrl}/job/${job.slug || job.id}`,
        };

        if (validDate) {
          entry.lastModified = validDate;
        }

        jobUrls.push(entry);
      }

      currentPage++;
    } while (currentPage <= lastPage && currentPage <= MAX_PAGES_SAFETY_CAP);

    if (lastPage > MAX_PAGES_SAFETY_CAP) {
      console.warn(`[Sitemap Warning] Total pages (${lastPage}) exceeded safety cap (${MAX_PAGES_SAFETY_CAP}). Consider partitioning into a sitemap index.`);
    }

    // If we have a latest job timestamp, use it as homepage lastModified
    if (latestJobDate && staticUrls[0]) {
      staticUrls[0].lastModified = latestJobDate;
    }
  } catch (err) {
    console.error('[Sitemap Jobs Error]:', err);
  }

  return [...staticUrls, ...categoryUrls, ...jobUrls];
}