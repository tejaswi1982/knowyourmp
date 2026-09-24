import Link from 'next/link';

/**
 * A rule with information on it, rather than a navigation bar.
 *
 * Not sticky: at these type sizes a persistent bar would eat the compositions
 * it sits above, and every page ends with its own way back.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-ink/20">
      <div className="frame flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1">
        <Link
          href="/"
          className="tag-lg inline-flex min-h-[44px] items-center font-semibold tracking-[0.16em] text-ink"
          aria-label="Know Your MP, home"
        >
          Know Your <span className="text-cobalt">MP</span>
        </Link>

        {/* Links are set at label scale, so the hit area is opened up with
            padding rather than left at the height of the type. */}
        <nav aria-label="Primary" className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/#find"
            className="tag inline-flex min-h-[44px] items-center px-1 text-ink/65 transition-colors hover:text-cobalt"
          >
            Find your MP
          </Link>
          <Link
            href="/mp/mumbai-north-west"
            className="tag hidden min-h-[44px] items-center px-1 text-ink/65 transition-colors hover:text-cobalt sm:inline-flex"
          >
            MH-27
          </Link>
          <Link
            href="/methodology"
            className="tag inline-flex min-h-[44px] items-center px-1 text-ink/65 transition-colors hover:text-cobalt"
          >
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
