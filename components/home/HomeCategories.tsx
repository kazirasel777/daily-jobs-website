// File: components/home/HomeCategories.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HomeIcon, { type HomeIconName } from './HomeIcons';
import { toBnNumber } from '@/lib/format';
import type { JobCategory } from '@/types/job';

interface HomeCategoriesProps {
  categories: JobCategory[];
  totalJobs: number;
  categoryCounts: number[];
  selectedCategory?: string;
}

function getCategoryIcon(slug: string): HomeIconName {
  if (slug.includes('govt')) return 'building';
  if (slug.includes('bank')) return 'bank';
  if (slug.includes('private') || slug.includes('company')) return 'case';
  if (slug.includes('ngo')) return 'heart';
  return 'case';
}

export default function HomeCategories({
  categories,
  totalJobs,
  categoryCounts,
  selectedCategory,
}: HomeCategoriesProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 800px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsOpen(!e.matches);
    };
    onChange(mql);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return (
    <details
      className="home-categories home-panel"
      id="category-panel"
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
    >
      <summary>
        <HomeIcon name="grid" />
        বিভাগ অনুযায়ী দেখুন
        <HomeIcon name="chevron" className="chevron" />
      </summary>
      <div className="home-category-list">
        <Link
          href="/"
          scroll={false}
          className={`home-category ${!selectedCategory ? 'active' : ''}`}
        >
          <HomeIcon name="grid" />
          <span>সকল চাকরি</span>
          <span className="count">{toBnNumber(totalJobs)}</span>
        </Link>
        {categories.map((c, i) => {
          const count = categoryCounts[i];
          const isSelected = selectedCategory === c.slug;
          return (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              scroll={false}
              className={`home-category ${isSelected ? 'active' : ''}`}
            >
              <HomeIcon name={getCategoryIcon(c.slug)} />
              <span>{c.name}</span>
              <span className="count">{count !== undefined ? toBnNumber(count) : '—'}</span>
            </Link>
          );
        })}
        {/* ক্যাটাগরি তালিকার শেষে ("অন্যান্য চাকরি"-র নিচে) একবার — পুরোনো বিজ্ঞপ্তির তালিকা */}
        <Link href="/old-jobs" className="home-category">
          <HomeIcon name="clock" />
          <span>পুরোনো বিজ্ঞপ্তি</span>
        </Link>
      </div>
    </details>
  );
}
