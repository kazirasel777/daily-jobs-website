// File: app/question-bank/subject/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import QuestionList from '@/components/QuestionList';
import { getStudyQuestions, getStudySubjects } from '@/lib/api';
import { parsePage, toBnDigits } from '@/lib/format';
import { pagedPath } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { MIN_INDEXABLE_QUESTIONS, QUESTIONS_PER_PAGE } from '@/lib/study';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function findSubject(slug: string) {
  return (await getStudySubjects()).find((s) => s.slug === slug);
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { slug } = await params;
  const page = parsePage((await searchParams).page);
  const subject = await findSubject(slug);
  if (!subject) return { title: 'বিষয় পাওয়া যায়নি' };
  return pageMetadata({
    title: `${subject.name}: চাকরি পরীক্ষার প্রশ্ন ও উত্তর${page > 1 ? ` — পৃষ্ঠা ${toBnDigits(page)}` : ''}`,
    description: `${subject.name} বিষয়ের প্রকাশিত বহুনির্বাচনী প্রশ্ন, সঠিক উত্তর ও ব্যাখ্যা — চাকরি পরীক্ষার প্রস্তুতির জন্য।`,
    path: pagedPath(`/question-bank/subject/${subject.slug}`, page),
    index: subject.question_count >= MIN_INDEXABLE_QUESTIONS,
  });
}

export default async function SubjectPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const page = parsePage((await searchParams).page);
  const subject = await findSubject(slug);
  if (!subject) notFound();

  const questions = await getStudyQuestions({ subject: subject.slug, page, per_page: QUESTIONS_PER_PAGE });
  if (page > 1 && page > questions.meta.last_page) notFound();
  const basePath = `/question-bank/subject/${subject.slug}`;

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-7 sm:py-9">
          <Breadcrumbs items={[{ name: 'প্রশ্নব্যাংক', path: '/question-bank' }, { name: subject.name, path: basePath }]} />
          <p className="eyebrow mt-4">বিষয়ভিত্তিক প্রশ্ন</p>
          <h1 className="mt-1 font-serif text-[1.75rem] font-bold text-ink sm:text-4xl">{subject.name}</h1>
        </div>
      </section>
      <div className="container-page max-w-4xl pt-8">
        <QuestionList result={questions} hrefFor={(p) => pagedPath(basePath, p)} />
      </div>
    </>
  );
}
