import type { Metadata } from 'next';
import { Archivo, Archivo_Black, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/civic/SiteHeader';
import { SiteFooter } from '@/components/civic/SiteFooter';

/**
 * Type system.
 *
 * Archivo Black carries headline mass  -  a grotesk heavy enough to be read as
 * form rather than as text. Archivo (same family, variable) does everything
 * readable, so the page holds together without a second personality. Barlow
 * Condensed is the signage layer: constituency codes, labels, provenance,
 * status. Provenance never shares a typeface with editorial copy.
 */
const display = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const sans = Archivo({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const sign = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sign',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://knowyourmp.abhinandantejaswi.com'),
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/apple-touch-icon.png' },
  title: {
    default: 'Know Your MP: who speaks for you?',
    template: '%s | Know Your MP',
  },
  description:
    'Enter your PIN. See who represents you, what the public record says, and where the source is. No scores. No opinions.',
  openGraph: {
    title: 'Know Your MP',
    description: 'Public information about your elected representative. For citizens, by citizens.',
    type: 'website',
    siteName: 'KnowYourMP',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'KnowYourMP, public records for Mumbai North-West' }],
  },
  twitter: { card: 'summary_large_image', title: 'Know Your MP', description: 'Public information about your elected representative, with sources.', images: ['/og-image.jpg'] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${display.variable} ${sans.variable} ${sign.variable}`}
    >
      <body className="min-h-screen">
        <a
          href="#main"
          className="tag sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-acid focus:px-4 focus:py-3 focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
