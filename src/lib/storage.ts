import { Article, emptyOrigin, emptyPractice, interpretationLines } from '@/types/article';
import { supabase } from '@/integrations/supabase/client';

const TABLE = 'culture_articles';

// The generated Supabase types are not checked in, so the table is untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any).from(TABLE);

/** Database row -> Article. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): Article {
  return normalize({
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
      interpretation: interpretationLines(row.interpretation),
      humanNeed: row.human_need ?? '',
      origin: row.origin,
      practice: row.practice,
      imagePrompts: {
        exterior: row.exterior_prompt ?? '',
        interior: row.interior_prompt ?? '',
      },
    },
    images: { exterior: row.image_exterior, interior: row.image_interior },
    videos: { exterior: row.video_exterior, interior: row.video_interior },
  });
}

/** Article -> database row. */
function toRow(article: Article) {
  const d = article.dimensions;
  return {
    id: article.id,
    concept: article.concept,
    space_name: d.spaceName,
    lede: d.lede ?? '',
    insight: d.insight,
    proverb: d.proverb,
    interpretation: d.interpretation,
    human_need: d.humanNeed,
    origin: d.origin,
    practice: d.practice,
    image_exterior: article.images.exterior,
    image_interior: article.images.interior,
    video_exterior: article.videos.exterior,
    video_interior: article.videos.interior,
    exterior_prompt: d.imagePrompts.exterior,
    interior_prompt: d.imagePrompts.interior,
    tags: article.tags,
    created_at: article.createdAt,
  };
}

/**
 * The shared library. Anything held locally for the same id wins, so an edit
 * made here is not overwritten by an older copy from the server.
 */
export async function syncArticlesFromSupabase(): Promise<Article[]> {
  const local = getArticles();
  try {
    const { data, error } = await db().select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!Array.isArray(data)) return local;

    const byId = new Map<string, Article>();
    data.forEach((row: unknown) => {
      const a = fromRow(row);
      byId.set(a.id, a);
    });
    const waiting = new Set(pendingIds());
    local.forEach(a => {
      const shared = byId.get(a.id);
      // The shared table is the library. An article it does not hold was
      // removed there (the rejected bulk expansion), unless this device is
      // still waiting to send it - only then is the local copy kept.
      if (!shared) {
        if (waiting.has(a.id)) byId.set(a.id, a);
        return;
      }
      // Newest wins. "Local always wins" quietly pinned whatever a browser had
      // read first, so a corrected article never reached anyone who had already
      // opened it - and refreshing the page could not help.
      if (String(a.updatedAt) >= String(shared.updatedAt)) byId.set(a.id, a);
    });

    const merged = collapseByConcept(Array.from(byId.values()));
    writeArticles(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.warn('Could not read the shared library.', error);
    return local;
  }
}

/** A copy we keep in our own bucket. Anything else is an engine's link and may expire or show its limit card. */
export const isStoredMedia = (url: string | null | undefined): url is string =>
  typeof url === 'string' && url.includes('/storage/v1/object/public/');

/**
 * What the server already holds and an older copy here must not undo: an image
 * stored by the image function, and the origin story the origin function
 * wrote. A browser that opened an article before those arrived would otherwise
 * write the old version back on its next save.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function keepServerWork(row: any, server: any) {
  if (!server) return row;
  for (const col of ['image_exterior', 'image_interior']) {
    if (!isStoredMedia(row[col]) && isStoredMedia(server[col])) row[col] = server[col];
  }
  const local = row.origin ?? {};
  const remote = server.origin ?? {};
  if (!local.story && remote.story) row.origin = { ...remote, ...stripEmpty(local) };
  return row;
}

function stripEmpty(o: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

// ---------- Saving: always, on its own ----------

const PENDING_KEY = 'culturearch_pending';
export const SAVE_STATE = 'culturearch:save-state';
export type SaveState = 'saving' | 'saved' | 'offline';

function pendingIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function setPending(ids: string[]) {
  writeArticles(PENDING_KEY, JSON.stringify([...new Set(ids)]));
}

function announce(id: string, state: SaveState) {
  window.dispatchEvent(new CustomEvent(SAVE_STATE, { detail: { id, state } }));
}

/**
 * Writes one article to the shared table. A failure is kept in a pending list
 * and retried when the connection returns or the app next opens, so nothing
 * typed here is ever lost on the way.
 */
