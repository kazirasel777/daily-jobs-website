// File: components/Breadcrumbs.tsx
import Link from 'next/link';
import Icon from '@/components/Icon';
import { breadcrumbSchema, jsonLd } from '@/lib/seo';

export interface Crumb {
  name: string;
  path: string;
}

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail = [{ name: 'প্রথম পাতা', path: '/' }, ...items];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema(trail)) }} />
      <nav aria-label="অবস্থান" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {trail.map((item, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={item.path} className="flex min-w-0 items-center gap-1">
                {i > 0 && <Icon name="chevronRight" className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                {last ? (
                  <span aria-current="page" className="line-clamp-1 text-ink-soft">{item.name}</span>
                ) : (
                  <Link href={item.path} className="hover:text-brand-700 hover:underline">{item.name}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
