import type { Constituency, Representative } from '@/types/civic';
import { fitFontSize } from '@/lib/typography';
import { cn } from '@/components/ui/cn';

/**
 * Identity without a photograph.
 *
 * Official portraits of members are not released under a licence that permits
 * redistribution, and scraping one would break the project's own rule about
 * accounting for everything it publishes. So identity is built from what is
 * unambiguously public: the name itself, the seat code, the term.
 *
 * The name is set at architectural scale and fits within the frame  -  closer to
 * a building number or a platform sign than to an avatar. The plate accepts a
 * licensed portrait later without any change to its callers.
 */
export function IdentityPlate({
  representative,
  constituency,
  className,
}: {
  representative: Representative;
  constituency: Constituency;
  className?: string;
}) {
  if (representative.portrait) {
    return (
      <figure className={cn('relative', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote portrait, unoptimised by design */}
        <img
          src={representative.portrait.src}
          alt={representative.portrait.alt}
          className="w-full"
        />
        {representative.portrait.credit && (
          <figcaption className="tag mt-2 text-chalk/55">
            {representative.portrait.credit}
          </figcaption>
        )}
      </figure>
    );
  }

  // Family name, set as the graphic element. Surname alone reads as a mark;
  // the full name is always stated in the adjacent heading.
  const parts = representative.fullName.split(' ').filter(Boolean);
  const surname = parts[parts.length - 1] ?? representative.fullName;

  return (
    <figure className={cn('relative', className)}>
      {/* No clipping. The surname was previously set to run past the right edge
          as a graphic gesture, but a cropped name reads as a rendering fault
          rather than as art direction  -  and this is the person's name, which is
          primary information. It is now sized to fit the plate exactly. */}
      <div className="relative bg-ink-raised">
        {/* A measured field  -  registration lines, not texture for its own sake. */}
        <div
          className="hairgrid pointer-events-none absolute inset-0 text-chalk/[0.07]"
          aria-hidden="true"
        />

        {/* Seat code, top edge, like a platform indicator. */}
        <div className="relative flex items-baseline justify-between gap-4 px-5 pt-5">
          <span className="tag-lg font-semibold text-acid">{constituency.code}</span>
          <span className="tag text-chalk/55">{representative.term.label}</span>
        </div>

        {/* The padded box is the sizing container, so `cqw` resolves against
            the space actually available to the text rather than the plate's
            full width  -  otherwise the fit overshoots by the padding. */}
        <div className="fit relative px-4 pb-8 pt-8">
          <p
            aria-hidden="true"
            className="font-display leading-[1.08] tracking-[-0.05em] text-chalk"
            style={{ fontSize: fitFontSize(surname, { min: '1.75rem', max: '7rem' }) }}
          >
            {surname.toUpperCase()}
          </p>
        </div>

        <div className="relative flex items-baseline justify-between gap-4 border-t border-chalk/15 px-5 py-3">
          <span className="tag text-chalk/60">{representative.party}</span>
          <span className="tag text-chalk/55">Elected {representative.term.startYear}</span>
        </div>
      </div>

      {/* Sentence case, not the signage face: this is a sentence to read, and
          the label styling set it in all caps where it stopped being legible.
          Chalk-toned because the plate sits on the ink ground. */}
      <figcaption className="mt-4 max-w-note text-pretty text-sm leading-relaxed text-chalk/70">
        No photograph included. Permission to redistribute an official portrait has not been
        verified for this project.
      </figcaption>
    </figure>
  );
}
