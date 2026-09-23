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

האפליקציה עולה ב-http://localhost:5173. בלי מפתחות Supabase היא עובדת במצב הדגמה: הספרייה המקומית (localStorage) פעילה, ויצירת מושגים חדשים מושבתת עם הודעה מתאימה.

## חיבור ל-Supabase

1. יוצרים פרויקט ב-Supabase ומריצים את `supabase/migrations/20260923_create_culture_articles_table.sql`.
2. מעלים את שתי פונקציות ה-Edge שבתיקייה `supabase/functions`.
3. מגדירים בפרויקט את הסודות `GEMINI_API_KEY` (יצירת התוכן) ו-`ACCESS_NANO_BANANA_API` (יצירת התמונות).
4. מעתיקים את `.env.example` ל-`.env` וממלאים:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**הערה:** הגישה לטבלה ב-`storage.ts` לא מוגדרת בטיפוסים (`as any`) עד שהטיפוסים של Supabase נוצרים מחדש. אחרי המיגרציה אפשר להריץ `supabase gen types` ולהסיר את ה-cast.

## פרסום

הפרויקט מתפרסם אוטומטית ל-GitHub Pages בכל דחיפה ל-`main`, דרך `.github/workflows/deploy.yml`.

כדי שהאתר החי יתחבר ל-Supabase, מגדירים בהגדרות הריפו:

- Variables ← `VITE_SUPABASE_URL`
- Secrets ← `VITE_SUPABASE_ANON_KEY`

בלעדיהם הבנייה מצליחה והאתר עולה במצב הדגמה.

הניתוב הוא `HashRouter` (כתובות בסגנון `#/library`), כדי שרענון של עמוד פנימי יעבוד ב-GitHub Pages בלי הגדרות שרת.

## קבצים

```
index.html                    שלד HTML, RTL, טעינת גופנים
src/main.tsx, src/App.tsx     נקודת כניסה וניתוב
src/index.css                 טוקנים של צבע, כהה ובהיר
src/types/article.ts          מודל התוכן + HUMAN_NEEDS
src/data/cultures.ts          10 קבוצות תרבות + 3 שאלות השוואה
src/lib/storage.ts            טבלה culture_articles, קיבוץ לפי צורך/תרבות
src/lib/ai.ts                 מעביר hint למודל
src/integrations/supabase/    לקוח Supabase, כולל מצב הדגמה בלי מפתחות
src/contexts/ThemeContext.tsx מצב כהה/בהיר
src/components/CultureBlocks.tsx   OriginLine, PracticeBlock (רכיב משותף)
src/components/MagazinePage.tsx    4 פריסות + מקור + יישום
src/components/Header.tsx, Breadcrumbs.tsx, SkeletonLoader.tsx
src/components/ui/            כפתור, קלט, כרטיס, תגית, הודעות
src/pages/                    Home, Output, ArticleView, Editor, Library, ConceptBrowser
supabase/functions/generate-dimensions/index.ts   פרומפט מערכת + ולידציה
supabase/functions/generate-images/index.ts       מסגרת 16:9
supabase/migrations/20260923_create_culture_articles_table.sql
```

## רקע לאפליקציה (במקום math-bg.jpg)

**משפט זיקוק:** קיר אבן גיר בשפלה בשעת אחר הצהריים. בקיר נישות ריקות, והאור מתעכב על הסדקים בכל אחת מהן.

```
Documentary realism, professional architecture photography, 16:9. A long rough limestone wall of an old house in the Shephelah lowlands, Israel, late afternoon. A row of small recessed empty niches at different depths, raking warm sunlight catching fine cracks and lime plaster, soft shadow gradients, olive leaves casting faint moving shadows at the edge. Calm, quiet, muted ochre and stone white, generous empty space for overlaying interface. No people. No text, no words, no writing, no frame divisions.
```
