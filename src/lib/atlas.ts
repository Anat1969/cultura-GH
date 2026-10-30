import { supabase } from '@/integrations/supabase/client';
import { callFunction } from '@/lib/ai';
import { Article, HUMAN_NEEDS } from '@/types/article';

/*
 * The atlas reads the library as a comparison: which cultures answer the same
 * need, and what each culture answers that others do not. Everything here is
 * derived from the articles; only the model's distillations and what the user
 * adds by hand (image, notes) are stored, in culture_atlas.
 */

// ---------- One name per culture ----------

/**
 * The model names a culture by country, language or people, so the same
 * culture arrives as "דנית" and "דנמרק". Comparison needs one name each.
 */
const CULTURE_ALIASES: Record<string, string> = {
  דנית: 'דנמרק',
  פינית: 'פינלנד',
  וילס: 'ויילס',
  'יוון העתיקה': 'יוון',
  'עברית מקראית': 'יהדות',
  עברית: 'יהדות',
  ערבית: 'העולם הערבי',
  'עמי נגוני': 'דרום אפריקה',
  זולו: 'דרום אפריקה',
  שוודית: 'שוודיה',
  נורווגית: 'נורווגיה',
  יפנית: 'יפן',
  סינית: 'סין',
  גרמנית: 'גרמניה',
  ספרדית: 'ספרד',
  פורטוגזית: 'פורטוגל',
  רוסית: 'רוסיה',
  יוונית: 'יוון',
};

export function cultureOf(article: Article): string {
  let raw = (article.dimensions.origin.culture ?? '').trim();
  // "אקאן, גאנה" / "בודהיזם, הודו": the place after the comma is the culture.
  if (raw.includes(',')) raw = raw.split(',').pop()!.trim();
  return CULTURE_ALIASES[raw] ?? raw ?? 'ללא תרבות';
}

/** The same concept written in Hebrew and in Latin letters counts once. */
export function distinctArticles(articles: Article[]): Article[] {
  const byKey = new Map<string, Article>();
  for (const a of articles) {
    const key = (a.dimensions.origin.transliteration || a.concept).toLowerCase().replace(/[^\p{L}]/gu, '');
    const prev = byKey.get(key);
    if (!prev || String(a.updatedAt) > String(prev.updatedAt)) byKey.set(key, a);
  }
  return [...byKey.values()];
}

// ---------- Derived tables ----------

export interface ThemeGroup {
  need: string;
  articles: Article[];
  cultures: string[];
}

/** Needs ordered by how many cultures answer them: the widest overlaps first. */
export function themeGroups(articles: Article[]): ThemeGroup[] {
  return HUMAN_NEEDS.map(need => {
    const list = articles.filter(a => a.dimensions.humanNeed === need);
    return { need, articles: list, cultures: [...new Set(list.map(cultureOf))] };
  })
    .filter(g => g.articles.length > 0)
    .sort((a, b) => b.cultures.length - a.cultures.length);
}

export interface CultureProfile {
  culture: string;
  articles: Article[];
  needs: string[];
  /** Share of its needs that at most one other culture also answers, 0-1. */
  rarity: number;
}

export function cultureProfiles(articles: Article[]): CultureProfile[] {
  const cultures = [...new Set(articles.map(cultureOf))];
  const culturesPerNeed = new Map<string, Set<string>>();
  for (const a of articles) {
    const set = culturesPerNeed.get(a.dimensions.humanNeed) ?? new Set();
    set.add(cultureOf(a));
    culturesPerNeed.set(a.dimensions.humanNeed, set);
  }
  return cultures
    .map(culture => {
      const own = articles.filter(a => cultureOf(a) === culture);
      const needs = [...new Set(own.map(a => a.dimensions.humanNeed))];
      const rare = needs.filter(n => (culturesPerNeed.get(n)?.size ?? 1) - 1 <= 1).length;
      return { culture, articles: own, needs, rarity: needs.length ? rare / needs.length : 0 };
    })
    .sort((a, b) => b.articles.length - a.articles.length || a.culture.localeCompare(b.culture, 'he'));
}

// ---------- What the model returns ----------

export interface Visual {
  distill: string;
  prompt: string;
}

export interface ThemeDistillation {
  core: string;
  rows: { culture: string; concept: string; emphasis: string; mechanism: string; space: string; unique: string }[];
  tensions: { axis: string; poles: string; meaning: string }[];
  insights: string[];
  design: string[];
  visual: Visual;
}

export interface CultureDistillation {
  essence: string;
  signatures: { trait: string; evidence: string }[];
  rows: { need: string; ownAnswer: string; othersAnswer: string; difference: string }[];
  blindSpots: { need: string; note: string }[];
  insights: string[];
  visual: Visual;
}

export interface Suggestion {
  concept: string;
  transliteration: string;
  script: string;
  english: string;
  literal: string;
  need: string;
  why: string;
  confidence: 'high' | 'medium' | 'low';
  /** Checked by the server against English Wikipedia; see culture-atlas. */
  verified: 'title' | 'mention' | 'none';
  source?: string;
  sourceTitle?: string;
  hebrewTitle?: string;
}

