// File: components/home/HomeIcons.tsx
import type { SVGProps } from 'react';

export type HomeIconName =
  | 'search'
  | 'eye'
  | 'arrow'
  | 'calendar'
  | 'grid'
  | 'building'
  | 'bank'
  | 'case'
  | 'heart'
  | 'book'
  | 'clock'
  | 'chevron'
  | 'bell';

interface HomeIconProps extends SVGProps<SVGSVGElement> {
  name: HomeIconName;
}

export default function HomeIcon({ name, className = '', ...props }: HomeIconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
    ...props,
  };

  switch (name) {
    case 'search':
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M4 12h15m-5-5 5 5-5 5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M8 3v4m8-4v4M4 11h16" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.3" />
          <rect x="14" y="3" width="7" height="7" rx="1.3" />
          <rect x="3" y="14" width="7" height="7" rx="1.3" />
          <rect x="14" y="14" width="7" height="7" rx="1.3" />
        </svg>
      );
    case 'building':
      return (
        <svg {...common}>
          <path d="M3 21h18M5 21V9h14v12M3 9l9-6 9 6M9 13v4m6-4v4" />
        </svg>
      );
    case 'bank':
      return (
        <svg {...common}>
          <path d="m2 8 10-5 10 5H2Zm2 13h16M6 11v7m6-7v7m6-7v7" />
        </svg>
      );
    case 'case':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V4h8v3M3 12c5 3 13 3 18 0M12 13v3" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-4 4 1 10 8 15 7-5 12-11 8-15Z" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m7 9 5 5 5-5" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common}>
          <path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4l-2 3Zm5 4h4" />
        </svg>
      );
    default:
      return null;
  }
}
