// Persists one article sent from the app into the repository: the text as a row
// in content/articles.json, and each generated image downloaded and committed
// beside it. Image hosts hand out short-lived URLs, so copying the bytes here is
// what makes an article survive.
import fs from 'node:fs/promises';
import path from 'node:path';

const REPO_NAME = process.env.REPO_NAME;
const CONTENT_DIR = 'public/content';
const IMAGES_DIR = path.join(CONTENT_DIR, 'images');
const INDEX_FILE = path.join(CONTENT_DIR, 'articles.json');

/** Served path for a committed file, matching the site's base path. */
const publicPath = (file) => `/${REPO_NAME}/content/images/${file}`;

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

async function readIndex() {
  try {
    return JSON.parse(await fs.readFile(INDEX_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/** Downloads one image into the repo and returns its served path. */
async function saveImage(url, id, slot) {
  if (!url || typeof url !== 'string') return null;
  // Already ours from an earlier publish - keep it as is.
  if (url.startsWith(`/${REPO_NAME}/`)) return url;
  if (!/^https?:\/\//.test(url)) return null;

  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Could not fetch ${slot} image (${response.status}); keeping the original URL.`);
    return url;
  }

  const type = (response.headers.get('content-type') || '').split(';')[0].trim();
  const ext = EXTENSIONS[type] ?? 'jpg';
  const file = `${id}-${slot}.${ext}`;

  await fs.mkdir(IMAGES_DIR, { recursive: true });
  await fs.writeFile(path.join(IMAGES_DIR, file), Buffer.from(await response.arrayBuffer()));
  console.log(`Saved ${slot} image as ${file}`);
  return publicPath(file);
}

async function main() {
  const payload = JSON.parse(process.env.CLIENT_PAYLOAD || '{}');
  const article = payload.article;

  if (!article?.id || !article?.concept) {
    throw new Error('Payload carried no usable article (id and concept are required).');
  }

  article.images = {
    exterior: await saveImage(article.images?.exterior, article.id, 'exterior'),
    interior: await saveImage(article.images?.interior, article.id, 'interior'),
  };
  article.publishedAt = new Date().toISOString();

  const index = await readIndex();
  const at = index.findIndex((a) => a.id === article.id);
  if (at >= 0) index[at] = article;
  else index.unshift(article);

  index.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.writeFile(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

  console.log(`${at >= 0 ? 'Updated' : 'Added'} "${article.concept}". Library holds ${index.length}.`);
  await fs.appendFile(process.env.GITHUB_OUTPUT, `concept=${article.concept}\n`);
}

await main();
