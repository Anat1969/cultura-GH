# CultureArch — מרחבי תרבות

אפליקציה אחות ל-MathArch. אותו שלד ואותה חוויה, והתוכן הוא מושגי תרבות במקום מושגים מתמטיים.

## מה נשאר ומה השתנה

**השלד לא השתנה.** אין מסכים חדשים. הנתיבים זהים: `/`, `/generate`, `/article/:id`, `/library`, `/concepts`, `/concept/:x`, `/edit/:id`.

| שכבה בשיטה | שדה |
|---|---|
| לשונית | `origin` (חדש): כתב מקורי, תעתיק, משמעות מילולית, תרבות, אזור בלועזית |
| הקשרית ופסיכולוגית | `insight` |
| גישור | `interpretation` |
| יישום | `practice` (חדש): למה, איך, מתי, איפה |
| השוואה | `humanNeed` (חדש): ערך אחד מרשימה סגורה |
| מרחב | `imagePrompts.exterior` = ארץ המקור; `interior` = מרחב מרפא בישראל |

`architecturalName` שונה ל-`spaceName`. השדה `proverb` מוצג כ"ברוח המושג", ולא כפתגם שמיוחס לתרבות.

**ההשוואה** מתבצעת במסך `/concepts`, דרך מתג "לפי צורך | לפי תרבות". במצב "לפי צורך" מושגים מתרבויות שונות מוצגים זה לצד זה.

**הצעות למשתמש:** בדף הבית נוספו שני כפתורים, "שאלות להשוואה" ו"קבוצות תרבות". התוכן שלהם נמצא ב-`src/data/cultures.ts`.

## הרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה עולה ב-http://localhost:5173 ומתחברת לאותו פרויקט Supabase, כך שאין מה להגדיר מקומית.

## ארכיטקטורה

אין שרת משלנו. שלוש שכבות:

| שכבה | מה יושב שם |
|---|---|
| Supabase Edge Functions | מפתח Claude ומפתח התמונות, כסודות בצד השרת |
| Supabase Postgres | טבלת `culture_articles` — הספרייה המשותפת בין מכשירים |
| ריפו GitHub | ארכיון קבוע: מאמרים והתמונות עצמן, ב-`public/content/` |

פרויקט Supabase: `ktqmwpbzcnzkhjskqisy` (cultura-GH).

## המפתחות — למה בסודות ולא בטבלה

**מפתח API לעולם לא נשמר בטבלה.** הדפדפן ניגש ל-Supabase עם המפתח הציבורי (publishable), שנמצא בקוד האתר ובריפו הפומבי. טבלה שקריאה ל-anon קריאה לכל העולם, ו-RLS לא משנה את זה כל עוד אין התחברות משתמשים — כי ה-anon חייב הרשאת קריאה כדי שהאפליקציה תעבוד. מפתח בטבלה כזו הוא מפתח דלוף.

לכן המפתחות יושבים כ**סודות של Edge Functions**: הדפדפן קורא לפונקציה, הפונקציה מדברת עם Claude, והמפתח לא עוזב את השרת.

