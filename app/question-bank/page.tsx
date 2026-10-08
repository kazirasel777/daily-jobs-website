// File: app/question-bank/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import QuestionList from '@/components/QuestionList';
import { getStudyCollections, getStudyQuestions, getStudySubjects } from '@/lib/api';
import { parsePage, toBnDigits, toBnNumber } from '@/lib/format';
import { pagedPath } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { MIN_INDEXABLE_QUESTIONS, QUESTIONS_PER_PAGE } from '@/lib/study';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const SLUG = /^[a-z0-9_-]{1,191}$/i;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  const { meta } = await getStudyQuestions({ page, per_page: QUESTIONS_PER_PAGE });
  return pageMetadata({
    title: page > 1 ? `প্রশ্নব্যাংক — পৃষ্ঠা ${toBnDigits(page)}` : 'প্রশ্নব্যাংক: চাকরি পরীক্ষার প্রশ্ন, উত্তর ও ব্যাখ্যা',
    description:
      'বিসিএস ও অন্যান্য নিয়োগ পরীক্ষার প্রস্তুতির জন্য বিষয়ভিত্তিক বহুনির্বাচনী প্রশ্ন, সঠিক উত্তর ও ব্যাখ্যা। বিগত পরীক্ষার প্রশ্ন আলাদাভাবে চিহ্নিত।',
    path: pagedPath('/question-bank', page),
    index: meta.total >= MIN_INDEXABLE_QUESTIONS,
  });
}

export default async function QuestionBankPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // The old page filtered with ?subject= / ?collection=; those now have their own pages.
  if (typeof params.collection === 'string' && SLUG.test(params.collection)) {
    permanentRedirect(`/question-bank/set/${params.collection}`);
  }
  if (typeof params.subject === 'string' && SLUG.test(params.subject)) {
    permanentRedirect(`/question-bank/subject/${params.subject}`);
  }

  const page = parsePage(params.page);
  const [subjects, collections, questions] = await Promise.all([
    getStudySubjects(),
    getStudyCollections(),
    getStudyQuestions({ page, per_page: QUESTIONS_PER_PAGE }),
  ]);
  if (page > 1 && page > questions.meta.last_page) notFound();

  const activeSubjects = subjects.filter((s) => s.question_count > 0);
  const activeSets = collections.filter((c) => c.question_count > 0);

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-7 sm:py-9">
          <Breadcrumbs items={[{ name: 'প্রশ্নব্যাংক', path: '/question-bank' }]} />
          <h1 className="mt-4 font-serif text-[1.75rem] font-bold text-ink sm:text-4xl">প্রশ্নব্যাংক</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            চাকরি পরীক্ষার প্রস্তুতির জন্য প্রকাশিত প্রশ্ন, সঠিক উত্তর ও ব্যাখ্যা। প্রতিটি প্রশ্নের উৎস চিহ্নিত আছে — বিগত পরীক্ষার প্রশ্ন ও অনুশীলনী প্রশ্ন আলাদা।
          </p>
        </div>
      </section>

      <div className="container-page grid gap-10 pt-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="space-y-6">
          <nav aria-labelledby="subjects-heading" className="card p-5">
            <h2 id="subjects-heading" className="font-serif text-lg font-bold text-ink">বিষয়</h2>
            {activeSubjects.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {activeSubjects.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/question-bank/subject/${s.slug}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-ink-soft hover:bg-brand-50 hover:text-brand-800">
                      <span>{s.name}</span>
                      <span className="text-xs text-muted">{toBnNumber(s.question_count)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">এখনো কোনো বিষয়ে প্রশ্ন প্রকাশিত হয়নি।</p>
            )}
          </nav>

          {activeSets.length > 0 && (
            <nav aria-labelledby="sets-heading" className="card p-5">
              <h2 id="sets-heading" className="font-serif text-lg font-bold text-ink">পরীক্ষা ও প্রশ্নসেট</h2>
              <ul className="mt-3 space-y-1">
                {activeSets.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/question-bank/set/${c.slug}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-ink-soft hover:bg-brand-50 hover:text-brand-800">
                      <span>{c.name}</span>
                      <span className="text-xs text-muted">{toBnNumber(c.question_count)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>

        <section aria-labelledby="all-questions-heading" className="min-w-0">
          <h2 id="all-questions-heading" className="mb-2 font-serif text-xl font-bold text-ink">সব প্রশ্ন</h2>
          <QuestionList result={questions} hrefFor={(p) => pagedPath('/question-bank', p)} />
        </section>
      </div>
    </>
  );
}
