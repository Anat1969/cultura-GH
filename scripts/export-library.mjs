// Copies the shared library out of the database and into the repository, as
// public/content/articles.json.
//
// This is what makes the library part of the site itself rather than something
// each visitor has to fetch successfully before they see anything. The file
// ships with the build, so the articles are on screen as soon as the page is,
// with no key, no request and no race. The database stays the live layer for
// anything written since the last deploy.
//
// Runs in CI before every build, and can be run by hand:
//   node scripts/export-library.mjs

import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT = 'https://ktqmwpbzcnzkhjskqisy.supabase.co';
const ANON = 'sb_publishable_IkreG7naPa1h-d4kGp1gpA_sLU4tg5q';
const OUT = path.join(process.cwd(), 'public', 'content', 'articles.json');

const headers = { apikey: ANON, Authorization: `Bearer ${ANON}` };

/** Database row -> the Article shape the app reads. Mirrors lib/storage.ts. */
const toArticle = (row) => ({
  id: row.id,
  concept: row.concept,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  tags: row.tags ?? [],
  dimensions: {
    lede: row.lede ?? '',
    insight: row.insight,
    spaceName: row.space_name,
    proverb: row.proverb,
    interpretation: Array.isArray(row.interpretation)
      ? row.interpretation
      : [row.interpretation].filter(Boolean),
    humanNeed: row.human_need ?? '',
    origin: row.origin ?? {},
    practice: row.practice ?? {},
    imagePrompts: {
      exterior: row.exterior_prompt ?? '',
      interior: row.interior_prompt ?? '',
    },
  },
  images: { exterior: row.image_exterior, interior: row.image_interior },
  videos: { exterior: row.video_exterior, interior: row.video_interior },
});

async function main() {
  const res = await fetch(
    `${PROJECT}/rest/v1/culture_articles?select=*&order=created_at.desc`,
    { headers },
  );
  if (!res.ok) throw new Error(`Could not read the library (${res.status})`);

  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('The library did not come back as a list.');

  // One article per concept, newest first. Duplicates would show as repeated
  // cards, and the repo copy should be the tidy one.
  const byConcept = new Map();
  for (const row of rows) {
    const existing = byConcept.get(row.concept);
    if (!existing || String(row.created_at) > String(existing.created_at)) {
      byConcept.set(row.concept, row);
    }
  }

  const articles = [...byConcept.values()]
    .map(toArticle)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, `${JSON.stringify(articles, null, 2)}\n`, 'utf8');

  const withLede = articles.filter((a) => a.dimensions.lede).length;
  console.log(`export-library: ${articles.length} articles (${withLede} with a lede) -> ${OUT}`);
}

await main();
