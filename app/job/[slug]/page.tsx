// File: app/job/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import DeadlineBadge from '@/components/DeadlineBadge';
import Icon from '@/components/Icon';
import HomeIcon from '@/components/home/HomeIcons';
import ViewCounter from '@/components/ViewCounter';
import { getJobDetail, getJobs } from '@/lib/api';
import {
  applicationMethodLabel,
  daysUntil,
  formatDateBn,
  isHttpUrl,
  stripHtml,
  toBnDigits,
  toBnNumber,
  truncate,
} from '@/lib/format';
import { sanitizeRichText } from '@/lib/sanitize';
import { jobPath } from '@/lib/site';
import { jobPostingSchema, jsonLd, pageMetadata } from '@/lib/seo';
import type { JobDetail } from '@/types/job';

type Params = Promise<{ slug: string }>;

// Rendered on first visit, then served from cache and refreshed every 5 minutes.
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

function metaDescription(job: JobDetail): string {
  if (job.seo?.description?.trim()) return job.seo.description.trim();
  const fromBody = stripHtml(job.description);
  if (fromBody.length >= 60) return truncate(fromBody);
  const parts = [
    job.organization_name && `${job.organization_name}-এর নিয়োগ বিজ্ঞপ্তি।`,
    job.vacancies && `পদসংখ্যা ${toBnNumber(job.vacancies)}।`,
    job.location && `কর্মস্থল ${job.location}।`,
    job.deadline && `আবেদনের শেষ তারিখ ${formatDateBn(job.deadline)}।`,
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : 'নিয়োগ বিজ্ঞপ্তির বিস্তারিত, আবেদনের নিয়ম ও মূল বিজ্ঞপ্তির ছবি।';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobDetail(slug);
  if (!job) return { title: 'বিজ্ঞপ্তিটি পাওয়া যায়নি', robots: { index: false, follow: true } };

  const images = [job.thumbnail_url, job.circular_images?.[0]?.url].filter((u): u is string => Boolean(u));
  return pageMetadata({
    // Archived circulars stay reachable for old links but leave the search index.
    index: job.availability !== 'archived',
    title: job.seo?.title?.trim() || job.title,
    description: metaDescription(job),
    path: jobPath(job),
    type: 'article',
    images: images.slice(0, 1),
    publishedTime: job.published_at ?? undefined,
    modifiedTime: job.updated_at ?? undefined,
  });
}

function getCategoryClass(slug?: string): string {
  if (slug === 'bank_jobs') return 'tag bank';
  if (slug === 'private_jobs') return 'tag private';
  if (slug === 'ngo_education') return 'tag ngo';
  return 'tag';
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const job = await getJobDetail(slug);
  if (!job) notFound();

  // Old links by numeric id point to the canonical slug URL.
  if (job.slug && decodeURIComponent(slug) !== job.slug) permanentRedirect(jobPath(job));

  const days = daysUntil(job.deadline);
  // The API decides availability (Dhaka day, admin thresholds); the date check covers older API builds.
  const expired = (job.availability !== undefined && job.availability !== 'active') || job.application_open === false || (days !== null && days < 0);
  const applyLink = !expired && isHttpUrl(job.apply_link) ? job.apply_link : null;
  const method = applicationMethodLabel(job.application_method);
  const images = (job.circular_images ?? []).filter((img): img is { page_number: number; url: string } => Boolean(img.url));
  const schema = expired ? null : jobPostingSchema(job);

  const related = job.category
    ? (await getJobs({ category: job.category.slug, per_page: 6 }).catch(() => null))?.data.filter((j) => j.id !== job.id).slice(0, 4) ?? []
    : [];

  return (
    <article className="detail-wrap wrap">
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />}
      {!expired && <ViewCounter jobId={job.id} />}

      <nav className="detail-breadcrumb" aria-label="অবস্থান">
        <Link href="/">প্রথম পাতা</Link>
        <span>›</span>
        {job.category && (
          <>
            <Link href={`/category/${job.category.slug}`}>{job.category.name}</Link>
            <span>›</span>
          </>
        )}
        <span>{job.title}</span>
      </nav>

      <div className="detail-grid">
        <div className="detail-body">
          <header className="detail-hero">
            <div className="detail-labels">
              {job.category && (
                <Link href={`/category/${job.category.slug}`} className={getCategoryClass(job.category.slug)}>
                  {job.category.name}
                </Link>
              )}
              {job.recently_added && !expired && <span className="new">নতুন বিজ্ঞপ্তি</span>}
              <DeadlineBadge deadline={job.deadline} precision={job.deadline_precision} />
            </div>

            <h1>{job.title}</h1>

            {job.organization_name && (
              <div className="detail-org">
                <HomeIcon name="building" />
                <span>{job.organization_name}</span>
              </div>
            )}

            <dl className="fact-grid">
              <div>
                <dt>পদসংখ্যা</dt>
                <dd>{job.vacancies !== null && job.vacancies > 0 ? `${toBnNumber(job.vacancies)} জন` : 'বিজ্ঞপ্তি অনুযায়ী'}</dd>
              </div>
              <div>
                <dt>কর্মস্থল</dt>
                <dd>{job.location || 'বিজ্ঞপ্তি অনুযায়ী'}</dd>
              </div>
              <div>
                <dt>বিজ্ঞপ্তি প্রকাশ</dt>
                <dd>{job.circular_published_date ? formatDateBn(job.circular_published_date) : job.published_at ? formatDateBn(job.published_at) : 'বিজ্ঞপ্তি অনুযায়ী'}</dd>
              </div>
              <div>
                <dt>আবেদনের মাধ্যম</dt>
                <dd>{method || 'মূল বিজ্ঞপ্তি অনুযায়ী'}</dd>
              </div>
              <div>
                <dt>{job.deadline_precision === 'approximate' ? 'আবেদনের শেষ তারিখ (আনুমানিক)' : 'আবেদনের শেষ তারিখ'}</dt>
                <dd className={expired ? 'text-muted line-through' : 'accent'}>
                  {job.deadline ? formatDateBn(job.deadline) : 'বিজ্ঞপ্তি অনুযায়ী'}
                </dd>
              </div>
              <div>
                <dt>বেতন ও সুযোগ-সুবিধা</dt>
                <dd>বিজ্ঞপ্তি অনুযায়ী</dd>
              </div>
            </dl>

            <div className="detail-meta">
              {job.published_at && <span>প্রকাশ: {formatDateBn(job.published_at)}</span>}
              {job.updated_at && job.updated_at !== job.published_at && (
                <span>সর্বশেষ হালনাগাদ: {formatDateBn(job.updated_at)}</span>
              )}
            </div>

            <nav className="section-nav" aria-label="এই বিজ্ঞপ্তিতে">
              <a href="#overview">বিস্তারিত</a>
              {job.application_instructions && <a href="#application">আবেদনের নিয়ম</a>}
              {images.length > 0 && <a href="#circular">মূল বিজ্ঞপ্তি</a>}
              {job.sources && job.sources.length > 0 && <a href="#sources">তথ্যের উৎস</a>}
            </nav>
          </header>

          {expired && (
            <div style={{ marginTop: '20px' }}>
              <p role="status" className="flex items-start gap-2 rounded-xl border border-line-strong bg-stone-100 p-4 text-sm text-ink-soft">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {job.deadline
                  ? <>এই বিজ্ঞপ্তির আবেদনের সময় {formatDateBn(job.deadline)} তারিখে শেষ হয়েছে।</>
                  : <>এই বিজ্ঞপ্তির আবেদনের সময় শেষ হয়েছে।</>}{' '}
                তথ্যটি শুধু রেফারেন্সের জন্য রাখা হয়েছে — এখন আবেদন করা যাবে না।
                {job.availability === 'archived' && ' (আর্কাইভ)'}
              </p>
            </div>
          )}

          <section className="detail-section" id="overview">
            <h2>
              <span className="section-number">০১</span> বিজ্ঞপ্তির বিস্তারিত
            </h2>
            {job.description ? (
              <div className="prose-bn mt-4" dangerouslySetInnerHTML={{ __html: sanitizeRichText(job.description) }} />
            ) : (
              <p className="mt-4 rounded-xl bg-surface p-4 text-sm text-muted">
                লিখিত বিবরণ যোগ করা হয়নি। যোগ্যতা ও শর্তাবলি জানতে নিচের মূল বিজ্ঞপ্তির ছবি দেখুন।
              </p>
            )}
          </section>

          {job.application_instructions && (
            <section className="detail-section" id="application">
              <h2>
                <span className="section-number">০২</span> যেভাবে আবেদন করবেন
              </h2>
              <div className="prose-bn mt-4 whitespace-pre-line [overflow-wrap:anywhere]">
                {job.application_instructions}
              </div>
            </section>
          )}

          {images.length > 0 && (
            <section className="detail-section" id="circular">
              <h2>
                <span className="section-number">{job.application_instructions ? '০৩' : '০২'}</span> মূল বিজ্ঞপ্তি{' '}
                <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
                  ({toBnDigits(images.length)} পাতা)
                </span>
              </h2>
              <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--muted)' }}>ছবিতে ক্লিক করলে পূর্ণ আকারে খুলবে।</p>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {images.map((img, idx) => {
                  const n = img.page_number || idx + 1;
                  return (
                    <figure key={`${n}-${idx}`} className="circular-sheet">
                      <a href={img.url} target="_blank" rel="noopener noreferrer" className="block bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`${job.title} — মূল বিজ্ঞপ্তি, পাতা ${toBnDigits(n)}`}
                          loading="lazy"
                          decoding="async"
                          className="block h-auto w-full"
                        />
                      </a>
                      <figcaption style={{ borderTop: '1px solid var(--line)', padding: '10px 4px 0', marginTop: '10px', fontSize: '12px', color: 'var(--muted)' }}>
                        পাতা {toBnDigits(n)}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          )}

          {job.sources && job.sources.length > 0 && (
            <section className="detail-section" id="sources">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <h2>
                  <span className="section-number">{images.length > 0 ? (job.application_instructions ? '০৪' : '০৩') : (job.application_instructions ? '০৩' : '০২')}</span> তথ্যের উৎস ও প্রকাশনা
                </h2>
                <Link href="/sources" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)' }}>
                  সকল উৎস ডিরেক্টরি →
                </Link>
              </div>

              <p style={{ marginTop: '12px', fontSize: '13px', lineHeight: 1.8, color: 'var(--muted)' }}>
                দৈনিক চাকরি কোনো সরকারি প্রতিষ্ঠানের প্রতিনিধিত্ব করে না। প্রকাশের স্বচ্ছতার স্বার্থে মূল বিজ্ঞপ্তি ও প্রচারের উৎস নিচে উল্লেখ করা হলো:
              </p>

              <ul className="mt-4 divide-y divide-line/60">
                {job.sources.map((src) => {
                  const roleLabel =
                    src.source_role === 'original_notice'
                      ? 'মূল বিজ্ঞপ্তি / গেজেট'
                      : src.source_role === 'issuing_authority'
                      ? 'নিয়োগকারী প্রতিষ্ঠান'
                      : src.source_role === 'discovery_source'
                      ? 'পত্রিকা / প্রচার মাধ্যম'
                      : 'তথ্যসূত্র';

                  return (
                    <li key={src.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-ink">{src.source_name}</span>
                            {src.is_verified && (
                              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">
                                ✓ যাচাইকৃত
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-700">{roleLabel}</span>
                            {src.publication_date && <span>প্রকাশ: {formatDateBn(src.publication_date)}</span>}
                            {src.printed_page && <span>{src.printed_page}</span>}
                          </div>
                        </div>

                        {src.source_url && (
                          <a
                            href={src.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                          >
                            মূল উৎস লিংক
                            <Icon name="external" className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="detail-sidebar" aria-label="আবেদন ও প্রয়োজনীয় তথ্য">
          <section className="apply-panel">
            <h2>পরের ধাপ: আবেদন</h2>
            <p>যোগ্যতা মিলিয়ে মূল বিজ্ঞপ্তির নির্দেশনা অনুসরণ করুন।</p>

            <div className="apply-deadline">
              <span>আবেদনের শেষ তারিখ</span>
              <strong>{job.deadline ? formatDateBn(job.deadline) : 'বিজ্ঞপ্তি অনুযায়ী'}</strong>
            </div>

            {expired ? (
              <span className="primary-action" style={{ opacity: 0.65, cursor: 'not-allowed', background: '#728079' }}>
                আবেদনের সময় শেষ
              </span>
            ) : applyLink ? (
              <>
                <a
                  href={applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-action"
                >
                  নিয়োগকারীর সাইটে আবেদন ↗
                </a>
                <p style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--muted)', wordBreak: 'break-all' }}>
                  {new URL(applyLink).hostname}
                </p>
              </>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--ink)', margin: '12px 0', lineHeight: 1.7 }}>
                অনলাইন আবেদনের লিংক দেওয়া নেই। মূল বিজ্ঞপ্তির নির্দেশনা অনুযায়ী আবেদন করুন।
              </p>
            )}

            {images.length > 0 && (
              <a className="secondary-action" href="#circular">
                মূল বিজ্ঞপ্তি পড়ুন ↓
              </a>
            )}

            <p style={{ fontSize: '11px', marginTop: '16px', color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              দৈনিক চাকরি আবেদন গ্রহণ করে না। আবেদনের আগে মূল বিজ্ঞপ্তির যোগ্যতা, ফি ও শর্ত মিলিয়ে নিন।
            </p>
          </section>

          <section className="detail-note">
            <h3>একটু যাচাই, নিশ্চিন্ত সিদ্ধান্ত।</h3>
            <p>
              আবেদন কেবল নিয়োগকারীর নির্ধারিত মাধ্যমে করুন। কোনো ব্যক্তিকে চাকরির নিশ্চয়তার বিনিময়ে টাকা দেবেন না। মূল বিজ্ঞপ্তির শর্তই চূড়ান্ত।
            </p>
            <Link href="/sources">আমাদের তথ্যের উৎস →</Link>
          </section>

          {job.category && (
            <Link className="back-link" href={`/category/${job.category.slug}`}>
              ← {job.category.name}-এর সব বিজ্ঞপ্তি
            </Link>
          )}
        </aside>
      </div>

      {related.length > 0 && job.category && (
        <section className="related-block" aria-labelledby="related-heading">
          <div className="related-title">
            <h2 id="related-heading">{job.category.name}: আরও বিজ্ঞপ্তি</h2>
            <Link href={`/category/${job.category.slug}`}>সব দেখুন →</Link>
          </div>
          <div className="related-jobs">
            {related.map((r) => (
              <Link key={r.id} className="related-job" href={jobPath(r)}>
                <small>{r.organization_name || job.category?.name}</small>
                <h3>{r.title}</h3>
                <span>{r.deadline ? `আবেদন শেষ ${formatDateBn(r.deadline)}` : 'বিজ্ঞপ্তি দেখুন'} →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
