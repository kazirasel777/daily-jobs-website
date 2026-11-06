// File: app/old-jobs/page.tsx
// পুরোনো (মেয়াদোত্তীর্ণ) বিজ্ঞপ্তির তালিকা — শুধু ওয়েবসাইটে। একবার প্রকাশিত চাকরি, শেষ তারিখ থেকে
// অ্যাডমিন-নির্ধারিত দিন (ডিফল্ট ১৮০) পর্যন্ত; শেষ তারিখ নতুন আগে। প্রতিটি সারি একই পুরোনো URL-এ যায়।
// ফিল্টার করা URL noindex ও সাইটম্যাপের বাইরে; মূল তালিকা ও তার পৃষ্ঠাগুলো index-যোগ্য।
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { getJobCategoriesSafe, getOldJobs, type OldJobsResponse } from '@/lib/api';
import { formatDateBn, parsePage, toBnDigits, toBnNumber } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { jobPath } from '@/lib/site';
import type { JobListItem } from '@/types/job';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 20;
const BASE = '/old-jobs';

function categoryParam(raw: string | string[] | undefined): string | undefined {
  return typeof raw === 'string' && /^[a-z0-9_-]{1,100}$/.test(raw) ? raw : undefined;
}

function hrefFor(page: number, category?: string): string {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `${BASE}${qs ? `?${qs}` : ''}`;
}

async function load(page: number, category?: string): Promise<OldJobsResponse | null> {
  return getOldJobs({ page, per_page: PER_PAGE, category }).catch(() => null);
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const category = categoryParam(sp.category);
  const res = await load(page, category);
  const pageSuffix = page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : '';

  return pageMetadata({
    // ক্যাটাগরি-ফিল্টার বা খালি তালিকা index নয়; মূল তালিকা ও তার পৃষ্ঠা (self-canonical) index-যোগ্য
    index: !category && (res?.data.length ?? 0) > 0,
    title: `পুরোনো চাকরির বিজ্ঞপ্তি${pageSuffix}`,
    description:
      'আবেদনের সময় শেষ হয়েছে এমন সরকারি, ব্যাংক ও বেসরকারি নিয়োগ বিজ্ঞপ্তির তালিকা — প্রতিষ্ঠান, পদ ও শেষ তারিখসহ। পুরোনো বিজ্ঞপ্তির তথ্য ও মূল ছবি রেফারেন্সের জন্য রাখা হয়েছে।',
    path: hrefFor(page, category),
  });
}

function OldJobRow({ job }: { job: JobListItem }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted">
          {[job.organization_name, job.category?.name].filter(Boolean).join(' · ')}
        </p>
        <h2 className="mt-0.5 font-serif text-base font-bold leading-snug text-ink sm:text-lg">
          <Link href={jobPath(job)} className="hover:text-brand-700 hover:underline">
            {job.title}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          {job.deadline ? <>আবেদনের শেষ তারিখ ছিল {formatDateBn(job.deadline)}</> : 'আবেদনের সময় শেষ'}
          {job.vacancies !== null && job.vacancies > 0 && <> · পদসংখ্যা {toBnNumber(job.vacancies)}</>}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-ink-soft">মেয়াদ শেষ</span>
    </li>
  );
}

export default async function OldJobsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const category = categoryParam(sp.category);

  const [res, categories] = await Promise.all([load(page, category), getJobCategoriesSafe()]);
  const rows = res?.data ?? [];
  const meta = res?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE };
  const days = res?.meta.listing_days;
  const selected = categories.find((c) => c.slug === category);

  if (res && page > 1 && page > meta.last_page) notFound();

  return (
    <div className="container-page py-4 sm:py-5">
      <Breadcrumbs items={[{ name: 'পুরোনো বিজ্ঞপ্তি', path: BASE }]} />

      <header className="mt-2 max-w-3xl sm:mt-3">
        <h1 className="font-serif text-xl font-bold text-ink sm:text-2xl">
          পুরোনো চাকরির বিজ্ঞপ্তি{selected ? ` — ${selected.name}` : ''}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          এই বিজ্ঞপ্তিগুলোর আবেদনের সময় শেষ হয়েছে{days ? ` (শেষ তারিখ থেকে ${toBnDigits(days)} দিনের মধ্যে)` : ''}। তথ্য, মূল বিজ্ঞপ্তির ছবি ও উৎস রেফারেন্সের জন্য রাখা হয়েছে — এখানে আবেদন করা যাবে না।
        </p>
        <p className="mt-2 text-sm">
          <Link href={selected ? `/category/${selected.slug}` : '/'} className="font-bold text-brand-800 hover:underline">
            {selected ? `${selected.name}: এখন আবেদন করা যায় এমন বিজ্ঞপ্তি →` : 'এখন আবেদন করা যায় এমন বিজ্ঞপ্তি দেখুন →'}
          </Link>
        </p>
      </header>

      {categories.length > 0 && (
        <nav aria-label="বিভাগ অনুযায়ী পুরোনো বিজ্ঞপ্তি" className="mt-4 flex flex-wrap gap-2">
          {[{ slug: '', name: 'সব' }, ...categories].map((c) => {
            const active = (c.slug || undefined) === category;
            return (
              <Link
                key={c.slug || 'all'}
                href={hrefFor(1, c.slug || undefined)}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                  active ? 'bg-brand-800 text-white' : 'border border-line bg-surface text-ink hover:border-brand-600'
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </nav>
      )}

      {res === null ? (
        <div className="mt-6 rounded-xl border border-line bg-stone-50 p-6 text-center">
          <p className="text-sm text-ink-soft">পুরোনো বিজ্ঞপ্তি লোড হতে সমস্যা হয়েছে। কিছু সময় পর আবার চেষ্টা করুন।</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="এই তালিকায় এখন কোনো বিজ্ঞপ্তি নেই"
            body="সক্রিয় বিজ্ঞপ্তিগুলো প্রথম পাতায় দেখুন।"
            action={{ href: '/', label: 'সক্রিয় বিজ্ঞপ্তি দেখুন' }}
          />
        </div>
      ) : (
        <ol className="mt-4 divide-y divide-line/70 rounded-2xl border border-line bg-surface px-3.5 shadow-xs sm:px-5">
          {rows.map((job) => (
            <OldJobRow key={job.id} job={job} />
          ))}
        </ol>
      )}

      {rows.length > 0 && (
        <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={(p) => hrefFor(p, category)} />
      )}
    </div>
  );
}
