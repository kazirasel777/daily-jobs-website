// File: components/JobSourceList.tsx
// একটি চাকরির উৎস: API যা পাঠায় হুবহু তা-ই (প্রকাশক, ধরন, তারিখ, পৃষ্ঠা, একটি বাটন)।
// জব পেজ ও /sources দুই জায়গায় একই নকশা, অ্যাপেও একই তথ্য।
import Icon from '@/components/Icon';
import { formatDateBn, isHttpUrl, toBnDigits } from '@/lib/format';
import type { PublicJobSource } from '@/types/job';

const TYPE_LABEL: Record<string, string> = {
  official_notice: 'অফিশিয়াল বিজ্ঞপ্তি',
  website: 'প্রতিষ্ঠানের ওয়েবসাইট',
  newspaper: 'সংবাদপত্র',
  epaper: 'ই-পেপার',
  saved_image: 'সংরক্ষিত বিজ্ঞপ্তির ছবি',
  social: 'সোশ্যাল মিডিয়া',
};

function pageText(page: string | null): string | null {
  if (!page?.trim()) return null;
  const p = page.trim();
  return p.startsWith('পৃষ্ঠা') ? toBnDigits(p) : `পৃষ্ঠা ${toBnDigits(p)}`;
}

/** "যেখানে খবর পেয়েছি" (discovery) মূল উৎস নয় — অ্যাপের মতোই বাদ। */
export function visibleSources(sources: PublicJobSource[] | undefined): PublicJobSource[] {
  return (sources ?? []).filter((src) => src.source_role !== 'discovery_source');
}

export default function JobSourceList({ sources, compact = false }: { sources: PublicJobSource[]; compact?: boolean }) {
  return (
    <ul className={compact ? 'space-y-2' : 'divide-y divide-line/60'}>
      {sources.map((src) => {
        const page = pageText(src.printed_page);
        const buttonUrl = src.button_label && isHttpUrl(src.button_url) ? src.button_url : null;
        const type = TYPE_LABEL[src.source_type] ?? 'তথ্যসূত্র';

        return (
          <li key={src.id} className={compact ? '' : 'py-3 first:pt-0 last:pb-0'}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-700">{type}</span>
                  <span className="text-sm font-semibold text-ink break-words">{src.source_name}</span>
                  {src.is_verified && (
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">✓ যাচাইকৃত</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  {src.publication_date && <span>প্রকাশ: {formatDateBn(src.publication_date)}</span>}
                  {page && <span>{page}</span>}
                  {!buttonUrl && <span>অনলাইন লিংক নেই</span>}
                </div>
              </div>

              {buttonUrl && (
                <a
                  href={buttonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-brand-700 hover:border-brand-600 hover:underline"
                >
                  {src.button_label}
                  <Icon name="external" className="h-3 w-3" />
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
