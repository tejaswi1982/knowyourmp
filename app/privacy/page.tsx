import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What KnowYourMP stores when someone submits a public-work observation or source.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <article className="frame max-w-read py-14 sm:py-20">
    <p className="tag text-cobalt">Privacy</p>
    <h1 className="mt-5 font-display text-big uppercase">What this pilot stores</h1>
    <p className="mt-6 leading-relaxed">KnowYourMP does not use analytics, advertising trackers, or non-essential cookies. Following a constituency stores a preference in local storage on this device; it does not subscribe you to messages.</p>
    <h2 className="mt-10 font-display text-mid uppercase">If you submit evidence</h2>
    <p className="mt-4 leading-relaxed">A public-work observation or supporting source can include your note, the date you provide, submitted photographs or documents, and an upload time. Submissions are private while pending moderation. If approved, the submitted evidence and safe attachments become public, labelled as citizen-submitted. Do not include faces, personal documents, or information you do not want published.</p>
    <p className="mt-4 leading-relaxed">The pilot uses an essential, HttpOnly session cookie to show your submission receipt and status on this device. It expires after 90 days. No account, email address, precise location, or image GPS metadata is requested. Photographs are re-encoded to remove image metadata; documents are not metadata-scrubbed. Original filenames are visible only to moderators.</p>
    <p className="mt-4 leading-relaxed">Submissions are stored on the pilot operator’s application disk for moderation. The current pilot has no self-service deletion, retention schedule, or public correction and removal contact channel. Keep your receipt if you may need an operator to locate a submission. Do not submit sensitive material.</p>
    <h2 className="mt-10 font-display text-mid uppercase">Public records and external links</h2>
    <p className="mt-4 leading-relaxed">The civic records shown here come from cited public sources. Opening a source link takes you to that publisher, which has its own privacy practices. Public pages may be read without an account.</p>
    <p className="mt-10"><Link className="text-cobalt underline underline-offset-4" href="/site-use">Site use and data notes</Link></p>
  </article>;
}
