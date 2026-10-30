// Culture is also language: how a language orders a sentence, builds a word,
// marks gender or rank says something about the people who speak it.
//
// These are structural facts, written by hand, each resting on a source:
//   word order, gender          WALS Online, Dryer & Haspelmath (eds.), 2013
//   script and letter counts    the language's official alphabet; Omniglot
//   high- and low-context       Edward T. Hall, Beyond Culture, 1976 - only for
//                               the cultures Hall himself placed
// The interpretation of what a structure means for a culture is shown as
// interpretation, never as one of these facts.

export interface LanguageProfile {
  code: string;
  he: string;
  en: string;
  script: string;        // name and type of the writing system
  letters: string;       // how many signs, in words
  order: 'SOV' | 'SVO' | 'VSO' | 'V2' | 'חופשי';
  orderNote?: string;
  build: string;         // how words are built
  gender: string;        // grammatical gender or noun classes
  politeness: string;    // how address marks closeness and rank
  context?: 'גבוה' | 'נמוך';
  trait: string;         // one distinctive structural fact
}

export const ORDER_LABEL: Record<LanguageProfile['order'], string> = {
  SOV: 'נושא, מושא, נשוא',
  SVO: 'נושא, נשוא, מושא',
  VSO: 'נשוא, נושא, מושא',
  V2: 'הנשוא במקום השני',
  חופשי: 'סדר חופשי',
};

