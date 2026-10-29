// One source for everything geographic: the flag, the globe and the grouping
// by continent and cultural region all read this table, so a country is placed
// the same way everywhere. Coordinates are a representative point, not a
// centroid; the article's own origin.lat/lng wins when the origin function set it.

export interface Country {
  he: string;
  continent: string;
  region: string;
  lat: number;
  lng: number;
}

export const COUNTRIES: Record<string, Country> = {
  // Scandinavia and the Nordics
  DK: { he: 'דנמרק', continent: 'אירופה', region: 'סקנדינביה והארצות הנורדיות', lat: 55.7, lng: 12.6 },
  NO: { he: 'נורווגיה', continent: 'אירופה', region: 'סקנדינביה והארצות הנורדיות', lat: 60.5, lng: 8.5 },
  SE: { he: 'שוודיה', continent: 'אירופה', region: 'סקנדינביה והארצות הנורדיות', lat: 59.3, lng: 18.1 },
  FI: { he: 'פינלנד', continent: 'אירופה', region: 'סקנדינביה והארצות הנורדיות', lat: 61.9, lng: 25.7 },
  IS: { he: 'איסלנד', continent: 'אירופה', region: 'סקנדינביה והארצות הנורדיות', lat: 64.1, lng: -21.9 },
  // Western and Central Europe
  GB: { he: 'בריטניה', continent: 'אירופה', region: 'מערב אירופה', lat: 52.5, lng: -1.5 },
  IE: { he: 'אירלנד', continent: 'אירופה', region: 'מערב אירופה', lat: 53.3, lng: -6.3 },
  NL: { he: 'הולנד', continent: 'אירופה', region: 'מערב אירופה', lat: 52.4, lng: 4.9 },
  BE: { he: 'בלגיה', continent: 'אירופה', region: 'מערב אירופה', lat: 50.8, lng: 4.4 },
  FR: { he: 'צרפת', continent: 'אירופה', region: 'מערב אירופה', lat: 46.6, lng: 2.4 },
  DE: { he: 'גרמניה', continent: 'אירופה', region: 'מרכז אירופה', lat: 51.2, lng: 10.4 },
  AT: { he: 'אוסטריה', continent: 'אירופה', region: 'מרכז אירופה', lat: 47.5, lng: 14.6 },
  CH: { he: 'שווייץ', continent: 'אירופה', region: 'מרכז אירופה', lat: 46.8, lng: 8.2 },
  CZ: { he: 'צ׳כיה', continent: 'אירופה', region: 'מרכז אירופה', lat: 50.1, lng: 14.4 },
  PL: { he: 'פולין', continent: 'אירופה', region: 'מרכז אירופה', lat: 52.2, lng: 21.0 },
  HU: { he: 'הונגריה', continent: 'אירופה', region: 'מרכז אירופה', lat: 47.5, lng: 19.0 },
  // Mediterranean Europe
  ES: { he: 'ספרד', continent: 'אירופה', region: 'אגן הים התיכון', lat: 37.4, lng: -4.5 },
  PT: { he: 'פורטוגל', continent: 'אירופה', region: 'אגן הים התיכון', lat: 38.7, lng: -9.1 },
  IT: { he: 'איטליה', continent: 'אירופה', region: 'אגן הים התיכון', lat: 41.9, lng: 12.5 },
  GR: { he: 'יוון', continent: 'אירופה', region: 'אגן הים התיכון', lat: 37.98, lng: 23.7 },
  HR: { he: 'קרואטיה', continent: 'אירופה', region: 'אגן הים התיכון', lat: 43.5, lng: 16.4 },
  // Eastern Europe
  RU: { he: 'רוסיה', continent: 'אירופה', region: 'מזרח אירופה', lat: 55.8, lng: 37.6 },
  UA: { he: 'אוקראינה', continent: 'אירופה', region: 'מזרח אירופה', lat: 50.4, lng: 30.5 },
  RO: { he: 'רומניה', continent: 'אירופה', region: 'מזרח אירופה', lat: 44.4, lng: 26.1 },
  GE: { he: 'גאורגיה', continent: 'אסיה', region: 'מזרח אירופה', lat: 41.7, lng: 44.8 },
  // Middle East and North Africa
  IL: { he: 'ישראל', continent: 'אסיה', region: 'המזרח התיכון', lat: 31.8, lng: 35.2 },
  LB: { he: 'לבנון', continent: 'אסיה', region: 'המזרח התיכון', lat: 33.9, lng: 35.5 },
  SY: { he: 'סוריה', continent: 'אסיה', region: 'המזרח התיכון', lat: 33.5, lng: 36.3 },
  JO: { he: 'ירדן', continent: 'אסיה', region: 'המזרח התיכון', lat: 31.9, lng: 35.9 },
  SA: { he: 'ערב הסעודית', continent: 'אסיה', region: 'המזרח התיכון', lat: 24.7, lng: 46.7 },
  IQ: { he: 'עיראק', continent: 'אסיה', region: 'המזרח התיכון', lat: 33.3, lng: 44.4 },
  IR: { he: 'איראן', continent: 'אסיה', region: 'המזרח התיכון', lat: 32.7, lng: 51.7 },
  TR: { he: 'טורקיה', continent: 'אסיה', region: 'המזרח התיכון', lat: 41.0, lng: 29.0 },
  YE: { he: 'תימן', continent: 'אסיה', region: 'המזרח התיכון', lat: 15.4, lng: 44.2 },
  EG: { he: 'מצרים', continent: 'אפריקה', region: 'המזרח התיכון', lat: 30.0, lng: 31.2 },
  MA: { he: 'מרוקו', continent: 'אפריקה', region: 'המזרח התיכון', lat: 31.6, lng: -8.0 },
  TN: { he: 'תוניסיה', continent: 'אפריקה', region: 'המזרח התיכון', lat: 36.8, lng: 10.2 },
  // Sub-Saharan Africa
  ZA: { he: 'דרום אפריקה', continent: 'אפריקה', region: 'אפריקה שמדרום לסהרה', lat: -26.2, lng: 28.0 },
  GH: { he: 'גאנה', continent: 'אפריקה', region: 'אפריקה שמדרום לסהרה', lat: 6.7, lng: -1.6 },
  KE: { he: 'קניה', continent: 'אפריקה', region: 'אפריקה שמדרום לסהרה', lat: -1.3, lng: 36.8 },
  TZ: { he: 'טנזניה', continent: 'אפריקה', region: 'אפריקה שמדרום לסהרה', lat: -6.2, lng: 39.2 },
  NG: { he: 'ניגריה', continent: 'אפריקה', region: 'אפריקה שמדרום לסהרה', lat: 7.4, lng: 3.9 },
  ET: { he: 'אתיופיה', continent: 'אפריקה', region: 'אפריקה שמדרום לסהרה', lat: 9.0, lng: 38.7 },
  BW: { he: 'בוטסואנה', continent: 'אפריקה', region: 'אפריקה שמדרום לסהרה', lat: -24.7, lng: 25.9 },
  SN: { he: 'סנגל', continent: 'אפריקה', region: 'אפריקה שמדרום לסהרה', lat: 14.7, lng: -17.4 },
  // South Asia
  IN: { he: 'הודו', continent: 'אסיה', region: 'דרום אסיה', lat: 25.3, lng: 83.0 },
  NP: { he: 'נפאל', continent: 'אסיה', region: 'דרום אסיה', lat: 27.7, lng: 85.3 },
  LK: { he: 'סרי לנקה', continent: 'אסיה', region: 'דרום אסיה', lat: 7.3, lng: 80.6 },
  PK: { he: 'פקיסטן', continent: 'אסיה', region: 'דרום אסיה', lat: 31.5, lng: 74.3 },
  BT: { he: 'בהוטן', continent: 'אסיה', region: 'דרום אסיה', lat: 27.5, lng: 89.6 },
  // East and Southeast Asia
  JP: { he: 'יפן', continent: 'אסיה', region: 'מזרח אסיה', lat: 35.0, lng: 135.8 },
  CN: { he: 'סין', continent: 'אסיה', region: 'מזרח אסיה', lat: 39.9, lng: 116.4 },
  KR: { he: 'קוריאה', continent: 'אסיה', region: 'מזרח אסיה', lat: 37.6, lng: 127.0 },
  TW: { he: 'טאיוואן', continent: 'אסיה', region: 'מזרח אסיה', lat: 25.0, lng: 121.5 },
  MN: { he: 'מונגוליה', continent: 'אסיה', region: 'מזרח אסיה', lat: 47.9, lng: 106.9 },
  TH: { he: 'תאילנד', continent: 'אסיה', region: 'דרום-מזרח אסיה', lat: 13.8, lng: 100.5 },
  VN: { he: 'וייטנאם', continent: 'אסיה', region: 'דרום-מזרח אסיה', lat: 21.0, lng: 105.8 },
  ID: { he: 'אינדונזיה', continent: 'אסיה', region: 'דרום-מזרח אסיה', lat: -8.4, lng: 115.2 },
  PH: { he: 'הפיליפינים', continent: 'אסיה', region: 'דרום-מזרח אסיה', lat: 14.6, lng: 121.0 },
  MY: { he: 'מלזיה', continent: 'אסיה', region: 'דרום-מזרח אסיה', lat: 3.1, lng: 101.7 },
  // Americas
  US: { he: 'ארצות הברית', continent: 'אמריקה', region: 'צפון אמריקה', lat: 39.8, lng: -98.6 },
  CA: { he: 'קנדה', continent: 'אמריקה', region: 'צפון אמריקה', lat: 45.4, lng: -75.7 },
  MX: { he: 'מקסיקו', continent: 'אמריקה', region: 'אמריקה הלטינית', lat: 19.4, lng: -99.1 },
  BR: { he: 'ברזיל', continent: 'אמריקה', region: 'אמריקה הלטינית', lat: -22.9, lng: -43.2 },
  AR: { he: 'ארגנטינה', continent: 'אמריקה', region: 'אמריקה הלטינית', lat: -34.6, lng: -58.4 },
  PE: { he: 'פרו', continent: 'אמריקה', region: 'אמריקה הלטינית', lat: -13.5, lng: -72.0 },
  CL: { he: 'צ׳ילה', continent: 'אמריקה', region: 'אמריקה הלטינית', lat: -33.4, lng: -70.7 },
  CO: { he: 'קולומביה', continent: 'אמריקה', region: 'אמריקה הלטינית', lat: 4.7, lng: -74.1 },
  CU: { he: 'קובה', continent: 'אמריקה', region: 'אמריקה הלטינית', lat: 23.1, lng: -82.4 },
  // Oceania
  AU: { he: 'אוסטרליה', continent: 'אוקיאניה', region: 'אוקיאניה', lat: -25.3, lng: 133.8 },
  NZ: { he: 'ניו זילנד', continent: 'אוקיאניה', region: 'אוקיאניה', lat: -41.3, lng: 174.8 },
  WS: { he: 'סמואה', continent: 'אוקיאניה', region: 'אוקיאניה', lat: -13.8, lng: -172.0 },
};

