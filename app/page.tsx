// File: app/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Icon from '@/components/Icon';
import JobCard from '@/components/JobCard';
import Pagination from '@/components/Pagination';
import SearchForm from '@/components/SearchForm';
import DeadlineBadge from '@/components/DeadlineBadge';
import { getJobCategories, getJobs } from '@/lib/api';
import { daysUntil, formatDateBn, parsePage, toBnDigits, toBnNumber } from '@/lib/format';
import { SITE, jobPath, pagedPath } from '@/lib/site';
import { jsonLd, pageMetadata, siteSchema } from '@/lib/seo';

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
  const [closingSource, recentRes, categoryCounts] = isFirstPage
    ? await Promise.all([
        getJobs({ page: 1, per_page: 50 }),
        getJobs({ recently_added: true, per_page: 1 }),
        Promise.all(categories.map((c) => getJobs({ category: c.slug, per_page: 1 }).then((r) => r.meta.total))),
      ])
    : [null, null, [] as number[]];

  const closingAll = (closingSource?.data ?? [])
    .map((job) => ({ job, days: daysUntil(job.deadline) }))
    .filter((x): x is { job: typeof x.job; days: number } => x.days !== null && x.days >= 0 && x.days <= 3)
    .sort((a, b) => a.days - b.days);
  const closingSoon = closingAll.slice(0, 5);
  // The count is only exact when every active job fitted in the 50 fetched above.


  return (
    <>
      {isFirstPage && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteSchema()) }} />}

      {isFirstPage ? (
        <section className="border-b border-line bg-surface">
          <div className="container-page flex items-center justify-between gap-8 py-7 sm:py-8">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-snug text-ink sm:text-[2rem]">আপনার পরবর্তী চাকরির খবর, এক জায়গায়</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">সরকারি ও বেসরকারি নিয়োগ বিজ্ঞপ্তি, মূল সার্কুলার এবং আবেদনের তথ্য।</p>
              <div className="mt-5 max-w-2xl"><SearchForm /></div>
            </div>
            <dl className="hidden shrink-0 gap-7 text-sm lg:flex">
              <div><dd className="text-3xl font-bold text-brand-700">{toBnNumber(jobsRes.meta.total)}</dd><dt className="mt-1 text-xs text-muted">সক্রিয় বিজ্ঞপ্তি</dt></div>
              {recentRes && recentRes.meta.total > 0 && <div><dd className="text-3xl font-bold text-brand-700">{toBnNumber(recentRes.meta.total)}</dd><dt className="mt-1 text-xs text-muted">গত ৪৮ ঘণ্টায় নতুন</dt></div>}
            </dl>
          </div>
        </section>
      ) : (
        <section className="border-b border-line bg-surface">
          <div className="container-page py-8">
            <p className="eyebrow">পৃষ্ঠা {toBnDigits(page)}</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-ink sm:text-3xl">সর্বশেষ চাকরির বিজ্ঞপ্তি</h1>
          </div>
        </section>
      )}

      {isFirstPage && categories.length > 0 && (
        <section aria-labelledby="cat-heading" className="container-page pt-6">
          <h2 id="cat-heading" className="sr-only">বিভাগ অনুযায়ী দেখুন</h2>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c, i) => (
              <li key={c.slug} className="shrink-0">
                <Link
                  href={`/category/${c.slug}`}
                  className="card flex h-full shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 transition-colors hover:border-brand-600 hover:bg-brand-50"
                >
                  <span className="font-semibold text-ink">{c.name}</span>
                  <span className="text-xs text-muted">
                    {categoryCounts[i] !== undefined ? `${toBnNumber(categoryCounts[i])}টি বিজ্ঞপ্তি` : 'দেখুন'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="container-page grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
        <section aria-labelledby="latest-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="latest-heading" className="font-serif text-xl font-bold text-ink">
              {isFirstPage ? 'সর্বশেষ চাকরির বিজ্ঞপ্তি' : `পৃষ্ঠা ${toBnDigits(page)} / ${toBnDigits(jobsRes.meta.last_page)}`}
            </h2>
            <span className="text-sm text-muted">মোট {toBnNumber(jobsRes.meta.total)}টি</span>
          </div>

          {jobsRes.data.length > 0 ? (
            <div className="space-y-4">
              {jobsRes.data.map((job) => (
                <JobCard key={job.id} job={job} headingLevel="h3" />
              ))}
            </div>
          ) : (
            <div className="card px-6 py-12 text-center text-muted">এই মুহূর্তে কোনো সক্রিয় বিজ্ঞপ্তি প্রকাশিত নেই।</div>
          )}

          <Pagination currentPage={page} lastPage={jobsRes.meta.last_page} hrefFor={(p) => pagedPath('/', p)} />
        </section>

        <aside className="space-y-6">
          {closingSoon.length > 0 && (
            <section aria-labelledby="closing-heading" className="card p-5">
              <h2 id="closing-heading" className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
                <Icon name="clock" className="h-5 w-5 text-alert-600" />
                শেষ সময় ঘনিয়ে এসেছে
              </h2>
              <ul className="mt-3 divide-y divide-line">
                {closingSoon.map(({ job }) => (
                  <li key={job.id} className="py-3">
                    <Link href={jobPath(job)} className="block text-sm font-semibold leading-6 text-ink hover:text-brand-700">
                      {job.title}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <DeadlineBadge deadline={job.deadline} />
                      <span>{formatDateBn(job.deadline)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card overflow-hidden">
            <div className="bg-brand-900 p-5 text-white">
              <Icon name="book" className="h-6 w-6 text-marigold-300" />
              <h2 className="mt-2 font-serif text-lg font-bold">প্রশ্নব্যাংক</h2>
              <p className="mt-1 text-sm text-brand-100">বিসিএস ও অন্যান্য নিয়োগ পরীক্ষার প্রশ্ন, সঠিক উত্তর ও ব্যাখ্যা বিষয়ভিত্তিকভাবে পড়ুন।</p>
            </div>
            <div className="flex flex-col gap-2 p-5 text-sm">
              <Link href="/question-bank" className="font-bold text-brand-700 hover:underline">প্রশ্নব্যাংক খুলুন →</Link>
              <Link href="/current-affairs" className="font-bold text-brand-700 hover:underline">সাম্প্রতিক সাধারণ জ্ঞান →</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-marigold-300 bg-marigold-50 p-5 text-sm text-marigold-900">
            <h2 className="flex items-center gap-2 font-bold">
              <Icon name="alert" className="h-4 w-4" />
              আবেদনের আগে জেনে নিন
            </h2>
            <p className="mt-2 leading-6">
              দৈনিক চাকরি কোনো নিয়োগকারী প্রতিষ্ঠান নয়। আবেদন সবসময় নিয়োগকারীর নির্ধারিত ওয়েবসাইট বা ঠিকানায় করুন এবং মূল বিজ্ঞপ্তি মিলিয়ে নিন।
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
