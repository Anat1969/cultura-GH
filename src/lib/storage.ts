import { Article, emptyOrigin, emptyPractice } from '@/types/article';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'culturearch_articles';
const THEME_KEY = 'culturearch_theme';
const TABLE = 'culture_articles';

// The generated Supabase types may not include the new table until they are
// regenerated after the migration runs, so the table is accessed untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any).from(TABLE);

export type GroupMode = 'need' | 'culture';

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

export async function syncArticlesFromSupabase(): Promise<Article[]> {
  try {
    const { data, error } = await db()
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const articles: Article[] = data.map((row: any) =>
        normalize({
          id: row.id,
          concept: row.concept,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          tags: row.tags || [row.concept],
          dimensions: {
            insight: row.insight,
            spaceName: row.space_name,
            proverb: row.proverb,
            interpretation: row.interpretation,
            humanNeed: row.human_need || '',
            origin: row.origin,
            practice: row.practice,
            imagePrompts: {
              exterior: row.exterior_prompt || '',
              interior: row.interior_prompt || '',
            },
          },
          images: {
            exterior: row.image_exterior,
            interior: row.image_interior,
          },
        })
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
      return articles;
    }
    return [];
  } catch (error) {
    console.error('Failed to sync from Supabase:', error);
    return getArticles();
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));

  syncArticleToSupabase(toSave);
}

async function syncArticleToSupabase(article: Article): Promise<void> {
  try {
    const d = article.dimensions;
    const payload = {
      id: article.id,
      concept: article.concept,
      space_name: d.spaceName,
      insight: d.insight,
      proverb: d.proverb,
      interpretation: d.interpretation,
      human_need: d.humanNeed,
      origin: d.origin,
      practice: d.practice,
      image_exterior: article.images.exterior,
      image_interior: article.images.interior,
      exterior_prompt: d.imagePrompts.exterior,
      interior_prompt: d.imagePrompts.interior,
      tags: article.tags,
      created_at: article.createdAt,
      updated_at: article.updatedAt,
    };

    const { error } = await db().upsert([payload], { onConflict: 'id' });
    if (error) throw error;
  } catch (error) {
    console.error('Failed to sync article to Supabase:', error);
  }
}

export function deleteArticle(id: string): void {
  const articles = getArticles().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));

  db()
    .delete()
    .eq('id', id)
    .then(({ error }: { error: unknown }) => {
      if (error) console.error('Failed to delete from Supabase:', error);
    });
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
  return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
}

export function setTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(THEME_KEY, theme);
}
