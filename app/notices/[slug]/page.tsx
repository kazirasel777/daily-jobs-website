// File: app/notices/[slug]/page.tsx
// একটি নোটিশের নিজস্ব, শেয়ারযোগ্য ও ইনডেক্সযোগ্য পাতা: /notices/{id-english-slug}
// - পুরোনো slug বা শুধু id → স্থায়ীভাবে বর্তমান slug-এ (308)
// - অপ্রকাশিত/মুছে ফেলা → 404; API সাময়িক বন্ধ → error (পুরোনো ক্যাশ পাতা থেকে যায়, ভুল 404 নয়)
// - পরীক্ষা শেষ/স্থগিত/বাতিল/সংশোধিত — শীর্ষে স্পষ্ট; পুরোনো নোটিশ রেফারেন্স হিসেবে থাকে
// - Article + BreadcrumbList structured data (JobPosting নয়)
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import Icon from '@/components/Icon';
import HomeIcon from '@/components/home/HomeIcons';
import NoticeCard, { NoticeStateChip } from '@/components/notices/NoticeCard';
import { getNoticeDetail, getNotices } from '@/lib/api';
import { formatDateBn, isHttpUrl } from '@/lib/format';
import {
  eventDateText,
  eventNoun,
  eventState,
  hostOf,
  isNoticeIndexable,
  nextStepLines,
  noticeDescription,
  noticeMetaTitle,
  noticeTone,
} from '@/lib/notice';
import { sanitizeRichText } from '@/lib/sanitize';
import { jsonLd, noticeArticleSchema, pageMetadata } from '@/lib/seo';
import { noticePath } from '@/lib/site';
import type { PublicNotice } from '@/types/notice';

type Params = Promise<{ slug: string }>;

// প্রথম ভিজিটে তৈরি, তারপর ক্যাশ; Laravel প্রকাশ/সংশোধনের পর /api/revalidate দিয়ে সাথে সাথে হালনাগাদ করে।
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

function listFilterFor(n: PublicNotice): { key: string; label: string } {
  if (n.type === 'result') return { key: 'result', label: 'ফলাফল' };
  if (n.kind === 'exam_schedule') return { key: 'exam_schedule', label: 'পরীক্ষার সময়সূচি' };
  if (n.kind === 'admit_card') return { key: 'admit_card', label: 'প্রবেশপত্র' };
  if (n.kind === 'viva') return { key: 'viva', label: 'মৌখিক পরীক্ষা' };
  return { key: 'general', label: 'অন্যান্য নোটিশ' };
}

function shareImage(n: PublicNotice): string | null {
  return n.feature_image?.url ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const notice = await getNoticeDetail(slug);
  if (!notice) return { title: 'নোটিশটি পাওয়া যায়নি', robots: { index: false, follow: true } };

  const image = shareImage(notice);
  const meta = pageMetadata({
    index: isNoticeIndexable(notice),
    title: noticeMetaTitle(notice),
    description: noticeDescription(notice),
    path: noticePath(notice),
    type: 'article',
    images: image ? [image] : undefined,
    publishedTime: notice.published_at ?? undefined,
    modifiedTime: notice.updated_at ?? undefined,
  });
  return { ...meta, alternates: { ...meta.alternates, types: { 'application/rss+xml': '/notices/feed.xml' } } };
}

function StatusBanner({ notice }: { notice: PublicNotice }) {
  const state = eventState(notice);
  const noun = eventNoun(notice);
  if (notice.notice_status === 'cancelled' || notice.notice_status === 'postponed' || notice.notice_status === 'revised') {
    const headline =
      notice.notice_status === 'cancelled'
        ? `এই ${noun} বাতিল করা হয়েছে`
        : notice.notice_status === 'postponed'
          ? `এই ${noun} স্থগিত করা হয়েছে`
          : 'এই নোটিশ সংশোধন করা হয়েছে';
    return (
      <div role="status" className={`nx-banner ${notice.notice_status}`}>
        <Icon name="alert" />
        <div>
          <strong>{headline}</strong>
          {notice.status_note && <span>{notice.status_note} </span>}
          <span>বিস্তারিত জানতে প্রতিষ্ঠানের মূল নোটিশ দেখুন।</span>
        </div>
      </div>
    );
  }
  if (state.phase === 'past') {
    return (
      <div role="status" className="nx-banner past">
        <Icon name="info" />
        <div>
          <strong>
            এই {noun} {eventDateText(notice)} তারিখে অনুষ্ঠিত হয়েছে
          </strong>
          তথ্যটি রেফারেন্সের জন্য রাখা হয়েছে।{' '}
          <Link href="/notices">সর্বশেষ নোটিশ ও আসন্ন পরীক্ষা দেখুন →</Link>
        </div>
      </div>
    );
  }
  return null;
}

