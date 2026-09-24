import { notFound } from 'next/navigation';
import { getWork } from '@/lib/works';
import { VerificationForm } from '@/components/civic/VerificationForm';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Submit a citizen observation', robots: { index: false, follow: true } };
export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWork(id); if (!work) notFound();
  return <VerificationForm work={work} id={id} kind="observation"/>;
}