export const LANGUAGES: Record<string, LanguageProfile> = {
  he: {
    code: 'he', he: 'עברית', en: 'Hebrew',
    script: 'כתב עברי, אבג׳ד (עיצורים בלבד)', letters: '22 אותיות',
    order: 'SVO', orderNote: 'בעברית המקראית הנשוא בא לרוב ראשון',
    build: 'שורש ומשקל: שורש של שלושה עיצורים יוצק מילים בתבניות',
    gender: 'זכר ונקבה, גם בפועל ובגוף שני', politeness: 'בלי פנייה מנומסת נפרדת: "אתה" לכל אדם',
    trait: 'משפחת מילים נולדת משורש אחד: כתב, מכתב, כתובת, הכתבה',
  },
  ar: {
    code: 'ar', he: 'ערבית', en: 'Arabic',
    script: 'כתב ערבי, אבג׳ד מחובר', letters: '28 אותיות',
    order: 'VSO', orderNote: 'VSO בערבית הספרותית, SVO נפוץ בדיבור',
    build: 'שורש ומשקל, כמו בעברית', gender: 'זכר ונקבה', politeness: 'תארי כבוד ונוסחאות ברכה ארוכות',
    context: 'גבוה',
    trait: 'דיגלוסיה: ערבית ספרותית אחת לצד דיאלקטים מדוברים שונים מאוד',
  },
  ja: {
    code: 'ja', he: 'יפנית', en: 'Japanese',
    script: 'שתי הברתיות (היראגנה, קטקנה) לצד קאנג׳י', letters: '46 הברות בכל הברתית, 2,136 קאנג׳י בשימוש רשמי',
    order: 'SOV', build: 'צירופית: סיומות נצמדות זו לזו', gender: 'אין',
    politeness: 'קֵייגו: שלוש רמות דיבור של כבוד וענווה', context: 'גבוה',
    trait: 'הנושא נשמט לעיתים קרובות, והפועל בא תמיד בסוף',
  },
  zh: {
    code: 'zh', he: 'סינית', en: 'Chinese',
    script: 'כתב סיני, לוגוגרפי (סימן למילה או להברה)', letters: 'כ-3,500 סימנים נפוצים',
    order: 'SVO', build: 'מבודדת: מילים לא משתנות, היחסים נקבעים בסדר ובמילות עזר', gender: 'אין',
    politeness: 'פנייה מכבדת נפרדת (您 לעומת 你)', context: 'גבוה',
    trait: 'טונאלית: ארבעה טונים, אותה הברה בטון אחר היא מילה אחרת',
  },
  ko: {
    code: 'ko', he: 'קוריאנית', en: 'Korean',
    script: 'האנגול, אלפבית שנוצר ב-1443', letters: '24 אותיות',
    order: 'SOV', build: 'צירופית', gender: 'אין', politeness: 'רמות דיבור לפי גיל ומעמד', context: 'גבוה',
    trait: 'האלפבית תוכנן במכוון, וצורת האות משרטטת את תנועת הפה',
  },
  sa: {
    code: 'sa', he: 'סנסקריט', en: 'Sanskrit',
    script: 'דוונאגרי, אבוגידה (עיצור עם תנועה מובנית)', letters: 'כ-48 צלילים',
    order: 'SOV', orderNote: 'הסדר חופשי יחסית, ברירת המחדל SOV',
    build: 'נטייה עשירה: 8 יחסות, ומילים מורכבות ארוכות (סָמָאסָה)', gender: 'זכר, נקבה וסתמי',
    politeness: 'פנייה מכבדת בגוף שלישי (bhavān)',
    trait: 'הדקדוק של פאניני (Pāṇini, כ-400 לפנה״ס) תיאר אותה ב-4,000 כללים',
  },
  hi: {
    code: 'hi', he: 'הינדי', en: 'Hindi',
    script: 'דוונאגרי, אבוגידה', letters: 'כ-44 אותיות (11 תנועות ו-33 עיצורים)', order: 'SOV', build: 'נטייה ומילות יחס אחרי השם',
    gender: 'זכר ונקבה', politeness: 'שלוש דרגות של "אתה": tū, tum, āp',
    trait: 'מילות היחס באות אחרי השם, כמו בסנסקריט',
  },
  sv: {
    code: 'sv', he: 'שוודית', en: 'Swedish',
    script: 'לטיני', letters: '29 אותיות (å, ä, ö)', order: 'V2', build: 'נטייה מועטה, מילים מורכבות',
    gender: 'כללי וסתמי', politeness: 'רפורמת ה"דו" בשנות ה-60: כולם פונים זה לזה ב"אתה"', context: 'נמוך',
    trait: 'מבטא טונאלי: שתי מילים נבדלות רק בעליית הקול',
  },
  da: {
    code: 'da', he: 'דנית', en: 'Danish',
    script: 'לטיני', letters: '29 אותיות (æ, ø, å)', order: 'V2', build: 'נטייה מועטה, מילים מורכבות',
    gender: 'כללי וסתמי', politeness: '"דו" כמעט לכולם; "דה" המכבד נדיר', context: 'נמוך',
    trait: 'הסְטֵד (stød): עצירה קלה בגרון שמבדילה בין מילים',
  },
  no: {
    code: 'no', he: 'נורווגית', en: 'Norwegian',
    script: 'לטיני', letters: '29 אותיות (æ, ø, å)', order: 'V2', build: 'נטייה מועטה, מילים מורכבות',
    gender: 'זכר, נקבה וסתמי (בנורמות רבות)', politeness: '"דו" לכולם', context: 'נמוך',
    trait: 'שתי שפות כתיבה רשמיות: בּוּקמוֹל ונִינוֹשק',
  },
  fi: {
    code: 'fi', he: 'פינית', en: 'Finnish',
    script: 'לטיני', letters: '29 אותיות (ä, ö, å)', order: 'SVO', build: 'צירופית: 15 יחסות דקדוקיות',
    gender: 'אין: "hän" הוא גם הוא וגם היא', politeness: '"te" המכבד בשימוש מועט', context: 'נמוך',
    trait: 'אין יידוע ואין זמן עתיד דקדוקי',
  },
  de: {
    code: 'de', he: 'גרמנית', en: 'German',
    script: 'לטיני', letters: '26 אותיות ועוד ä, ö, ü, ß', order: 'V2', orderNote: 'בפסוקית משנה הפועל עובר לסוף (SOV)',
    build: 'נטייה ומילים מורכבות ארוכות', gender: 'זכר, נקבה וסתמי', politeness: 'du לעומת Sie', context: 'נמוך',
    trait: 'כל שם עצם נכתב באות גדולה, ומושג חדש נבנה מהרכבה',
  },
  nl: {
    code: 'nl', he: 'הולנדית', en: 'Dutch',
    script: 'לטיני', letters: '26 אותיות', order: 'V2', orderNote: 'בפסוקית משנה SOV',
    build: 'נטייה מועטה, מילים מורכבות', gender: 'כללי וסתמי', politeness: 'jij לעומת u',
    trait: 'הקטנה (-je) נפוצה מאוד ומעניקה חום למילה',
  },
  af: {
    code: 'af', he: 'אפריקאנס', en: 'Afrikaans',
    script: 'לטיני', letters: '26 אותיות', order: 'V2', build: 'כמעט בלי נטייה', gender: 'אין',
    politeness: 'jy לעומת u', trait: 'שלילה כפולה: "nie ... nie" בסוף המשפט',
  },
  es: {
    code: 'es', he: 'ספרדית', en: 'Spanish',
    script: 'לטיני', letters: '27 אותיות (ñ)', order: 'SVO', build: 'נטייה עשירה בפועל', gender: 'זכר ונקבה',
    politeness: 'tú לעומת usted',
    trait: 'שני פעלי "להיות": ser למהות, estar למצב',
  },
  pt: {
    code: 'pt', he: 'פורטוגזית', en: 'Portuguese',
    script: 'לטיני', letters: '26 אותיות', order: 'SVO', build: 'נטייה עשירה בפועל', gender: 'זכר ונקבה',
    politeness: 'tu, você ו-o senhor', trait: 'שם פועל שמקבל גוף (infinitivo pessoal), נדיר בשפות',
  },
  it: {
    code: 'it', he: 'איטלקית', en: 'Italian',
    script: 'לטיני', letters: '21 אותיות', order: 'SVO', build: 'נטייה עשירה בפועל', gender: 'זכר ונקבה',
    politeness: 'tu לעומת Lei', trait: 'הנושא נשמט, כי סיומת הפועל כבר אומרת מי',
  },
  fr: {
    code: 'fr', he: 'צרפתית', en: 'French',
    script: 'לטיני', letters: '26 אותיות', order: 'SVO', build: 'נטייה בפועל', gender: 'זכר ונקבה',
    politeness: 'tu לעומת vous', trait: 'המעבר מ-vous ל-tu הוא רגע חברתי מסומן',
  },
  el: {
    code: 'el', he: 'יוונית', en: 'Greek',
    script: 'אלפבית יווני', letters: '24 אותיות', order: 'SVO', orderNote: 'סדר גמיש',
    build: 'נטייה עשירה', gender: 'זכר, נקבה וסתמי', politeness: 'εσύ לעומת εσείς',
    trait: 'נכתבת ברציפות כ-3,400 שנה, מכתב קווי B ועד היום',
  },
  ru: {
    code: 'ru', he: 'רוסית', en: 'Russian',
    script: 'קירילי', letters: '33 אותיות', order: 'SVO', orderNote: 'סדר חופשי, SVO נייטרלי',
    build: 'נטייה עשירה: 6 יחסות', gender: 'זכר, נקבה וסתמי', politeness: 'ты לעומת вы',
    trait: 'אספקט: לכל פועל זוג, פעולה שהושלמה ופעולה מתמשכת',
  },
  cy: {
    code: 'cy', he: 'וולשית', en: 'Welsh',
    script: 'לטיני', letters: '29 אותיות, 8 מהן צירופים (ch, dd, ll)', order: 'VSO',
    build: 'נטייה בפועל ובמילות יחס', gender: 'זכר ונקבה', politeness: 'ti לעומת chi',
    trait: 'מוטציות: האות הראשונה של מילה משתנה לפי המילה שלפניה',
  },
  ga: {
    code: 'ga', he: 'אירית', en: 'Irish',
    script: 'לטיני', letters: '18 אותיות במסורת', order: 'VSO', build: 'נטייה ומוטציות',
    gender: 'זכר ונקבה', politeness: 'בלי פנייה מכבדת נפרדת',
    trait: 'אין מילה ל"כן" ול"לא": עונים בחזרה על הפועל',
  },
  zu: {
    code: 'zu', he: 'זולו', en: 'Zulu',
    script: 'לטיני', letters: '26 אותיות וצירופים', order: 'SVO', build: 'צירופית',
    gender: 'כ-15 מחלקות שם (לא זכר ונקבה)', politeness: 'פנייה ברבים לאדם מכובד',
    trait: 'צלילי נקישה (c, q, x) שנשאלו משפות הקוֹיסאן',
  },
  tn: {
    code: 'tn', he: 'סצואנה', en: 'Setswana',
    script: 'לטיני', letters: '26 אותיות וצירופים', order: 'SVO', build: 'צירופית', gender: 'מחלקות שם',
    politeness: 'פנייה ברבים לאדם מכובד', trait: 'הפועל מסכים עם מחלקת השם של הנושא',
  },
  sw: {
    code: 'sw', he: 'סווהילי', en: 'Swahili',
    script: 'לטיני (בעבר כתב ערבי)', letters: '24 אותיות וצירופים', order: 'SVO', build: 'צירופית',
    gender: 'כ-15 מחלקות שם', politeness: 'ברכות כבוד לפי גיל (shikamoo)',
    trait: 'שפת מסחר: שלד בנטו ואוצר מילים רחב מערבית',
  },
  ak: {
    code: 'ak', he: 'אקאן (טווי)', en: 'Akan',
    script: 'לטיני (ɛ, ɔ)', letters: '22 אותיות', order: 'SVO', build: 'מבודדת יחסית',
    gender: 'אין', politeness: 'פנייה דרך מתווך (אוקיאמי) בטקסי כבוד',
    trait: 'טונאלית, ותרבות של פתגמים וסמלי אדינקרה (Adinkra)',
  },
  tr: {
    code: 'tr', he: 'טורקית', en: 'Turkish',
    script: 'לטיני מאז 1928', letters: '29 אותיות', order: 'SOV', build: 'צירופית, עם הרמוניית תנועות',
    gender: 'אין', politeness: 'sen לעומת siz', trait: 'מילה אחת יכולה לשאת משפט שלם של סיומות',
  },
  fa: {
    code: 'fa', he: 'פרסית', en: 'Persian',
    script: 'כתב ערבי מותאם', letters: '32 אותיות', order: 'SOV', build: 'נטייה מועטה',
    gender: 'אין', politeness: 'to לעומת shomā, ותרבות הנימוס תַּעָרוֹף',
    trait: 'אין מגדר דקדוקי: "u" הוא גם הוא וגם היא',
  },
};

