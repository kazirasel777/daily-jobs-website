// File: app/job/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import DeadlineBadge from '@/components/DeadlineBadge';
import Icon from '@/components/Icon';
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
    title: job.seo?.title?.trim() || job.title,
    description: metaDescription(job),
    path: jobPath(job),
    type: 'article',
    images: images.slice(0, 1),
    publishedTime: job.published_at ?? undefined,
    modifiedTime: job.updated_at ?? undefined,
  });
}

function Fact({ label, value, icon }: { label: string; value: React.ReactNode; icon: Parameters<typeof Icon>[0]['name'] }) {
  return (
    <div className="flex gap-2.5 p-3.5 sm:gap-3 sm:p-4">
      <Icon name={icon} className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-muted">{label}</dt>
        <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
      </div>
    </div>
  );
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const job = await getJobDetail(slug);
  if (!job) notFound();

  // Old links by numeric id point to the canonical slug URL.
  if (job.slug && decodeURIComponent(slug) !== job.slug) permanentRedirect(jobPath(job));

  const days = daysUntil(job.deadline);
  const expired = days !== null && days < 0;
  const applyLink = !expired && isHttpUrl(job.apply_link) ? job.apply_link : null;
  const method = applicationMethodLabel(job.application_method);
  const images = (job.circular_images ?? []).filter((img): img is { page_number: number; url: string } => Boolean(img.url));
  const schema = expired ? null : jobPostingSchema(job);

  const related = job.category
    ? (await getJobs({ category: job.category.slug, per_page: 6 }).catch(() => null))?.data.filter((j) => j.id !== job.id).slice(0, 4) ?? []
    : [];

  const crumbs = [
    ...(job.category ? [{ name: job.category.name, path: `/category/${job.category.slug}` }] : []),
    { name: job.title, path: jobPath(job) },
  ];

  return (
    <article>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />}
      <ViewCounter jobId={job.id} />

      <div className="container-page grid items-start gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
      <article className="card min-w-0 p-5 sm:p-7">
      <header>
        <div className="">
          <Breadcrumbs items={crumbs} />

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            {job.category && (
              <Link href={`/category/${job.category.slug}`} className="rounded-md bg-brand-50 px-2 py-0.5 font-bold text-brand-700 hover:bg-brand-100">
                {job.category.name}
              </Link>
            )}
            {job.recently_added && <span className="rounded-md bg-marigold-100 px-2 py-0.5 font-bold text-marigold-900">নতুন</span>}
            <DeadlineBadge deadline={job.deadline} precision={job.deadline_precision} />
          </div>

          <h1 className="mt-3 max-w-4xl font-serif text-[1.6rem] font-bold leading-snug text-ink sm:text-[1.9rem]">{job.title}</h1>
          {job.organization_name && (
            <p className="mt-2 flex items-center gap-2 text-lg text-ink-soft">
              <Icon name="building" className="h-5 w-5 text-muted" />
              {job.organization_name}
            </p>
          )}
        </div>
      </header>

      {expired && (
        <div className="pt-6">
          <p role="status" className="flex items-start gap-2 rounded-xl border border-line-strong bg-stone-100 p-4 text-sm text-ink-soft">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            এই বিজ্ঞপ্তির আবেদনের সময় {formatDateBn(job.deadline)} তারিখে শেষ হয়েছে। তথ্যটি শুধু রেফারেন্সের জন্য রাখা হয়েছে।
          </p>
        </div>
      )}

      <div className="pt-6">
        <section aria-labelledby="facts-heading" className="card overflow-hidden">
          <h2 id="facts-heading" className="sr-only">এক নজরে</h2>
          <dl className="-mb-px -mr-px grid grid-cols-2 lg:grid-cols-3 [&>div]:border-b [&>div]:border-r [&>div]:border-line">
            {job.vacancies !== null && job.vacancies > 0 && <Fact icon="users" label="পদসংখ্যা" value={`${toBnNumber(job.vacancies)} জন`} />}
            {job.location && <Fact icon="pin" label="কর্মস্থল" value={job.location} />}
            {job.circular_published_date && <Fact icon="file" label="বিজ্ঞপ্তি প্রকাশ" value={formatDateBn(job.circular_published_date)} />}
            {job.apply_start_date && <Fact icon="calendar" label="আবেদন শুরু" value={formatDateBn(job.apply_start_date)} />}
            {job.deadline && (
              <Fact
                icon="clock"
                label={job.deadline_precision === 'approximate' ? 'আবেদনের শেষ তারিখ (আনুমানিক)' : 'আবেদনের শেষ তারিখ'}
                value={<span className={expired ? 'text-muted line-through' : days !== null && days <= 3 ? 'text-alert-700' : 'text-brand-700'}>{formatDateBn(job.deadline)}</span>}
              />
            )}
            {method && <Fact icon="external" label="আবেদনের মাধ্যম" value={method} />}
          </dl>
        </section>
      </div>

      <div className="pt-6">
        <div className="min-w-0 space-y-8">

          <section aria-labelledby="details-heading">
            <h2 id="details-heading" className="font-serif text-xl font-bold text-ink">বিজ্ঞপ্তির বিস্তারিত</h2>
            {job.description ? (
              <div className="prose-bn mt-4" dangerouslySetInnerHTML={{ __html: sanitizeRichText(job.description) }} />
            ) : (
              <p className="mt-4 rounded-xl bg-surface p-4 text-sm text-muted">
                লিখিত বিবরণ যোগ করা হয়নি। যোগ্যতা ও শর্তাবলি জানতে নিচের মূল বিজ্ঞপ্তির ছবি দেখুন।
              </p>
            )}
          </section>

          {images.length > 0 && (
            <section aria-labelledby="circular-heading">
              <h2 id="circular-heading" className="font-serif text-xl font-bold text-ink">
                মূল বিজ্ঞপ্তি <span className="text-base font-semibold text-muted">({toBnDigits(images.length)} পাতা)</span>
              </h2>
              <p className="mt-1 text-sm text-muted">ছবিতে ক্লিক করলে পূর্ণ আকারে খুলবে।</p>
              <div className="mt-4 space-y-5">
                {images.map((img, idx) => {
                  const n = img.page_number || idx + 1;
                  return (
                    <figure key={`${n}-${idx}`} className="card overflow-hidden">
                      <a href={img.url} target="_blank" rel="noopener" className="block bg-white">
                        {/* Scanned circulars have unknown dimensions; a plain lazy image keeps them readable at full width. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`${job.title} — মূল বিজ্ঞপ্তি, পাতা ${toBnDigits(n)}`}
                          loading="lazy"
                          decoding="async"
                          className="block h-auto w-full"
                        />
                      </a>
                      <figcaption className="border-t border-line px-4 py-2 text-xs text-muted">পাতা {toBnDigits(n)}</figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          )}
        </div>


      </div>

      </article>
        <aside className="space-y-5">
          <section aria-labelledby="apply-heading" className="card p-5 lg:sticky lg:top-6">
            <h2 id="apply-heading" className="font-serif text-lg font-bold text-ink">আবেদন</h2>
            {expired ? (
              <p className="mt-3 text-sm text-muted">আবেদনের সময় শেষ হয়ে গেছে।</p>
            ) : (
              <>
                {applyLink ? (
                  <>
                    <a
                      href={applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-800 px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-700"
                    >
                      নিয়োগকারীর সাইটে আবেদন
                      <Icon name="external" className="h-4 w-4" />
                    </a>
                    <p className="mt-2 break-all text-center text-xs text-muted">{new URL(applyLink).hostname}</p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-ink-soft">
                    অনলাইন আবেদনের লিংক দেওয়া নেই। নিচের নিয়ম ও মূল বিজ্ঞপ্তি অনুযায়ী আবেদন করুন।
                  </p>
                )}
                {job.application_instructions && (
                  <div className="mt-4 rounded-xl bg-paper p-4 text-sm leading-7 text-ink-soft">
                    <h3 className="mb-1 font-bold text-ink">আবেদনের নিয়ম</h3>
                    <p className="whitespace-pre-line [overflow-wrap:anywhere]">{job.application_instructions}</p>
                  </div>
                )}
              </>
            )}
            <p className="mt-4 flex gap-2 border-t border-line pt-4 text-xs leading-5 text-muted">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-marigold-700" />
              দৈনিক চাকরি আবেদন গ্রহণ করে না। আবেদনের আগে মূল বিজ্ঞপ্তির যোগ্যতা, ফি ও শর্ত মিলিয়ে নিন।
            </p>
            {(job.published_at || job.updated_at) && (
              <p className="mt-3 text-xs text-muted">
                {job.published_at && <>সাইটে প্রকাশ: {formatDateBn(job.published_at)}</>}
                {job.updated_at && job.updated_at !== job.published_at && <><br />সর্বশেষ হালনাগাদ: {formatDateBn(job.updated_at)}</>}
              </p>
            )}
          </section>
        </aside>
      </div>

      {related.length > 0 && job.category && (
        <section aria-labelledby="related-heading" className="container-page pt-12">
          <div className="flex items-end justify-between gap-4">
            <h2 id="related-heading" className="font-serif text-xl font-bold text-ink">{job.category.name}: আরও বিজ্ঞপ্তি</h2>
            <Link href={`/category/${job.category.slug}`} className="text-sm font-bold text-brand-700 hover:underline">সব দেখুন →</Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.id} className="card p-4">
                <Link href={jobPath(r)} className="font-semibold leading-6 text-ink hover:text-brand-700">{r.title}</Link>
                <div className="mt-2"><DeadlineBadge deadline={r.deadline} /></div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
