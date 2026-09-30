import type { Metadata } from 'next';
import Link from 'next/link';
import { PinLookup } from '@/components/civic/PinLookup';
import photo from '@/data/photography/andheri-flyover.json';

export const metadata: Metadata = {
  title: 'Enter your PIN code',
  description: 'Enter your PIN code to begin. Explore your representative’s public record, Parliament and public money, with sources.',
  alternates: { canonical: '/' },
  openGraph: { url: '/', images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'KnowYourMP, public records for Mumbai North-West' }] },
};

export default function HomePage() {
  return <div className="entry-page">
    {/* The crop contains only photographic pixels. All interface text is in flow. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="entry-photo" src="/story/andheri-flyover.jpg" width={1600} height={1200}
      alt="Concrete spans of the Andheri flyover receding along the Western Express Highway, with an open road in the foreground. Photographed in 2010."
      fetchPriority="high" loading="eager" decoding="async"/>
    <div className="entry-wash" aria-hidden="true"/>
    <div className="entry-content">
      <div className="entry-masthead">
        <Link href="/" className="entry-brand" aria-label="KnowYourMP home">KnowYourMP</Link>
        <a className="entry-home-link" href="https://www.abhinandantejaswi.com/">Home ↗</a>
      </div>
      <div id="find" className="entry-invitation">
        <h1><label htmlFor="lookup">Enter your PIN code</label></h1>
        <PinLookup/>
      </div>
      <footer className="entry-footer">
        <Link href="/methodology">Methodology</Link>
        <details className="entry-credit">
          <summary>Photo credit <span aria-hidden="true">↗</span></summary>
          <div>
            <p>Andheri flyover, Western Express Highway · 15 January 2010.</p>
            <p>Photograph: {photo.creator}. <a href={photo.page}>Original photograph ↗</a></p>
            <p><a href={photo.licenseUrl}>{photo.license} ↗</a>. Grayscale, tonal overlay and responsive crop; original JPEG unchanged. Photographic adaptations use the same license.</p>
          </div>
        </details>
      </footer>
    </div>
  </div>;
}
