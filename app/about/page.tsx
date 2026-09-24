import { permanentRedirect } from 'next/navigation';

/** `/about` and `/methodology` are the same page. One canonical URL. */
export default function AboutPage() {
  permanentRedirect('/methodology');
}