הסודות מוגדרים ב[עמוד הסודות של Edge Functions](https://supabase.com/dashboard/project/ktqmwpbzcnzkhjskqisy/settings/functions):

| סוד | חובה | תפקיד |
|---|---|---|
| `ANTHROPIC_API_KEY` | כן | יצירת התוכן |
| `FAL_API_KEY` | לא | יצירת שתי התמונות |
| `APP_PASSCODE` | מומלץ | דורש קוד גישה מהמשתמש |

שם הסוד של מפתח Claude גמיש: הפונקציה מחפשת קודם את `ANTHROPIC_API_KEY`, ואם אינו קיים — כל סוד ששמו מכיל `anthropic` או `claude`. אם לא נמצא דבר, הודעת השגיאה מפרטת את **שמות** הסודות הקיימים שנראים רלוונטיים, לעולם לא את ערכיהם.

**`APP_PASSCODE` חשוב:** האתר ציבורי, ולכן בלעדיו כל מי שמוצא אותו יכול ליצור מושגים על חשבון המפתח שבשרת. כשהוא מוגדר, הפונקציות דורשות כותרת `x-app-passcode` תואמת, והקוד נשמר בדפדפן במסך ההגדרות. כדאי בנוסף להגדיר תקרת הוצאה במסוף של Anthropic.

התוכן נוצר ב-`claude-opus-5` עם חשיבה אדפטיבית ופלט מובנה לפי סכימת `GeneratedDimensions`, כך שהשדות תמיד תקינים ו-`humanNeed` תמיד ערך מתוך הרשימה הסגורה.

**מפתחות אישיים בדפדפן** נשארו כאפשרות נסתרת במסך ההגדרות, לשימוש כשהמפתח בשרת לא מוגדר. הם אינם נדרשים.

## הספרייה המשותפת

`saveArticle` כותב ל-localStorage ומיד אחר כך ל-`culture_articles`. בטעינה האפליקציה מושכת את הריפו ואת הטבלה, וממזגת: עותק מקומי עם אותו `id` גובר, כדי שעריכה שטרם סונכרנה לא תידרס.

מדיניות ה-RLS מתירה קריאה, הוספה ועדכון ל-anon, ו**לא** מחיקה — כך שמבקר מזדמן לא יכול לרוקן את הספרייה. מחיקות נעשות מלוח הבקרה של Supabase.

## שמירה קבועה של התוכן בריפו

בלי זה מאמר נשמר רק ב-localStorage של הדפדפן, והתמונות מתארחות בקישור זמני של ספק התמונות שפג אחרי זמן מה. עם החיבור הזה המאמר והתמונות נשמרים בריפו עצמו.

**הגדרה חד-פעמית:** יוצרים [Fine-grained token](https://github.com/settings/personal-access-tokens/new) עם גישה לריפו הזה בלבד והרשאה אחת — `Contents: Read and write` — ומדביקים אותו במסך ההגדרות.

**שימוש:** במסך המאמר לוחצים "שמור בגיטהב".

**מה קורה מאחורי הקלעים:** האפליקציה שולחת `repository_dispatch` מסוג `publish-article`. הוורקפלואו [publish-article.yml](.github/workflows/publish-article.yml) מריץ את [save-article.mjs](.github/scripts/save-article.mjs), שמוריד את התמונות בצד השרת — כך אין מגבלות CORS — כותב אותן ל-`public/content/images/`, מוסיף את המאמר ל-`public/content/articles.json`, מבצע commit, ומפעיל מחדש את פריסת האתר.

ההורדה בצד השרת היא מה שהופך את התמונות לקבועות: הקישור המקורי יפוג, הקובץ בריפו יישאר.

בטעינה האפליקציה קוראת את `content/articles.json` וממזגת אותו עם מה ששמור מקומית. מאמר מקומי באותו `id` גובר, כדי שעריכה שטרם פורסמה לא תידרס. פרסום חוזר של אותו מאמר מעדכן את הרשומה במקום ליצור כפילות, ולא מוריד שוב תמונה שכבר נשמרה.

**הריפו ציבורי — כל מה שנשמר בו גלוי לכולם.**

## פרסום

הפרויקט מתפרסם אוטומטית ל-GitHub Pages בכל דחיפה ל-`main`, דרך `.github/workflows/deploy.yml`.

האתר החי עובד כמו שהוא: מדביקים מפתח Claude במסך ההגדרות והכול פועל. אין צורך בשום סוד ב-GitHub, ואין מפתחות בתוך הבנייה.

הניתוב הוא `HashRouter` (כתובות בסגנון `#/library`), כדי שרענון של עמוד פנימי יעבוד ב-GitHub Pages בלי הגדרות שרת.

## קבצים

```
index.html                    שלד HTML, RTL, טעינת גופנים
src/main.tsx, src/App.tsx     נקודת כניסה וניתוב
src/index.css                 טוקנים של צבע, כהה ובהיר
src/types/article.ts          מודל התוכן + HUMAN_NEEDS
src/data/cultures.ts          10 קבוצות תרבות + 3 שאלות השוואה
src/lib/storage.ts            ספרייה מקומית, מיזוג עם הריפו, קיבוץ לפי צורך/תרבות
src/lib/ai.ts                 שער אחיד: קורא ל-Edge Functions, נופל למפתח מקומי
src/integrations/supabase/    לקוח Supabase (URL ומפתח ציבורי בלבד)
src/lib/claude.ts             קריאה ישירה ל-Claude, סכימה ופלט מובנה
src/lib/settings.ts           שמירת מפתחות בדפדפן
src/lib/publish.ts            שליחת מאמר לשמירה בריפו
src/components/PublishButton.tsx  כפתור "שמור בגיטהב"
src/components/ErrorBoundary.tsx  הודעה במקום מסך ריק בשגיאת רינדור
public/content/articles.json  הספרייה הקבועה, נכתבת בידי הוורקפלואו
src/lib/motionFallback.ts     חשיפת התוכן כשאנימציות לא רצות
src/contexts/ThemeContext.tsx מצב כהה/בהיר
src/components/CultureBlocks.tsx   OriginLine, PracticeBlock (רכיב משותף)
src/components/MagazinePage.tsx    4 פריסות + מקור + יישום
src/components/Header.tsx, Breadcrumbs.tsx, SkeletonLoader.tsx
src/components/ui/            כפתור, קלט, כרטיס, תגית, הודעות
src/pages/                    Home, Output, ArticleView, Editor, Library, ConceptBrowser, Settings
.github/workflows/publish-article.yml             שמירת מאמר ותמונות בריפו
.github/scripts/save-article.mjs                  הורדת התמונות וכתיבת הספרייה
supabase/functions/generate-dimensions/index.ts   יצירת התוכן, המפתח בצד השרת
supabase/functions/generate-images/index.ts       יצירת התמונות
supabase/migrations/                              טבלת culture_articles ומדיניות RLS
```

## רקע לאפליקציה (במקום math-bg.jpg)

**משפט זיקוק:** קיר אבן גיר בשפלה בשעת אחר הצהריים. בקיר נישות ריקות, והאור מתעכב על הסדקים בכל אחת מהן.

```
Documentary realism, professional architecture photography, 16:9. A long rough limestone wall of an old house in the Shephelah lowlands, Israel, late afternoon. A row of small recessed empty niches at different depths, raking warm sunlight catching fine cracks and lime plaster, soft shadow gradients, olive leaves casting faint moving shadows at the edge. Calm, quiet, muted ochre and stone white, generous empty space for overlaying interface. No people. No text, no words, no writing, no frame divisions.
```
