import Link from 'next/link';
import { CivicLabel } from '@/components/civic/Data';

export default function NotFound() {
  return (
    <div className="frame flex min-h-[60vh] flex-col justify-center py-24">
      <CivicLabel tone="cobalt">Not in the record</CivicLabel>
      <h1 className="mt-6 max-w-[12ch] font-display text-huge uppercase text-ink">
        Nothing here yet
      </h1>
      <p className="mt-8 max-w-read text-pretty text-lg leading-relaxed text-ink/75">
        Either the address is wrong, or the seat has not been published. Coverage starts with
        MH-27 Mumbai North-West and grows one verified seat at a time.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4">
        <Link
          href="/"
          className="tag-lg inline-flex min-h-[44px] items-center gap-2 font-semibold text-cobalt"
        >
          Find your representative <span aria-hidden="true">&rarr;</span>
        </Link>
        <Link
          href="/methodology"
          className="tag inline-flex min-h-[44px] items-center text-ink/65 hover:text-cobalt"
        >
          Methodology
        </Link>
      </div>
    </div>
  );
}
