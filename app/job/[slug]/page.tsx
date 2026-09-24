// File: app/job/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ViewCounter from '@/components/ViewCounter';
import { getJobDetail } from '@/lib/api';
import { sanitizeRichText } from '@/lib/sanitize';

interface JobDetailsProps {
  params: Promise<{ slug: string }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toBengaliDigits(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '';
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (x) => digits[Number(x)]);
}

function isValidHttpUrl(stringUrl: string | null | undefined): boolean {
  if (!stringUrl) return false;
  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function generateMetadata({ params }: JobDetailsProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobDetail(slug);

  if (!job) {
    return {
      title: 'চাকরি পাওয়া যায়নি | দৈনিক চাকরি',
      description: 'অনুরোধকৃত চাকরির বিজ্ঞপ্তিটি পাওয়া যায়নি বা মেয়াদোত্তীর্ণ হয়েছে।',
    };
  }

  const seoTitle = job.seo?.title || `${job.title} | দৈনিক চাকরি`;
  const seoDescription =
    job.seo?.description ||
    stripHtml(job.description || '').substring(0, 160) ||
    'চাকরির বিস্তারিত বিজ্ঞপ্তি ও আবেদন পদ্ধতি পড়ুন দৈনিক চাকরি ওয়েবসাইটে।';

  const canonicalUrl = `https://dailyjobs.bd/job/${job.slug}`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      type: 'article',
      publishedTime: job.published_at || undefined,
      modifiedTime: job.updated_at || undefined,
      ...(job.thumbnail_url ? { images: [{ url: job.thumbnail_url }] } : {}),
    },
  };
}

