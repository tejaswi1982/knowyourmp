import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const photo = await readFile('public/story/andheri-flyover.jpg');
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="shade" x2="1"><stop stop-color="#242522" stop-opacity=".88"/><stop offset=".72" stop-color="#242522" stop-opacity=".53"/><stop offset="1" stop-color="#242522" stop-opacity=".24"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <path d="M82 98h72" stroke="#d9ef37" stroke-width="7"/>
  <text x="82" y="145" fill="#faf9f4" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="5">KNOW YOUR MP</text>
  <text x="78" y="350" fill="#faf9f4" font-family="Arial,sans-serif" font-size="94" font-weight="900" letter-spacing="-4">PUBLIC RECORDS.</text>
  <text x="80" y="450" fill="#faf9f4" font-family="Arial,sans-serif" font-size="94" font-weight="900" letter-spacing="-4">YOUR READING.</text>
  <text x="84" y="535" fill="#d9ef37" font-family="Arial,sans-serif" font-size="26" font-weight="700" letter-spacing="3">MUMBAI NORTH-WEST · MH-27</text>
  <rect x="1080" y="490" width="42" height="42" fill="#2526ed"/>
</svg>`);
await sharp(photo).resize(1200, 630, { fit: 'cover', position: 'centre' }).grayscale().composite([{ input: overlay }]).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og-image.jpg');
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#242522' } })
  .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M15 12h9v18l17-18h12L35 31l19 21H42L24 32v20h-9z" fill="#faf9f4"/><path d="M42 43h12v9H42z" fill="#2526ed"/></svg>'), resize: { width: 180, height: 180 } }])
  .png({ compressionLevel: 9 }).toFile('public/apple-touch-icon.png');
