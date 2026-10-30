// The deep root of a culture: the eleven ancient civilizations of ARCHITAIP,
// Anat's "cultural DNA" app (https://architaip.vercel.app). Copied from
// ARCHITAIP-GH/dwelling-dna/src/data/cultures.js, which stays the source: when a
// civilization changes there, it changes here. Only the fields this app reads.

export interface Civilization {
  id: string;
  name: string;
  archetype: string;
  chaos: string;
  order: string;
  role: string;
  color: string;
  vectors: { material: string; light: string; threshold: string; proportion: string; narrative: string };
  insight: string;
}

export const ARCHITAIP_URL = 'https://architaip.vercel.app';

export const CIVILIZATIONS: Civilization[] = [
  {
    "id": "mesopotamia",
    "name": "מסופוטמיה",
    "archetype": "שמירה על הסדר",
    "chaos": "כוח עיוור",
    "order": "כיבוש יומיומי",
    "role": "שמירה",
    "color": "#C19A6B",
    "vectors": {
      "material": "לבנת בוץ כבדה, גסה, לא מלוטשת — חומר שנלקח מהאדמה ויחזור אליה",
      "light": "אור אופקי וכבד, שמש מדברית שמשטחת צל, בלי חסד",
      "threshold": "שערים מסיביים כהגנה — הסף הוא חומה, לא הזמנה",
      "proportion": "נמוך ורחב, צמוד לאדמה, כובד גרביטציוני מכוון",
      "narrative": "כל מבנה הוא עדות לניצחון זמני על הכאוס — לא חגיגה, אלא הכרזה"
    },
    "insight": "\"המרחב אינו מגן — הוא מכריז. אני עומד. הסדר מחזיק.\""
  },
  {
    "id": "egypt",
    "name": "מצרים",
    "archetype": "הוכחת הקיום",
    "chaos": "חוסר משקל קוסמי",
    "order": "שקילת הלב",
    "role": "הוכחה",
    "color": "#D4AF37",
    "vectors": {
      "material": "אבן נצחית, חלקה, מדויקת — חומר שמסרב לחלוף",
      "light": "אור שמגיע בזווית מחושבת, יוצר צל מדויק — כל פתח הוא כוונה",
      "threshold": "פרופילאקס — מעבר טקסי שמחייב הכנה ולא רק הגעה",
      "proportion": "מונומנטלי מכוון — הגוף האנושי מדגיש את זעירותו",
      "narrative": "המרחב מזכיר לכל מי שנכנס: אתה זמני, האבן נצחית"
    },
    "insight": "\"אתה חולף. האבן נשארת. חי את חייך בהתאם.\""
  },
  {
    "id": "india",
    "name": "הודו הוודאית",
    "archetype": "ביצוע הדהרמה",
    "chaos": "אי-תפקוד דהרמי",
    "order": "קשר קוסמי חובה",
    "role": "ביצוע",
    "color": "#FF6B35",
    "vectors": {
      "material": "עץ מגולף, אבן חיה, חומר שמכיל אלוהות — כל משטח הוא מקדש",
      "light": "אור פילטרי דרך גילופים, נקודות אור בתוך חשכה — קדושה מתגלה בפיר",
      "threshold": "מנדפה — טרם הכניסה יש מרחב הכנה, לא ניתן להיכנס ישירות",
      "proportion": "רב-שכבתי ואנכי, צמיחה כלפי מעלה כמו מנטרה חזותית",
      "narrative": "המרחב הוא קוסמוגרמה — תרשים של הסדר האלוהי מתורגם לאדריכלות"
    },
    "insight": "\"המרחב לא מכיל אלוהות — הוא מיצגה. כל עמוד הוא ריקוד קפוא.\""
  },
  {
    "id": "china",
    "name": "סין הקדומה",
    "archetype": "שיקוף קוסמי",
    "chaos": "חוסר הרמוניה שמיים-ארץ",
    "order": "שמיים כמדד",
    "role": "שיקוף",
    "color": "#C41E3A",
    "vectors": {
      "material": "עץ, אבן ירוקה, חרסינה — חומרים שמתנהגים לפי טבעם המדויק",
      "light": "אור שמגיע דרך חצר פנימית, שמיים כמקור יחיד — הארץ מקבלת",
      "threshold": "שער עגול — סף שמסמן מעבר בין עולמות, לא בין חדרים",
      "proportion": "סימטריה מדויקת, ציר מרכזי חזק — כל אלמנט יודע את מקומו",
      "narrative": "המרחב ממשיך את הדאו — הוא לא נלחם בטבע, הוא ממשיך אותו"
    },
    "insight": "\"הבית הוא שאלה שיש לה תשובה. הציר מדבר. כי השמיים מקשיבים.\""
  },
  {
    "id": "maya",
    "name": "מאיה",
    "archetype": "תשלום החוב הקוסמי",
    "chaos": "חוב דם שלא שולם",
    "order": "עסקת קיום",
    "role": "תשלום",
    "color": "#4A7C2F",
    "vectors": {
      "material": "אבן גיר מסותתת, ג'ונגל שחודר פנימה — הטבע לא נדחה, הוא שותף",
      "light": "אור שנופל בדיוק אסטרונומי — בימים מסוימים השמש מדברת ישירות",
      "threshold": "מדרגות תלולות מכוונות — הסף הוא מאמץ גופני, טיפוס הוא תשלום",
      "proportion": "פירמידלי, אנכי מתכנס — הפרופורציות מכוונות לנקודה בשמיים",
      "narrative": "המרחב הוא שעון ולוח שנה — הוא מודד זמן ומחייב טקס"
    },
    "insight": "\"כל מדרגה שעלית — יום חיים ששולם. הגוף הוא מטבע הקיום.\""
  },
  {
    "id": "israel",
    "name": "ישראל הקדומה",
    "archetype": "ברית ואמון",
    "chaos": "ניתוק מהברית",
    "order": "בחירה הדדית",
    "role": "עדות",
    "color": "#C4A882",
    "vectors": {
      "material": "אבן ירושלמית גולמית, עץ זית מיושן — חומר שנושא זיכרון",
      "light": "אור שנכנס מלמעלה ולא מהצד — אור כמחייב, לא כמנחם",
      "threshold": "ספים שדורשים החלטה — לא ניתן לחצות בשוגג",
      "proportion": "פרופורציה של עדות לא של נוחות — המרחב לא מפנק",
      "narrative": "המרחב שואל: מה אתה חייב לזכור?"
    },
    "insight": "\"כאן לא בנו כדי להתפאר. בנו כדי לזכור. זיכרון הוא ברית.\""
  },
  {
    "id": "persia",
    "name": "פרס זורואסטרית",
    "archetype": "בחירה קוסמית",
    "chaos": "רוע פעיל",
    "order": "מלחמה מוסרית",
    "role": "בחירה",
    "color": "#1B5FAA",
    "vectors": {
      "material": "שיש מלוטש, פסיפס צבעוני — יופי כנשק נגד החושך",
      "light": "אור שמנצח חושך — הבדל מכוון בין מרחבים מוארים לחשוכים",
      "threshold": "פרופילאון מרשים — הכניסה מכריזה על ניצחון לפני שנכנסים",
      "proportion": "אימפריאלי ומרהיב — קנה המידה אומר: הטוב שולט כאן",
      "narrative": "אתה בתוך הטוב, בחוץ שורר הרוע"
    },
    "insight": "\"כאן, בתוך המרחב הזה, בחרת בטוב. בחוץ — ההחלטה מחכה לך.\""
  },
  {
    "id": "greece",
    "name": "יוון הקלאסית",
    "archetype": "הכרת הגבול",
    "chaos": "הוברִיס",
    "order": "גבול קפדני",
    "role": "קתרסיס",
    "color": "#E8E4C9",
    "vectors": {
      "material": "שיש לבן, אבן חיה שמגיבה לאור — חומר שמחפש שלמות",
      "light": "אור ים-תיכוני חד ובהיר — צללים מדויקים כגיאומטריה",
      "threshold": "פרונאוס — מרחב הכנה לפני הקדוש, ללא מעבר ישיר",
      "proportion": "יחס הזהב ומודולור האנושי — הגוף הוא קנה המידה של הכל",
      "narrative": "המרחב מוכיח שסדר אפשרי — ויכוח מנצח נגד הכאוס"
    },
    "insight": "\"הגוף שלך הוא קנה המידה. החוק שלך הוא הגבול. ראה — ושמור.\""
  },
  {
    "id": "celtic",
    "name": "קלטים",
    "archetype": "חציית הסף",
    "chaos": "גבול סגור",
    "order": "נזילות הקרומים",
    "role": "חציית סף",
    "color": "#3A7A34",
    "vectors": {
      "material": "אבן מחוספסת, כיסוי טבעי מאזוב, עץ עתיק — חומר שהטבע מאמץ בחזרה",
      "light": "אור מפוזר דרך עלווה, ערפל ואור בו-זמנית — לא ניתן להפריד",
      "threshold": "גבול מטושטש מכוון — קשה לדעת מתי היית בפנים ומתי בחוץ",
      "proportion": "אורגני ולא סימטרי — הצורה צומחת מהקרקע כמו עץ",
      "narrative": "המרחב שואל: היכן מסתיים הבית ומתחיל היער?"
    },
    "insight": "\"אין פנים ואין חוץ. יש רק רגע המעבר. היה שם.\""
  },
  {
    "id": "japan",
    "name": "יפן שינטו",
    "archetype": "טוהר אקטיבי",
    "chaos": "קגארה — זוהמה",
    "order": "נוכחות הרוחות",
    "role": "טיהור",
    "color": "#F0ECD8",
    "vectors": {
      "material": "עץ הינוקי, נייר ואשי, חצץ מגורף — חומרים שמגיבים לזמן בחן",
      "light": "אור מסונן דרך שוג'י, מפוזר ושווה — לא כיוון אחד, אלא נוכחות",
      "threshold": "טוריי ונוצה — הסף הוא טקס ניקוי, לא מעבר פיזי בלבד",
      "proportion": "ממוזער ומדויק — כל סנטימטר נושא כוונה, אין בזבוז",
      "narrative": "המרחב הוא שמירה — הוא מוזמן לנוח בקשב מלא"
    },
    "insight": "\"פחות. מדויק. כוונה. הרוחות נוכחות כאשר הרעש נעלם.\""
  },
  {
    "id": "africa",
    "name": "אפריקה Ubuntu",
    "archetype": "קישור השלם",
    "chaos": "ניתוק קהילתי",
    "order": "רשת יחסים",
    "role": "גישור",
    "color": "#C4622D",
    "vectors": {
      "material": "טיט, במבוק, סיבים טבעיים — חומר שהקהילה בנתה בידיים",
      "light": "אור פתוח של חצר מרכזית — השמיים הם התקרה המשותפת",
      "threshold": "חצר פנימית כלב — הכניסה היא אל הקהילה, לא אל הפרט",
      "proportion": "מעגלי ומרכזי — הפרופורציה אומרת: המרכז שייך לכולם",
      "narrative": "אני קיים כי אנחנו קיימים"
    },
    "insight": "\"בית שנבנה לפרט לבדו — אינו בית. הוא בידוד עם קירות.\""
  }
];

/**
 * Which civilization a present-day word grows from. Only direct lines: a
 * culture with no ancestor among the eleven (Scandinavia, Russia, Iberia) gets
 * none rather than a forced one.
 */
const BY_COUNTRY: Record<string, string> = {
  IQ: 'mesopotamia', SY: 'mesopotamia',
  EG: 'egypt',
  IN: 'india', NP: 'india', LK: 'india', BT: 'india',
  CN: 'china', TW: 'china',
  MX: 'maya', GT: 'maya',
  IL: 'israel',
  IR: 'persia',
  GR: 'greece', CY: 'greece',
  IE: 'celtic',
  JP: 'japan',
  ZA: 'africa', GH: 'africa', KE: 'africa', TZ: 'africa', NG: 'africa', ET: 'africa', SN: 'africa', BW: 'africa',
};

export function civilizationOf(code: string, culture = ''): Civilization | undefined {
  // Britain is Celtic only where the word is Welsh, Scottish or Cornish.
  const id = code === 'GB' ? (/וולש|וילס|ויילס|סקוט|קורני|welsh|scot|cornish|gael/i.test(culture) ? 'celtic' : '') : BY_COUNTRY[code];
  return CIVILIZATIONS.find(c => c.id === id);
}
