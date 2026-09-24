'use client';
import { useEffect, useState } from 'react';
export function FollowArea({ pin = '400053' }: { pin?: string }) {
  const [followed, setFollowed] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { try { setFollowed(localStorage.getItem(`civic-follow-${pin}`) === 'true'); } catch { /* Storage is optional. */ } }, [pin]);
  return <span className="follow-area"><button type="button" aria-pressed={followed} onClick={() => { try { localStorage.setItem(`civic-follow-${pin}`, String(!followed)); setFollowed(!followed); } catch { setError('This browser could not save your preference.'); } }}>{followed ? `Following ${pin} · unfollow` : `Follow ${pin}`}</button><small>{error || (followed ? 'Saved on this device. Notifications are not enabled.' : '')}</small></span>;
}
export function ContributionSummary() {
  const [summary, setSummary] = useState<{worksChecked: number; documentsAdded: number} | null>(null);
  useEffect(() => { fetch('/api/contributions/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(setSummary).catch(() => undefined); }, []);
  if (!summary || (!summary.worksChecked && !summary.documentsAdded)) return null;
  return <aside className="civic-summary"><h2>Your contributions</h2><p>{summary.worksChecked} works checked · {summary.documentsAdded} documents added</p><small>Submissions from this browser, including those awaiting moderation.</small></aside>;
}
