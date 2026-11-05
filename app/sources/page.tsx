// File: app/sources/page.tsx
// তথ্যের উৎস: পাঠকের জন্য পরিচ্ছন্ন কার্ড; অভ্যন্তরীণ ID শুধু key/route-এ থাকে।
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Icon from '@/components/Icon';
import { visibleSources } from '@/components/JobSourceList';
import Pagination from '@/components/Pagination';
import { getSourceJobs } from '@/lib/api';
import { formatDateBn, isHttpUrl, parsePage, toBnDigits } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { jobPath, pagedPath } from '@/lib/site';
import type { PublicJobSource } from '@/types/job';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 30;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' && v.trim() !== '' && v !== 'all' ? v.trim() : undefined;
}

function sourceUrl(value: string | null | undefined): string | null {
  return isHttpUrl(value) ? value : null;
}

function sourceHost(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function SourceIcon({ print = false }: { print?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true" focusable="false">
      {print ? (
        <>
          <path d="M5 4h15v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8h2zM5 8v10M9 8h7M9 12h7M9 16h5" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3 12h18" />
        </>
      )}
    </svg>
  );
}

function noticeButtonLabel(src: PublicJobSource): string {
  if (src.button_label && (src as { notice_link_type?: string | null }).notice_link_type) {
    return src.button_label;
  }
  const linkType = (src as { notice_link_type?: string | null }).notice_link_type;
  if (linkType === 'notice') return 'মূল বিজ্ঞপ্তি দেখুন';
  if (linkType === 'website') return 'অফিসিয়াল ওয়েবসাইট দেখুন';
  return src.button_label || 'প্রতিষ্ঠানের নিয়োগ পাতা দেখুন';
}

// Kept local: the shared source display on job detail pages is unchanged.
function SourceCardRow({ source }: { source: PublicJobSource }) {
  const print = source.source_type === 'newspaper' || source.source_type === 'epaper';
  const nameUrl = sourceUrl(source.name_url === undefined ? source.source_url : source.name_url);
  const noticeUrl = sourceUrl(source.notice_url ?? (source.link_kind && source.link_kind !== 'none' ? source.button_url : null));
  // For print sources, name_url belongs to the newspaper, not the employer.
  // Never use it as the institution website or as a substitute notice button.
  const website = sourceUrl(source.website_url) ?? (print ? null : nameUrl);
  const date = source.publication_date ? formatDateBn(source.publication_date) : null;
  const printedPage = print ? source.printed_page?.trim() : null;
  const page = printedPage
    ? toBnDigits(printedPage.startsWith('পৃষ্ঠা') ? printedPage : `পৃষ্ঠা ${printedPage}`)
    : null;
  const actionLabel = source.button_label || noticeButtonLabel(source);
  const sourceType = print ? 'পত্রিকা / ই-পেপার' : 'অফিসিয়াল ওয়েবসাইট';
  const buttonClass = 'inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-brand-800 transition-colors hover:border-brand-600 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

  return (
    <li className="flex min-w-0 flex-wrap items-center gap-x-[18px] gap-y-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-relaxed">
        <span
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${print ? 'bg-marigold-50 text-marigold-700' : 'bg-brand-50 text-brand-700'}`}
          title={sourceType}
        >
          <SourceIcon print={print} />
          <span className="sr-only">{sourceType}: </span>
        </span>
        <span className="text-xs text-muted">প্রকাশিত:</span>
        <span className="font-bold text-brand-800 [overflow-wrap:anywhere]">{source.source_name}</span>
        {date && (
          <>
            <span aria-hidden="true" className="text-line-strong">·</span>
            <time dateTime={source.publication_date ?? undefined} aria-label={`প্রকাশের তারিখ: ${date}`} className="font-semibold whitespace-nowrap text-ink-soft">{date}</time>
          </>
        )}
        {page && (
          <>
            <span aria-hidden="true" className="text-line-strong">·</span>
            <span className="font-semibold whitespace-nowrap text-ink-soft">{page}</span>
          </>
        )}
      </div>

      {(website || noticeUrl) && (
        <div className="flex flex-wrap items-center gap-2">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              title={`নিয়োগকারী প্রতিষ্ঠানের ওয়েবসাইট: ${sourceHost(website) ?? website}`}
              className={`${buttonClass} border-brand-200 bg-surface`}
            >
              <SourceIcon />প্রতিষ্ঠানের ওয়েবসাইট<Icon name="external" className="h-3 w-3" />
            </a>
          )}
          {noticeUrl && (
            <a
              href={noticeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonClass} border-brand-200 bg-brand-50/60`}
            >
              {actionLabel}<Icon name="external" className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </li>
  );
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
        <ol className="mt-4 space-y-2.5">
          {rows.map((job) => (
            <li key={job.id} className="rounded-xl border border-line bg-surface px-3.5 py-3.5 shadow-xs sm:px-[18px] sm:py-[15px]">
              <h2 className="text-sm leading-relaxed sm:text-[15px]">
                <Link href={jobPath(job)} className="font-serif font-bold text-ink break-words hover:text-brand-800 hover:underline">
                  {job.title}
                </Link>
              </h2>
              <ul className="mt-2.5 space-y-3">
                {visibleSources(job.sources).map((source) => <SourceCardRow key={source.id} source={source} />)}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {rows.length > 0 && <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={hrefFor} />}
    </div>
  );
}
