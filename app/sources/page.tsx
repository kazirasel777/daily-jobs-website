// File: app/sources/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Icon from '@/components/Icon';
import Pagination from '@/components/Pagination';
import { getJobCategories, getJobSources } from '@/lib/api';
import { parsePage, toBnDigits } from '@/lib/format';
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

function roleBadge(role: string): { label: string; bg: string; text: string } {
  switch (role) {
    case 'original_notice':
      return { label: 'মূল বিজ্ঞপ্তি / গেজেট', bg: 'bg-brand-50', text: 'text-brand-800' };
    case 'issuing_authority':
      return { label: 'নিয়োগকারী প্রতিষ্ঠান', bg: 'bg-emerald-50', text: 'text-emerald-800' };
    case 'discovery_source':
      return { label: 'পত্রিকা / প্রচার মাধ্যম', bg: 'bg-amber-50', text: 'text-amber-800' };
    default:
      return { label: 'তথ্যসূত্র', bg: 'bg-stone-100', text: 'text-stone-700' };
  }
}

function sourceLinkLabel(role?: string | null, type?: string | null): string {
  if (role === 'original_notice') {
    return 'মূল সার্কুলার / নোটিশ লিংক';
  }
  if (role === 'issuing_authority') {
    return 'নিয়োগকারী প্রতিষ্ঠানের ওয়েবসাইট';
  }
  if (type === 'newspaper' || type === 'epaper') {
    return 'সংবাদপত্র / অনলাইন সংস্করণ লিংক';
  }
  return 'উৎস ওয়েবসাইট লিংক';
}

function sourceFallbackLabel(type?: string | null, role?: string | null): string {
  switch (type) {
    case 'newspaper':
      return 'প্রিন্ট সংবাদপত্র / মুদ্রিত সংস্করণ';
    case 'epaper':
      return 'ই-পেপার সংস্করণ';
    case 'official_notice':
      return 'অফিসিয়াল নোটিশ বোর্ড / মুদ্রিত গেজেট';
    default:
      return role === 'issuing_authority'
        ? 'প্রতিষ্ঠান নোটিশ বোর্ড'
        : 'মুদ্রিত বা অফলাইন বিজ্ঞপ্তি';
  }
}

