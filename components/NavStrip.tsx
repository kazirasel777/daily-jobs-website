// File: components/NavStrip.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  href: string;
  label: string;
}

/** Horizontally scrollable primary navigation; works the same on phones and desktops. */
export default function NavStrip({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="প্রধান মেনু" className="">
      <ul className="flex gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
