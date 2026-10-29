import { Article } from '@/types/article';
import { countryCode, countryOf, pointOf } from '@/data/geo';
import { distinctArticles } from '@/lib/atlas';

/*
 * The globe and the time axis read the library through this one view: every
 * word with its point on Earth, its year, and the group it falls into under
 * each way of grouping. Derived, never stored.
 */

export type GroupBy = 'region' | 'continent' | 'tradition' | 'period';

export const GROUP_LABELS: Record<GroupBy, string> = {
  region: 'אזור תרבותי',
  continent: 'יבשת',
  tradition: 'מסורת',
  period: 'תקופה',
};

// Periods in order; the time axis and the period grouping share them.
export const PERIODS: { label: string; from: number; to: number }[] = [
  { label: 'העת העתיקה', from: -5000, to: 499 },
  { label: 'ימי הביניים', from: 500, to: 1499 },
  { label: 'העת החדשה המוקדמת', from: 1500, to: 1799 },
  { label: 'המאה ה-19', from: 1800, to: 1899 },
  { label: 'המאה ה-20', from: 1900, to: 1999 },
  { label: 'המאה ה-21', from: 2000, to: 9999 },
];

export const periodOf = (year: number | null | undefined): string =>
  typeof year === 'number' ? (PERIODS.find(p => year >= p.from && year <= p.to)?.label ?? 'לא ידוע') : 'לא ידוע';

export interface WorldItem {
  article: Article;
  code: string;
  point: [number, number] | null;
  year: number | null;
  groups: Record<GroupBy, string>;
}

export function worldItems(articles: Article[]): WorldItem[] {
  return distinctArticles(articles).map(article => {
    const o = article.dimensions.origin;
    const code = countryCode(o);
    const country = countryOf(code);
    const year = typeof o.year === 'number' ? o.year : null;
    return {
      article,
      code,
      point: pointOf(o),
      year,
      groups: {
        region: country?.region ?? 'לא ידוע',
        continent: country?.continent ?? 'לא ידוע',
        tradition: o.tradition || 'לא ידוע',
        period: periodOf(year),
      },
    };
  });
}

export interface WorldGroup {
  key: string;
  items: WorldItem[];
  color: string;
  center: [number, number] | null;
}

/** Hues spaced evenly at one lightness: a group is told apart by hue alone. */
const hue = (i: number, n: number) => `hsl(${Math.round((i * 360) / Math.max(n, 1) + 18) % 360} 62% 62%)`;

export function worldGroups(items: WorldItem[], by: GroupBy): WorldGroup[] {
  const map = new Map<string, WorldItem[]>();
  for (const it of items) map.set(it.groups[by], [...(map.get(it.groups[by]) ?? []), it]);
  let keys = [...map.keys()];
  if (by === 'period') {
    const order = [...PERIODS.map(p => p.label), 'לא ידוע'];
    keys = keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  } else {
    keys = keys.sort((a, b) => (a === 'לא ידוע' ? 1 : b === 'לא ידוע' ? -1 : map.get(b)!.length - map.get(a)!.length));
  }
  return keys.map((key, i) => {
    const list = map.get(key)!;
    const pts = list.map(it => it.point).filter((p): p is [number, number] => !!p);
    const center: [number, number] | null = pts.length
      ? [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
      : null;
    return { key, items: list, color: key === 'לא ידוע' ? 'hsl(0 0% 55%)' : hue(i, keys.length), center };
  });
}

export const yearLabel = (year: number) => (year < 0 ? `${Math.abs(year)} לפנה״ס` : String(year));
