// File: app/category/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import JobCard from '@/components/JobCard';
import Pagination from '@/components/Pagination';
import { getJobCategories, getJobs } from '@/lib/api';
import { parsePage, toBnDigits, toBnNumber } from '@/lib/format';
import { pagedPath } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import type { JobCategory } from '@/types/job';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 20;

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

  const category = await findCategory(slug);
  if (!category) notFound();

  const jobsRes = await getJobs({ category: category.slug, page, per_page: PER_PAGE });
  if (page > 1 && page > jobsRes.meta.last_page) notFound();

  const basePath = `/category/${category.slug}`;

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-7 sm:py-9">
          <Breadcrumbs items={[{ name: category.name, path: basePath }]} />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-[1.75rem] font-bold text-ink sm:text-4xl">
                {category.name}
                {page > 1 && <span className="ml-2 text-lg font-semibold text-muted">— পৃষ্ঠা {toBnDigits(page)}</span>}
              </h1>
              <p className="mt-2 max-w-2xl text-ink-soft">{INTROS[category.slug] ?? `${category.name} বিভাগের নিয়োগ বিজ্ঞপ্তি।`}</p>
            </div>
            <p className="rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-800">
              সক্রিয় বিজ্ঞপ্তি <strong className="font-serif text-xl">{toBnNumber(jobsRes.meta.total)}</strong>টি
            </p>
          </div>
        </div>
      </section>

      <div className="container-page max-w-4xl pt-8">
        {jobsRes.data.length > 0 ? (
          <div className="space-y-3">
            {jobsRes.data.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="file"
            title="এই বিভাগে এখন কোনো সক্রিয় বিজ্ঞপ্তি নেই"
            body="নতুন বিজ্ঞপ্তি প্রকাশিত হলে এখানে দেখা যাবে। ততক্ষণ অন্য বিভাগের সর্বশেষ বিজ্ঞপ্তি দেখতে পারেন।"
            action={{ href: '/', label: 'সর্বশেষ সব বিজ্ঞপ্তি' }}
          />
        )}
        <Pagination currentPage={page} lastPage={jobsRes.meta.last_page} hrefFor={(p) => pagedPath(basePath, p)} />
      </div>
    </>
  );
}
