// File: app/sources/page.tsx
// তথ্যের উৎস: ছোট ভূমিকা, তারপর প্রতিটি প্রকাশিত চাকরি এক সারিতে —
// #আইডি, শিরোনাম, উৎস (নাম · তারিখ · পৃষ্ঠা) আর সরাসরি লিংক থাকলে "মূল বিজ্ঞপ্তি দেখুন"।
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Icon from '@/components/Icon';
import JobSourceList, { visibleSources } from '@/components/JobSourceList';
import Pagination from '@/components/Pagination';
import { getSourceJobs } from '@/lib/api';
import { parsePage, toBnDigits } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { jobPath, pagedPath } from '@/lib/site';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 30;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' && v.trim() !== '' && v !== 'all' ? v.trim() : undefined;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const pageSuffix = page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : '';

  return pageMetadata({
    title: `তথ্যের উৎস${pageSuffix}`,
    description:
      'দৈনিক চাকরিতে প্রকাশিত প্রতিটি নিয়োগ বিজ্ঞপ্তির মূল উৎস: প্রতিষ্ঠানের ওয়েবসাইট, পত্রিকা বা ই-পেপারের নাম ও তারিখ, আর মূল বিজ্ঞপ্তির লিংক। দৈনিক চাকরি কোনো সরকারি সংস্থা নয়।',
    path: pagedPath('/sources', page),
  });
}

export default async function SourcesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  // category UI-তে নেই, তবে অ্যাপের লিংক (?category=govt_jobs) কাজ করে
  const category = str(sp.category);
  const query = str(sp.q);

  const res = await getSourceJobs({ category, q: query, page, per_page: PER_PAGE }).catch(() => null);
  const rows = res?.data ?? [];
  const meta = res?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE };

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (query) params.set('q', query);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/sources${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="container-page py-4 sm:py-5">
      <Breadcrumbs items={[{ name: 'তথ্যের উৎস', path: '/sources' }]} />

      <header className="mt-2 max-w-3xl sm:mt-3">
        <h1 className="font-serif text-xl font-bold text-ink sm:text-2xl">তথ্যের উৎস</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          আমরা বিভিন্ন প্রতিষ্ঠানের ওয়েবসাইট, পত্রিকা ও ই-পেপার থেকে নিয়োগ বিজ্ঞপ্তি খুঁজে এক জায়গায় প্রকাশ করি। নিচে প্রতিটি বিজ্ঞপ্তির মূল উৎস আর পাওয়া গেলে মূল বিজ্ঞপ্তির লিংক দেওয়া আছে।
        </p>
        <p className="mt-1 text-xs text-muted">দৈনিক চাকরি কোনো সরকারি সংস্থা নয়। আবেদনের আগে মূল বিজ্ঞপ্তি মিলিয়ে নিন।</p>
      </header>

      <form method="GET" action="/sources" className="mt-4 flex max-w-md gap-2" key={query ?? ''}>
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
            <Icon name="search" className="h-4 w-4" />
          </div>
          <input
            type="search"
            name="q"
            maxLength={100}
            defaultValue={query ?? ''}
            placeholder="চাকরি বা উৎসের নাম লিখুন"
            aria-label="চাকরি বা উৎসের নাম খুঁজুন"
            className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <button type="submit" className="cursor-pointer rounded-xl bg-brand-800 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700">
          খুঁজুন
        </button>
      </form>

      {res === null ? (
        <div className="mt-6 rounded-xl border border-line bg-stone-50 p-6 text-center">
          <p className="text-sm text-ink-soft">উৎসের তালিকা লোড হতে সমস্যা হয়েছে। কিছু সময় পর আবার চেষ্টা করুন।</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="কোনো উৎস পাওয়া যায়নি"
            body={query ? `"${query}" নামে কোনো চাকরি বা উৎস মেলেনি।` : 'এখনো কোনো চাকরির উৎস তালিকাভুক্ত হয়নি।'}
            action={{ href: '/sources', label: 'সব উৎস দেখুন' }}
          />
        </div>
      ) : (
        <ol className="mt-4 divide-y divide-line/70 rounded-2xl border border-line bg-surface px-3.5 shadow-xs sm:px-5">
          {rows.map((job) => (
            <li key={job.id} className="py-3.5">
              <p className="text-sm leading-snug sm:text-base">
                <span className="mr-1.5 font-mono text-xs font-semibold text-muted">#{toBnDigits(job.id)}</span>
                <Link href={jobPath(job)} className="font-serif font-bold text-ink break-words hover:text-brand-800 hover:underline">
                  {job.title}
                </Link>
              </p>
              <div className="mt-1.5">
                <JobSourceList sources={visibleSources(job.sources)} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {rows.length > 0 && <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={hrefFor} />}
    </div>
  );
}
