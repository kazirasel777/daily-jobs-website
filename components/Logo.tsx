// File: components/Logo.tsx
// Original DailyJobs mark: a circular notice page with a highlighted headline line.

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#0d4f36" />
      <path d="M20 13h17l10 10v27a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3z" fill="#fff" />
      <path d="M37 13v10h10z" fill="#acd3be" />
      <rect x="22" y="29" width="20" height="4.5" rx="2.25" fill="#e3a018" />
      <rect x="22" y="37.5" width="20" height="3" rx="1.5" fill="#8fb5a2" />
      <rect x="22" y="44" width="13" height="3" rx="1.5" fill="#8fb5a2" />
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
      <span className="flex flex-col leading-none">
        <span className={`font-serif text-[1.3rem] font-bold sm:text-[1.45rem] ${inverted ? 'text-white' : 'text-brand-900'}`}>
          দৈনিক চাকরি
        </span>
        <span className={`mt-1 text-[0.68rem] font-semibold tracking-[0.12em] ${inverted ? 'text-brand-200' : 'text-muted'}`}>
          DAILYJOBS.BD
        </span>
      </span>
    </span>
  );
}