export default async function JobDetailsPage({ params }: JobDetailsProps) {
  const { slug } = await params;
  const job = await getJobDetail(slug);

  if (!job) {
    notFound();
  }

  const validApplyLink = isValidHttpUrl(job.apply_link) ? job.apply_link : null;
  const images = (job.circular_images || []).filter((img) => Boolean(img.url));

  return (
    <div className="min-h-screen bg-slate-50/80 py-6 sm:py-10">
      {/* ভিউ কাউন্ট প্রক্সি কম্পোনেন্ট (ডিডুপ্লিকেটেড সেশন ট্র্যাকার) */}
      <ViewCounter jobId={job.id} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ব্যাক বাটন */}
        <div className="mb-5 sm:mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors text-xs sm:text-sm font-semibold bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            সকল বিজ্ঞপ্তিতে ফিরে যান
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">

          {/* মূল কন্টেন্ট (বাম পাশ) */}
          <div className="grow lg:w-2/3 bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100 overflow-hidden">

            {/* থাম্বনেইল ব্যানার (যদি থাকে) */}
            {job.thumbnail_url && (
              <div className="w-full bg-slate-50 border-b border-slate-100 p-4 sm:p-6 flex justify-center">
                <div className="relative w-full max-w-sm h-48 sm:h-60">
                  <Image
                    src={job.thumbnail_url}
                    alt={job.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 400px"
                    priority
                    className="object-contain rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="p-5 sm:p-8 md:p-10">

              {/* ক্যাটাগরি ব্যাজ */}
              {job.category && (
                <div className="mb-3">
                  <Link
                    href={`/category/${job.category.slug}`}
                    className="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 text-xs font-bold px-3 py-1 rounded-md transition-colors"
                  >
                    {job.category.name}
                  </Link>
                </div>
              )}

              {/* জব টাইটেল */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 mb-3 leading-snug">
                {job.title}
              </h1>

              {/* প্রতিষ্ঠান */}
              {job.organization_name && (
                <p className="text-base sm:text-lg font-semibold text-slate-700 mb-6">
                  {job.organization_name}
                </p>
              )}

              {/* মূল তথ্য হাইলাইট গ্রিড */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-700 mb-8">
                {job.circular_published_date && (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">প্রকাশের তারিখ</span>
                    <span className="font-bold">{job.circular_published_date}</span>
                  </div>
                )}
                {job.deadline && (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">আবেদনের শেষ তারিখ</span>
                    <span className="font-bold text-red-600">{job.deadline}</span>
                  </div>
                )}
                {job.vacancies !== null && job.vacancies > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">মোট পদসংখ্যা</span>
                    <span className="font-bold">{toBengaliDigits(job.vacancies)} জন</span>
                  </div>
                )}
                {job.location && (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">কর্মস্থল</span>
                    <span className="font-bold">{job.location}</span>
                  </div>
                )}
                {job.application_method && (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">আবেদনের মাধ্যম</span>
                    <span className="font-bold capitalize">{job.application_method}</span>
                  </div>
                )}
                {job.days_left !== null && (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">বাকি সময়</span>
                    <span className={`font-bold ${job.days_left <= 3 ? 'text-red-600' : 'text-slate-800'}`}>
                      {job.days_left < 0
                        ? 'সময় শেষ'
                        : job.days_left === 0
                        ? 'আজই শেষ দিন'
                        : `${toBengaliDigits(job.days_left)} দিন বাকি`}
                    </span>
                  </div>
                )}
              </div>

              {/* বিস্তারিত বিবরণ (স্যানিটাইজড এইচটিএমএল) */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 border-l-4 border-orange-500 pl-3">
                  বিজ্ঞপ্তির বিস্তারিত বিবরণ
                </h2>
                {job.description ? (
                  <div
                    className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(job.description) }}
                  />
                ) : (
                  <p className="text-slate-500 text-sm italic bg-slate-50 p-4 rounded-xl">
                    বিজ্ঞপ্তির লিখিত বিবরণ দেওয়া নেই। অনুগ্রহ করে নিচে সংযুক্ত অফিশিয়াল সার্কুলার চিত্র দেখুন।
                  </p>
                )}
              </div>

              {/* সার্কুলার ইমেজ গ্যালারি */}
              {images.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 border-l-4 border-orange-500 pl-3">
                    অফিশিয়াল সার্কুলার বিজ্ঞপ্তি ({toBengaliDigits(images.length)} টি পাতা)
                  </h2>
                  <div className="space-y-6">
                    {images.map((img, idx) => (
                      <div key={img.page_number || idx} className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                        <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 border-b border-slate-200">
                          পাতা নং: {toBengaliDigits(img.page_number || idx + 1)}
                        </div>
                        {/* Using standard img with lazy loading to preserve document aspect ratio & full scan readability */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url!}
                          alt={`${job.title} - সার্কুলার পাতা ${img.page_number || idx + 1}`}
                          className="w-full h-auto object-contain block bg-white"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ডান পাশের আবেদন বক্স (সাইডবার) */}
          <div className="lg:w-1/3 shrink-0 w-full">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100 p-5 sm:p-6 sticky top-24 space-y-5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                আবেদন প্রক্রিয়া
              </h3>

              {validApplyLink ? (
                <>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    নিচের বাটনে ক্লিক করে অফিশিয়াল নিয়োগকারী ওয়েবসাইটে গিয়ে সরাসরি আবেদন সম্পন্ন করুন।
                  </p>
                  <a
                    href={validApplyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm sm:text-base text-center"
                  >
                    <span>অনলাইনে আবেদন করুন</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </>
              ) : (
                <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-4 text-center">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                    সরাসরি অনলাইন লিংক নেই
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    এই পদটিতে আবেদনের নিয়মাবলী জানতে বিজ্ঞপ্তির বিবরণ বা অফিশিয়াল সার্কুলার চিত্র দেখুন।
                  </p>
                </div>
              )}

              {/* আবেদনের বিশেষ নির্দেশনা */}
              {job.application_instructions && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <strong className="text-slate-800 block">আবেদনের নিয়ম:</strong>
                  <p className="leading-relaxed">{job.application_instructions}</p>
                </div>
              )}

              {/* সতর্কবার্তা */}
              <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4 leading-normal">
                ⚠️ আবেদন করার পূর্বে সার্কুলারে উল্লেখিত শিক্ষাগত যোগ্যতা ও শর্তাবলী মনোযোগ সহকারে পড়ে নিন।
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
