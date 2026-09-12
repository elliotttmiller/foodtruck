import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const exportDir = path.join(root, 'out');
const pagesDir = path.join(root, 'docs');
const commandCenterDir = path.join(pagesDir, 'command-center');

if (!existsSync(exportDir)) {
  throw new Error('Static export directory "out" was not created. Ensure next.config.mjs has output: "export".');
}

// The website export shares GitHub Pages with the independently built Command Center.
// Preserve its bundle when refreshing the website's static files.
const savedDir = existsSync(commandCenterDir)
  ? await mkdtemp(path.join(os.tmpdir(), 'uffda-command-center-'))
  : null;
try {
  if (savedDir) await cp(commandCenterDir, path.join(savedDir, 'command-center'), { recursive: true });
  await rm(pagesDir, { recursive: true, force: true });
  await mkdir(pagesDir, { recursive: true });
  await cp(exportDir, pagesDir, { recursive: true });
  if (savedDir) await cp(path.join(savedDir, 'command-center'), commandCenterDir, { recursive: true });
} finally {
  if (savedDir) await rm(savedDir, { recursive: true, force: true });
}

// Prevent GitHub Pages/Jekyll from ignoring Next.js' `_next` directory.
await writeFile(path.join(pagesDir, '.nojekyll'), '', 'utf8');

console.log('GitHub Pages bundle prepared in ./docs');
console.log('Publish source: main branch /docs folder');