/** The language of a word when nothing more specific is known: its country's main one. */
const BY_COUNTRY: Record<string, string> = {
  IL: 'he', EG: 'ar', SA: 'ar', LB: 'ar', SY: 'ar', JO: 'ar', IQ: 'ar', MA: 'ar', TN: 'ar', YE: 'ar',
  JP: 'ja', CN: 'zh', TW: 'zh', KR: 'ko', IN: 'sa', NP: 'sa',
  SE: 'sv', DK: 'da', NO: 'no', FI: 'fi', DE: 'de', AT: 'de', NL: 'nl', ES: 'es', MX: 'es', AR: 'es',
  PT: 'pt', BR: 'pt', IT: 'it', FR: 'fr', GR: 'el', RU: 'ru', IE: 'ga', ZA: 'zu', BW: 'tn',
  KE: 'sw', TZ: 'sw', GH: 'ak', TR: 'tr', IR: 'fa',
};

export function languageOf(origin: { lang?: { code?: string }; country?: string; culture?: string }): LanguageProfile | undefined {
  const own = origin.lang?.code;
  if (own && LANGUAGES[own]) return LANGUAGES[own];
  if (/וולש|וילס|ויילס/.test(origin.culture ?? '')) return LANGUAGES.cy;
  return LANGUAGES[BY_COUNTRY[(origin.country ?? '').toUpperCase()] ?? ''];
}
