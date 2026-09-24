// File: app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { GoogleAnalytics } from '@next/third-parties/google';

const isPreview = process.env.VERCEL_ENV === 'preview';

export const metadata: Metadata = {
  metadataBase: new URL('https://dailyjobs.bd'),
  title: {
    default: 'দৈনিক চাকরি | সরকারি, ব্যাংক ও বেসরকারি চাকরির খবর',
    template: '%s | দৈনিক চাকরি',
  },
  description:
    'বাংলাদেশের সকল সরকারি, বেসরকারি এবং ব্যাংক চাকরির সর্বশেষ সার্কুলার ও বিজ্ঞপ্তি সবার আগে পড়ুন দৈনিক চাকরি ওয়েবসাইটে।',
  icons: {
    icon: '/favicon.ico',
  },
  alternates: {
    canonical: 'https://dailyjobs.bd',
  },
  robots: isPreview
    ? {
        index: false,
        follow: false,
      }
    : {
        index: true,
        follow: true,
      },
  openGraph: {
    title: 'দৈনিক চাকরি | সরকারি, ব্যাংক ও বেসরকারি চাকরির খবর',
    description: 'বাংলাদেশের সকল সরকারি, বেসরকারি এবং ব্যাংক চাকরির সর্বশেষ সার্কুলার ও বিজ্ঞপ্তি সবার আগে পড়ুন।',
    url: 'https://dailyjobs.bd',
    siteName: 'দৈনিক চাকরি',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.GA_MEASUREMENT_ID;

  return (
    <html lang="bn" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50/50" suppressHydrationWarning>
        <Header />
        <main className="grow">{children}</main>
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <Footer />
      </body>
    </html>
  );
}