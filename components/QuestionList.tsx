// File: components/QuestionList.tsx
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import QuestionCard from '@/components/QuestionCard';
import { toBnDigits, toBnNumber } from '@/lib/format';
import type { PaginatedResponse, Question } from '@/types/job';

export default function QuestionList({ result, hrefFor }: { result: PaginatedResponse<Question>; hrefFor: (page: number) => string }) {
  const { data, meta } = result;
  const perPage = meta.per_page ?? 20;

  if (data.length === 0) {
    return (
      <EmptyState
        icon="book"
        title="এখানে এখনো কোনো প্রশ্ন প্রকাশিত হয়নি"
        body="উত্তর যাচাই করা প্রশ্ন প্রকাশিত হলে এখানে দেখা যাবে।"
        action={{ href: '/question-bank', label: 'প্রশ্নব্যাংকে ফিরে যান' }}
      />
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        মোট {toBnNumber(meta.total)}টি প্রশ্ন
        {meta.last_page > 1 && ` · পৃষ্ঠা ${toBnDigits(meta.current_page)} / ${toBnDigits(meta.last_page)}`}
      </p>
      <div className="space-y-4">
        {data.map((q, i) => (
          <QuestionCard key={q.id} question={q} number={(meta.current_page - 1) * perPage + i + 1} />
        ))}
      </div>
      <Pagination currentPage={meta.current_page} lastPage={meta.last_page} hrefFor={hrefFor} />
    </>
  );
}
