// File: app/notices/page.tsx
// নোটিশ, পরীক্ষার সময়সূচি, প্রবেশপত্র, মৌখিক পরীক্ষা ও ফলাফল — চাকরি থেকে আলাদা।
// প্রতিটি কার্ড নোটিশের নিজস্ব পাতায় (/notices/{slug}) নেয়; অফিসিয়াল লিংক সেখানে।
// SEO: ফিল্টার ছাড়া পাতাগুলো (?page=N সহ) self-canonical ও ইনডেক্সযোগ্য; ফিল্টার করা দৃশ্য noindex, follow।
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import NoticeCard from '@/components/notices/NoticeCard';
import NoticeHashRedirect from '@/components/notices/NoticeHashRedirect';
import { getNotices, type GetNoticesParams } from '@/lib/api';
import { formatDateBn, parsePage, toBnDigits } from '@/lib/format';
import { eventState, noticeTone } from '@/lib/notice';
import { pageMetadata } from '@/lib/seo';
import { noticePath } from '@/lib/site';
import type { PublicNotice } from '@/types/notice';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 18;

const NOTICE_FILTERS: { key: string; label: string; heading: string; params: Pick<GetNoticesParams, 'type' | 'kind'> }[] = [
  { key: 'all', label: 'সব', heading: 'নোটিশ, পরীক্ষার সময়সূচি ও ফলাফল', params: {} },
  { key: 'exam_schedule', label: 'পরীক্ষার সময়সূচি', heading: 'পরীক্ষার সময়সূচি', params: { kind: 'exam_schedule' } },
  { key: 'admit_card', label: 'প্রবেশপত্র', heading: 'প্রবেশপত্রের নোটিশ', params: { kind: 'admit_card' } },
  { key: 'viva', label: 'মৌখিক পরীক্ষা', heading: 'মৌখিক পরীক্ষার (ভাইভা) সময়সূচি', params: { kind: 'viva' } },
  { key: 'result', label: 'ফলাফল', heading: 'নিয়োগ পরীক্ষার ফলাফল', params: { type: 'result' } },
  { key: 'general', label: 'অন্যান্য নোটিশ', heading: 'অন্যান্য নোটিশ', params: { kind: 'general' } },
];

function filterFrom(raw: string | string[] | undefined) {
  return NOTICE_FILTERS.find((f) => f.key === raw) ?? NOTICE_FILTERS[0];
}

function hrefFor(page: number, key: string): string {
  const params = new URLSearchParams();
  if (key !== 'all') params.set('filter', key);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/notices${qs ? `?${qs}` : ''}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const filter = filterFrom(sp.filter);
  const unknownParam = Object.keys(sp).some((k) => k !== 'page' && k !== 'filter');
  const pageSuffix = page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : '';
  const meta = pageMetadata({
    title: `${filter.heading}${pageSuffix}`,
    description:
      'সরকারি নিয়োগ পরীক্ষার সময়সূচি, প্রবেশপত্র, মৌখিক পরীক্ষা ও ফলাফলের নোটিশ — প্রতিষ্ঠান, তারিখ, সময়, কেন্দ্র আর মূল নোটিশের লিংকসহ। দৈনিক চাকরি কোনো সরকারি সংস্থা নয়।',
    path: hrefFor(page, filter.key),
    // ফিল্টার করা দৃশ্য মূল তালিকারই উপসেট: লিংক অনুসরণযোগ্য, কিন্তু আলাদা করে ইনডেক্স নয়
    index: filter.key === 'all' && !unknownParam,
  });
  return { ...meta, alternates: { ...meta.alternates, types: { 'application/rss+xml': '/notices/feed.xml' } } };
}

