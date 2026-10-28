// File: components/home/HomeHeader.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HomeIcon from './HomeIcons';

export default function HomeHeader() {
  const [query, setQuery] = useState('');

  return (
    <header className="home-header">
      <a
        href="#main"
        className="home-sr focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:p-3"
      >
        মূল বিষয়ে যান
      </a>
      <div className="home-wrap home-header-row">
        <Link href="/" className="home-brand" aria-label="দৈনিক চাকরি — প্রথম পাতা">
          <Image
            src="/brand/dainik-chakri-logo.png"
            alt="দৈনিক চাকরি"
            width={104}
            height={64}
            priority
            style={{ width: '100%', height: 'auto' }}
          />
        </Link>

        <nav className="home-nav" aria-label="প্রধান মেনু">
          <Link href="/#jobs-heading" className="active">
            চাকরির বিজ্ঞপ্তি
          </Link>
          <Link href="/#notices">নোটিশ ও ফলাফল</Link>
          <Link href="/#question-bank">প্রশ্নব্যাংক</Link>
        </nav>

        <nav className="home-mobile-nav" aria-label="দ্রুত মেনু">
          <Link href="/#notices">নোটিশ</Link>
          <Link href="/#question-bank">প্রশ্নব্যাংক</Link>
        </nav>

        <form className="home-search" role="search" action="/search" method="get">
          <HomeIcon name="search" />
          <label className="home-sr" htmlFor="home-search-input">
            চাকরি খুঁজুন
          </label>
          <input
            id="home-search-input"
            name="q"
            type="search"
            placeholder="প্রতিষ্ঠান বা চাকরির নাম লিখুন"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="অনুসন্ধান মুছুন"
            >
              ×
            </button>
          )}
        </form>
      </div>
    </header>
  );
}
