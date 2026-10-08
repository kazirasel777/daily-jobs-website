// File: lib/study.ts
/** Question pages with fewer questions than this stay readable but are not indexed. */
export const MIN_INDEXABLE_QUESTIONS = 10;

export const QUESTIONS_PER_PAGE = 20;

export function originLabel(origin: string): { label: string; className: string } {
  switch (origin) {
    case 'past_exam':
      return { label: 'বিগত পরীক্ষার প্রশ্ন', className: 'bg-brand-50 text-brand-800 ring-brand-600/25' };
    case 'admin_written':
      return { label: 'সম্পাদকীয় অনুশীলনী', className: 'bg-marigold-50 text-marigold-900 ring-marigold-500/40' };
    default:
      return { label: 'অনুশীলনী প্রশ্ন', className: 'bg-stone-100 text-stone-700 ring-stone-300' };
  }
}
