// File: app/question-bank/set/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import QuestionList from '@/components/QuestionList';
import { getStudyCollections, getStudyQuestions } from '@/lib/api';
import { parsePage, toBnDigits } from '@/lib/format';
import { pagedPath } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { MIN_INDEXABLE_QUESTIONS, QUESTIONS_PER_PAGE } from '@/lib/study';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function findSet(slug: string) {
  return (await getStudyCollections()).find((c) => c.slug === slug);
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { slug } = await params;
  const page = parsePage((await searchParams).page);
  const set = await findSet(slug);
  if (!set) return { title: 'প্রশ্নসেট পাওয়া যায়নি' };
  return pageMetadata({
    title: `${set.name}: প্রশ্ন ও উত্তর${page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : ''}`,
    description: `${set.name}-এর প্রকাশিত প্রশ্ন, সঠিক উত্তর ও ব্যাখ্যা একসঙ্গে পড়ুন।`,
    path: pagedPath(`/question-bank/set/${set.slug}`, page),
    index: set.question_count >= MIN_INDEXABLE_QUESTIONS,
  });
}

export default async function SetPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const page = parsePage((await searchParams).page);
  const set = await findSet(slug);
  if (!set) notFound();

  const questions = await getStudyQuestions({ collection: set.slug, page, per_page: QUESTIONS_PER_PAGE });
  if (page > 1 && page > questions.meta.last_page) notFound();
  const basePath = `/question-bank/set/${set.slug}`;

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-7 sm:py-9">
          <Breadcrumbs items={[{ name: 'প্রশ্নব্যাংক', path: '/question-bank' }, { name: set.name, path: basePath }]} />
          <p className="eyebrow mt-4">প্রশ্নসেট</p>
          <h1 className="mt-1 font-serif text-[1.75rem] font-bold text-ink sm:text-4xl">{set.name}</h1>
          {set.job_post_id && (
            <p className="mt-2 text-sm text-muted">
              এই সেটটি একটি নিয়োগ বিজ্ঞপ্তির সঙ্গে যুক্ত। <Link href={`/job/${set.job_post_id}`} className="font-semibold text-brand-700 hover:underline">বিজ্ঞপ্তিটি দেখুন</Link>
            </p>
          )}
        </div>
      </section>
      <div className="container-page max-w-4xl pt-8">
        <QuestionList result={questions} hrefFor={(p) => pagedPath(basePath, p)} />
      </div>
    </>
  );
}
