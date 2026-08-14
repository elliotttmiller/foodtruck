import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exportDir = path.join(root, 'out');
const pagesDir = path.join(root, 'docs');

if (!existsSync(exportDir)) {
  throw new Error('Static export directory "out" was not created. Ensure next.config.mjs has output: "export".');
}

await rm(pagesDir, { recursive: true, force: true });
await mkdir(pagesDir, { recursive: true });
await cp(exportDir, pagesDir, { recursive: true });

// Prevent GitHub Pages/Jekyll from ignoring Next.js' `_next` directory.
await writeFile(path.join(pagesDir, '.nojekyll'), '', 'utf8');

console.log('GitHub Pages bundle prepared in ./docs');
console.log('Publish source: main branch /docs folder');
