import { notFound } from 'next/navigation';
import { getWork } from '@/lib/works';
import { VerificationForm } from '@/components/civic/VerificationForm';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Submit a supporting source', robots: { index: false, follow: true } };
export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWork(id); if (!work) notFound();
  return <VerificationForm work={work} id={id} kind="document"/>;
}
