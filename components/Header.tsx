// File: components/Header.tsx
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import Icon from '@/components/Icon';
import NavStrip, { type NavItem } from '@/components/NavStrip';
import type { JobCategory } from '@/types/job';

export default function Header({ categories }: { categories: JobCategory[] }) {
  const items: NavItem[] = [
    { href: '/', label: 'সর্বশেষ' },
    ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
    { href: '/question-bank', label: 'প্রশ্নব্যাংক' },
    { href: '/current-affairs', label: 'সাধারণ জ্ঞান' },
  ];

  return (
    <header className="relative z-40 bg-brand-950 md:sticky md:top-0 text-white shadow-[0_1px_0_rgba(0,0,0,0.2)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-brand-900"
      >
        মূল বিষয়ে যান
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="দৈনিক চাকরি — প্রথম পাতা" className="rounded-lg">
          <Logo inverted />
        </Link>

        <form action="/search" method="get" role="search" className="hidden max-w-md flex-1 md:block">
          <label htmlFor="header-search" className="sr-only">চাকরি খুঁজুন</label>
          <div className="flex items-center rounded-full bg-white/10 ring-1 ring-white/15 focus-within:bg-white focus-within:text-ink">
            <Icon name="search" className="ml-4 h-4 w-4 shrink-0 opacity-70" />
            <input
              id="header-search"
              type="search"
              name="q"
              maxLength={100}
              placeholder="পদ বা প্রতিষ্ঠানের নাম লিখুন"
              className="w-full bg-transparent px-3 py-2 text-sm placeholder:text-current placeholder:opacity-60 focus:outline-none"
            />
          </div>
        </form>

        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 rounded-full bg-marigold-300 px-3.5 py-2 text-sm font-bold text-brand-950 hover:bg-marigold-100 md:hidden"
        >
          <Icon name="search" className="h-4 w-4" />
          খুঁজুন
        </Link>
      </div>
      <NavStrip items={items} />
    </header>
  );
}
