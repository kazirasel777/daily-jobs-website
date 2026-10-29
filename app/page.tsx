// File: app/page.tsx
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import HomeView from '@/components/home/HomeView';
import '@/components/home/home.css';

import { getJobCategories, getJobs } from '@/lib/api';
import { daysUntil, parsePage, toBnDigits } from '@/lib/format';
import { SITE, pagedPath } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 12;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  if (page > 1) {
    return pageMetadata({
      title: `সর্বশেষ চাকরির বিজ্ঞপ্তি — পৃষ্ঠা ${toBnDigits(page)}`,
      description: `দৈনিক চাকরিতে প্রকাশিত সক্রিয় নিয়োগ বিজ্ঞপ্তির তালিকা, পৃষ্ঠা ${toBnDigits(page)}। প্রতিটি বিজ্ঞপ্তিতে আবেদনের শেষ তারিখ, পদসংখ্যা ও কর্মস্থল দেখুন।`,
      path: pagedPath('/', page),
    });
  }
  return pageMetadata({
    title: `${SITE.name} | আজকের সরকারি, ব্যাংক ও বেসরকারি চাকরির বিজ্ঞপ্তি`,
    absoluteTitle: true,
    description: SITE.description,
    path: '/',
  });
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Legacy URLs: the old home page carried search and category filters as parameters.
  const legacyQuery = typeof params.q === 'string' ? params.q : typeof params.search === 'string' ? params.search : '';
  if (legacyQuery.trim()) {
    permanentRedirect(`/search?q=${encodeURIComponent(legacyQuery.trim())}`);
  }
  if (typeof params.category === 'string' && /^[a-z0-9_-]{1,100}$/.test(params.category) && params.category !== 'all') {
    permanentRedirect(`/category/${params.category}`);
  }

  const page = parsePage(params.page);

  const [jobsRes, categories] = await Promise.all([
    getJobs({ page, per_page: PER_PAGE }),
    getJobCategories(),
  ]);

  if (page > 1 && page > jobsRes.meta.last_page) notFound();

  const isFirstPage = page === 1;

  // Front-page extras are only fetched for page 1.
  const [closingSource, categoryCounts] = isFirstPage
    ? await Promise.all([
        getJobs({ page: 1, per_page: 50 }),
        Promise.all(categories.map((c) => getJobs({ category: c.slug, per_page: 1 }).then((r) => r.meta.total))),
      ])
    : [null, [] as number[]];

  const closingAll = (closingSource?.data ?? [])
    .map((job) => ({ job, days: daysUntil(job.deadline) }))
    .filter((x): x is { job: typeof x.job; days: number } => x.days !== null && x.days >= 0 && x.days <= 3)
    .sort((a, b) => a.days - b.days);
  const closingSoon = closingAll.slice(0, 3);

  return (
    <HomeView
      categories={categories}
      totalJobs={jobsRes.meta.total}
      categoryCounts={categoryCounts}
      jobsRes={jobsRes}
      page={page}
      closingSoon={closingSoon}
      isSiteSchemaNeeded={isFirstPage}
    />
  );
}
