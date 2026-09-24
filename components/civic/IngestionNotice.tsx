import type { IngestionState } from '@/types/civic';
import { formatDate } from '@/lib/format';
export function IngestionNotice({state}:{state?:IngestionState}) {
  if(!state) return <p className="mt-4 text-sm">Data integration in progress.</p>;
  const stale = !!state.lastSuccessAt && Date.now()-Date.parse(state.lastSuccessAt)>30*86400000;
  return <div className="my-6 max-w-read border-l-2 border-cobalt pl-4 text-sm leading-relaxed">
    <p>{['source-unavailable','parser-mismatch'].includes(state.status)?`Latest update could not be published. ${state.lastSuccessAt?'Previously validated records remain available.':'No validated snapshot is available.'}`:state.message}</p>
    <p className="mt-2">{state.lastSuccessAt?`Last successful retrieval: ${formatDate(state.lastSuccessAt)}.`:'No successful retrieval yet.'}{stale?' This snapshot is over 30 days old.':''}</p>
    {!!state.warnings.length&&<details className="mt-3"><summary className="cursor-pointer underline">Coverage and source notes ({state.warnings.length})</summary><ul className="mt-3 list-disc space-y-2 pl-5">{state.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></details>}
  </div>;
}
