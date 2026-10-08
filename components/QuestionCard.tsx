// File: components/QuestionCard.tsx
// Read-only revision card: question, options, the correct answer and its explanation.
import Icon from '@/components/Icon';
import { toBnDigits } from '@/lib/format';
import { sanitizeRichText } from '@/lib/sanitize';
import { originLabel } from '@/lib/study';
import type { Question } from '@/types/job';

const OPTION_KEYS = ['a', 'b', 'c', 'd'] as const;
const OPTION_LABELS: Record<(typeof OPTION_KEYS)[number], string> = { a: 'ক', b: 'খ', c: 'গ', d: 'ঘ' };

export default function QuestionCard({ question, number }: { question: Question; number: number }) {
  const origin = originLabel(question.origin);
  const correct = question.correct_option as (typeof OPTION_KEYS)[number] | undefined;

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-serif text-sm font-bold text-muted">প্রশ্ন {toBnDigits(number)}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${origin.className}`}>{origin.label}</span>
      </div>

      {question.stimulus && (
        <div className="mt-3 rounded-xl border-l-4 border-marigold-500 bg-paper p-4 text-sm">
          {question.stimulus.title && <p className="mb-1 font-bold text-ink">{question.stimulus.title}</p>}
          <div className="prose-bn text-sm" dangerouslySetInnerHTML={{ __html: sanitizeRichText(question.stimulus.body) }} />
        </div>
      )}

      <h3 className="mt-3 text-lg font-bold leading-8 text-ink">{question.question_text}</h3>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {OPTION_KEYS.map((key) => {
          const text = question.options?.[key];
          if (!text) return null;
          const isCorrect = correct === key;
          return (
            <li
              key={key}
              className={`flex items-start gap-3 rounded-xl border p-3 text-[0.95rem] ${
                isCorrect ? 'border-brand-600 bg-brand-50 font-semibold text-brand-900' : 'border-line text-ink-soft'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isCorrect ? 'bg-brand-700 text-white' : 'bg-paper text-muted'
                }`}
                aria-hidden="true"
              >
                {OPTION_LABELS[key]}
              </span>
              <span className="pt-0.5">{text}</span>
              {isCorrect && (
                <span className="ml-auto inline-flex shrink-0 items-center gap-1 pt-0.5 text-xs font-bold text-brand-700">
                  <Icon name="check" className="h-4 w-4" />
                  সঠিক উত্তর
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {question.explanation && (
        <div className="mt-4 rounded-xl bg-marigold-50 p-4 text-sm leading-7 text-ink-soft">
          <p className="mb-1 font-bold text-marigold-900">ব্যাখ্যা</p>
          <p className="whitespace-pre-line [overflow-wrap:anywhere]">{question.explanation}</p>
        </div>
      )}
    </article>
  );
}
