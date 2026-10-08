// File: app/search/page.tsx
// Internal search results: useful for readers, never indexed (noindex, follow).
import type { Metadata } from 'next';
import Link from 'next/link';
import JobCard from '@/components/JobCard';
import Pagination from '@/components/Pagination';
import SearchForm from '@/components/SearchForm';
import EmptyState from '@/components/EmptyState';
import { getJobCategories, getJobs } from '@/lib/api';
import { parsePage, toBnNumber } from '@/lib/format';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export const metadata: Metadata = {
  title: 'চাকরি খুঁজুন',
  description: 'পদের নাম বা প্রতিষ্ঠানের নাম লিখে সক্রিয় চাকরির বিজ্ঞপ্তি খুঁজুন।',
  robots: { index: false, follow: true },
  alternates: { canonical: '/search' },
};

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const page = parsePage(params.page);

  const [results, categories] = await Promise.all([
    q ? getJobs({ q, page, per_page: 20 }) : Promise.resolve(null),
    getJobCategories(),
  ]);

  const hrefFor = (p: number) => `/search?q=${encodeURIComponent(q)}${p > 1 ? `&page=${p}` : ''}`;

  return (
    <div className="container-page max-w-4xl py-8 sm:py-10">
      <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">{q ? 'অনুসন্ধানের ফল' : 'চাকরি খুঁজুন'}</h1>
      <div className="mt-5">
        <SearchForm defaultValue={q} autoFocus={!q} />
      </div>

      {results ? (
        <section className="mt-8" aria-live="polite">
          <p className="mb-4 text-sm text-muted">
            “{q}” লিখে {toBnNumber(results.meta.total)}টি সক্রিয় বিজ্ঞপ্তি পাওয়া গেছে
          </p>
          {results.data.length > 0 ? (
            <div className="space-y-3">
              {results.data.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          ) : (
            <EmptyState
              icon="search"
              title="মিলে যাওয়া কোনো সক্রিয় বিজ্ঞপ্তি নেই"
              body="বানান বদলে বা ছোট শব্দে আবার খুঁজুন। অনুসন্ধান পদের শিরোনাম ও প্রতিষ্ঠানের নামে কাজ করে।"
              action={{ href: '/', label: 'সর্বশেষ বিজ্ঞপ্তি দেখুন' }}
            />
          )}
          <Pagination currentPage={results.meta.current_page} lastPage={results.meta.last_page} hrefFor={hrefFor} />
        </section>
      ) : (
        categories.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-lg font-bold text-ink">অথবা বিভাগ বেছে নিন</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="inline-block rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-soft hover:border-brand-600 hover:text-brand-700">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      )}
    </div>
  );
}
