// Suggestions shown on the home page so the user knows what to ask
// and what to compare. Clicking a concept generates it.
// `hint` is sent to the model to disambiguate the concept.

export interface ConceptSuggestion {
  label: string; // Hebrew display
  hint: string;  // transliteration + culture, sent to the model
}

export interface CultureGroup {
  name: string;
  region_en: string;
  concepts: ConceptSuggestion[];
}

export interface ComparisonQuestion {
  question: string;
  need: string; // matches HUMAN_NEEDS
  concepts: ConceptSuggestion[];
}

export const cultureGroups: CultureGroup[] = [
  {
    name: 'יפן',
    region_en: 'Japan',
    concepts: [
      { label: 'מא', hint: 'Ma (間), Japan' },
      { label: 'ואבי-סאבי', hint: 'Wabi-sabi (侘寂), Japan' },
      { label: 'קינצוגי', hint: 'Kintsugi (金継ぎ), Japan' },
      { label: 'שינרין-יוקו', hint: 'Shinrin-yoku (森林浴), Japan' },
      { label: 'איקיגאי', hint: 'Ikigai (生き甲斐), Japan' },
    ],
  },
  {
    name: 'סקנדינביה',
    region_en: 'Scandinavia — Denmark, Sweden, Norway, Finland',
    concepts: [
      { label: 'היגה', hint: 'Hygge, Denmark' },
      { label: 'לאגום', hint: 'Lagom, Sweden' },
      { label: 'קושליג', hint: 'Koselig, Norway' },
      { label: 'סיסו', hint: 'Sisu, Finland' },
      { label: 'פרילופטסליב', hint: 'Friluftsliv, Norway' },
    ],
  },
  {
    name: 'הים התיכון',
    region_en: 'Mediterranean — Greece, Spain, Portugal',
    concepts: [
      { label: 'פילוקסניה', hint: 'Philoxenia (Φιλοξενία), Greece' },
      { label: 'מראקי', hint: 'Meraki (Μεράκι), Greece' },
      { label: 'קאירוס', hint: 'Kairos (Καιρός), Ancient Greece' },
      { label: 'סובמסה', hint: 'Sobremesa, Spain' },
      { label: 'קרנסיה', hint: 'Querencia, Spain' },
      { label: 'סאודאדה', hint: 'Saudade, Portugal' },
    ],
  },
  {
    name: 'העולם הערבי',
    region_en: 'Arab world',
    concepts: [
      { label: 'כַּרַם', hint: 'Karam (كرم), Arabic' },
      { label: 'בַּרַכָּה', hint: 'Baraka (بركة), Arabic' },
      { label: 'טַרַב', hint: 'Tarab (طرب), Arabic' },
      { label: 'צַבְּר', hint: 'Sabr (صبر), Arabic' },
    ],
  },
  {
    name: 'יהדות ועברית',
    region_en: 'Jewish and Hebrew tradition',
    concepts: [
      { label: 'שבת', hint: 'Shabbat, Hebrew' },
      { label: 'תיקון', hint: 'Tikkun, Hebrew' },
      { label: 'הכנסת אורחים', hint: 'Hachnasat orchim, Hebrew' },
      { label: 'תשובה', hint: 'Teshuva, Hebrew' },
    ],
  },
  {
    name: 'הודו',
    region_en: 'India',
    concepts: [
      { label: 'דהרמה', hint: 'Dharma (धर्म), Sanskrit' },
      { label: 'סמסקארה', hint: 'Samskara (संस्कार), Sanskrit' },
      { label: 'דוקהה', hint: 'Dukkha, Pali / Sanskrit duhkha' },
    ],
  },
  {
    name: 'אפריקה',
    region_en: 'Sub-Saharan Africa — South Africa, Kenya, Ghana',
    concepts: [
      { label: 'אובונטו', hint: 'Ubuntu, Nguni languages, Southern Africa' },
      { label: 'הרמבה', hint: 'Harambee, Swahili, Kenya' },
      { label: 'סנקופה', hint: 'Sankofa, Akan, Ghana' },
    ],
  },
  {
    name: 'מרכז אירופה',
    region_en: 'Central Europe — Germany, Austria',
    concepts: [
      { label: 'גמיטליכקייט', hint: 'Gemütlichkeit, German' },
      { label: 'ולדאיינזאמקייט', hint: 'Waldeinsamkeit, German' },
      { label: 'בילדונג', hint: 'Bildung, German' },
      { label: 'היימאט', hint: 'Heimat, German' },
    ],
  },
  {
    name: 'סין',
    region_en: 'China',
    concepts: [
      { label: 'וו-ויי', hint: 'Wu wei (無為), Chinese' },
      { label: 'פנג שואי', hint: 'Feng shui (風水), Chinese' },
      { label: 'יין ויאנג', hint: 'Yin-yang (陰陽), Chinese' },
    ],
  },
  {
    name: 'כמיהה: ויילס ורוסיה',
    region_en: 'Wales, Russia',
    concepts: [
      { label: 'הירָאת׳', hint: 'Hiraeth, Welsh' },
      { label: 'טוסקה', hint: 'Toska (Тоска), Russian' },
    ],
  },
];

export const comparisonQuestions: ComparisonQuestion[] = [
  {
    question: 'מה עושה כל תרבות עם געגוע?',
    need: 'געגוע',
    concepts: [
      { label: 'סאודאדה', hint: 'Saudade, Portugal' },
      { label: 'הירָאת׳', hint: 'Hiraeth, Welsh' },
      { label: 'טוסקה', hint: 'Toska (Тоска), Russian' },
    ],
  },
  {
    question: 'איך תרבויות שונות מקבלות את הזר בפתח הבית?',
    need: 'אירוח',
    concepts: [
      { label: 'פילוקסניה', hint: 'Philoxenia (Φιλοξενία), Greece' },
      { label: 'כַּרַם', hint: 'Karam (كرم), Arabic' },
      { label: 'הכנסת אורחים', hint: 'Hachnasat orchim, Hebrew' },
    ],
  },
  {
    question: 'מה משמעות הריק בבית?',
    need: 'מנוחה',
    concepts: [
      { label: 'מא', hint: 'Ma (間), Japan' },
      { label: 'היגה', hint: 'Hygge, Denmark' },
      { label: 'לאגום', hint: 'Lagom, Sweden' },
    ],
  },
];
