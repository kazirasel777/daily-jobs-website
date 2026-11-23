// File: lib/notice.ts
// নোটিশের তারিখ-অবস্থা, লেখা ও SEO নিয়ম — তালিকা, বিস্তারিত পাতা, হোম ও sitemap একই নিয়ম মানে।
// কোনো তথ্য অনুমান করে বানানো হয় না: যা API দেয় না, তা দেখানো হয় না।
import type { PublicNotice } from '@/types/notice';
import { daysUntil, formatDateBn, stripHtml, toBnDigits, truncate } from '@/lib/format';

export type NoticeTone = 'exam' | 'viva' | 'admit' | 'result' | 'general' | 'news';

export function noticeTone(notice: Pick<PublicNotice, 'type' | 'kind'>): NoticeTone {
  if (notice.type === 'result') return 'result';
  if (notice.type === 'news') return 'news';
  if (notice.kind === 'admit_card') return 'admit';
  if (notice.kind === 'viva') return 'viva';
  if (notice.kind === 'exam_schedule') return 'exam';
  return 'general';
}

/** ধরন অনুযায়ী তারিখের নাম: পরীক্ষা / মৌখিক পরীক্ষা / … */
export function eventNoun(notice: Pick<PublicNotice, 'type' | 'kind'>): string {
  return notice.kind === 'viva' ? 'মৌখিক পরীক্ষা' : 'পরীক্ষা';
}

export type EventPhase = 'upcoming' | 'soon' | 'today' | 'ongoing' | 'past' | 'none';

export interface EventState {
  phase: EventPhase;
  /** কার্ড/হেডারের ছোট লেবেল, যেমন "৩ দিন বাকি", "পরীক্ষা শেষ" */
  label: string;
  daysLeft: number | null;
}

/**
 * পরীক্ষার তারিখ থেকে আজকের (ঢাকা) অবস্থা — ক্যাশ করা পাতাতেও প্রতিবার নতুন করে হিসাব।
 * স্থগিত/বাতিল নোটিশে তারিখের গণনা দেখানো হয় না (সেই তারিখ আর প্রযোজ্য নয়)।
 */
export function eventState(notice: Pick<PublicNotice, 'type' | 'kind' | 'event_date' | 'event_end_date' | 'notice_status'>): EventState {
  if (!notice.event_date || notice.notice_status === 'postponed' || notice.notice_status === 'cancelled') {
    return { phase: 'none', label: '', daysLeft: null };
  }
  const noun = eventNoun(notice);
  const start = daysUntil(notice.event_date);
  const end = daysUntil(notice.event_end_date || notice.event_date);
  if (start === null || end === null) return { phase: 'none', label: '', daysLeft: null };
  if (end < 0) return { phase: 'past', label: `${noun} শেষ`, daysLeft: start };
  if (start < 0) return { phase: 'ongoing', label: `${noun} চলছে`, daysLeft: start };
  if (start === 0) return { phase: 'today', label: `আজ ${noun}`, daysLeft: 0 };
  if (start === 1) return { phase: 'soon', label: `আগামীকাল ${noun}`, daysLeft: 1 };
  if (start <= 7) return { phase: 'soon', label: `${toBnDigits(start)} দিন বাকি`, daysLeft: start };
  return { phase: 'upcoming', label: `${toBnDigits(start)} দিন বাকি`, daysLeft: start };
}

/** "১ ডিসেম্বর ২০২৬" বা "১ – ৫ ডিসেম্বর ২০২৬" ধাঁচের তারিখ-পরিসর। */
export function eventDateText(notice: Pick<PublicNotice, 'event_date' | 'event_end_date'>): string {
  if (!notice.event_date) return '';
  const start = formatDateBn(notice.event_date);
  if (!notice.event_end_date || notice.event_end_date === notice.event_date) return start;
  return `${start} – ${formatDateBn(notice.event_end_date)}`;
}

/** কার্ড ও meta description: সম্পাদকের সারাংশ, না থাকলে বিবরণের শুরু, না থাকলে জানা তথ্য দিয়ে বাক্য। */
export function noticeDescription(notice: PublicNotice, max = 158): string {
  const summary = notice.summary?.trim();
  if (summary) return truncate(summary, max);
  const body = (notice.body_text || stripHtml(notice.body)).replace(/\s+/g, ' ').trim();
  if (body.length >= 60) return truncate(body, max);
  const parts = [
    notice.organization_name && `${notice.organization_name}-এর ${notice.kind_label} নোটিশ।`,
    notice.event_date && `${eventNoun(notice)}র তারিখ ${eventDateText(notice)}।`,
    notice.notice_date && `নোটিশের তারিখ ${formatDateBn(notice.notice_date)}।`,
  ].filter(Boolean);
  return truncate(parts.length ? parts.join(' ') : notice.title, max);
}

/** <title>: শিরোনামে প্রতিষ্ঠান না থাকলে যোগ করা হয় (Google-এ চেনার জন্য)। */
export function noticeMetaTitle(notice: PublicNotice): string {
  const org = notice.organization_name?.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const title = notice.title.trim();
  if (!org || title.includes(org)) return title;
  const withOrg = `${title} — ${org}`;
  return withOrg.length <= 90 ? withOrg : title;
}

/**
 * ইনডেক্স হবে যদি পাতায় পড়ার মতো নিজস্ব তথ্য থাকে: ৮০+ অক্ষরের বিবরণ, বা মূল নোটিশের PDF/ছবি।
 * Laravel-এর /sitemap/notices-এর `indexable`-এর সাথে একই নিয়ম।
 */
export function isNoticeIndexable(notice: PublicNotice): boolean {
  const body = (notice.body_text || stripHtml(notice.body)).trim();
  return body.length >= 80 || Boolean(notice.pdf_url) || Boolean(notice.image_url);
}

/** "পরবর্তী করণীয়" — প্রতি লাইনে একটি। */
export function nextStepLines(notice: Pick<PublicNotice, 'next_steps'>): string[] {
  return (notice.next_steps ?? '')
    .split(/\r?\n/)
    // শুধু বুলেট/ক্রমিক চিহ্ন বাদ ("১. ", "- "), লাইনের শুরুর তারিখ নয়
    .map((l) => l.trim().replace(/^(?:[•\-–*]|[০-৯0-9]{1,2}[.)])\s+/, '').trim())
    .filter(Boolean);
}

/** প্রতিষ্ঠানের নামের ছোট রূপ (কার্ডের ছবিহীন টাইলে): বন্ধনীর ইংরেজি সংক্ষেপ, না থাকলে প্রথম শব্দগুলো। */
export function orgMonogram(name: string | null | undefined): string {
  if (!name) return '';
  const abbr = /\(([A-Za-z][A-Za-z0-9 .&-]{1,14})\)/.exec(name)?.[1];
  if (abbr) return abbr.trim();
  return name.split(/\s+/).slice(0, 2).join(' ');
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
