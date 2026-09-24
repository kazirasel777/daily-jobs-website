// File: components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* টপ ফুটার গ্রিড */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          
          {/* কলাম ১: লোগো এবং পরিচিতি */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span className="bg-orange-600 text-white p-1.5 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                দৈনিক চাকরি
              </h2>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              বাংলাদেশের সকল সরকারি, বেসরকারি এবং ব্যাংক চাকরির সর্বশেষ সার্কুলার ও প্রস্তুতিমূলক তথ্য সবার আগে পাঠকদের কাছে পৌঁছে দিতে আমরা প্রতিশ্রুতিবদ্ধ।
            </p>
            <p className="text-xs text-slate-500">
              উৎস-স্বীকৃতি: বিভিন্ন জাতীয় দৈনিক ও অফিশিয়াল বিজ্ঞপ্তি থেকে সংগৃহীত।
            </p>
          </div>

          {/* কলাম ২: জনপ্রিয় ক্যাটাগরি */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 border-b border-slate-700 pb-2 inline-block">
              চাকরির ক্যাটাগরি
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/category/govt_jobs" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> সরকারি চাকরি
                </Link>
              </li>
              <li>
                <Link href="/category/bank_jobs" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> ব্যাংক জবস
                </Link>
              </li>
              <li>
                <Link href="/category/private_jobs" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> প্রাইভেট চাকরি
                </Link>
              </li>
              <li>
                <Link href="/category/defense_jobs" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> ডিফেন্স চাকরি
                </Link>
              </li>
            </ul>
          </div>

          {/* কলাম ৩: প্রস্তুতি ও প্রশ্নব্যাংক */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 border-b border-slate-700 pb-2 inline-block">
              প্রস্তুতি ও তথ্য
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/question-bank" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> বিসিএস ও প্রশ্নব্যাংক
                </Link>
              </li>
              <li>
                <Link href="/current-affairs" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> সাম্প্রতিক সাধারণ জ্ঞান
                </Link>
              </li>
              <li>
                <Link href="/#search-section" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> চাকরির সন্ধান
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> সকল বিজ্ঞপ্তি
                </Link>
              </li>
            </ul>
          </div>

          {/* কলাম ৪: নীতিমালা ও দায়িত্ব */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 border-b border-slate-700 pb-2 inline-block">
              নীতিমালা ও সতর্কতা
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              আমরা কোনো নিয়োগকারী সংস্থা নই। যেকোনো চাকরিতে আবেদনের পূর্বে মূল অফিশিয়াল সার্কুলার যাচাই করে নিজ দায়িত্বে আবেদন করার পরামর্শ দেওয়া হচ্ছে।
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>ইমেইল: info@dailyjobs.bd</p>
              <p>ওয়েবসাইট: dailyjobs.bd</p>
            </div>
          </div>

        </div>

        {/* নিচের কপিরাইট অংশ */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>
            &copy; {currentYear} <span className="text-white font-semibold">দৈনিক চাকরি (DailyJobs)</span>. সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="flex items-center gap-1.5">
            কারিগরি সহায়তা: <span className="text-slate-400 font-medium">DailyJobs Team</span>
          </p>
        </div>

      </div>
    </footer>
  );
}