'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { SourceReference } from '@/types/civic';
import { formatDate } from '@/lib/format';

type SourceSummary = Omit<SourceReference, 'manifests'>;

/** Native dialog supplies focus containment, Escape and modal semantics. */
export function SourcePeek({ sources, context, caveat }: { sources: SourceSummary[]; context: string; caveat?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  return <span className="source-peek">
    <button type="button" className="source-trigger" data-source-open={id} onClick={() => ref.current?.showModal()} aria-haspopup="dialog" aria-controls={id} aria-label={`Source for ${context}`}>source ↗</button>
    <dialog ref={ref} id={id} className="source-sheet" aria-labelledby={`${id}-title`} onClick={event => { if(event.target===event.currentTarget) ref.current?.close(); }}>
      <div className="source-sheet-body"><form method="dialog"><button className="sheet-close" aria-label="Close source">Close ×</button></form>
        <h2 id={`${id}-title`}>{context}</h2>
        {caveat && <p className="source-caveat">{caveat}</p>}
        {sources.map(source=><article key={source.id}>
          <h3>{source.publisher}</h3><p>{source.title}</p>
          <dl><div><dt>Retrieved</dt><dd>{formatDate(source.retrievedAt)}</dd></div><div><dt>Reporting period</dt><dd>{source.period ?? 'Not supplied'}</dd></div></dl>
          {source.note && <p>{source.note}</p>}
          {source.deepLinkStatus==='pending' && <p>The link opens the portal; select the member and report there.</p>}
          <a href={source.url} target="_blank" rel="noreferrer">View source record ↗</a>
        </article>)}
        {!sources.length && <p>No retrieved source is available yet.</p>}
      </div>
    </dialog>
  </span>;
}

/** A non-interactive place marker, in a reserved margin rather than over facts. */
export function PlaceMarker({ pin, code }: { pin: string; code: string }) {
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    const place=document.getElementById('place');
    if(!place)return;
    const observer=new IntersectionObserver(([entry])=>setVisible(!entry.isIntersecting && entry.boundingClientRect.top<0));
    observer.observe(place);return()=>observer.disconnect();
  },[]);
  return <div className={`place-marker${visible?' is-visible':''}`} aria-hidden="true">{pin} / {code}</div>;
}
