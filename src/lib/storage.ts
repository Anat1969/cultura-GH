import { Article, emptyOrigin, emptyPractice } from '@/types/article';

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
    dimensions: {
      ...a.dimensions,
      humanNeed: a.dimensions.humanNeed ?? '',
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
    local.forEach(a => byId.set(a.id, a));

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
}

export function deleteArticle(id: string): void {
  const articles = getArticles().filter(a => a.id !== id);
  writeArticles(STORAGE_KEY, JSON.stringify(articles));
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
