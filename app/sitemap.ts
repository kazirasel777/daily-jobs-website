// File: app/sitemap.ts
// Only canonical, indexable pages. Jobs come from every page of the public API;
// if the API fails the sitemap answers with an error (crawlers retry later)
// instead of publishing a truncated or empty list. Rendered per request so a
// deploy never depends on the API being reachable at build time.
import type { MetadataRoute } from 'next';
import { getAllJobs, getCurrentAffairs, getJobCategories, getJobs, getStudyCollections, getStudyQuestions, getStudySubjects } from '@/lib/api';
import { absoluteUrl, jobPath } from '@/lib/site';
import { MIN_INDEXABLE_QUESTIONS } from '@/lib/study';

export const dynamic = 'force-dynamic';

function validDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function latest(dates: (Date | undefined)[]): Date | undefined {
  return dates.reduce<Date | undefined>((max, d) => (d && (!max || d > max) ? d : max), undefined);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, categories, subjects, collections, questionMeta, affairs] = await Promise.all([
    getAllJobs(),
    getJobCategories(),
    getStudySubjects(),
    getStudyCollections(),
    getStudyQuestions({ per_page: 1 }),
    getCurrentAffairs({ per_page: 1 }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Home: last change is the newest published job.
  entries.push({ url: absoluteUrl('/'), lastModified: latest(jobs.map((j) => validDate(j.published_at))) });

  // Categories with at least one active job (empty ones are noindex).
  const categoryCounts = await Promise.all(categories.map((c) => getJobs({ category: c.slug, per_page: 1 }).then((r) => r.meta.total)));
  categories.forEach((c, i) => {
    if (categoryCounts[i] === 0) return;
    const newest = latest(jobs.filter((j) => j.category?.slug === c.slug).map((j) => validDate(j.published_at)));
    entries.push({ url: absoluteUrl(`/category/${c.slug}`), ...(newest ? { lastModified: newest } : {}) });
  });

  for (const job of jobs) {
    const modified = validDate(job.updated_at) ?? validDate(job.published_at);
    entries.push({ url: absoluteUrl(jobPath(job)), ...(modified ? { lastModified: modified } : {}) });
  }

  // Study pages follow the same thresholds the pages use for their robots tag.
  if (questionMeta.meta.total >= MIN_INDEXABLE_QUESTIONS) entries.push({ url: absoluteUrl('/question-bank') });
  subjects
    .filter((s) => s.question_count >= MIN_INDEXABLE_QUESTIONS)
    .forEach((s) => entries.push({ url: absoluteUrl(`/question-bank/subject/${s.slug}`) }));
  collections
    .filter((c) => c.question_count >= MIN_INDEXABLE_QUESTIONS)
    .forEach((c) => entries.push({ url: absoluteUrl(`/question-bank/set/${c.slug}`) }));
  if (affairs.meta.total >= 10) {
    entries.push({ url: absoluteUrl('/current-affairs'), lastModified: validDate(affairs.data[0]?.affair_date) });
  }

  for (const path of ['/about', '/contact', '/privacy', '/disclaimer']) entries.push({ url: absoluteUrl(path) });

  return entries;
}
