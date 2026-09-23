// Writes every concept the app suggests into the shared library, once.
//
// The suggestion chips are a fixed list, so there is no reason to pay for and
// wait on the same concept again each time someone clicks it. This fills the
// library ahead of time; the app then opens what is already there and only
// generates concepts a user types that nobody has written yet.
//
// Safe to re-run: concepts already in the table are skipped.
//
//   node scripts/seed-library.mjs [--dry] [--limit N]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = 'https://ktqmwpbzcnzkhjskqisy.supabase.co';
const ANON = 'sb_publishable_IkreG7naPa1h-d4kGp1gpA_sLU4tg5q';
const CONCURRENCY = 3;

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const LIMIT = Number(args[args.indexOf('--limit') + 1]) || Infinity;

const headers = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  'Content-Type': 'application/json',
};

/** Same loose matching the app uses, so spellings do not duplicate. */
const conceptKey = (v) =>
  (v ?? '')
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase();

/** The suggestion list is the source; read it rather than restating it here. */
function readSuggestions() {
  const src = fs.readFileSync(path.join(HERE, '..', 'src', 'data', 'cultures.ts'), 'utf8');
  const found = new Map();
  const re = /\{\s*label:\s*'([^']+)'\s*,\s*hint:\s*'([^']+)'\s*\}/g;
  let m;
  while ((m = re.exec(src))) {
    const [, label, hint] = m;
    if (!found.has(conceptKey(label))) found.set(conceptKey(label), { label, hint });
  }
  return [...found.values()];
}

async function existingConcepts() {
  const res = await fetch(`${PROJECT}/rest/v1/culture_articles?select=concept`, { headers });
  if (!res.ok) throw new Error(`Could not read the library (${res.status})`);
  return new Set((await res.json()).map((r) => conceptKey(r.concept)));
}

async function generate(concept, hint) {
  const res = await fetch(`${PROJECT}/functions/v1/generate-dimensions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ concept, hint }),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

async function insert(concept, d) {
  const row = {
    id: crypto.randomUUID(),
    concept,
    space_name: d.spaceName,
    lede: d.lede ?? '',
    insight: d.insight,
    proverb: d.proverb,
    interpretation: d.interpretation,
    human_need: d.humanNeed,
    origin: d.origin,
    practice: d.practice,
    exterior_prompt: d.imagePrompts.exterior,
    interior_prompt: d.imagePrompts.interior,
    tags: [d.origin?.culture, d.humanNeed].filter(Boolean),
    created_at: new Date().toISOString(),
  };
  const res = await fetch(`${PROJECT}/rest/v1/culture_articles`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Insert failed (${res.status}): ${(await res.text()).slice(0, 160)}`);
}

async function main() {
  const suggestions = readSuggestions();
  const already = await existingConcepts();
  const todo = suggestions.filter((s) => !already.has(conceptKey(s.label))).slice(0, LIMIT);

  console.log(`${suggestions.length} concepts in the app, ${already.size} already written.`);
  console.log(`${todo.length} to write.\n`);
  if (DRY || todo.length === 0) {
    todo.forEach((s) => console.log(`  would write: ${s.label}  (${s.hint})`));
    return;
  }

  let done = 0;
  let failed = 0;
  const queue = [...todo];

  const worker = async () => {
    while (queue.length) {
      const { label, hint } = queue.shift();
      try {
        const d = await generate(label, hint);
        await insert(label, d);
        done += 1;
        console.log(`  [${done + failed}/${todo.length}] ${label} — ${d.spaceName}`);
      } catch (error) {
        failed += 1;
        console.warn(`  [${done + failed}/${todo.length}] ${label} FAILED: ${error.message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\nWritten: ${done}. Failed: ${failed}.`);
}

await main();
