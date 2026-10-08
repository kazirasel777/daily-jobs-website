// File: lib/format.ts
// Bangla display helpers shared by server and client components.

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

export function toBnDigits(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** Formats a number with Bangla digits and South-Asian grouping (১,২৩৪). */
export function toBnNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  return toBnDigits(new Intl.NumberFormat('en-IN').format(value));
}

/** "2026-11-06" or an ISO timestamp → "৬ নভেম্বর ২০২৬" (Dhaka calendar day). */
export function formatDateBn(value: string | null | undefined): string {
  if (!value) return '';
  const ymd = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : dhakaDateString(new Date(value));
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${toBnDigits(d)} ${BN_MONTHS[m - 1]} ${toBnDigits(y)}`;
}

/** Calendar date in Asia/Dhaka as YYYY-MM-DD, or '' for an invalid date. */
export function dhakaDateString(date: Date): string {
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Days from today (Dhaka) to a YYYY-MM-DD deadline; negative once it has passed. */
export function daysUntil(deadline: string | null | undefined, now = new Date()): number | null {
  if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null;
  const today = Date.parse(`${dhakaDateString(now)}T00:00:00Z`);
  const end = Date.parse(`${deadline}T00:00:00Z`);
  if (isNaN(today) || isNaN(end)) return null;
  return Math.round((end - today) / 86_400_000);
}

export type DeadlineTone = 'closed' | 'today' | 'urgent' | 'soon' | 'open' | 'unknown';

export interface DeadlineStatus {
  tone: DeadlineTone;
  label: string;
  daysLeft: number | null;
}

/** Deadline status recomputed from the date itself so cached pages never show stale counts. */
export function deadlineStatus(deadline: string | null | undefined, precision?: string | null): DeadlineStatus {
  const daysLeft = daysUntil(deadline);
  if (daysLeft === null) return { tone: 'unknown', label: 'শেষ তারিখ বিজ্ঞপ্তিতে দেখুন', daysLeft };
  const approx = precision === 'approximate' ? ' (আনুমানিক)' : '';
  if (daysLeft < 0) return { tone: 'closed', label: 'আবেদনের সময় শেষ', daysLeft };
  if (daysLeft === 0) return { tone: 'today', label: `আজই শেষ দিন${approx}`, daysLeft };
  if (daysLeft <= 3) return { tone: 'urgent', label: `আর ${toBnDigits(daysLeft)} দিন বাকি${approx}`, daysLeft };
  if (daysLeft <= 7) return { tone: 'soon', label: `${toBnDigits(daysLeft)} দিন বাকি${approx}`, daysLeft };
  return { tone: 'open', label: `${toBnDigits(daysLeft)} দিন বাকি${approx}`, daysLeft };
}

const APPLICATION_METHODS: Record<string, string> = {
  online: 'অনলাইনে',
  offline: 'অফলাইনে',
  email: 'ইমেইলে',
  post: 'ডাকযোগে',
  in_person: 'সরাসরি',
  other: 'বিজ্ঞপ্তি অনুযায়ী',
};

export function applicationMethodLabel(method: string | null | undefined): string {
  if (!method) return '';
  return APPLICATION_METHODS[method] ?? '';
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Shortens text on a word boundary for meta descriptions. */
export function truncate(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`;
}

export function isHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Reads a positive page number from a search param; anything else becomes 1. */
export function parsePage(raw: string | string[] | undefined): number {
  if (typeof raw !== 'string' || !/^\d{1,4}$/.test(raw)) return 1;
  return Math.max(1, parseInt(raw, 10));
}
