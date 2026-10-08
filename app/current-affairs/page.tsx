// File: app/current-affairs/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { getCurrentAffairs } from '@/lib/api';
import { formatDateBn, parsePage, toBnDigits, toBnNumber } from '@/lib/format';
import { pagedPath } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const PER_PAGE = 20;
/** Fewer published items than this: readable, but kept out of the index. */
const MIN_INDEXABLE_ITEMS = 10;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  const { meta } = await getCurrentAffairs({ page, per_page: PER_PAGE });
  return pageMetadata({
    title: `সাম্প্রতিক সাধারণ জ্ঞান${page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : ''}`,
    description: 'চাকরি পরীক্ষার প্রস্তুতির জন্য জাতীয় ও আন্তর্জাতিক সাম্প্রতিক ঘটনাবলি প্রশ্ন-উত্তর আকারে, তারিখসহ।',
    path: pagedPath('/current-affairs', page),
    index: meta.total >= MIN_INDEXABLE_ITEMS,
  });
}

export default async function CurrentAffairsPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePage((await searchParams).page);
  const { data, meta } = await getCurrentAffairs({ page, per_page: PER_PAGE });
  if (page > 1 && page > meta.last_page) notFound();

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-7 sm:py-9">
          <Breadcrumbs items={[{ name: 'সাধারণ জ্ঞান', path: '/current-affairs' }]} />
          <h1 className="mt-4 font-serif text-[1.75rem] font-bold text-ink sm:text-4xl">সাম্প্রতিক সাধারণ জ্ঞান</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">নিয়োগ পরীক্ষায় আসতে পারে এমন সাম্প্রতিক তথ্য, প্রশ্ন-উত্তর আকারে।</p>
        </div>
      </section>

      <div className="container-page max-w-3xl pt-8">
        {data.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted">মোট {toBnNumber(meta.total)}টি তথ্য</p>
            <ol className="relative space-y-4 border-l-2 border-brand-100 pl-5">
              {data.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[1.72rem] top-6 h-3 w-3 rounded-full border-2 border-white bg-brand-600" aria-hidden="true" />
                  <article className="card p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {item.affair_date && <time dateTime={item.affair_date} className="font-semibold text-brand-700">{formatDateBn(item.affair_date)}</time>}
                      {item.category && <span className="rounded-md bg-paper px-2 py-0.5 text-muted">{item.category}</span>}
                    </div>
                    <h2 className="mt-2 text-lg font-bold leading-8 text-ink">{item.question}</h2>
                    <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 font-semibold text-brand-900">
                      <span className="sr-only">উত্তর: </span>
                      {item.answer}
                    </p>
                  </article>
                </li>
              ))}
            </ol>
            <Pagination currentPage={page} lastPage={meta.last_page} hrefFor={(p) => pagedPath('/current-affairs', p)} />
          </>
        ) : (
          <EmptyState
            icon="spark"
            title="এখনো কোনো তথ্য প্রকাশিত হয়নি"
            body="সাম্প্রতিক সাধারণ জ্ঞানের তথ্য প্রকাশিত হলে এখানে তারিখ অনুযায়ী দেখা যাবে।"
            action={{ href: '/question-bank', label: 'প্রশ্নব্যাংক দেখুন' }}
          />
        )}
      </div>
    </>
  );
}
