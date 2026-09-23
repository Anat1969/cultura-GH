// CultureArch — content model
// Three-layer method mapped onto the MathArch skeleton:
// origin = linguistic layer | insight = contextual + psychological layer
// interpretation = local bridge | practice = why/how/when/where | images = space

export interface Origin {
  script: string;          // original spelling in native script, e.g. 間
  transliteration: string; // Latin transliteration, e.g. Ma
  literal: string;         // literal meaning, in Hebrew
  culture: string;         // culture / language, in Hebrew, e.g. יפן
  region_en: string;       // region / country in English for search, e.g. Japan
}

export interface Practice {
  why: string;
  how: string;
  when: string;
  where: string;
}

export interface GeneratedDimensions {
  insight: string;         // origin context + human need + psychology (+ uncertainty note)
  spaceName: string;       // poetic name of the space embodying the concept
  proverb: string;         // original line "in the spirit of" — never attributed to the culture
  interpretation: string;  // bridge to Israeli / Jewish culture
  humanNeed: string;       // one value from HUMAN_NEEDS — drives comparison
  origin: Origin;
  practice: Practice;
  imagePrompts: {
    exterior: string;      // the concept in its place of origin
    interior: string;      // a healing living space in Israel
  };
}

export interface Article {
  id: string;
  concept: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  dimensions: GeneratedDimensions;
  images: {
    exterior: string | null;
    interior: string | null;
  };
}

// Closed list so that comparison grouping stays consistent.
// Must match HUMAN_NEEDS in supabase/functions/generate-dimensions/index.ts
export const HUMAN_NEEDS = [
  'שייכות',
  'מנוחה',
  'געגוע',
  'משמעות',
  'קהילה',
  'אירוח',
  'איזון',
  'חוסן',
  'שינוי',
  'קבלת אי-שלמות',
  'חיבור לטבע',
  'זמן',
] as const;

export const emptyOrigin: Origin = {
  script: '',
  transliteration: '',
  literal: '',
  culture: '',
  region_en: '',
};

export const emptyPractice: Practice = { why: '', how: '', when: '', where: '' };

export const practiceLabels: Record<keyof Practice, string> = {
  why: 'למה',
  how: 'איך',
  when: 'מתי',
  where: 'איפה',
};

export function buildTags(d: GeneratedDimensions): string[] {
  return Array.from(
    new Set([d.origin?.culture, d.humanNeed].filter((t): t is string => !!t && !!t.trim()))
  );
}
