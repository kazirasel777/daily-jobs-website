// File: app/api/revalidate/route.ts
// Laravel নোটিশ প্রকাশ/সংশোধন/অপ্রকাশ/ডিলিটের পর এখানে জানায় (X-Revalidate-Secret = REVALIDATE_SECRET)।
// শুধু জানা ট্যাগ ও নোটিশের পথ মানা হয়; অন্য কিছু নয়। REVALIDATE_SECRET না থাকলে endpoint বন্ধ।
import { timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const TAG = /^(?:notices|notice-\d{1,10}|sitemap)$/;
const PATH = /^\/(?:notices(?:\/[a-z0-9-]{1,120})?)?$/;

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET?.trim();
  const given = request.headers.get('x-revalidate-secret')?.trim() ?? '';
  if (!expected) return Response.json({ ok: false, error: 'disabled' }, { status: 404 });
  if (!sameSecret(given, expected)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let body: { tags?: unknown; paths?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const tags = (Array.isArray(body.tags) ? body.tags : []).filter((t): t is string => typeof t === 'string' && TAG.test(t)).slice(0, 10);
  const paths = (Array.isArray(body.paths) ? body.paths : []).filter((p): p is string => typeof p === 'string' && PATH.test(p)).slice(0, 10);

  // { expire: 0 }: পরীক্ষার তারিখ/বাতিলের মতো তথ্যে পুরোনো সংস্করণ আর দেখানো হবে না; পরের অনুরোধেই নতুন ডেটা
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  for (const path of paths) revalidatePath(path);

  return Response.json({ ok: true, tags, paths });
}
