// File: app/sources/page.tsx
// তথ্যের উৎস: প্রতিটি প্রকাশিত চাকরি আর তার পাতায় দেখানো হুবহু একই উৎস।
// উৎস আসে অ্যাডমিন প্যানেলে প্রতিটি চাকরির জন্য দেওয়া তথ্য থেকে (API: /sources/jobs)।
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Icon from '@/components/Icon';
import JobSourceList, { visibleSources } from '@/components/JobSourceList';
import Pagination from '@/components/Pagination';
import { getJobCategories, getSourceJobs, type SourceGroup } from '@/lib/api';
import { parsePage, toBnDigits, toBnNumber } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { jobPath, pagedPath } from '@/lib/site';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 30;

const GROUPS: Array<{ key: SourceGroup | ''; label: string }> = [
  { key: '', label: 'সব উৎস' },
  { key: 'official', label: 'অফিশিয়াল বিজ্ঞপ্তি ও ওয়েবসাইট' },
  { key: 'newspaper', label: 'সংবাদপত্র' },
  { key: 'epaper', label: 'ই-পেপার' },
  { key: 'saved_image', label: 'সংরক্ষিত বিজ্ঞপ্তির ছবি' },
];

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' && v.trim() !== '' && v !== 'all' ? v.trim() : undefined;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const pageSuffix = page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : '';
  const catSuffix = sp.category === 'govt_jobs' ? ' (সরকারি চাকরি)' : '';

  return pageMetadata({
    title: `তথ্যের উৎস: প্রতিটি বিজ্ঞপ্তি কোথায় প্রকাশিত${catSuffix}${pageSuffix}`,
    description:
      'দৈনিক চাকরিতে প্রকাশিত প্রতিটি নিয়োগ বিজ্ঞপ্তির উৎস: প্রতিষ্ঠানের বিজ্ঞপ্তি পেজ বা ওয়েবসাইট, সংবাদপত্র ও ই-পেপারের নাম, তারিখ ও পৃষ্ঠা। দৈনিক চাকরি কোনো সরকারি সংস্থা নয়।',
    path: pagedPath('/sources', page),
  });
}

