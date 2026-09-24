import Link from 'next/link';
import HeroSearch from '@/components/HeroSearch';
import CategorySidebar from '@/components/CategorySidebar';
import JobCard from '@/components/JobCard';
import Pagination from '@/components/Pagination';
import { getJobCategories, getJobs } from '@/lib/api';

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;

  // Accept both 'q' and legacy 'search', preferring 'q'
  const rawQuery = resolvedParams.q || resolvedParams.search;
  const searchQuery = typeof rawQuery === 'string' ? rawQuery.trim() : '';

  const rawCategory = resolvedParams.category;
  const currentCategory = typeof rawCategory === 'string' && rawCategory !== 'all' ? rawCategory.trim() : '';

  const rawPage = resolvedParams.page;
  const currentPage = typeof rawPage === 'string' ? Math.max(1, parseInt(rawPage, 10) || 1) : 1;

  // Concurrent fetch using typed API layer
  const [categories, jobsResponse] = await Promise.all([
    getJobCategories(),
    getJobs({
      category: currentCategory,
      q: searchQuery,
      page: currentPage,
      per_page: 20,
    }),
  ]);

  const jobs = jobsResponse.data;
  const meta = jobsResponse.meta;

  const hasSearch = Boolean(searchQuery);
  const selectedCategoryName = categories.find((c) => c.slug === currentCategory)?.name;

  return (
    <div className="min-h-screen bg-slate-50">
      <HeroSearch defaultQuery={searchQuery} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ফিল্টার / সার্চ স্ট্যাটাস বার */}
        {(hasSearch || selectedCategoryName) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {hasSearch && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm px-3.5 py-1.5 rounded-lg shadow-2xs font-medium">
                অনুসন্ধান: <strong className="text-orange-600 font-bold">&quot;{searchQuery}&quot;</strong>
              </span>
            )}
            {selectedCategoryName && (
              <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs sm:text-sm px-3.5 py-1.5 rounded-lg font-medium">
                ক্যাটাগরি: <strong className="font-bold">{selectedCategoryName}</strong>
              </span>
            )}
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-orange-600 underline ml-2 transition-colors"
            >
              ফিল্টার মুছুন
            </Link>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* জবের তালিকা (বাম পাশ) */}
          <div className="flex-1 w-full space-y-4">
            {jobs.length > 0 ? (
              <>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pb-2">
                  <span>সর্বশেষ বিজ্ঞপ্তি (পৃষ্ঠা {meta.current_page} / {meta.last_page})</span>
                  <span>মোট {meta.total} টি চাকরি</span>
                </div>

                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}

                {/* পেজিনেশন */}
                <Pagination currentPage={meta.current_page} lastPage={meta.last_page} />
              </>
            ) : (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                  কোনো চাকরির বিজ্ঞপ্তি পাওয়া যায়নি
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                  {hasSearch
                    ? `"${searchQuery}" এর সাথে মিলে এমন কোনো সক্রিয় বিজ্ঞপ্তি এই মুহূর্তে নেই। অন্য কি-ওয়ার্ড দিয়ে চেষ্টা করুন।`
                    : 'এই মুহূর্তে কোনো নতুন চাকরির বিজ্ঞপ্তি পাওয়া যায়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'}
                </p>
                {hasSearch && (
                  <Link
                    href="/"
                    className="inline-block mt-4 text-xs font-bold text-orange-600 hover:text-orange-700 underline"
                  >
                    সকল বিজ্ঞপ্তিতে ফিরে যান
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* সাইডবার (ডান পাশ) */}
          <CategorySidebar categories={categories} currentCategory={currentCategory} />

        </div>
      </section>
    </div>
  );
}