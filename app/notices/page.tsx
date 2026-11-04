// File: app/notices/page.tsx
// নোটিশ, পরীক্ষার সময়সূচি ও রেজাল্ট — চাকরি থেকে আলাদা। প্রতিটির সাথে প্রতিষ্ঠান, তারিখ,
// অফিসিয়াল ওয়েবসাইট আর মূল নোটিশের লিংক। ডেটা না থাকলে কিছু বানিয়ে দেখানো হয় না।
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Icon from '@/components/Icon';
import Pagination from '@/components/Pagination';
import { getNotices, type GetNoticesParams } from '@/lib/api';
import { formatDateBn, isHttpUrl, parsePage, toBnDigits } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { pagedPath } from '@/lib/site';
import type { PublicNotice } from '@/types/notice';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 20;

const FILTERS: { key: string; label: string; params: Pick<GetNoticesParams, 'type' | 'kind'> }[] = [
  { key: 'all', label: 'সব', params: {} },
  { key: 'exam_schedule', label: 'পরীক্ষার সময়সূচি', params: { kind: 'exam_schedule' } },
  { key: 'viva', label: 'মৌখিক পরীক্ষা', params: { kind: 'viva' } },
  { key: 'admit_card', label: 'প্রবেশপত্র', params: { kind: 'admit_card' } },
  { key: 'result', label: 'রেজাল্ট', params: { type: 'result' } },
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  const pageSuffix = page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : '';
  return pageMetadata({
    title: `নোটিশ ও পরীক্ষার সময়সূচি${pageSuffix}`,
    description:
      'বিভিন্ন সরকারি প্রতিষ্ঠানের পরীক্ষার সময়সূচি, মৌখিক পরীক্ষা, প্রবেশপত্র ও ফলাফলের নোটিশ, প্রতিটির সাথে প্রতিষ্ঠানের নাম, তারিখ আর মূল নোটিশের লিংক। দৈনিক চাকরি কোনো সরকারি সংস্থা নয়।',
    path: pagedPath('/notices', page),
  });
}

function NoticeRow({ notice }: { notice: PublicNotice }) {
  const sourceUrl = isHttpUrl(notice.source_url) ? notice.source_url : null;
  const website = isHttpUrl(notice.official_website) ? notice.official_website : null;
  const pdf = isHttpUrl(notice.pdf_url) ? notice.pdf_url : null;

  return (
    <li id={`notice-${notice.id}`} className="scroll-mt-20 py-4">
      <p className="text-xs font-semibold text-brand-800">{notice.kind_label}</p>
      <h2 className="mt-0.5 font-serif text-base font-bold leading-snug text-ink sm:text-lg">{notice.title}</h2>

      <dl className="mt-1.5 grid gap-x-4 gap-y-0.5 text-sm text-ink-soft sm:grid-cols-2">
        {notice.organization_name && (
          <div>
            <dt className="inline text-muted">প্রকাশক: </dt>
            <dd className="inline">{notice.organization_name}</dd>
          </div>
        )}
        {notice.notice_date && (
          <div>
            <dt className="inline text-muted">নোটিশের তারিখ: </dt>
            <dd className="inline">{formatDateBn(notice.notice_date)}</dd>
          </div>
        )}
        {notice.event_date && (
          <div>
            <dt className="inline text-muted">পরীক্ষার তারিখ: </dt>
            <dd className="inline font-semibold text-ink">{formatDateBn(notice.event_date)}</dd>
          </div>
        )}
      </dl>

      {notice.body_text && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-brand-800 hover:underline">বিস্তারিত</summary>
          <p className="mt-1.5 whitespace-pre-line leading-relaxed text-ink-soft">{notice.body_text}</p>
        </details>
      )}

      <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-bold">
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 rounded-full bg-brand-800 px-3 py-1.5 text-white hover:bg-brand-700">
            {notice.notice_link_type === 'notice' ? 'মূল নোটিশ দেখুন' : 'প্রতিষ্ঠানের নোটিশ পাতা দেখুন'}
            <Icon name="external" className="h-3.5 w-3.5" />
          </a>
        )}
        {pdf && (
          <a href={pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-ink hover:border-brand-600">
            PDF
            <Icon name="external" className="h-3.5 w-3.5" />
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-ink hover:border-brand-600">
            {hostOf(website)}
            <Icon name="external" className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </li>
  );
}

export default async function NoticesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const filter = FILTERS.find((f) => f.key === sp.filter) ?? FILTERS[0];

  const res = await getNotices({ ...filter.params, page, per_page: PER_PAGE }).catch(() => null);
  const rows = res?.data ?? [];
  const meta = res?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE };

  const hrefFor = (p: number, key = filter.key) => {
    const params = new URLSearchParams();
    if (key !== 'all') params.set('filter', key);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/notices${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="container-page py-4 sm:py-5">
      <Breadcrumbs items={[{ name: 'নোটিশ ও পরীক্ষার সময়সূচি', path: '/notices' }]} />

      <header className="mt-2 max-w-3xl sm:mt-3">
        <h1 className="font-serif text-xl font-bold text-ink sm:text-2xl">নোটিশ ও পরীক্ষার সময়সূচি</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          নিয়োগ পরীক্ষার সময়সূচি, মৌখিক পরীক্ষা, প্রবেশপত্র ও ফলাফলের নোটিশ। প্রতিটির সাথে প্রকাশকারী প্রতিষ্ঠান, তারিখ আর মূল নোটিশের লিংক দেওয়া আছে।
        </p>
        <p className="mt-1 text-xs text-muted">দৈনিক চাকরি কোনো সরকারি সংস্থা নয়। পরীক্ষার আগে মূল নোটিশ মিলিয়ে নিন।</p>
      </header>

      <nav aria-label="নোটিশের ধরন" className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={hrefFor(1, f.key)}
            aria-current={f.key === filter.key ? 'page' : undefined}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
              f.key === filter.key ? 'bg-brand-800 text-white' : 'border border-line bg-surface text-ink hover:border-brand-600'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {res === null ? (
        <div className="mt-6 rounded-xl border border-line bg-stone-50 p-6 text-center">
          <p className="text-sm text-ink-soft">নোটিশ লোড হতে সমস্যা হয়েছে। কিছু সময় পর আবার চেষ্টা করুন।</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="এখনো কোনো নোটিশ নেই"
            body="নতুন পরীক্ষার সময়সূচি বা নোটিশ প্রকাশ হলে এখানে দেখা যাবে।"
            action={{ href: '/', label: 'চাকরির বিজ্ঞপ্তি দেখুন' }}
          />
        </div>
      ) : (
        <ol className="mt-4 divide-y divide-line/70 rounded-2xl border border-line bg-surface px-3.5 shadow-xs sm:px-5">
          {rows.map((n) => (
            <NoticeRow key={n.id} notice={n} />
          ))}
        </ol>
      )}

      {rows.length > 0 && <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={(p) => hrefFor(p)} />}
    </div>
  );
}
