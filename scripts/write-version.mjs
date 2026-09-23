// Records which bundle this deploy published, so a browser holding a cached
// index.html can notice it is running an older one. Runs after vite build.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const bundle = html.match(/assets\/(index-[A-Za-z0-9_-]+\.js)/)?.[1];

if (!bundle) {
  console.error('write-version: no bundle found in dist/index.html');
  process.exit(1);
}

fs.writeFileSync(
  path.join(dist, 'version.json'),
  `${JSON.stringify({ bundle, builtAt: new Date().toISOString() }, null, 2)}\n`,
  'utf8',
);
console.log(`write-version: ${bundle}`);
