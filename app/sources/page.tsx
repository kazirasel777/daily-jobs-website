// File: app/sources/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Icon, { type IconName } from '@/components/Icon';
import Pagination from '@/components/Pagination';
import { getJobCategories, getJobSources } from '@/lib/api';
import { parsePage, toBnDigits, toBnNumber, formatDateBn } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { pagedPath } from '@/lib/site';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 30;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const category = typeof sp.category === 'string' ? sp.category : undefined;

  const pageSuffix = page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : '';
  const catSuffix = category === 'govt_jobs' ? ' (সরকারি চাকরি)' : '';

  return pageMetadata({
    title: `তথ্যের উৎস ও প্রকাশনা ডিরেক্টরি${catSuffix}${pageSuffix}`,
    description: 'দৈনিক চাকরিতে প্রকাশিত সরকারি ও অন্যান্য নিয়োগ বিজ্ঞপ্তির মূল উৎস, অফিশিয়াল সরকারি পোর্টাল ও পত্রিকার তালিকা।',
    path: pagedPath('/sources', page),
  });
}

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function sourceTypeBadge(type: string): { label: string; icon: IconName; bg: string; text: string; border: string } {
  switch (type) {
    case 'newspaper':
      return { label: 'পত্রিকা', icon: 'file', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' };
    case 'epaper':
      return { label: 'ই-পেপার', icon: 'file', bg: 'bg-sky-50', text: 'text-sky-900', border: 'border-sky-200' };
    case 'official_notice':
      return { label: 'অফিসিয়াল নোটিশ', icon: 'building', bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200' };
    case 'website':
      return { label: 'ওয়েবসাইট', icon: 'spark', bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' };
    case 'social':
      return { label: 'সোশ্যাল মিডিয়া', icon: 'users', bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' };
    default:
      return { label: 'তথ্যমাধ্যম', icon: 'book', bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-200' };
  }
}

function sourceRoleLabel(role: string): string {
  switch (role) {
    case 'original_notice':
      return 'মূল বিজ্ঞপ্তি';
    case 'issuing_authority':
      return 'নিয়োগকারী প্রতিষ্ঠান';
    case 'discovery_source':
      return 'প্রচার মাধ্যম';
    default:
      return 'তথ্যসূত্র';
  }
}

export default async function SourcesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const selectedCategory = typeof sp.category === 'string' && sp.category !== 'all' && sp.category.trim() !== '' ? sp.category : undefined;
  const query = typeof sp.q === 'string' && sp.q.trim() !== '' ? sp.q.trim() : undefined;

  const [categories, sourcesRes] = await Promise.all([
    getJobCategories().catch(() => []),
    getJobSources({
      category: selectedCategory,
      q: query,
      page,
      per_page: PER_PAGE,
    }).catch(() => null),
  ]);

  const sources = sourcesRes?.data ?? [];
  const meta = sourcesRes?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE };

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (query) params.set('q', query);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/sources${qs ? `?${qs}` : ''}`;
  };

  const hasActiveFilters = Boolean(query || selectedCategory);

  return (
    <div className="container-page py-4 sm:py-5">
      <Breadcrumbs items={[{ name: 'তথ্যের উৎস', path: '/sources' }]} />

      {/* কমপ্যাক্ট শিরোনাম ও কাউন্ট */}
      <header className="mt-2 sm:mt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="eyebrow inline-block text-xs">তথ্যের স্বচ্ছতা</span>
            <h1 className="font-serif text-xl font-bold text-ink sm:text-2xl">
              তথ্যের উৎস
            </h1>
          </div>
          {sourcesRes !== null && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
              <span>
                {hasActiveFilters ? 'ফলাফল: ' : 'মোট: '}
                <strong className="font-bold text-ink">{toBnNumber(meta.total)}টি</strong>
              </span>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs sm:text-sm text-muted">
          বিজ্ঞপ্তি, পত্রিকা ও ওয়েবসাইটের সরাসরি তথ্যসূত্র।
        </p>
      </header>

      {/* সংক্ষিপ্ত স্বাতন্ত্র্য ঘোষণা */}
      <section aria-label="সরকারি তথ্যের স্বচ্ছতা ঘোষণা" className="mt-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink-soft shadow-2xs">
        <p>
          <strong className="font-semibold text-ink">ঘোষণা:</strong> দৈনিক চাকরি কোনো সরকারি সংস্থার প্রতিনিধিত্ব করে না। আবেদনের আগে সংশ্লিষ্ট প্রতিষ্ঠানের মূল বিজ্ঞপ্তি যাচাই করুন।
        </p>
      </section>

      {/* ডিরেক্টরি প্যানেল */}
      <div className="mt-3.5 rounded-2xl border border-line bg-surface p-3.5 sm:p-5 shadow-xs">
        {/* সমন্বিত অনুসন্ধান ও ক্যাটাগরি ফিল্টার ফর্ম */}
        <form method="GET" action="/sources" className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-6">
            <label htmlFor="source-search-input" className="block text-xs font-bold text-ink-soft mb-1">
              উৎসের নাম অনুসন্ধান
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
                placeholder="সোর্সের নাম লিখুন (যেমন: কুয়েট, বিপিএসসি...)"
                aria-label="সোর্সের নাম অনুসন্ধান"
                className="w-full rounded-xl border border-line bg-paper/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="source-category-select" className="block text-xs font-bold text-ink-soft mb-1">
              চাকরির বিভাগ
            </label>
            <select
              id="source-category-select"
              name="category"
              defaultValue={selectedCategory ?? ''}
              aria-label="চাকরির বিভাগ নির্বাচন করুন"
              className="w-full rounded-xl border border-line bg-paper/50 py-2 px-3 text-xs sm:text-sm text-ink focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
            >
              <option value="">সকল চাকরির বিভাগ</option>
              <option value="govt_jobs">🏛️ সরকারি চাকরি</option>
              {categories
                .filter((c) => c.slug !== 'govt_jobs')
                .map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-800 py-2 px-4 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition-colors cursor-pointer"
            >
              খুঁজুন
            </button>
            {hasActiveFilters && (
              <Link
                href="/sources"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-surface py-2 px-3 text-xs font-medium text-muted hover:border-brand-600 hover:text-ink transition-colors"
                title="ফিল্টার রিসেট করুন"
              >
                রিসেট
              </Link>
            )}
          </div>
        </form>

        {/* কনটেন্ট ও সোর্স তালিকা */}
        {sourcesRes === null ? (
          <div className="mt-6 rounded-xl border border-line bg-stone-50 p-6 text-center">
            <p className="text-sm text-ink-soft">উৎস তালিকা লোড হতে সমস্যা হয়েছে। অনুগ্রহ করে কিছু সময় পর আবার চেষ্টা করুন।</p>
            <Link href="/sources" className="mt-3 inline-block rounded-xl bg-brand-800 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700">
              পুনরায় চেষ্টা করুন
            </Link>
          </div>
        ) : sources.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="কোনো তথ্যসূত্র পাওয়া যায়নি"
              body={
                query
                  ? `"${query}" অনুসন্ধানের সাথে এই বিভাগে কোনো উৎস মেলেনি। ফিল্টার রিসেট করে পুনরায় চেষ্টা করুন।`
                  : 'এই ক্যাটাগরিতে বর্তমানে কোনো অনুমোদিত পাবলিক সোর্স তালিকাভুক্ত নেই।'
              }
              action={{ href: '/sources', label: 'সব উৎস দেখুন' }}
            />
          </div>
        ) : (
          <div className="mt-4 border-t border-line/70">
            {/* দেখানো ফলাফলের রেঞ্জ */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs text-muted border-b border-line/60">
              <span>
                প্রদর্শিত:{' '}
                <strong className="font-semibold text-ink">
                  {toBnDigits((meta.current_page - 1) * PER_PAGE + 1)}–{toBnDigits(Math.min((meta.current_page - 1) * PER_PAGE + sources.length, meta.total))}
                </strong>{' '}
                (মোট {toBnNumber(meta.total)}টির মধ্যে)
              </span>
              {query && (
                <span>
                  অনুসন্ধান: <strong className="text-ink">"{query}"</strong>
                </span>
              )}
            </div>

            <div className="divide-y divide-line/70">
              {sources.map((item, index) => {
                const typeBadge = sourceTypeBadge(item.source_type);
                const roleLabel = sourceRoleLabel(item.source_role);
                const domain = extractDomain(item.source_url);
                const rowNum = (meta.current_page - 1) * PER_PAGE + index + 1;

                return (
                  <article
                    key={`${item.source_name}-${rowNum}`}
                    className="py-3 sm:py-3.5 transition-colors hover:bg-brand-50/15"
                  >
                    <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                      {/* বাম পাশ: টাইপ আইকন, নাম ও মেটাডাটা */}
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {/* মাধ্যম আইকন অ্যাভাটার */}
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${typeBadge.border} ${typeBadge.bg} ${typeBadge.text} shadow-2xs`}
                          title={typeBadge.label}
                        >
                          <Icon name={typeBadge.icon} className="h-3.5 w-3.5" />
                        </div>

                        {/* সোর্স বিবরণ */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-mono font-semibold text-muted">
                              {toBnDigits(rowNum)}.
                            </span>
                            <h2 className="font-serif text-sm sm:text-base font-bold text-ink break-words leading-snug">
                              {item.source_name}
                            </h2>
                            {item.is_verified && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200"
                                title="প্রশাসনিকভাবে যাচাইকৃত"
                              >
                                <Icon name="check" className="h-3 w-3" />
                                <span>যাচাইকৃত</span>
                              </span>
                            )}
                          </div>

                          {/* ব্যাজ ও মেটা তথ্য (বাংলা মাপ minimum text-xs / 12px) */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                            {/* মাধ্যমের ধরন */}
                            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium border ${typeBadge.border} ${typeBadge.bg} ${typeBadge.text}`}>
                              {typeBadge.label}
                            </span>

                            {/* ভূমিকা */}
                            <span className="font-medium text-ink-soft">
                              {roleLabel}
                            </span>

                            <span className="text-stone-300" aria-hidden="true">•</span>

                            {/* সর্বশেষ নথিভুক্ত তারিখ */}
                            <span title="বিজ্ঞপ্তি নথিভুক্তির সর্বশেষ প্রাপ্ত তারিখ">
                              সর্বশেষ নথিভুক্ত:{' '}
                              <strong className="font-semibold text-ink">
                                {item.latest_date ? formatDateBn(item.latest_date) : '—'}
                              </strong>
                            </span>

                            {/* সংশ্লিষ্ট ক্যাটাগরি */}
                            {item.categories.length > 0 && (
                              <>
                                <span className="text-stone-300" aria-hidden="true">•</span>
                                <span className="text-muted">
                                  {item.categories.map((c) => c.name).join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ডান পাশ: আসল ডোমেইন লিংক ও অ্যাকশন */}
                      <div className="pl-10.5 md:pl-0 shrink-0 self-start md:self-center">
                        {item.source_url ? (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex max-w-full items-center gap-1.5 rounded-xl border border-line bg-paper/60 px-3 py-1.5 text-xs font-semibold text-brand-800 shadow-2xs hover:border-brand-600 hover:bg-brand-50 hover:text-brand-900 transition-all cursor-pointer"
                          >
                            {domain && (
                              <>
                                <span className="font-mono text-[11px] text-muted group-hover:text-brand-800 transition-colors break-all">
                                  {domain}
                                </span>
                                <span className="text-stone-300" aria-hidden="true">|</span>
                              </>
                            )}
                            <span className="shrink-0">উৎস খুলুন</span>
                            <Icon
                              name="external"
                              className="h-3 w-3 shrink-0 text-brand-600 group-hover:translate-x-0.5 transition-transform"
                            />
                          </a>
                        ) : (
                          <span className="inline-flex items-center rounded-xl border border-line/70 bg-stone-50 px-2.5 py-1 text-xs text-muted">
                            অনলাইন লিংক নেই
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* তারিখ সংক্রান্ত স্বচ্ছতা ফুটনোট */}
            <p className="mt-3 text-xs text-muted leading-relaxed">
              * নোট: "সর্বশেষ নথিভুক্ত" হলো সংশ্লিষ্ট বিজ্ঞপ্তি বা সোর্সের সিস্টেমে প্রাপ্ত সর্বশেষ প্রকাশের তথ্য; এটি সব ক্ষেত্রে পত্রিকার নির্দিষ্ট দিনের ইস্যু তারিখের নিশ্চয়তা নির্দেশ করে না।
            </p>
          </div>
        )}

        {/* প্যাজিনেশন */}
        {sources.length > 0 && (
          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            hrefFor={hrefFor}
          />
        )}
      </div>
    </div>
  );
}
