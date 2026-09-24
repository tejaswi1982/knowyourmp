import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Private local review environment. Never writes fixture evidence to the real store.
const root = path.resolve('data/participation/journey-review');
await mkdir(root, { recursive: true });
const token = randomBytes(32).toString('hex');
await writeFile(path.join(root, 'admin-token.txt'), token);
await sharp(Buffer.from('<svg width="900" height="600"><rect width="900" height="600" fill="#dddcd2"/><text x="55" y="265" font-size="48" font-family="sans-serif" fill="#262722">REVIEW FIXTURE</text><text x="55" y="330" font-size="25" font-family="sans-serif" fill="#262722">Not a photograph of this public work.</text></svg>')).jpeg().toFile(path.join(root, 'review-fixture.jpg'));
const mode = process.argv.includes('--production') ? 'start' : 'dev';
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', mode, '--hostname', '127.0.0.1', '--port', '3199'], {
  env: { ...process.env, CIVIC_STORAGE_DIR: root, CIVIC_ADMIN_TOKEN: token }, stdio: 'inherit', windowsHide: true,
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { child.kill(); process.exit(); });
child.on('exit', code => process.exit(code ?? 0));
