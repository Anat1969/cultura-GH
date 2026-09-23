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

האפליקציה עולה ב-http://localhost:5173. בלי מפתח Claude הספרייה פעילה ויצירת מושגים חדשים מפנה למסך ההגדרות.

## הפעלה מיידית: מפתח Claude

הדרך המהירה, ובלי להקים שום שרת. באפליקציה עצמה:

1. נכנסים ל**הגדרות** בתפריט העליון.
2. פותחים את [דף המפתחות במסוף של Anthropic](https://console.anthropic.com/settings/keys), יוצרים מפתח ומעתיקים אותו.
3. מדביקים בשדה "מפתח Claude" ושומרים.

מרגע זה יצירת המושגים עובדת. המפתח נשמר ב-localStorage של אותו דפדפן ונשלח רק ל-Anthropic — הוא לא נשמר באתר, לא נכנס לבנייה ולא עובר ב-GitHub.

התוכן נוצר במודל `claude-opus-5` עם חשיבה אדפטיבית, ובפלט מובנה (structured outputs) לפי סכימת `GeneratedDimensions` — כך שהשדות תמיד חוזרים בפורמט הנכון ו-`humanNeed` תמיד ערך מתוך הרשימה הסגורה.

**תמונות (רשות):** Claude כותב את הפרומפטים אך אינו מייצר תמונות. מפתח מ-[fal.ai](https://fal.ai/dashboard/keys) בשדה השני מפעיל את שתי התמונות לכל מאמר. בלעדיו המאמרים נוצרים בלי תמונות והפרומפטים נשמרים להעתקה.

**כדאי לדעת:** המפתח נגיש לכל מי שמשתמש באותו דפדפן, והשימוש מחויב בחשבון שלך — כדאי להגדיר תקרת הוצאה במסוף.

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
src/lib/ai.ts                 שער אחיד ליצירת תוכן ותמונות
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
```

## רקע לאפליקציה (במקום math-bg.jpg)

**משפט זיקוק:** קיר אבן גיר בשפלה בשעת אחר הצהריים. בקיר נישות ריקות, והאור מתעכב על הסדקים בכל אחת מהן.

```
Documentary realism, professional architecture photography, 16:9. A long rough limestone wall of an old house in the Shephelah lowlands, Israel, late afternoon. A row of small recessed empty niches at different depths, raking warm sunlight catching fine cracks and lime plaster, soft shadow gradients, olive leaves casting faint moving shadows at the edge. Calm, quiet, muted ochre and stone white, generous empty space for overlaying interface. No people. No text, no words, no writing, no frame divisions.
```