export interface Suggestions {
  usable: Suggestion[];
  /** Not found anywhere on Wikipedia: never offered, only listed. */
  rejected: Suggestion[];
}

export function distillTheme(group: ThemeGroup): Promise<ThemeDistillation> {
  return callFunction('culture-atlas', {
    mode: 'theme',
    need: group.need,
    items: group.articles.map(a => ({
      culture: cultureOf(a),
      concept: a.concept,
      transliteration: a.dimensions.origin.transliteration,
      literal: a.dimensions.origin.literal,
      insight: a.dimensions.insight,
      how: a.dimensions.practice.how,
      where: a.dimensions.practice.where,
    })),
  });
}

export function distillCulture(profile: CultureProfile, all: Article[]): Promise<CultureDistillation> {
  return callFunction('culture-atlas', {
    mode: 'culture',
    culture: profile.culture,
    own: profile.articles.map(a => ({
      concept: a.concept,
      need: a.dimensions.humanNeed,
      literal: a.dimensions.origin.literal,
      insight: a.dimensions.insight,
    })),
    others: all
      .filter(a => cultureOf(a) !== profile.culture)
      .map(a => ({ concept: a.concept, culture: cultureOf(a), need: a.dimensions.humanNeed })),
  });
}

export async function suggestConcepts(culture: string, all: Article[]): Promise<Suggestions> {
  const existing = all.filter(a => cultureOf(a) === culture);
  const result = await callFunction<{ items: Suggestion[] }>('culture-atlas', {
    mode: 'suggest',
    culture,
    existing: existing.map(a => `${a.concept} (${a.dimensions.origin.transliteration})`),
    library: all.map(a => a.dimensions.origin.transliteration || a.concept),
  });
  // The model is told not to repeat the library; hold it to that here too,
  // including under the English page name it was verified by.
  const known = new Set(
    all.flatMap(a => [a.dimensions.origin.transliteration, a.concept]).map(v => (v || '').toLowerCase())
  );
  const fresh = (result.items ?? []).filter(
    s => !known.has((s.transliteration || '').toLowerCase()) && !known.has((s.sourceTitle || '').toLowerCase())
  );
  // Hebrew Wikipedia's title is the accepted Hebrew name; the model's spelling
  // is not ("טורקה" for Talkoot).
  for (const s of fresh) {
    const hebrew = (s.hebrewTitle || '').replace(/\s*\(.*\)\s*$/, '').trim();
    if (hebrew) s.concept = hebrew;
  }
  return {
    usable: fresh.filter(s => s.verified !== 'none'),
    rejected: fresh.filter(s => s.verified === 'none'),
  };
}

// ---------- Saved entries ----------

export type AtlasKind = 'theme' | 'culture' | 'group';

export interface AtlasEntry<T = unknown> {
  id: string;
  kind: AtlasKind;
  key: string;
  data: T | null;
  image_url: string | null;
  notes: string;
  updated_at?: string;
}

const table = () => (supabase as any).from('culture_atlas'); // eslint-disable-line @typescript-eslint/no-explicit-any

export const atlasId = (kind: AtlasKind, key: string) => `${kind}:${key}`;

export async function loadEntry<T>(kind: AtlasKind, key: string): Promise<AtlasEntry<T>> {
  const id = atlasId(kind, key);
  const { data, error } = await table().select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`טעינת השמירה נכשלה: ${error.message}`);
  return (data as AtlasEntry<T>) ?? { id, kind, key, data: null, image_url: null, notes: '' };
}

export async function saveEntry<T>(entry: AtlasEntry<T>): Promise<void> {
  const { error } = await table().upsert(
    [{ id: entry.id, kind: entry.kind, key: entry.key, data: entry.data ?? {}, image_url: entry.image_url, notes: entry.notes }],
    { onConflict: 'id' }
  );
  if (error) throw new Error(`השמירה נכשלה: ${error.message}`);
}

/** Every saved entry, to show which views already hold a distillation. */
export async function listEntries(): Promise<Pick<AtlasEntry, 'id' | 'image_url'>[]> {
  const { data } = await table().select('id,image_url');
  return Array.isArray(data) ? data : [];
}

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

/** Stores a pasted or picked image in the media bucket and returns its public URL. */
export async function uploadAtlasImage(file: File, kind: AtlasKind): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error('יש להדביק או לבחור קובץ תמונה.');
  if (file.size > 20 * 1024 * 1024) throw new Error('התמונה גדולה מ-20MB.');
  // Storage paths must be ASCII, so the Hebrew key stays in the table, not the path.
  const path = `atlas/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('article-media').upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(`ההעלאה נכשלה: ${error.message}`);
  return supabase.storage.from('article-media').getPublicUrl(path).data.publicUrl;
}