export default async function NoticeDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const notice = await getNoticeDetail(slug);
  if (!notice) notFound();

  // পুরোনো slug, শুধু id বা বড় হাতের অক্ষর → একটাই canonical URL
  const canonical = noticePath(notice);
  let requested = slug;
  try {
    requested = decodeURIComponent(slug);
  } catch {}
  if (`/notices/${requested}` !== canonical) permanentRedirect(canonical);

  const tone = noticeTone(notice);
  const state = eventState(notice);
  const filter = listFilterFor(notice);
  const description = noticeDescription(notice);
  const sourceUrl = isHttpUrl(notice.source_url) ? notice.source_url : null;
  const website = isHttpUrl(notice.official_website) ? notice.official_website : null;
  const pdf = isHttpUrl(notice.pdf_url) ? notice.pdf_url : null;
  const scan = isHttpUrl(notice.image_url) ? notice.image_url : null;
  const action = isHttpUrl(notice.action_url) ? { url: notice.action_url, label: notice.action_label || 'অনলাইনে দেখুন' } : null;
  const sourceLabel = notice.notice_link_type === 'notice' ? 'মূল নোটিশ দেখুন' : 'প্রতিষ্ঠানের নোটিশ পাতা দেখুন';
  const steps = nextStepLines(notice);
  const isResult = notice.type === 'result';
  const noun = eventNoun(notice);
  const featured = notice.feature_image?.url ? notice.feature_image : null;
  const updatedLater =
    notice.updated_at && notice.published_at && new Date(notice.updated_at).getTime() - new Date(notice.published_at).getTime() > 60_000;

  const related = (
    await getNotices({ ...(notice.type === 'result' ? { type: 'result' as const } : notice.kind ? { kind: notice.kind } : {}), per_page: 5 }).catch(
      () => null,
    )
  )?.data
    .filter((n) => n.id !== notice.id)
    .slice(0, 3) ?? [];

  const schema = noticeArticleSchema({
    path: canonical,
    headline: notice.title,
    description,
    datePublished: notice.published_at,
    dateModified: notice.updated_at,
    image: featured?.url ?? scan,
    organizationName: notice.organization_name,
    organizationUrl: website,
  });

  let n = 0;
  const num = () => `০${['১', '২', '৩', '৪', '৫', '৬'][n++]}`;

  return (
    <article className={`detail-wrap wrap nx-detail nx-tone-${tone}`}>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />}

      <div className="pt-1">
        <Breadcrumbs
          items={[
            { name: 'নোটিশ ও ফলাফল', path: '/notices' },
            { name: filter.label, path: `/notices?filter=${filter.key}` },
            { name: notice.title, path: canonical },
          ]}
        />
      </div>

      <div className="detail-grid">
        <div className="detail-body">
          <header className="detail-hero">
            <div className="nx-labels">
              <Link href={`/notices?filter=${filter.key}`} className="nx-chip">
                {notice.kind_label}
              </Link>
              <NoticeStateChip notice={notice} />
            </div>

            <h1>{notice.title}</h1>

            {notice.organization_name && (
              <div className="detail-org">
                <HomeIcon name="building" />
                <span>{notice.organization_name}</span>
              </div>
            )}

            {featured && (
              <figure className="nx-hero-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.url} alt={featured.alt || notice.title} width={1200} height={675} fetchPriority="high" decoding="async" />
              </figure>
            )}

            <StatusBanner notice={notice} />

            {notice.summary && <p className="nx-lede">{notice.summary}</p>}

            <dl className="nx-facts">
              {notice.organization_name && (
                <div>
                  <dt>প্রকাশকারী প্রতিষ্ঠান</dt>
                  <dd>{notice.organization_name}</dd>
                </div>
              )}
              {notice.exam_name && (
                <div>
                  <dt>{isResult ? 'যে পরীক্ষার ফলাফল' : 'সংশ্লিষ্ট পরীক্ষা / পদ'}</dt>
                  <dd>{notice.exam_name}</dd>
                </div>
              )}
              {notice.notice_date && (
                <div>
                  <dt>নোটিশের তারিখ</dt>
                  <dd>
                    <time dateTime={notice.notice_date}>{formatDateBn(notice.notice_date)}</time>
                  </dd>
                </div>
              )}
              {notice.event_date && (
                <div>
                  <dt>{noun}র তারিখ</dt>
                  <dd className={state.phase === 'past' || notice.notice_status ? '' : 'accent'}>
                    <span className={notice.notice_status === 'cancelled' || notice.notice_status === 'postponed' ? 'line-through opacity-70' : ''}>
                      {eventDateText(notice)}
                    </span>
                    {state.phase !== 'none' && <span className={`nx-state ${state.phase}`}>{state.label}</span>}
                  </dd>
                </div>
              )}
              {notice.event_time && (
                <div>
                  <dt>সময়</dt>
                  <dd>{notice.event_time}</dd>
                </div>
              )}
              {notice.event_venue && (
                <div className="wide">
                  <dt>কেন্দ্র / স্থান</dt>
                  <dd>{notice.event_venue}</dd>
                </div>
              )}
            </dl>

            <div className="detail-meta">
              {notice.published_at && (
                <span>
                  দৈনিক চাকরিতে প্রকাশ: <time dateTime={notice.published_at}>{formatDateBn(notice.published_at)}</time>
                </span>
              )}
              {updatedLater && notice.updated_at && (
                <span>
                  সর্বশেষ হালনাগাদ: <time dateTime={notice.updated_at}>{formatDateBn(notice.updated_at)}</time>
                </span>
              )}
            </div>
          </header>

          <section className="detail-section" id="details">
            <h2>
              <span className="section-number">{num()}</span> নোটিশের বিস্তারিত
            </h2>
            {notice.body?.trim() ? (
              <div className="prose-bn mt-4" dangerouslySetInnerHTML={{ __html: sanitizeRichText(notice.body) }} />
            ) : (
              <p className="mt-4 rounded-xl bg-surface p-4 text-sm text-muted">লিখিত বিবরণ যোগ করা হয়নি। বিস্তারিত জানতে মূল নোটিশ দেখুন।</p>
            )}
          </section>

          {steps.length > 0 && (
            <section className="detail-section" id="next-steps">
              <h2>
                <span className="section-number">{num()}</span> {isResult ? 'ফলাফলের পরে করণীয়' : 'পরীক্ষার্থীদের করণীয়'}
              </h2>
              <ol className="nx-steps">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </section>
          )}

          {(pdf || scan || sourceUrl) && (
            <section className="detail-section" id="original">
              <h2>
                <span className="section-number">{num()}</span> মূল নোটিশ
              </h2>
              <p className="mt-2 text-sm text-muted">তারিখ, সময় ও শর্তের ক্ষেত্রে প্রতিষ্ঠানের মূল নোটিশই চূড়ান্ত।</p>
              <div className="nx-doc-actions">
                {pdf && (
                  <a href={pdf} target="_blank" rel="noopener noreferrer" className="nx-btn primary">
                    <Icon name="file" /> মূল নোটিশ (PDF) খুলুন
                  </a>
                )}
                {sourceUrl && (
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className={`nx-btn${pdf ? '' : ' primary'}`}>
                    {sourceLabel} <Icon name="external" />
                  </a>
                )}
              </div>
              {scan && (
                <figure className="circular-sheet" style={{ marginTop: '16px' }}>
                  <a href={scan} target="_blank" rel="noopener noreferrer" className="block bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scan} alt={`${notice.title} — মূল নোটিশ`} loading="lazy" decoding="async" className="block h-auto w-full" />
                  </a>
                  <figcaption style={{ borderTop: '1px solid var(--line)', padding: '10px 4px 0', marginTop: '10px', fontSize: '12px', color: 'var(--muted)' }}>
                    মূল নোটিশের ছবি — বড় করে দেখতে ছবিতে ক্লিক করুন
                  </figcaption>
                </figure>
              )}
            </section>
          )}

          <section className="detail-section" id="source">
            <h2>
              <span className="section-number">{num()}</span> তথ্যের উৎস
            </h2>
            <dl className="nx-source-dl">
              {notice.organization_name && (
                <div>
                  <dt>প্রকাশকারী</dt>
                  <dd>{notice.organization_name}</dd>
                </div>
              )}
              {notice.notice_date && (
                <div>
                  <dt>নোটিশের তারিখ</dt>
                  <dd>{formatDateBn(notice.notice_date)}</dd>
                </div>
              )}
              {website && (
                <div>
                  <dt>অফিসিয়াল ওয়েবসাইট</dt>
                  <dd>
                    <a href={website} target="_blank" rel="noopener noreferrer nofollow">
                      {hostOf(website)}
                    </a>
                  </dd>
                </div>
              )}
              {sourceUrl && (
                <div>
                  <dt>{notice.notice_link_type === 'notice' ? 'মূল নোটিশের লিংক' : 'প্রতিষ্ঠানের নোটিশ পাতা'}</dt>
                  <dd>
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                      {hostOf(sourceUrl)}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            <p style={{ marginTop: '12px', fontSize: '12px', lineHeight: 1.7, color: 'var(--muted)' }}>
              দৈনিক চাকরি কোনো সরকারি প্রতিষ্ঠানের প্রতিনিধিত্ব করে না। এই পাতার তথ্য প্রতিষ্ঠানের প্রকাশিত নোটিশ থেকে নেওয়া; পরীক্ষার আগে মূল নোটিশ মিলিয়ে নিন।
            </p>
          </section>
        </div>

        <aside className="detail-sidebar" aria-label="গুরুত্বপূর্ণ তথ্য ও লিংক">
          <section className="apply-panel">
            <h2>{isResult ? 'ফলাফল' : notice.kind === 'admit_card' ? 'প্রবেশপত্র' : 'এক নজরে'}</h2>
            {notice.event_date ? (
              <div className="nx-side-date">
                <span>{noun}র তারিখ</span>
                <strong>{eventDateText(notice)}</strong>
                {notice.event_time && <em>{notice.event_time}</em>}
              </div>
            ) : (
              notice.notice_date && (
                <div className="nx-side-date">
                  <span>নোটিশের তারিখ</span>
                  <strong>{formatDateBn(notice.notice_date)}</strong>
                </div>
              )
            )}

            <div className="nx-side-actions">
              {action && (
                <>
                  <a href={action.url} target="_blank" rel="noopener noreferrer nofollow" className="nx-btn primary">
                    {action.label} <Icon name="external" />
                  </a>
                  <p className="nx-side-host">{hostOf(action.url)}</p>
                </>
              )}
              {pdf && (
                <a href={pdf} target="_blank" rel="noopener noreferrer" className={`nx-btn${action ? '' : ' primary'}`}>
                  <Icon name="file" /> মূল নোটিশ (PDF)
                </a>
              )}
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className={`nx-btn${action || pdf ? '' : ' primary'}`}>
                  {sourceLabel} <Icon name="external" />
                </a>
              )}
            </div>

            <p style={{ fontSize: '11px', marginTop: '16px', color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              প্রবেশপত্র ডাউনলোড বা ফলাফল দেখা শুধু প্রতিষ্ঠানের অফিসিয়াল সাইটে। কাউকে টাকা বা পাসওয়ার্ড দেবেন না।
            </p>
          </section>

          <Link className="back-link" href={`/notices?filter=${filter.key}`}>
            ← সব {filter.label}
          </Link>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="related-block" aria-labelledby="related-heading">
          <div className="related-title">
            <h2 id="related-heading">আরও {filter.label}</h2>
            <Link href={`/notices?filter=${filter.key}`}>সব দেখুন →</Link>
          </div>
          <ol className="nx-grid" style={{ marginTop: '14px' }}>
            {related.map((r) => (
              <li key={r.id}>
                <NoticeCard notice={r} headingLevel="h3" />
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
