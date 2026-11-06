// File: components/StimulusFigure.tsx
'use client';
// The figure a question depends on (diagram strip, chart). Served as-is
// (`unoptimized`): these are small line drawings that gain nothing from
// re-encoding, and the URL may be a signed, expiring one from a private disk,
// which must not be cached by the optimizer or need an extra host allowance.
import { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/Icon';
import type { StimulusImage } from '@/types/job';

export default function StimulusFigure({ image, fallbackAlt }: { image: StimulusImage | null | undefined; fallbackAlt: string }) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <div role="note" className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-marigold-500 bg-marigold-50 p-3 text-sm text-marigold-900">
        <Icon name="alert" className="h-4 w-4 shrink-0" />
        <span>এই প্রশ্নের চিত্রটি এখন দেখানো যাচ্ছে না, তাই প্রশ্নটি অসম্পূর্ণ।</span>
        <button type="button" onClick={() => window.location.reload()} className="font-bold underline underline-offset-2">
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  const width = image.width ?? 800;
  const height = image.height ?? 450;
  const alt = image.alt || fallbackAlt;
  // Up to 2× the original, but a tall figure stops at ~400px high so the question stays near it.
  const maxWidth = Math.round(Math.min(width * 2, (width * 400) / height)) + 14;

  return (
    <figure className="m-0">
      {/* Always the whole figure in view (a sideways-scrolling strip would hide the last option),
          enlarged on wider screens. Tap/click opens the original file. */}
      <div className="-mx-2 sm:mx-0">
        <a
          href={image.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-line bg-white p-1.5"
          style={{ width: `min(100%, ${maxWidth}px)` }}
          aria-label={`চিত্রটি পূর্ণ আকারে খুলুন: ${alt}`}
        >
          <Image
            src={image.url}
            alt={alt}
            width={width}
            height={height}
            unoptimized
            className="h-auto w-full"
            onError={() => setFailed(true)}
          />
        </a>
      </div>
      <figcaption className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
        <Icon name="external" className="h-3.5 w-3.5" />
        ছোট লাগলে চিত্রে চাপ দিয়ে পূর্ণ আকারে দেখুন
      </figcaption>
    </figure>
  );
}
