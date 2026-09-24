import type { ParliamentQuestion, ProjectRecord } from '@/types/civic';

/** Presentation-only counts; keep official labels rather than infer subjects. */
export function groupLabels(labels: (string | undefined)[]) {
  const counts = new Map<string, number>();
  for (const label of labels) {
    const name = label?.trim() || 'Not supplied';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function questionMinistries(records: ParliamentQuestion[]) {
  return groupLabels(records.map(record => record.ministry));
}

export function questionsForMinistry(records: ParliamentQuestion[], ministry: string) {
  return records.filter(record => (record.ministry?.trim() || 'Not supplied') === ministry);
}

/** A transparent chronological preview, never a selected performance sample. */
export function previewWorks(records: ProjectRecord[], limit = 4) {
  return [...records].sort((a, b) =>
    (b.recommendationDate ?? '').localeCompare(a.recommendationDate ?? '') || a.id.localeCompare(b.id)
  ).slice(0, limit);
}
