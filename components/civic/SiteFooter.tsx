import Link from 'next/link';
import { getCoverage } from '@/lib/repository';
import { TOTAL_LOK_SABHA_SEATS } from '@/data/constituencies';
import { CivicLabel } from './Data';

/**
 * A manifesto fragment and a build status, not a corporate footer.
 */
export async function SiteFooter() {
  const coverage = await getCoverage();

  return (
    <footer className="bg-ink text-chalk">
      <div className="frame py-16 sm:py-20">
        <p className="font-display text-big uppercase text-balance">
          For citizens,
          <br />
          by citizens.
        </p>

        <div className="mt-14 grid gap-10 border-t border-chalk/20 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <CivicLabel tone="invert-muted">Build status</CivicLabel>
            {/* Stated in words rather than as a ratio: "1 / 543" reads like a
                score, and this is a progress note, not a performance. */}
            <p className="mt-3 font-display text-mid uppercase text-acid">
              {coverage.constituenciesLive === 1
                ? 'One seat live.'
                : `${coverage.constituenciesLive} seats live.`}
            </p>
            <p className="font-display text-mid uppercase text-chalk/70">
              {TOTAL_LOK_SABHA_SEATS - coverage.constituenciesLive} to connect.
            </p>
          </div>

          <div>
            <CivicLabel tone="invert-muted">The rules</CivicLabel>
            <ul className="tag mt-3 space-y-2 text-chalk/75">
              <li>No scores</li>
              <li>No rankings</li>
              <li>No endorsements</li>
              <li>Data has a source</li>
            </ul>
          </div>

          <nav aria-label="Footer">
            <CivicLabel tone="invert-muted">Go</CivicLabel>
            <ul className="tag mt-3 space-y-2">
              {[
                { href: '/', label: 'Find your MP' },
                { href: '/mp/mumbai-north-west', label: 'MH-27 Mumbai North-West' },
                { href: '/methodology', label: 'Methodology' },
                { href: '/api/mps', label: 'Open data' },
                { href: '/site-use', label: 'Site use and data' },
                { href: '/privacy', label: 'Privacy' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-[32px] items-center text-chalk/75 hover:text-acid"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <CivicLabel tone="invert-muted">Sourced from</CivicLabel>
            <ul className="tag mt-3 space-y-2 text-chalk/75">
              <li>Election Commission of India</li>
              <li>Lok Sabha Secretariat</li>
              <li>Digital Sansad</li>
              <li>MoSPI &middot; MPLADS</li>
            </ul>
          </div>
        </div>

        <p className="mt-14 max-w-read text-pretty text-sm leading-relaxed text-chalk/55">
          An independent citizen project. Not affiliated with, endorsed by, or speaking for any
          political party, candidate, or government body. Figures are reproduced from public
          records. Public works observations are citizen-submitted and remain labelled as such.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-chalk/20 pt-5 text-sm text-chalk/60">
          <span>Project by Abhinandan Tejaswi</span>
          <a className="min-h-[44px] inline-flex items-center hover:text-acid" href="https://abhinandantejaswi.com" target="_blank" rel="noopener noreferrer">Website ↗</a>
          <a className="min-h-[44px] inline-flex items-center hover:text-acid" href="https://www.linkedin.com/in/abhinandantejaswi/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        </div>
      </div>
    </footer>
  );
}
