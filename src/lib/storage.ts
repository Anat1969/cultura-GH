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
    local.forEach(a => {
      // Newest wins. "Local always wins" quietly pinned whatever a browser had
      // read first, so a corrected article never reached anyone who had already
      // opened it - and refreshing the page could not help.
      const shared = byId.get(a.id);
      if (!shared || String(a.updatedAt) >= String(shared.updatedAt)) byId.set(a.id, a);
    });

    const merged = Array.from(byId.values()).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    writeArticles(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.warn('Could not read the shared library.', error);
    return local;
  }
}

/** Pushes one article to the shared table; failures never block local saving. */
async function pushToSupabase(article: Article): Promise<void> {
  try {
    const { error } = await db().upsert([toRow(article)], { onConflict: 'id' });
    if (error) throw error;
  } catch (error) {
    console.warn('Could not save to the shared library.', error);
  }
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

export function getArticles(): Article[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Article[]).map(normalize) : [];
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

    const merged = Array.from(byId.values()).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
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

  void pushToSupabase(toSave);
}

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
