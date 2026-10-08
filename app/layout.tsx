// File: app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Bengali, Noto_Serif_Bengali } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getJobCategoriesSafe } from '@/lib/api';
import { SITE, getSiteUrl, isPreviewDeployment } from '@/lib/site';

const sans = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  variable: '--font-bn-sans',
  display: 'swap',
});

const serif = Noto_Serif_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['600', '700'],
  variable: '--font-bn-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  // Preview deployments stay out of search; production pages decide per page.
  robots: isPreviewDeployment() ? { index: false, follow: false } : undefined,
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#062519',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await getJobCategoriesSafe();
  const gaId = process.env.GA_MEASUREMENT_ID;

  return (
    <html lang="bn" className={`${sans.variable} ${serif.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">
        <Header categories={categories} />
        <main id="main" className="grow">
          {children}
        </main>
        <Footer categories={categories} />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
