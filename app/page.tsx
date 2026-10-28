// File: app/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Pagination from '@/components/Pagination';
import HomeIcon from '@/components/home/HomeIcons';
import HomeJobCard from '@/components/home/HomeJobCard';
import HomeCategories from '@/components/home/HomeCategories';
import HomeNotices from '@/components/home/HomeNotices';
import HomeStudy from '@/components/home/HomeStudy';
import '@/components/home/home.css';

import { getJobCategories, getJobs } from '@/lib/api';
import { daysUntil, formatDateBn, parsePage, toBnDigits, toBnNumber } from '@/lib/format';
import { SITE, jobPath, pagedPath } from '@/lib/site';
import { jsonLd, pageMetadata, siteSchema } from '@/lib/seo';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 12;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  if (page > 1) {
    return pageMetadata({
      title: `সর্বশেষ চাকরির বিজ্ঞপ্তি — পৃষ্ঠা ${toBnDigits(page)}`,
      description: `দৈনিক চাকরিতে প্রকাশিত সক্রিয় নিয়োগ বিজ্ঞপ্তির তালিকা, পৃষ্ঠা ${toBnDigits(page)}। প্রতিটি বিজ্ঞপ্তিতে আবেদনের শেষ তারিখ, পদসংখ্যা ও কর্মস্থল দেখুন।`,
      path: pagedPath('/', page),
    });
  }
  return pageMetadata({
    title: `${SITE.name} | আজকের সরকারি, ব্যাংক ও বেসরকারি চাকরির বিজ্ঞপ্তি`,
    absoluteTitle: true,
    description: SITE.description,
    path: '/',
  });
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Legacy URLs: the old home page carried search and category filters as parameters.
  const legacyQuery = typeof params.q === 'string' ? params.q : typeof params.search === 'string' ? params.search : '';
  if (legacyQuery.trim()) {
    permanentRedirect(`/search?q=${encodeURIComponent(legacyQuery.trim())}`);
  }
  if (typeof params.category === 'string' && /^[a-z0-9_-]{1,100}$/.test(params.category) && params.category !== 'all') {
    permanentRedirect(`/category/${params.category}`);
  }

  const page = parsePage(params.page);

  const [jobsRes, categories] = await Promise.all([
    getJobs({ page, per_page: PER_PAGE }),
    getJobCategories(),
  ]);

  if (page > 1 && page > jobsRes.meta.last_page) notFound();

  const isFirstPage = page === 1;

  // Front-page extras are only fetched for page 1.
  const [closingSource, categoryCounts] = isFirstPage
    ? await Promise.all([
        getJobs({ page: 1, per_page: 50 }),
        Promise.all(categories.map((c) => getJobs({ category: c.slug, per_page: 1 }).then((r) => r.meta.total))),
      ])
    : [null, [] as number[]];

  const closingAll = (closingSource?.data ?? [])
    .map((job) => ({ job, days: daysUntil(job.deadline) }))
    .filter((x): x is { job: typeof x.job; days: number } => x.days !== null && x.days >= 0 && x.days <= 3)
    .sort((a, b) => a.days - b.days);
  const closingSoon = closingAll.slice(0, 3);

  return (
    <div className="home-page">
      {isFirstPage && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteSchema()) }} />}

      <div className="home-wrap">
        <div className="home-intro">
          <div>
            <h1>
              সঠিক খবর। <span>নতুন সুযোগ।</span>
            </h1>
            <p className="sub">সরকারি, ব্যাংক ও বেসরকারি চাকরির বিজ্ঞপ্তি</p>
          </div>
          <div className="home-intro-right">
            <span className="home-intro-caption">
              মূল বিজ্ঞপ্তি থেকে
              <br />
              আপনার পরের সুযোগ
            </span>
            <div className="home-intro-art" aria-hidden="true">
              <span className="home-sketch-page" />
              <span className="home-sketch-case">
                <HomeIcon name="case" />
              </span>
              <span className="home-sketch-dot" />
            </div>
          </div>
        </div>

        <div className="home-page-grid">
          <aside className="home-sidebar" aria-label="চাকরির বিভাগ ও প্রস্তুতি">
            <HomeCategories
              categories={categories}
              totalJobs={jobsRes.meta.total}
              categoryCounts={categoryCounts}
            />

            <section className="home-study-short">
              <span className="mini">
                <HomeIcon name="book" />
                একটু এগিয়ে থাকুন
              </span>
              <h2>
                চাকরির প্রস্তুতিও
                <br />
                একই ঠিকানায়
              </h2>
              <p>বিগত প্রশ্ন, উত্তর ও ব্যাখ্যা।</p>
              <Link href="/question-bank">
                বিসিএস প্রশ্নব্যাংক
                <HomeIcon name="arrow" />
              </Link>
              <Link href="/question-bank">
                ব্যাংক নিয়োগ পরীক্ষা
                <HomeIcon name="arrow" />
              </Link>
              <Link href="/question-bank">
                সাম্প্রতিক পরীক্ষার প্রশ্ন
                <HomeIcon name="arrow" />
              </Link>
            </section>

            <p className="home-side-note">
              <strong>মূল সূত্র মিলিয়ে নিন।</strong>
              <br />
              আবেদন করুন নিয়োগকারী প্রতিষ্ঠানের নির্ধারিত মাধ্যমে।
            </p>
          </aside>

          <main className="home-main" id="main">
            <section aria-labelledby="jobs-heading">
              <div className="home-section-bar">
                <div className="home-section-heading">
                  <h2 id="jobs-heading">
                    {isFirstPage
                      ? 'সর্বশেষ বিজ্ঞপ্তি'
                      : `সর্বশেষ চাকরির বিজ্ঞপ্তি — পৃষ্ঠা ${toBnDigits(page)} / ${toBnDigits(jobsRes.meta.last_page)}`}
                  </h2>
                  <span className="home-result-count" id="result-count" aria-live="polite">
                    {toBnNumber(jobsRes.meta.total)}টি
                  </span>
                </div>
                <label className="home-sr" htmlFor="sort">
                  সাজানোর নিয়ম
                </label>
                <select className="home-sort" id="sort" defaultValue="new" aria-label="সাজানোর নিয়ম">
                  <option value="new">নতুন প্রকাশিত</option>
                  <option value="deadline">শেষ তারিখ আগে</option>
                </select>
              </div>

              {jobsRes.data.length > 0 ? (
                <div className="home-job-list" id="jobs">
                  {jobsRes.data.map((job) => (
                    <HomeJobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="home-empty">
                  <strong>এই মুহূর্তে কোনো সক্রিয় বিজ্ঞপ্তি নেই।</strong>
                </div>
              )}

              <div className="home-more-area">
                {page < jobsRes.meta.last_page && (
                  <Link href={pagedPath('/', page + 1)} className="home-more">
                    আরও বিজ্ঞপ্তি দেখুন
                    <HomeIcon name="chevron" />
                  </Link>
                )}
              </div>

              <Pagination
                currentPage={page}
                lastPage={jobsRes.meta.last_page}
                hrefFor={(p) => pagedPath('/', p)}
              />
            </section>

            {closingSoon.length > 0 && (
              <section className="home-section" id="closing" aria-labelledby="closing-heading">
                <div className="home-section-bar">
                  <div className="home-section-heading home-closing-title">
                    <h2 id="closing-heading">শেষ সময় ঘনিয়ে আসছে</h2>
                    <HomeIcon name="clock" />
                  </div>
                  <span className="home-small-link">সময় থাকতে আবেদন করুন</span>
                </div>
                <div className="home-closing-grid" id="closing-jobs">
                  {closingSoon.map(({ job, days }) => (
                    <Link key={job.id} className="home-closing-card" href={jobPath(job)}>
                      <span className="home-closing-days">
                        {days === 0 ? 'আজই শেষ দিন' : `আর ${toBnDigits(days)} দিন`}
                      </span>
                      <h3>{job.organization_name || job.title}</h3>
                      <p>শেষ তারিখ {formatDateBn(job.deadline)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <HomeNotices />

            <HomeStudy />
          </main>
        </div>
      </div>
    </div>
  );
}
