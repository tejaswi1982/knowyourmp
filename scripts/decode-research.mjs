import { readFile, writeFile } from 'node:fs/promises';
for (const file of process.argv.slice(2)) {
  let s = await readFile(file, 'utf8');
  s = s.replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  s = s.replace(/"([^"\n]*)"\.split\(""\)\.reverse\(\)\.join\(""\)/g, (_, text) => JSON.stringify([...text].reverse().join('')));
  s = s.replace(/\b(\d+)\^(\d+)\b/g, (_, a, b) => String(Number(a) ^ Number(b)));
  await writeFile(`${file}.decoded.js`, s.replace(/;/g, ';\n'));
}
