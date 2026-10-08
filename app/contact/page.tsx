// File: app/contact/page.tsx
import InfoPage from '@/components/InfoPage';
import { SITE } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'যোগাযোগ',
  description: 'তথ্য সংশোধন, প্রতিক্রিয়া বা অন্য কোনো বিষয়ে দৈনিক চাকরির সঙ্গে যোগাযোগ করুন।',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <InfoPage title="যোগাযোগ" path="/contact">
      <p>
        কোনো বিজ্ঞপ্তির তথ্যে ভুল, পুরোনো তারিখ বা ভাঙা লিংক পেলে, অথবা অন্য কোনো প্রতিক্রিয়া জানাতে ইমেইল করুন:
      </p>
      <p>
        <a href={`mailto:${SITE.email}`}><strong>{SITE.email}</strong></a>
      </p>
      <p>
        ইমেইলে বিজ্ঞপ্তির লিংক ও কোন তথ্যটি ঠিক করা দরকার তা উল্লেখ করলে দ্রুত যাচাই করা সহজ হয়।
      </p>
      <h2>চাকরির আবেদন সম্পর্কে</h2>
      <p>
        আমরা কোনো পদের জন্য আবেদন বা সিভি গ্রহণ করি না এবং নিয়োগ প্রক্রিয়ার ফলাফল সম্পর্কে তথ্য দিতে পারি না। এসব বিষয়ে সংশ্লিষ্ট নিয়োগকারী প্রতিষ্ঠানের সঙ্গে যোগাযোগ করুন।
      </p>
    </InfoPage>
  );
}
