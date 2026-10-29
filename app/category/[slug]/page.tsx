// File: app/category/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomeView from '@/components/home/HomeView';
import { getJobCategories, getJobs } from '@/lib/api';
import { parsePage, toBnDigits } from '@/lib/format';
import { pagedPath } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import type { JobCategory } from '@/types/job';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 12;

/** Short reader-facing introductions for the categories that exist in the admin panel. */
const INTROS: Record<string, string> = {
  govt_jobs: 'মন্ত্রণালয়, অধিদপ্তর, জেলা প্রশাসন, বিশ্ববিদ্যালয় ও রাষ্ট্রায়ত্ত প্রতিষ্ঠানের নিয়োগ বিজ্ঞপ্তি।',
  bank_jobs: 'সরকারি ও বেসরকারি ব্যাংক এবং আর্থিক প্রতিষ্ঠানের নিয়োগ বিজ্ঞপ্তি।',
  private_jobs: 'বেসরকারি কোম্পানি ও প্রতিষ্ঠানের নিয়োগ বিজ্ঞপ্তি।',
  defense_jobs: 'সেনা, নৌ ও বিমানবাহিনীসহ প্রতিরক্ষা ও বাহিনীর ভর্তি ও নিয়োগ বিজ্ঞপ্তি।',
  ngo_education: 'এনজিও, স্কুল-কলেজ ও শিক্ষাপ্রতিষ্ঠানের নিয়োগ বিজ্ঞপ্তি।',
  other_jobs: 'অন্য বিভাগে না পড়া প্রতিষ্ঠানের নিয়োগ বিজ্ঞপ্তি।',
};

async function findCategory(slug: string): Promise<JobCategory | undefined> {
  const categories = await getJobCategories();
  return categories.find((c) => c.slug === slug);
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { slug } = await params;
  const page = parsePage((await searchParams).page);
  const category = await findCategory(slug);
  if (!category) return { title: 'বিভাগ পাওয়া যায়নি' };

  const pageSuffix = page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : '';
  const intro = INTROS[category.slug] ?? `${category.name} বিভাগের নিয়োগ বিজ্ঞপ্তি।`;
  // An empty category is still useful to visitors but has nothing worth indexing.
  const { meta } = await getJobs({ category: category.slug, page, per_page: PER_PAGE });
  return pageMetadata({
    index: meta.total > 0,
    title: `${category.name}: নিয়োগ বিজ্ঞপ্তি${pageSuffix}`,
    description: `${intro} প্রতিটি বিজ্ঞপ্তিতে আবেদনের শেষ তারিখ, পদসংখ্যা, কর্মস্থল ও আবেদনের নিয়ম দেখুন।`,
    path: pagedPath(`/category/${category.slug}`, page),
  });
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const page = parsePage((await searchParams).page);

  const categories = await getJobCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const [jobsRes, allJobsRes, categoryCounts] = await Promise.all([
    getJobs({ category: category.slug, page, per_page: PER_PAGE }),
    getJobs({ page: 1, per_page: 1 }), // Site-wide total active jobs for sidebar
    Promise.all(categories.map((c) => getJobs({ category: c.slug, per_page: 1 }).then((r) => r.meta.total))),
  ]);

  if (page > 1 && page > jobsRes.meta.last_page) notFound();

  return (
    <HomeView
      categories={categories}
      totalJobs={allJobsRes.meta.total}
      categoryCounts={categoryCounts}
      jobsRes={jobsRes}
      page={page}
      selectedCategory={category}
    />
  );
}