export async function pushToSupabase(article: Article): Promise<boolean> {
  announce(article.id, 'saving');
  try {
    const { data: server } = await db()
      .select('image_exterior,image_interior,origin')
      .eq('id', article.id)
      .maybeSingle();
    const { error } = await db().upsert([keepServerWork(toRow(article), server)], { onConflict: 'id' });
    if (error) throw error;
    setPending(pendingIds().filter(id => id !== article.id));
    announce(article.id, 'saved');
    return true;
  } catch (error) {
    console.warn('Could not save to the shared library; will retry.', error);
    setPending([...pendingIds(), article.id]);
    announce(article.id, 'offline');
    return false;
  }
}

/** Sends whatever did not reach the server last time. */
export async function retryPending(): Promise<void> {
  for (const id of pendingIds()) {
    const article = getArticleById(id);
    if (article) await pushToSupabase(article);
    else setPending(pendingIds().filter(p => p !== id));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void retryPending());
}

const STORAGE_KEY = 'culturearch_articles';
const THEME_KEY = 'culturearch_theme';

export type GroupMode = 'need' | 'culture';

/**
 * localStorage throws outright when site data is blocked (private windows,
 * strict browser settings), and an unguarded write takes the whole app down
 * with it. Losing persistence is survivable; a blank screen is not.
 */
function writeArticles(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Local storage is unavailable; changes stay in memory only.', error);
  }
}

/** Fill missing fields so older or partial records never crash the UI. */
function normalize(a: Article): Article {
  return {
    ...a,
    tags: a.tags ?? [],
    videos: { ...{ exterior: null, interior: null }, ...(a.videos ?? {}) },
    images: { ...{ exterior: null, interior: null }, ...(a.images ?? {}) },
    dimensions: {
      ...a.dimensions,
      humanNeed: a.dimensions.humanNeed ?? '',
      lede: a.dimensions.lede ?? '',
      interpretation: interpretationLines(a.dimensions.interpretation),
      origin: { ...emptyOrigin, ...(a.dimensions.origin ?? {}) },
      practice: { ...emptyPractice, ...(a.dimensions.practice ?? {}) },
      imagePrompts: a.dimensions.imagePrompts ?? { exterior: '', interior: '' },
    },
  };
}

/**
 * One article per concept, newest kept. A concept is written once, so two rows
 * for it can only come from an older copy that was never cleaned up - showing
 * both as separate cards is never what anyone wants.
 */
function collapseByConcept(articles: Article[]): Article[] {
  const byConcept = new Map<string, Article>();
  for (const article of articles) {
    const key = conceptKey(article.concept);
    const existing = byConcept.get(key);
    if (!existing || String(article.updatedAt) > String(existing.updatedAt)) {
      byConcept.set(key, article);
    }
  }
  return [...byConcept.values()].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
  );
}

export function getArticles(): Article[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? collapseByConcept((JSON.parse(data) as Article[]).map(normalize)) : [];
  } catch {
    return [];
  }
}

/**
 * The library committed to the repository: permanent, shared across devices and
 * with images that do not expire. Merged under anything held locally for the
 * same id, so an unpublished local edit is never overwritten by the published
 * copy on load.
 */
