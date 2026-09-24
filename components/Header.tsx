// File: components/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const NAV_LINKS = [
  { href: '/', label: 'হোম' },
  { href: '/category/govt_jobs', label: 'সরকারি চাকরি' },
  { href: '/category/bank_jobs', label: 'ব্যাংক জবস' },
  { href: '/category/private_jobs', label: 'প্রাইভেট চাকরি' },
  { href: '/question-bank', label: 'প্রশ্ন ব্যাংক' },
  { href: '/current-affairs', label: 'সাম্প্রতিক' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        
        {/* লোগো */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/daily_jobs_logo.png"
            alt="দৈনিক চাকরি লোগো"
            width={160}
            height={40}
            priority
            className="w-auto h-10 sm:h-11 object-contain transition-transform group-hover:scale-102"
          />
        </Link>

        {/* ডেস্কটপ নেভিগেশন মেনু */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 font-medium text-slate-700 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-orange-600 transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ডানদিকের সার্চ শর্টকাট ও মোবাইল বাটন */}
        <div className="flex items-center gap-3">
          <Link
            href="/#search-section"
            className="hidden sm:inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            সার্চ করুন
          </Link>

          {/* মোবাইল মেনু টগল বাটন */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            aria-expanded={mobileMenuOpen}
            aria-label="মেনু খুলুন"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* মোবাইল মেনু ড্রয়ার */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-fadeIn">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/#search-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              চাকরি খুঁজুন
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}