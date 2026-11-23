// File: app/notices/feed.xml/route.ts
// সর্বশেষ ৩০টি নোটিশের RSS। Google Search Console-এ sitemap হিসেবে জমা দেওয়া যায়
// (Google XML sitemap-এর পাশাপাশি RSS/Atom feed-কে নতুন URL দ্রুত জানার উপায় হিসেবে পড়ে)।
import { getNotices } from '@/lib/api';
import { isNoticeIndexable, noticeDescription } from '@/lib/notice';
import { SITE, absoluteUrl, noticePath } from '@/lib/site';

// বিল্ডের সময় API-র উপর নির্ভর নয় (sitemap-এর মতো): অনুরোধে তৈরি, API ডেটা ট্যাগসহ ক্যাশ থেকে
export const dynamic = 'force-dynamic';

function xml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string);
}

export async function GET() {
  // API বন্ধ থাকলে খালি feed নয়, ত্রুটি (ক্রলার পরে আবার চেষ্টা করে; পুরোনো ক্যাশ থাকলে সেটাই যায়)
  const res = await getNotices({ per_page: 30 });
  const items = res.data
    .filter(isNoticeIndexable)
    .map((n) => {
      const url = absoluteUrl(noticePath(n));
      const date = n.published_at ? new Date(n.published_at) : null;
      return [
        '<item>',
        `<title>${xml(n.title)}</title>`,
        `<link>${xml(url)}</link>`,
        `<guid isPermaLink="false">dailyjobs-notice-${n.id}</guid>`,
        `<description>${xml(noticeDescription(n, 300))}</description>`,
        `<category>${xml(n.kind_label)}</category>`,
        date && !isNaN(date.getTime()) ? `<pubDate>${date.toUTCString()}</pubDate>` : '',
        '</item>',
      ].join('');
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xml(`নোটিশ, পরীক্ষার সময়সূচি ও ফলাফল | ${SITE.name}`)}</title>
<link>${xml(absoluteUrl('/notices'))}</link>
<atom:link href="${xml(absoluteUrl('/notices/feed.xml'))}" rel="self" type="application/rss+xml" />
<description>সরকারি নিয়োগ পরীক্ষার সময়সূচি, প্রবেশপত্র, মৌখিক পরীক্ষা ও ফলাফলের নোটিশ।</description>
<language>bn-BD</language>
${items}
</channel>
</rss>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' },
  });
}
