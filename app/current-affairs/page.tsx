// File: app/current-affairs/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { getCurrentAffairs } from '@/lib/api';

interface CurrentAffairsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: 'সাম্প্রতিক সাধারণ জ্ঞান ও ঘটনাপ্রবাহ',
  description:
    'চাকরি ও ভর্তি পরীক্ষার প্রস্তুতির জন্য বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলীর সর্বশেষ সাম্প্রতিক সাধারণ জ্ঞান তথ্যাবলী।',
  alternates: {
    canonical: 'https://dailyjobs.bd/current-affairs',
  },
  openGraph: {
    title: 'সাম্প্রতিক সাধারণ জ্ঞান ও ঘটনাপ্রবাহ | দৈনিক চাকরি',
    description: 'বাংলাদেশ ও আন্তর্জাতিক সাম্প্রতিক সাধারণ জ্ঞান তথ্যাবলী পড়ুন দৈনিক চাকরি ওয়েবসাইটে।',
    url: 'https://dailyjobs.bd/current-affairs',
    type: 'website',
  },
};

export default async function CurrentAffairsPage({ searchParams }: CurrentAffairsProps) {
  const resolvedParams = await searchParams;
  const rawPage = resolvedParams.page;
  const currentPage = typeof rawPage === 'string' ? Math.max(1, parseInt(rawPage, 10) || 1) : 1;

  const affairsRes = await getCurrentAffairs({
    page: currentPage,
    per_page: 20,
  });

  const affairs = affairsRes.data;
  const meta = affairsRes.meta;

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* হেডার */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <Link
            href="/"
            className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm font-semibold mb-2 inline-flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            হোমপেজে ফিরে যান
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            সাম্প্রতিক সাধারণ জ্ঞান
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            জাতীয় ও আন্তর্জাতিক গুরুত্বপূর্ণ ঘটনাবলী ও সাম্প্রতিক তথ্যাবলী
          </p>
        </div>

        {/* তথ্য তালিকা */}
        {affairs.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-500 pb-1">
              <span>মোট {meta.total} টি সাম্প্রতিক তথ্য</span>
              <span>পৃষ্ঠা {meta.current_page} / {meta.last_page}</span>
            </div>

            {affairs.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-2xs transition-all hover:border-orange-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  {item.category && (
                    <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-md border border-orange-100">
                      {item.category}
                    </span>
                  )}
                  {item.affair_date && (
                    <span className="text-xs text-slate-400 font-medium">
                      তারিখ: {item.affair_date}
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-relaxed">
                  {item.question}
                </h2>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs sm:text-sm text-emerald-950 font-semibold leading-relaxed">
                  <span className="text-emerald-700 font-bold block text-xs mb-0.5">উত্তর:</span>
                  {item.answer}
                </div>
              </article>
            ))}

            <Pagination currentPage={meta.current_page} lastPage={meta.last_page} />
          </div>
        ) : (
          <div className="bg-white p-12 sm:p-16 rounded-2xl text-center border border-slate-100 shadow-2xs">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
              i
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              বর্তমানে কোনো সাম্প্রতিক তথ্য পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              নতুন সাধারণ জ্ঞান তথ্য প্রকাশিত হলে স্বয়ংক্রিয়ভাবে এখানে যুক্ত হবে।
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
