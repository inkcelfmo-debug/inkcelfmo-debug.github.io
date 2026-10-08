import { cp, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODEL_ASSETS } from './slots-data.mjs';
import { renderPage } from './render.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(DIR, 'dist');

await mkdir(OUTPUT_DIR, { recursive: true });
const html = await renderPage();
await writeFile(join(OUTPUT_DIR, 'index.html'), html, 'utf8');
await writeFile(join(OUTPUT_DIR, 'wanshang.html'), html, 'utf8');
await cp(join(DIR, 'slots-data.mjs'), join(OUTPUT_DIR, 'slots-data.mjs'));
await cp(join(DIR, 'music.mp3'), join(OUTPUT_DIR, 'music.mp3'));

for (const asset of MODEL_ASSETS) {
  if (!asset.startsWith('./')) {
    throw new Error(`Model asset must be a local relative path: ${asset}`);
  }
  const filename = asset.slice(2);
  await cp(join(DIR, filename), join(OUTPUT_DIR, filename));
}

console.log(`SSR static site built in ${OUTPUT_DIR}`);
