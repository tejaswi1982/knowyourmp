import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { storageRoot } from './store';

export const mediaPath = (filename: string) => path.join(storageRoot(), 'uploads', filename);
export async function deleteMedia(filename: string) { await unlink(mediaPath(filename)).catch(() => undefined); }
export async function saveMedia(file: File, kind: 'observation' | 'document') {
  const extension = path.extname(file.name).toLowerCase();
  const formats: Record<string, string[]> = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'], ...(kind === 'document' ? { 'application/pdf': ['.pdf'] } : {}) };
  if (!formats[file.type]?.includes(extension) || file.size > 5 * 1024 * 1024 || file.size === 0) throw new Error('Use JPEG, PNG or WebP photographs, or PDF supporting documents; maximum 5 MB per file.');
  const input = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();
  let output: Buffer; let mime: string; let suffix: string;
  if (file.type === 'application/pdf') {
    if (!input.subarray(0, 8).toString().startsWith('%PDF-') || !input.subarray(-1024).includes(Buffer.from('%%EOF'))) throw new Error('The file does not appear to be a PDF.');
    output = input; mime = 'application/pdf'; suffix = '.pdf';
  } else {
    try {
      const decoder = sharp(input, { limitInputPixels: 40_000_000, animated: false });
      const meta = await decoder.metadata();
      const expected: Record<string,string> = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
      if (meta.format !== expected[file.type] || (meta.pages ?? 1) > 1) throw new Error('Invalid image.');
      output = await decoder.rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
      mime = 'image/jpeg'; suffix = '.jpg';
    } catch { throw new Error('Unable to decode this photograph. Use a valid, non-animated JPEG, PNG or WebP under 40 megapixels.'); }
  }
  const storedFilename = id + suffix;
  await mkdir(path.dirname(mediaPath(storedFilename)), { recursive: true });
  await writeFile(mediaPath(storedFilename), output, { flag: 'wx' });
  return { id, storedFilename, mime, originalFilename: file.name.replace(/^.*[\\/]/, '').replace(/[\u0000-\u001f]/g, '').slice(0, 200) };
}
