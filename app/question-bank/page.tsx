// File: app/question-bank/page.tsx
import type { Metadata } from 'next';
import { sanitizeRichText } from '@/lib/sanitize';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { getStudySubjects, getStudyCollections, getStudyQuestions } from '@/lib/api';
import type { Question } from '@/types/job';

interface QuestionBankProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: 'প্রশ্ন ব্যাংক ও চাকরির প্রস্তুতি',
  description:
    'বিসিএস, ব্যাংক, প্রাথমিক শিক্ষক নিয়োগ এবং সরকারি চাকরির বিগত পরীক্ষার প্রশ্ন ও ব্যাখ্যাসহ প্রস্তুতিমূলক এমসিকিউ অনুশীলন।',
  alternates: {
    canonical: 'https://dailyjobs.bd/question-bank',
  },
  openGraph: {
    title: 'প্রশ্ন ব্যাংক ও চাকরির প্রস্তুতি | দৈনিক চাকরি',
    description: 'বিসিএস, ব্যাংক এবং সরকারি চাকরির বিগত ও মডেল টেস্টের প্রশ্ন সমাধান ও ব্যাখ্যাসহ পড়ুন।',
    url: 'https://dailyjobs.bd/question-bank',
    type: 'website',
  },
};

function getOriginBadge(origin: string): { label: string; className: string } {
  switch (origin) {
    case 'past_exam':
      return {
        label: 'বিগত পরীক্ষার প্রশ্ন',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'admin_written':
      return {
        label: 'বিশেষ মডেল টেস্ট',
        className: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case 'agent_generated':
      return {
        label: 'অনুশীলন প্রশ্ন',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    default:
      return {
        label: 'এমসিকিউ',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

function QuestionItem({ question, index }: { question: Question; index: number }) {
  const origin = getOriginBadge(question.origin);
  const optionKeys = ['a', 'b', 'c', 'd'] as const;
  const optionLabels: Record<string, string> = { a: 'ক', b: 'খ', c: 'গ', d: 'ঘ' };

  return (
    <article className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-2xs mb-4">
      {/* টপ মেটা */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold text-slate-400">প্রশ্ন নং #{question.id}</span>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${origin.className}`}>
          {origin.label}
        </span>
      </div>

      {/* উদ্দীপক / অনুচ্ছেদ (যদি থাকে) */}
      {question.stimulus && (
        <div className="mb-4 p-3.5 bg-slate-50 border-l-3 border-orange-500 rounded-r-xl text-xs sm:text-sm text-slate-700">
          {question.stimulus.title && (
            <strong className="block text-slate-900 mb-1">{question.stimulus.title}</strong>
          )}
          <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(question.stimulus.body) }} />
        </div>
      )}

      {/* মূল প্রশ্ন */}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 leading-relaxed">
        {index}. {question.question_text}
      </h3>

      {/* অপশন গ্রিড */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        {optionKeys.map((opt) => {
          const text = question.options[opt];
          if (!text) return null;
          const isCorrect = question.correct_option === opt;

          return (
            <div
              key={opt}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs sm:text-sm transition-colors ${
                isCorrect
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCorrect
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {optionLabels[opt]}
              </span>
              <span className="grow pt-0.5 leading-relaxed">{text}</span>
              {isCorrect && (
                <span className="text-emerald-600 text-xs font-bold shrink-0 pt-0.5">✓ সঠিক উত্তর</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ব্যাখ্যা */}
      {question.explanation && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600 bg-orange-50/40 p-3.5 rounded-xl border border-orange-100">
          <strong className="text-orange-900 block mb-1">ব্যাখ্যা:</strong>
          <p className="leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </article>
  );
}

export default async function QuestionBankPage({ searchParams }: QuestionBankProps) {
  const resolvedParams = await searchParams;

  const currentSubject = typeof resolvedParams.subject === 'string' ? resolvedParams.subject.trim() : '';
  const currentCollection = typeof resolvedParams.collection === 'string' ? resolvedParams.collection.trim() : '';
  const rawPage = resolvedParams.page;
  const currentPage = typeof rawPage === 'string' ? Math.max(1, parseInt(rawPage, 10) || 1) : 1;

  const [subjects, collections, questionsRes] = await Promise.all([
    getStudySubjects(),
    getStudyCollections(),
    getStudyQuestions({
      subject: currentSubject || undefined,
      collection: currentCollection || undefined,
      page: currentPage,
      per_page: 20,
    }),
  ]);

  const questions = questionsRes.data;
  const meta = questionsRes.meta;

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* হেডার */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            প্রশ্ন ব্যাংক ও প্রস্তুতি
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            বিসিএস, ব্যাংক ও সরকারি চাকরি পরীক্ষার অধ্যায়ভিত্তিক প্রশ্ন, সঠিক উত্তর ও বিশ্লেষণ
          </p>
        </div>

        {/* ফিল্টার ট্যাব: বিষয় ও সংগ্রহ */}
        <div className="mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
          {/* বিষয় ফিল্টার */}
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-2">বিষয় নির্বাচন করুন:</span>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/question-bank"
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  !currentSubject
                    ? 'bg-orange-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                সব বিষয়
              </Link>
              {subjects.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/question-bank?subject=${sub.slug}${currentCollection ? `&collection=${currentCollection}` : ''}`}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    currentSubject === sub.slug
                      ? 'bg-orange-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sub.name} {sub.question_count > 0 && `(${sub.question_count})`}
                </Link>
              ))}
            </div>
          </div>

          {/* সংগ্রহ ফিল্টার (যদি থাকে) */}
          {collections.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 block mb-2">পরীক্ষা ও সংগ্রহ:</span>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/question-bank${currentSubject ? `?subject=${currentSubject}` : ''}`}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    !currentCollection
                      ? 'bg-slate-800 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  সব সংগ্রহ
                </Link>
                {collections.map((col) => (
                  <Link
                    key={col.slug}
                    href={`/question-bank?collection=${col.slug}${currentSubject ? `&subject=${currentSubject}` : ''}`}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      currentCollection === col.slug
                        ? 'bg-slate-800 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {col.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* প্রশ্ন তালিকা */}
        {questions.length > 0 ? (
          <div>
            <div className="flex justify-between items-center text-xs text-slate-500 mb-3 px-1">
              <span>মোট {meta.total} টি প্রশ্ন পাওয়া গেছে</span>
              <span>পৃষ্ঠা {meta.current_page} / {meta.last_page}</span>
            </div>

            {questions.map((q, idx) => (
              <QuestionItem key={q.id} question={q} index={(meta.current_page - 1) * meta.per_page + idx + 1} />
            ))}

            <Pagination currentPage={meta.current_page} lastPage={meta.last_page} />
          </div>
        ) : (
          <div className="bg-white p-12 sm:p-16 rounded-2xl text-center border border-slate-100 shadow-2xs">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
              ?
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              অনুগ্রহ করে অন্য কোনো বিষয় বা সংগ্রহ নির্বাচন করুন অথবা ফিল্টার রিসেট করুন।
            </p>
            <Link
              href="/question-bank"
              className="inline-block mt-4 text-xs font-bold text-orange-600 hover:text-orange-700 underline"
            >
              সব প্রশ্ন দেখুন
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
