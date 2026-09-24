'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ProjectRecord } from '@/types/civic';
import { formatRupees } from '@/lib/format';
import { documentFields, observationTypes } from '@/lib/contributions/model';

export function VerificationForm({ work, id, kind }: { work: ProjectRecord; id: string; kind: 'observation' | 'document' }) {
  const [step, setStep] = useState(1); const [near, setNear] = useState(''); const [type, setType] = useState('');
  const [field, setField] = useState(''); const [url, setUrl] = useState(''); const [note, setNote] = useState('');
  const [date, setDate] = useState(''); const [files, setFiles] = useState<File[]>([]); const [previews, setPreviews] = useState<string[]>([]);
  const [ack, setAck] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [receipt, setReceipt] = useState('');
  const token = useRef(''); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { token.current = crypto.randomUUID(); setDate(new Date().toISOString().slice(0,10)); }, []);
  useEffect(() => { if (receipt) heading.current?.focus(); }, [receipt]);
  useEffect(() => { const urls = files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : ''); setPreviews(urls); return () => urls.forEach(u => u && URL.revokeObjectURL(u)); }, [files]);
  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)];
    if (next.length > 3 || next.some(f => f.size > 5 * 1024 * 1024)) { setError('Choose up to 3 files, at most 5 MB each.'); return; }
    setFiles(next); setError('');
  }
  function next() {
    if (step === 1 && kind === 'observation' && !near) return setError('Choose whether you are at or near the described location.');
    if (step === 2 && !(kind === 'observation' ? type : field)) return setError('Choose an option.');
    if (step === 3 && !files.length && (kind === 'observation' || !url)) return setError(kind === 'observation' ? 'Add at least one photograph.' : 'Add a source URL or document.');
    if (step === 4 && kind === 'document' && !note.trim()) return setError('Explain what the source documents.');
    if (step === 4 && (/[<>]/.test(note) || note.length > 600)) return setError('Use plain text without HTML, up to 600 characters.');
    setError(''); setStep(step + 1); setTimeout(() => heading.current?.focus(), 0);
  }
  async function submit() {
    if (!ack || busy) return;
    setBusy(true); setError('');
    const data = new FormData();
    for (const [key,value] of Object.entries({ near, observationType: type, field, sourceUrl: url, note, observationDate: date, acknowledged: 'true', requestId: token.current })) data.set(key, value);
    files.forEach(f => data.append('files', f));
    try {
      const response = await fetch(`/api/works/${id}/${kind === 'observation' ? 'observations' : 'documents'}`, { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit.');
      setReceipt(result.id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to submit. Please try again.'); }
    finally { setBusy(false); }
  }
  if (receipt) return <div className="civic-page civic-form"><p className="civic-kicker">Evidence received · Pending moderation</p><h1 ref={heading} tabIndex={-1}>Thanks. Your {kind === 'observation' ? 'observation' : 'source'} has been submitted for review.</h1><ul className="civic-confirmation"><li>It is not public yet.</li><li>It will appear under {kind === 'observation' ? 'Citizen checks' : 'Supporting documents'} after a moderator approves it.</li><li>The official data remains unchanged.</li></ul><p>Receipt: <code>{receipt}</code></p><p className="civic-muted">Keep this receipt if you need to request a correction or removal through the pilot operator.</p><Link className="civic-action" href={`/works/${id}#citizen-checks`}>Return to project →</Link></div>;
  const labels = ['Confirm project', kind === 'observation' ? 'What do you observe?' : 'Which part of the record?', kind === 'observation' ? 'Add photographs' : 'Add a source', kind === 'observation' ? 'Anything else you observed?' : 'What does this source show?', 'Review and submit'];
  const stages = kind === 'observation' ? ['Project', 'Observation', 'Photo', 'Note', 'Review'] : ['Project', 'Field', 'Source', 'Explanation', 'Review'];
  return <div className="civic-page civic-form"><Link className="civic-back" href={`/works/${id}`}>← Work {id}</Link><p className="civic-kicker">{kind === 'observation' ? 'Verify this work' : 'Help complete this record'} · Step {step} of 5</p><ol className="civic-steps" aria-label="Verification stages">{stages.map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol><h1 ref={heading} tabIndex={-1}>{labels[step - 1]}</h1>
    {step === 1 && <><h2>{work.description ?? work.officialTitle}</h2><p>{work.locationText ?? 'Location is described in the official text; no precise location is supplied.'}</p><p>{work.amountRecommended == null ? 'Recommended amount not supplied' : `${formatRupees(work.amountRecommended)} recommended`}</p><p>Official record says: {work.officialStatus ?? 'Status not supplied'}</p>{work.statusNote && <p>{work.statusNote}</p>}{kind === 'observation' && <fieldset><legend>Are you at or near this location?</legend>{[['yes','Yes'],['no','No'],['unsure','I am unsure']].map(([value,label]) => <label className="civic-choice" key={value}><input type="radio" name="near" value={value} checked={near === value} onChange={() => setNear(value)}/>{label}</label>)}</fieldset>}<p className="civic-muted">No GPS permission is requested. We keep only your answer about proximity, not an exact location.</p></>}
    {step === 2 && <fieldset><legend>{kind === 'observation' ? 'Choose the clearest description of what you saw.' : 'Choose the field your evidence relates to.'}</legend>{(kind === 'observation' ? observationTypes : documentFields).map(value => <label key={value} className="civic-choice"><input type="radio" name="observation" checked={(kind === 'observation' ? type : field) === value} onChange={() => kind === 'observation' ? setType(value) : setField(value)}/>{value}</label>)}</fieldset>}
    {step === 3 && <>{kind === 'document' && <label>Public source URL (HTTPS)<input type="url" maxLength={2000} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…"/></label>}<p>{kind === 'observation' ? 'At least one photograph is required.' : 'Add a PDF or photograph, or provide a source URL.'} Up to 3 files, 5 MB each. JPEG, PNG, WebP{kind === 'document' ? ' or PDF' : ''}.</p><p className="civic-muted">Avoid faces, number plates, private interiors and personal documents. Public photographs have metadata removed.{kind === 'document' && ' PDF metadata is not stripped: submit only public documents without personal information.'}</p><label className="civic-upload">Upload from device<input type="file" multiple accept={kind === 'observation' ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf'} onChange={e => { addFiles(e.target.files); e.target.value = ''; }}/></label>{kind === 'observation' && <label className="civic-upload">Take a photograph<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => { addFiles(e.target.files); e.target.value = ''; }}/></label>}</>}
    {(step === 3 || step === 5) && <div className="civic-photos">{files.map((file,i) => <figure key={`${file.name}-${i}`}>{previews[i] && <img src={previews[i]} alt={`Preview of upload ${i + 1}`}/>}<figcaption>{file.name}</figcaption>{step === 3 && <button type="button" onClick={() => setFiles(files.filter((_,j) => j !== i))}>Remove file {i + 1}</button>}</figure>)}</div>}
    {step === 4 && <><label>{kind === 'observation' ? 'Optional factual note' : 'Short explanation'}<textarea maxLength={600} rows={5} value={note} onChange={e => setNote(e.target.value)} placeholder={kind === 'observation' ? 'For example: Paving appears incomplete on approximately half the lane.' : 'Explain which part of this document relates to the missing field.'}/></label><p className="civic-muted">Describe what you can see. Avoid accusations or personal allegations. Do not include personal contact details. {note.length}/600 characters.</p><label>{kind === 'observation' ? 'When did you observe this?' : 'Date you documented this source'}<input type="date" required value={date} max={new Date().toISOString().slice(0,10)} onChange={e => setDate(e.target.value)}/></label></>}
    {step === 5 && <><h2>{work.description ?? work.officialTitle}</h2><p>{kind === 'observation' ? type : field}</p><p>Date: {date || 'Choose a date in the previous step'}</p>{kind === 'observation' && <p>At or near location: {near}</p>}{url && <p>Source: {url}</p>}{note && <p>{note}</p>}<p className="civic-muted">A moderator checks relevance, privacy and factual wording. Publication is not an independent verification of the work or a change to the official record.</p><label className="civic-choice"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)}/>I am submitting what I personally observed or documented.</label></>}
    {error && <p role="alert" className="civic-error">{error}</p>}<div className="civic-form-actions">{step > 1 && <button type="button" disabled={busy} onClick={() => { setStep(step - 1); setError(''); }}>Back</button>}{step < 5 ? <button className="civic-action" type="button" onClick={next}>Continue →</button> : <button className="civic-action" type="button" disabled={!ack || busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit for review'}</button>}</div>
  </div>;
}