export async function syncArticlesFromGithub(): Promise<Article[]> {
  const local = getArticles();
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}content/articles.json`, {
      cache: 'no-cache',
    });
    if (!response.ok) return local;

    const published = (await response.json()) as Article[];
    if (!Array.isArray(published)) return local;

    const byId = new Map<string, Article>();
    published.forEach(a => byId.set(a.id, normalize(a)));
    local.forEach(a => {
      // Newest wins. "Local always wins" quietly pinned whatever a browser had
      // read first, so a corrected article never reached anyone who had already
      // opened it - and refreshing the page could not help.
      const shared = byId.get(a.id);
      if (!shared || String(a.updatedAt) >= String(shared.updatedAt)) byId.set(a.id, a);
    });

    const merged = collapseByConcept(Array.from(byId.values()));
    writeArticles(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.warn('Could not read the published library.', error);
    return local;
  }
}

/**
 * Throws away this browser's copy of the library and takes the shared one as it
 * stands. The escape hatch for a local copy that has drifted.
 */
export async function resetLibraryFromShared(): Promise<Article[]> {
  writeArticles(STORAGE_KEY, '[]');
  await syncArticlesFromGithub();
  return syncArticlesFromSupabase();
}

export function saveArticle(article: Article): void {
  const articles = getArticles();
  const idx = articles.findIndex(a => a.id === article.id);
  const toSave = { ...article, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    articles[idx] = toSave;
  } else {
    articles.unshift(toSave);
  }
  writeArticles(STORAGE_KEY, JSON.stringify(articles));
  window.dispatchEvent(new CustomEvent(ARTICLE_SAVED, { detail: toSave.id }));

  void pushToSupabase(toSave);
}

/** Saves and waits until the shared table has it. */
export async function saveArticleNow(article: Article): Promise<boolean> {
  saveArticle(article);
  const saved = getArticleById(article.id);
  return saved ? pushToSupabase(saved) : false;
}

/** Takes the server's copy of one article, after a function has written to it. */
export async function refreshArticle(id: string): Promise<Article | undefined> {
  try {
    const { data } = await db().select('*').eq('id', id).maybeSingle();
    if (!data) return getArticleById(id);
    const fresh = fromRow(data);
    const articles = getArticles();
    const idx = articles.findIndex(a => a.id === id);
    if (idx >= 0) articles[idx] = fresh;
    else articles.unshift(fresh);
    writeArticles(STORAGE_KEY, JSON.stringify(articles));
    window.dispatchEvent(new CustomEvent(ARTICLE_SAVED, { detail: id }));
    return fresh;
  } catch {
    return getArticleById(id);
  }
}

/** Fired on window with the article id whenever an article is saved. */
export const ARTICLE_SAVED = 'culturearch:article-saved';

export function deleteArticle(id: string): void {
  const articles = getArticles().filter(a => a.id !== id);
  writeArticles(STORAGE_KEY, JSON.stringify(articles));
}

/**
 * Matching is deliberately loose: the suggestion list writes vowel points and a
 * geresh (הירָאת׳) that nobody types, and spacing varies. Two spellings of the
 * same concept must not become two articles.
 */
export function conceptKey(value: string): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase();
}

/** The library is the source of truth: a concept is written once and kept. */
export function findArticleByConcept(concept: string): Article | undefined {
  const key = conceptKey(concept);
  if (!key) return undefined;
  return getArticles().find(a => conceptKey(a.concept) === key);
}

export function getArticleById(id: string): Article | undefined {
  return getArticles().find(a => a.id === id);
}

// ---------- Grouping: this is where comparison happens ----------

export function groupKey(article: Article, mode: GroupMode): string {
  return mode === 'need'
    ? article.dimensions.humanNeed || 'ללא צורך מוגדר'
    : article.dimensions.origin.culture || 'ללא תרבות מוגדרת';
}

export function getGroups(mode: GroupMode): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  getArticles().forEach(a => {
    const k = groupKey(a, mode);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  });
  return Array.from(counts, ([key, count]) => ({ key, count })).sort((a, b) =>
    a.key.localeCompare(b.key, 'he')
  );
}

export function getArticlesByGroup(mode: GroupMode, key: string): Article[] {
  return getArticles().filter(a => groupKey(a, mode) === key);
}

export function getTheme(): 'dark' | 'light' {
  try {
    return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
  } catch {
    return 'dark';
  }
}

export function setTheme(theme: 'dark' | 'light'): void {
  writeArticles(THEME_KEY, theme);
}