export default async function SourcesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const category = str(sp.category);
  const query = str(sp.q);
  const groupParam = str(sp.group);
  const group = GROUPS.some((g) => g.key === groupParam) ? (groupParam as SourceGroup) : undefined;
  const verified = sp.verified === '1';

  const [categories, res] = await Promise.all([
    getJobCategories().catch(() => []),
    getSourceJobs({ category, q: query, group, verified, page, per_page: PER_PAGE }).catch(() => null),
  ]);

  const rows = res?.data ?? [];
  const meta = res?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE };

  const hrefWith = (over: { page?: number; group?: string | undefined; verified?: boolean }) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (query) params.set('q', query);
    const g = 'group' in over ? over.group : group;
    if (g) params.set('group', g);
    if (over.verified ?? verified) params.set('verified', '1');
    if (over.page && over.page > 1) params.set('page', String(over.page));
    const qs = params.toString();
    return `/sources${qs ? `?${qs}` : ''}`;
  };

  const hasFilters = Boolean(query || category || group || verified);

  return (
    <div className="container-page py-4 sm:py-5">
      <Breadcrumbs items={[{ name: 'তথ্যের উৎস', path: '/sources' }]} />

      <header className="mt-2 sm:mt-3">
        <span className="eyebrow inline-block text-xs">তথ্যের স্বচ্ছতা</span>
        <h1 className="font-serif text-xl font-bold text-ink sm:text-2xl">তথ্যের উৎস</h1>
        <p className="mt-1 text-sm text-ink-soft">
          এখানে প্রতিটি প্রকাশিত চাকরির বিজ্ঞপ্তি কোথায় প্রকাশিত হয়েছে তা দেখানো হয়: প্রকাশকের নাম, প্রকাশের তারিখ, পত্রিকা হলে পৃষ্ঠা নম্বর, আর মূল লিংক থাকলে সেটি। চাকরির পাতার নিচেও হুবহু একই তথ্য থাকে।
        </p>
      </header>

      {/* বাটনগুলোর মানে */}
      <section aria-label="উৎসের বাটনের মানে" className="mt-3 grid gap-2 text-xs leading-relaxed text-ink-soft sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface px-3 py-2">
          <strong className="block text-ink">মূল বিজ্ঞপ্তি দেখুন</strong>
          নিয়োগকারী প্রতিষ্ঠানের ওয়েবসাইটে বিজ্ঞপ্তির পেজ বা PDF খোলে।
        </div>
        <div className="rounded-xl border border-line bg-surface px-3 py-2">
          <strong className="block text-ink">প্রকাশনার উৎস দেখুন</strong>
          যে সংবাদপত্র বা ই-পেপারের পাতায় বিজ্ঞপ্তিটি ছাপা হয়েছে সেটি খোলে।
        </div>
        <div className="rounded-xl border border-line bg-surface px-3 py-2">
          <strong className="block text-ink">সংরক্ষিত বিজ্ঞপ্তি দেখুন</strong>
          অনলাইন লিংক নেই; পত্রিকার নাম, তারিখ ও পৃষ্ঠা দেওয়া থাকে, আর আমাদের সংরক্ষিত বিজ্ঞপ্তির ছবি খোলে। এটি কোনো সরকারি ওয়েবসাইট নয়।
        </div>
      </section>

      <p className="mt-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink-soft">
        <strong className="font-semibold text-ink">ঘোষণা:</strong> দৈনিক চাকরি কোনো সরকারি সংস্থার প্রতিনিধিত্ব করে না। &ldquo;✓ যাচাইকৃত&rdquo; চিহ্ন থাকে শুধু সেই উৎসে, যা আমরা মূল বিজ্ঞপ্তির সাথে মিলিয়ে দেখেছি। আবেদনের আগে মূল বিজ্ঞপ্তি মিলিয়ে নিন।
      </p>

      <div className="mt-3.5 rounded-2xl border border-line bg-surface p-3.5 shadow-xs sm:p-5">
        {/* ধরন অনুযায়ী ভাগ */}
        <nav aria-label="উৎসের ধরন" className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => {
            const active = (group ?? '') === g.key;
            return (
              <Link
                key={g.key || 'all'}
                href={hrefWith({ group: g.key || undefined })}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? 'border-brand-800 bg-brand-800 text-white' : 'border-line bg-paper/60 text-ink-soft hover:border-brand-600'
                }`}
              >
                {g.label}
              </Link>
            );
          })}
        </nav>

        <form
          key={`${category ?? 'all'}-${query ?? ''}-${group ?? ''}-${verified}`}
          method="GET"
          action="/sources"
          className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-end"
        >
          {group && <input type="hidden" name="group" value={group} />}
          <div className="sm:col-span-5">
            <label htmlFor="source-search-input" className="mb-1 block text-xs font-bold text-ink-soft">
              চাকরি বা উৎসের নাম
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                <Icon name="search" className="h-4 w-4" />
              </div>
              <input
                id="source-search-input"
                type="search"
                name="q"
                maxLength={100}
                defaultValue={query ?? ''}
                placeholder="যেমন: বিপিএসসি, প্রথম আলো"
                className="w-full rounded-xl border border-line bg-paper/50 py-2 pl-9 pr-3 text-xs text-ink placeholder:text-muted focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="source-category-select" className="mb-1 block text-xs font-bold text-ink-soft">
              চাকরির বিভাগ
            </label>
            <select
              id="source-category-select"
              name="category"
              defaultValue={category ?? ''}
              className="w-full cursor-pointer rounded-xl border border-line bg-paper/50 px-3 py-2 text-xs text-ink focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:text-sm"
            >
              <option value="">সকল চাকরির বিভাগ</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 sm:col-span-3">
            <label className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-soft">
              <input type="checkbox" name="verified" value="1" defaultChecked={verified} className="h-3.5 w-3.5" />
              শুধু যাচাইকৃত
            </label>
            <button
              type="submit"
              className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-brand-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-700"
            >
              খুঁজুন
            </button>
          </div>
        </form>

        {res === null ? (
          <div className="mt-6 rounded-xl border border-line bg-stone-50 p-6 text-center">
            <p className="text-sm text-ink-soft">উৎস তালিকা লোড হতে সমস্যা হয়েছে। কিছু সময় পর আবার চেষ্টা করুন।</p>
            <Link href="/sources" className="mt-3 inline-block rounded-xl bg-brand-800 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700">
              পুনরায় চেষ্টা করুন
            </Link>
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="কোনো উৎস পাওয়া যায়নি"
              body={hasFilters ? 'এই ফিল্টারে কোনো চাকরির উৎস মেলেনি। ফিল্টার বদলে আবার চেষ্টা করুন।' : 'এখনো কোনো চাকরির উৎস তালিকাভুক্ত হয়নি।'}
              action={{ href: '/sources', label: 'সব উৎস দেখুন' }}
            />
          </div>
        ) : (
          <div className="mt-4 border-t border-line/70">
            <p className="border-b border-line/60 py-2 text-xs text-muted">
              মোট <strong className="font-semibold text-ink">{toBnNumber(meta.total)}টি</strong> চাকরির উৎস
              {meta.last_page > 1 && <> · পৃষ্ঠা {toBnDigits(meta.current_page)}/{toBnDigits(meta.last_page)}</>}
            </p>

            <ol className="divide-y divide-line/70">
              {rows.map((job) => {
                const sources = visibleSources(job.sources);
                return (
                  <li key={job.id} className="py-3.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-mono text-xs font-semibold text-muted">চাকরি #{toBnDigits(job.id)}</span>
                      <Link href={jobPath(job)} className="font-serif text-sm font-bold leading-snug text-ink break-words hover:text-brand-800 hover:underline sm:text-base">
                        {job.title}
                      </Link>
                    </div>
                    {(job.organization_name || job.category) && (
                      <p className="mt-0.5 text-xs text-muted">
                        {[job.organization_name, job.category?.name].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <div className="mt-2 rounded-xl border border-line/70 bg-paper/40 px-3 py-2">
                      <JobSourceList sources={sources} compact />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {rows.length > 0 && (
          <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={(p) => hrefWith({ page: p })} />
        )}
      </div>
    </div>
  );
}