function UpcomingStrip({ items }: { items: PublicNotice[] }) {
  if (items.length === 0) return null;
  return (
    <section className="nx-upcoming" aria-labelledby="upcoming-heading">
      <div className="nx-upcoming-head">
        <h2 id="upcoming-heading">আসন্ন পরীক্ষা ও ভাইভা</h2>
        <p>কাছের তারিখ আগে</p>
      </div>
      <ol>
        {items.map((n) => {
          const [day, month] = formatDateBn(n.event_date).split(' ');
          const state = eventState(n);
          return (
            <li key={n.id} className={`nx-tone-${noticeTone(n)}`}>
              <div className="nx-up">
                <span className="nx-cal" aria-hidden="true">
                  <small>{month}</small>
                  <b>{day}</b>
                </span>
                <div>
                  <h3>
                    <Link href={noticePath(n)}>{n.title}</Link>
                  </h3>
                  <p>
                    <span className="nx-chip">{n.kind_label}</span>
                    {state.phase !== 'none' && <span className={`nx-state ${state.phase}`}>{state.label}</span>}
                    {n.event_time && <span>{n.event_time}</span>}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default async function NoticesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const filter = filterFrom(sp.filter);
  const showUpcoming = page === 1 && (filter.key === 'all' || filter.key === 'exam_schedule' || filter.key === 'viva');

  const [res, upcoming] = await Promise.all([
    getNotices({ ...filter.params, page, per_page: PER_PAGE }).catch(() => null),
    showUpcoming
      ? getNotices({ ...(filter.key === 'all' ? {} : filter.params), upcoming: true, per_page: 6 })
          .then((r) => r.data)
          .catch(() => [] as PublicNotice[])
      : Promise.resolve([] as PublicNotice[]),
  ]);
  const rows = res?.data ?? [];
  const meta = res?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE };

  return (
    <div className="container-page py-4 sm:py-5">
      <NoticeHashRedirect />
      <Breadcrumbs
        items={[
          { name: 'নোটিশ ও ফলাফল', path: '/notices' },
          ...(filter.key !== 'all' ? [{ name: filter.label, path: hrefFor(1, filter.key) }] : []),
        ]}
      />

      <header className="mt-2 max-w-3xl sm:mt-3">
        <h1 className="font-serif text-xl font-bold text-ink sm:text-[28px]">{filter.heading}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft sm:text-[15px]">
          সরকারি নিয়োগ পরীক্ষার সময়সূচি, প্রবেশপত্র, মৌখিক পরীক্ষা ও ফলাফলের নোটিশ। প্রতিটি নোটিশের পাতায় প্রতিষ্ঠান, তারিখ, সময়, কেন্দ্র আর মূল নোটিশের লিংক।
        </p>
        <p className="mt-1 text-xs text-muted">দৈনিক চাকরি কোনো সরকারি সংস্থা নয়। পরীক্ষার আগে মূল নোটিশ মিলিয়ে নিন।</p>
      </header>

      <nav aria-label="নোটিশের ধরন" className="nx-filters">
        {NOTICE_FILTERS.map((f) => (
          <Link key={f.key} href={hrefFor(1, f.key)} aria-current={f.key === filter.key ? 'page' : undefined}>
            {f.label}
          </Link>
        ))}
      </nav>

      {showUpcoming && <UpcomingStrip items={upcoming} />}

      {res === null ? (
        <div className="mt-6 rounded-xl border border-line bg-stone-50 p-6 text-center">
          <p className="text-sm text-ink-soft">নোটিশ লোড হতে সমস্যা হয়েছে। কিছু সময় পর আবার চেষ্টা করুন।</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="এই ধরনের কোনো নোটিশ এখনো নেই"
            body="নতুন পরীক্ষার সময়সূচি, প্রবেশপত্র বা ফলাফল প্রকাশ হলে এখানে দেখা যাবে।"
            action={{ href: '/notices', label: 'সব নোটিশ দেখুন' }}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-baseline justify-between gap-3">
            <h2 className="text-base font-bold text-ink sm:text-lg">
              {filter.key === 'all' ? 'সর্বশেষ প্রকাশিত' : filter.label}
            </h2>
            <span className="text-xs text-muted">মোট {toBnDigits(meta.total)}টি · নোটিশের তারিখ অনুযায়ী নতুন আগে</span>
          </div>
          <ol className="nx-grid mt-3">
            {rows.map((n, i) => (
              <li key={n.id}>
                <NoticeCard notice={n} headingLevel="h3" eager={i < 3} />
              </li>
            ))}
          </ol>
        </>
      )}

      {rows.length > 0 && <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={(p) => hrefFor(p, filter.key)} />}
    </div>
  );
}
