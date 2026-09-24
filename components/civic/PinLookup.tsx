'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { lookup, lookupHref } from '@/lib/lookup';

/** One field, one action; the existing resolver remains the source of coverage. */
export function PinLookup() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [destination, setDestination] = useState('');
  const [pending, startTransition] = useTransition();
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const pin = query.trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setError('Enter a six-digit PIN code, starting with a non-zero digit.');
      input.current?.focus();
      return;
    }
    const result = lookup(pin);
    const href = lookupHref(result);
    if (!href) {
      setError('This PIN is not covered yet. Try 400053 for the Mumbai North-West pilot.');
      input.current?.focus();
      return;
    }
    setError('');
    setDestination(result.constituencyName ?? 'your constituency');
    startTransition(() => router.push(`${href}?pin=${encodeURIComponent(pin)}`));
  }

  return <form className="entry-form" onSubmit={submit} noValidate aria-busy={pending}>
    <div className="entry-field-row">
      <input ref={input} id="lookup" name="pin" type="text" inputMode="numeric" autoComplete="postal-code"
        pattern="[1-9][0-9]{5}" spellCheck={false} autoCapitalize="off" required disabled={!ready}
        value={query} placeholder="400053" aria-describedby="entry-help entry-status" aria-invalid={!!error}
        onChange={event => {setQuery(event.target.value); setError(''); setDestination('');}}/>
      <button type="submit" disabled={!ready || pending}><span>{pending ? 'Opening' : 'Find your MP'}</span><span className="entry-arrow" aria-hidden="true">↗</span></button>
    </div>
    <p id="entry-help">Mumbai North-West pilot · e.g. 400053</p>
    <p id="entry-status" className="entry-status" aria-live="polite" aria-atomic="true">{error || (pending ? `Opening ${destination}…` : '')}</p>
  </form>;
}