// Must match TRADITIONS in supabase/functions/concept-origin/index.ts
export const TRADITIONS = [
  'יהדות',
  'נצרות',
  'אסלאם',
  'בודהיזם',
  'הינדואיזם',
  'דאואיזם וקונפוציאניזם',
  'שינטו',
  'מסורת עממית',
  'מסורת שבטית',
  'חילוני ומודרני',
] as const;

/**
 * For articles the origin function has not reached yet: the country named in
 * region_en or in the culture. Words, not guesses: no match, no flag.
 */
const NAMES: [RegExp, string][] = [
  [/japan|יפן/i, 'JP'], [/china|סין/i, 'CN'], [/korea|קוריאה/i, 'KR'], [/sweden|שוודיה|שוודית/i, 'SE'],
  [/norway|נורווג/i, 'NO'], [/denmark|דנמרק|דנית/i, 'DK'], [/finland|פינלנד|פינית/i, 'FI'],
  [/iceland|איסלנד/i, 'IS'], [/wales|וילס|ויילס|וולשית|scotland|united kingdom|england|בריטניה/i, 'GB'],
  [/ireland|אירלנד/i, 'IE'], [/netherlands|הולנד/i, 'NL'], [/germany|bavaria|גרמניה/i, 'DE'],
  [/france|צרפת/i, 'FR'], [/spain|andalusia|ספרד/i, 'ES'], [/portugal|lisbon|פורטוגל/i, 'PT'],
  [/italy|איטליה/i, 'IT'], [/greece|יוון/i, 'GR'], [/russia|רוסיה/i, 'RU'], [/india|varanasi|הודו/i, 'IN'],
  [/nepal|נפאל/i, 'NP'], [/south africa|דרום אפריקה|נגוני|זולו/i, 'ZA'], [/ghana|גאנה|אקאן/i, 'GH'],
  [/kenya|קניה/i, 'KE'], [/botswana|בוטסואנה/i, 'BW'], [/tanzania|zanzibar|טנזניה|סואהילי/i, 'TZ'], [/egypt|cairo|מצרים/i, 'EG'],
  [/israel|judea|jewish|יהדות|עברית|ישראל/i, 'IL'], [/levant|arab|middle east|ערבית|העולם הערבי/i, 'LB'],
  [/turkey|טורקיה/i, 'TR'], [/iran|persia|פרס/i, 'IR'], [/mexico|מקסיקו/i, 'MX'], [/brazil|ברזיל/i, 'BR'],
  [/hawaii|united states|ארצות הברית/i, 'US'], [/new zealand|maori|ניו זילנד/i, 'NZ'],
  [/australia|aboriginal|אוסטרליה|אבוריג/i, 'AU'],
  [/thailand|תאילנד/i, 'TH'], [/vietnam|וייטנאם/i, 'VN'], [/indonesia|bali|אינדונזיה/i, 'ID'],
];

export function countryCode(origin: { country?: string; region_en?: string; culture?: string }): string {
  const code = (origin.country ?? '').toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return code;
  const text = `${origin.region_en ?? ''} ${origin.culture ?? ''}`;
  return NAMES.find(([re]) => re.test(text))?.[1] ?? '';
}

export function countryOf(code: string): Country | undefined {
  return COUNTRIES[code];
}

/** Where a word sits on the globe: its own place of origin, else its country. */
export function pointOf(origin: { lat?: number | null; lng?: number | null; country?: string; region_en?: string; culture?: string }): [number, number] | null {
  if (typeof origin.lat === 'number' && typeof origin.lng === 'number') return [origin.lng, origin.lat];
  const c = COUNTRIES[countryCode(origin)];
  return c ? [c.lng, c.lat] : null;
}
