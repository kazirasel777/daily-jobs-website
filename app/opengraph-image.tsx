// File: app/opengraph-image.tsx
// Default share image. Latin text only, so no Bengali font has to be bundled.
import { ImageResponse } from 'next/og';

export const alt = 'DailyJobs.bd';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', background: '#062519', padding: 80, gap: 56 }}>
        <svg width="220" height="220" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill="#0d4f36" />
          <path d="M20 13h17l10 10v27a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3z" fill="#fff" />
          <path d="M37 13v10h10z" fill="#acd3be" />
          <rect x="22" y="29" width="20" height="4.5" rx="2.25" fill="#e3a018" />
          <rect x="22" y="37.5" width="20" height="3" rx="1.5" fill="#8fb5a2" />
          <rect x="22" y="44" width="13" height="3" rx="1.5" fill="#8fb5a2" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 88, fontWeight: 800, color: '#ffffff', letterSpacing: -2 }}>DailyJobs.bd</div>
          <div style={{ fontSize: 38, color: '#acd3be', marginTop: 12 }}>Job circulars in Bangladesh</div>
          <div style={{ width: 140, height: 10, background: '#e3a018', borderRadius: 5, marginTop: 36 }} />
        </div>
      </div>
    ),
    size,
  );
}
