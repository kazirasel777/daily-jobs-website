// File: components/HeroSearch.tsx

interface HeroSearchProps {
  defaultQuery?: string;
}

export default function HeroSearch({ defaultQuery = '' }: HeroSearchProps) {
  return (
    <section id="search-section" className="relative bg-white border-b border-slate-100 overflow-hidden pt-10 pb-12 sm:pt-14 sm:pb-16">
      {/* ব্যাকগ্রাউন্ড সূক্ষ্ম শেপ */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[240px] bg-orange-50/60 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        
        {/* প্রধান শিরোনাম */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 sm:mb-6">
          আপনার কাঙ্ক্ষিত <span className="text-orange-600">চাকরি</span> খুঁজুন
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-6 sm:mb-8 font-normal">
          সরকারি প্রতিষ্ঠান, ব্যাংক, ডিফেন্স ও শীর্ষ বেসরকারি প্রতিষ্ঠানের সাম্প্রতিক নিয়োগ বিজ্ঞপ্তি
        </p>
        
        {/* সার্চ ফর্ম — name="q" দিয়ে সাবমিট হবে */}
        <form action="/" method="GET" className="bg-white p-1.5 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row max-w-2xl mx-auto gap-2">
          <div className="flex-grow flex items-center pl-4">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={defaultQuery}
              placeholder="পদের নাম, প্রতিষ্ঠান বা বিভাগ লিখুন..."
              className="w-full py-2.5 px-3 text-slate-800 bg-transparent border-none focus:ring-0 text-sm sm:text-base outline-hidden placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-7 rounded-xl transition-colors text-sm sm:text-base sm:w-auto w-full flex-shrink-0 shadow-sm"
          >
            অনুসন্ধান
          </button>
        </form>

      </div>
    </section>
  );
}