export default async function SourcesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const selectedCategory = typeof sp.category === 'string' && sp.category !== 'all' ? sp.category : undefined;
  const query = typeof sp.q === 'string' ? sp.q : undefined;

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

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ name: 'তথ্যের উৎস', path: '/sources' }]} />

      <header className="mt-4">
        <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
          তথ্যের উৎস ও প্রকাশনা ডিরেক্টরি
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          দৈনিক চাকরিতে প্রকাশিত চাকরির তথ্যের স্বচ্ছতা নিশ্চিত করতে মূল সরকারি নোটিশ পোর্টাল, নিয়োগকারী প্রতিষ্ঠান ও সংবাদপত্রের সরাসরি তালিকা।
        </p>
      </header>

      {/* সরকারি তথ্য বিষয়ক স্বচ্ছতা ও স্বাতন্ত্র্য ঘোষণা */}
      <section aria-label="সরকারি তথ্যের স্বচ্ছতা ঘোষণা" className="mt-4 rounded-xl border border-line bg-brand-50/40 p-4 text-xs leading-relaxed text-ink-soft">
        <p>
          <strong className="font-semibold text-ink">স্বচ্ছতা ও স্বাতন্ত্র্য ঘোষণা:</strong> দৈনিক চাকরি (DailyJobs.bd) কোনো সরকারি প্রতিষ্ঠান বা রাজনৈতিক দলের প্রতিনিধিত্ব করে না এবং সরকারের সাথে কোনো আনুষ্ঠানিক বা চুক্তিভিত্তিক সংযুক্তি নেই। চাকরিপ্রার্থীদের সুবিধার্থে উন্মুক্ত সরকারি পোর্টাল, অফিসিয়াল সার্কুলার বোর্ড ও স্বনামধন্য দৈনিক পত্রিকা থেকে তথ্য সংগ্রহ করে মূল উৎসের বিবরণসহ উপস্থাপন করা হয়। যেকোনো পদে আবেদনের পূর্বে সংশ্লিষ্ট প্রতিষ্ঠানের মূল বিজ্ঞপ্তি যাচাই করার পরামর্শ দেওয়া হলো।
        </p>
      </section>

      {/* ক্যাটাগরি ফিল্টার */}
      <nav aria-label="উৎস ক্যাটাগরি ফিল্টার" className="mt-6 flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <Link
          href={selectedCategory ? '/sources' : '#'}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            !selectedCategory
              ? 'bg-brand-800 text-white'
              : 'bg-surface text-ink-soft hover:bg-line/50 hover:text-ink'
          }`}
        >
          সকল উৎস
        </Link>
        <Link
          href="/sources?category=govt_jobs"
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            selectedCategory === 'govt_jobs'
              ? 'bg-brand-800 text-white'
              : 'bg-surface text-ink-soft hover:bg-line/50 hover:text-ink'
          }`}
        >
          🏛️ সরকারি চাকরি
        </Link>
        {categories
          .filter((c) => c.slug !== 'govt_jobs')
          .map((cat) => (
            <Link
              key={cat.slug}
              href={`/sources?category=${cat.slug}`}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-brand-800 text-white'
                  : 'bg-surface text-ink-soft hover:bg-line/50 hover:text-ink'
              }`}
            >
              {cat.name}
            </Link>
          ))}
      </nav>

      {/* সোর্স তালিকা (কমপ্যাক্ট ভিউ) */}
      {sourcesRes === null ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink-soft">উৎস তালিকা লোড হতে সমস্যা হয়েছে। অনুগ্রহ করে কিছু সময় পর আবার চেষ্টা করুন।</p>
          <Link href="/sources" className="mt-3 inline-block rounded-xl bg-brand-800 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700">
            পুনরায় চেষ্টা করুন
          </Link>
        </div>
      ) : sources.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="কোনো উৎস পাওয়া যায়নি"
            body="এই ক্যাটাগরিতে বর্তমানে কোনো অনুমোদিত পাবলিক সোর্স তালিকাভুক্ত নেই।"
            action={{ href: '/sources', label: 'সব উৎস দেখুন' }}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-stone-50/70 text-xs font-semibold text-muted">
                  <tr>
                    <th scope="col" className="w-12 py-3 pl-4 pr-2 text-center">#</th>
                    <th scope="col" className="py-3 px-4">উৎসের নাম</th>
                    <th scope="col" className="w-44 py-3 px-4">ধরন / ভূমিকা</th>
                    <th scope="col" className="w-72 py-3 pl-4 pr-6">উৎসের লিংক</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {sources.map((item, index) => {
                    const badge = roleBadge(item.source_role);
                    const rowNum = (meta.current_page - 1) * PER_PAGE + index + 1;
                    return (
                      <tr key={`${item.source_name}-${rowNum}`} className="transition-colors hover:bg-brand-50/20">
                        <td className="py-3 pl-4 pr-2 text-center text-xs font-medium text-muted">
                          {toBnDigits(rowNum)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-ink">
                          <div className="flex items-center gap-2">
                            <span>{item.source_name}</span>
                            {item.is_verified && (
                              <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                ✓ যাচাইকৃত
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 pl-4 pr-6 text-xs">
                          {item.source_url ? (
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                            >
                              <span>{sourceLinkLabel(item.source_role, item.source_type)}</span>
                              <Icon name="external" className="h-3 w-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-muted">
                              {sourceFallbackLabel(item.source_type, item.source_role)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Compact List View */}
            <ul className="divide-y divide-line/70 md:hidden">
              {sources.map((item, index) => {
                const badge = roleBadge(item.source_role);
                const rowNum = (meta.current_page - 1) * PER_PAGE + index + 1;
                return (
                  <li key={`${item.source_name}-${rowNum}`} className="p-3.5 transition-colors hover:bg-brand-50/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-xs font-medium text-muted shrink-0 pt-0.5">{toBnDigits(rowNum)}.</span>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-ink break-words leading-snug">{item.source_name}</span>
                          {item.is_verified && (
                            <span className="ml-1.5 inline-block rounded bg-emerald-50 px-1 py-0.2 text-[10px] font-bold text-emerald-700 align-middle">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium self-start ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-1.5 pl-5 text-xs">
                      {item.source_url ? (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline break-all"
                        >
                          <span>{sourceLinkLabel(item.source_role, item.source_type)}</span>
                          <Icon name="external" className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted">
                          {sourceFallbackLabel(item.source_type, item.source_role)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            hrefFor={hrefFor}
          />
        </>
      )}
    </div>
  );
}
