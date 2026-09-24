// File: components/JobCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { JobListItem } from '@/types/job';

function toBengaliDigits(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '';
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (x) => digits[Number(x)]);
}

function formatDeadlineStatus(deadline: string | null, daysLeft: number | null): { text: string; isUrgent: boolean } {
  if (!deadline) {
    return { text: 'বিজ্ঞপ্তি দেখুন', isUrgent: false };
  }

  if (daysLeft === null) {
    return { text: `শেষ সময়: ${deadline}`, isUrgent: false };
  }

  if (daysLeft < 0) {
    return { text: 'আবেদনের সময় পার হয়েছে', isUrgent: true };
  }

  if (daysLeft === 0) {
    return { text: 'আজই শেষ দিন!', isUrgent: true };
  }

  if (daysLeft <= 3) {
    return { text: `${toBengaliDigits(daysLeft)} দিন বাকি (${deadline})`, isUrgent: true };
  }

  return { text: `শেষ সময়: ${deadline}`, isUrgent: false };
}

export default function JobCard({ job }: { job: JobListItem }) {
  const detailUrl = `/job/${job.slug || job.id}`;
  const deadlineInfo = formatDeadlineStatus(job.deadline, job.days_left);

  return (
    <article className="group bg-white rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-100 hover:border-orange-200 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden mb-4">

      {/* বাম পাশের সূক্ষ্ম কালার ইন্ডিকেটর */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 rounded-l-2xl"></div>

      <div className="flex flex-row gap-4 sm:gap-5 items-start">

        {/* থাম্বনেইল ছবি বা ডিফল্ট আইকন */}
        <Link href={detailUrl} className="shrink-0 block" tabIndex={-1} aria-hidden="true">
          <div className="w-20 sm:w-24 md:w-28 aspect-square rounded-xl border border-slate-100 flex items-center justify-center bg-slate-50 group-hover:bg-orange-50/30 transition-colors overflow-hidden relative">
            {job.thumbnail_url ? (
              <Image
                src={job.thumbnail_url}
                alt={job.title}
                fill
                sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
                className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-orange-500 p-2 text-center transition-colors">
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wider line-clamp-1">
                  {job.category?.name || 'চাকরি'}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* জবের মূল তথ্য */}
        <div className="grow min-w-0">

          {/* ক্যাটাগরি ও নতুন ব্যাজ */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {job.category && (
              <Link
                href={`/category/${job.category.slug}`}
                className="inline-block bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-0.5 rounded-md transition-colors"
              >
                {job.category.name}
              </Link>
            )}
            {job.recently_added && (
              <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                সদ্য প্রকাশিত
              </span>
            )}
          </div>

          {/* জব টাইটেল */}
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
            <Link href={detailUrl}>
              {job.title}
            </Link>
          </h2>

          {/* প্রতিষ্ঠানের নাম */}
          {job.organization_name && (
            <p className="text-slate-600 font-medium text-xs sm:text-sm mt-1 line-clamp-1">
              {job.organization_name}
            </p>
          )}

          {/* মেটা ইনফো (লোকেশন, পদসংখ্যা) */}
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-2.5 text-xs text-slate-500">
            {job.location && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>
            )}

            {job.vacancies !== null && job.vacancies > 0 && (
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                পদসংখ্যা: {toBengaliDigits(job.vacancies)} জন
              </span>
            )}
          </div>

          {/* ডেডলাইন ও ডিটেইল বাটন */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 w-fit ${
                deadlineInfo.isUrgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {deadlineInfo.text}
            </span>

            <Link
              href={detailUrl}
              className="bg-slate-900 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors text-center shadow-xs w-full sm:w-auto"
            >
              বিস্তারিত দেখুন
            </Link>
          </div>

        </div>

      </div>
    </article>
  );
}