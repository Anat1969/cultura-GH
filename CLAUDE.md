# CLAUDE.md

## A&I logo button
The top bar holds only the app name (links home), content navigation, and ONE logo button "אד' ענת שטיבלמן A&I" (`<ai-menu>` from https://appofapp-gh.vercel.app/ai-menu.js). Every editing and development action (העתקת קישור, שיחת הפיתוח, פרויקט המחקר, התקנת האפליקציה, edit mode, add, delete) lives only inside it, never as loose buttons. Standard: https://github.com/Anat1969/AppOfApp-GH/blob/main/docs/ai-menu-standard.md

## AI generation runs on free Gemini, not Claude
Anat's decision (2026-10-29): text generation uses only the free Gemini key (GEMINI_API_KEY, shared in the Supabase project). No Anthropic SDK, no Claude key, no key field in the UI. The user is never asked to paste a key to get an article.

## Speed and images are part of "it works" (2026-10-29)
An article that takes over 20 seconds, or arrives with empty image frames, counts as broken for Anat. Text runs on gemini-2.5-flash with thinking off (4-5s). With no FAL_API_KEY, images come from free keyless Pollinations, fetched in the browser one at a time (about one per 45s; a 402 carries Retry-After) and stored in the article-media bucket. Never point an <img> straight at Pollinations: over the limit it shows a "Free limit reached" card, and it refuses localhost, so test images on the live site. Before reporting a fix, run a real end-to-end on the live site and time it.

## Atlas (2026-10-29)
`/atlas` compares cultures: overlaps by human need, uniqueness by culture, and discovery of new expressions per culture. Tables are derived from the library in `src/lib/atlas.ts` (one culture name per culture via CULTURE_ALIASES; Hebrew and Latin spellings of one concept count once). Distillations come from the `culture-atlas` Edge Function (Gemini 2.5 Flash, thinking off) and are kept with the pasted image and notes in `culture_atlas`. Article creation lives in one place, `src/lib/create.ts`.

## Model output about cultures is verified outside the model (2026-10-29)
The first library expansion, created without review, added invented words, a Finnish curse, a Welsh word for vomiting, a slur and an echo of a Nazi-era slogan. The model's own "confidence" rated them high. Rule: any list of cultural expressions the model proposes is checked against an outside source before it can be created (`culture-atlas` checks English Wikipedia: own page = verified, mention = shown with the source, nowhere = rejected). Never bulk-create model suggestions without that check, and never report generated content as good without reading it.

## Two homes: GitHub Pages and Vercel (2026-10-29)
The site deploys to both, from main: https://anat1969.github.io/cultura-GH/ and https://culturearch.vercel.app (Vercel project cultura-gh; cultura-gh.vercel.app belongs to another project). Vercel builds with the same `/cultura-GH/` base as Pages, and vercel.json maps that prefix onto the root, so absolute paths saved in articles (`/cultura-GH/content/images/...`) work on both.
