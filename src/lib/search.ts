import { Article, interpretationLines } from '@/types/article';
import { countryCode, countryOf } from '@/data/geo';

/*
 * Search is by keywords: every word typed must appear somewhere in the
 * article, in any order and any field. Niqqud, geresh, case and Latin accents
 * are ignored, so "סאודאדה", "saudade" and "Saudade" all find the same piece.
 */

export function normalizeText(value: string): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[֑-ׇ̀-ͯ]/g, '')
    .replace(/[׳״'"`]/g, '')
    .toLowerCase();
}

export function keywords(query: string): string[] {
  return normalizeText(query)
    .split(/[^\p{L}\p{N}-]+/u)
    .map(w => w.trim())
    .filter(Boolean);
}

/** Everything a reader might search an article by, as one normalized text. */
export function searchText(a: Article): string {
  const d = a.dimensions;
  const o = d.origin;
  const country = countryOf(countryCode(o));
  return normalizeText(
    [
      a.concept,
      d.spaceName,
      d.lede,
      d.insight,
      d.proverb,
      d.humanNeed,
      ...interpretationLines(d.interpretation),
      ...Object.values(d.practice ?? {}),
      o.script,
      o.transliteration,
      o.literal,
      o.culture,
      o.region_en,
      o.place,
      o.era,
      o.figure,
      o.story,
      o.tradition,
      typeof o.year === 'number' ? String(o.year) : '',
      country?.he,
      country?.region,
      country?.continent,
      ...a.tags,
    ]
      .filter(Boolean)
      .join(' ')
  );
}

/** Builds a matcher once per query; an empty query matches everything. */
export function keywordMatcher(query: string): (a: Article) => boolean {
  const words = keywords(query);
  if (!words.length) return () => true;
  return (a: Article) => {
    const text = searchText(a);
    return words.every(w => text.includes(w));
  };
}

/** For plain strings, such as group names. */
export function matchesKeywords(text: string, query: string): boolean {
  const t = normalizeText(text);
  return keywords(query).every(w => t.includes(w));
}
