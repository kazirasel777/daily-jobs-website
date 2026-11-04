// File: components/JobSourceList.tsx
// একটি চাকরির উৎস, সহজ এক লাইনে: উৎসের নাম (লিংক থাকলে ক্লিকযোগ্য) · তারিখ · পৃষ্ঠা,
// আর সরাসরি বিজ্ঞপ্তির লিংক থাকলে "মূল বিজ্ঞপ্তি দেখুন"। জব পেজ ও /sources দুই জায়গায় একই।
import Icon from '@/components/Icon';
import { formatDateBn, isHttpUrl, toBnDigits } from '@/lib/format';
import type { PublicJobSource } from '@/types/job';

function pageText(page: string | null): string | null {
  if (!page?.trim()) return null;
  const p = page.trim();
  return p.startsWith('পৃষ্ঠা') ? toBnDigits(p) : `পৃষ্ঠা ${toBnDigits(p)}`;
}

function sameUrl(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const norm = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  return norm(a) === norm(b);
}

/** "যেখানে খবর পেয়েছি" (discovery) মূল উৎস নয় — অ্যাপের মতোই বাদ। */
export function visibleSources(sources: PublicJobSource[] | undefined): PublicJobSource[] {
  return (sources ?? []).filter((src) => src.source_role !== 'discovery_source');
}

export default function JobSourceList({ sources, applyLink }: { sources: PublicJobSource[]; applyLink?: string | null }) {
  return (
    <ul className="space-y-2">
      {sources.map((src) => {
        // আবেদনের লিংক কখনো উৎস হিসেবে দেখানো হয় না
        const siteUrl = isHttpUrl(src.source_url) && !sameUrl(src.source_url, applyLink) ? src.source_url : null;
        const noticeUrl = src.link_kind === 'notice' && isHttpUrl(src.button_url) ? src.button_url : null;
        const page = pageText(src.printed_page);

        return (
          <li key={src.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <p className="min-w-0 text-sm text-ink-soft">
              <span className="text-muted">উৎস: </span>
              {siteUrl ? (
                <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-800 underline-offset-2 hover:underline break-words">
                  {src.source_name}
                </a>
              ) : (
                <span className="font-semibold text-ink break-words">{src.source_name}</span>
              )}
              {src.is_verified && <span className="ml-1 text-xs text-brand-700" title="মূল বিজ্ঞপ্তির সাথে মিলিয়ে দেখা হয়েছে">✓</span>}
              {src.publication_date && <span className="text-muted"> · {formatDateBn(src.publication_date)}</span>}
              {page && <span className="text-muted"> · {page}</span>}
            </p>

            {noticeUrl && (
              <a
                href={noticeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-brand-700 hover:border-brand-600"
              >
                মূল বিজ্ঞপ্তি দেখুন
                <Icon name="external" className="h-3 w-3" />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
