# CLAUDE.md

## A&I logo button
The top bar holds only the app name (links home), content navigation, and ONE logo button "אד' ענת שטיבלמן A&I" (`<ai-menu>` from https://appofapp-gh.vercel.app/ai-menu.js). Every editing and development action (העתקת קישור, שיחת הפיתוח, פרויקט המחקר, התקנת האפליקציה, edit mode, add, delete) lives only inside it, never as loose buttons. Standard: https://github.com/Anat1969/AppOfApp-GH/blob/main/docs/ai-menu-standard.md

## AI generation runs on free Gemini, not Claude
Anat's decision (2026-10-29): text generation uses only the free Gemini key (GEMINI_API_KEY, shared in the Supabase project). No Anthropic SDK, no Claude key, no key field in the UI. The user is never asked to paste a key to get an article.

## Speed and images are part of "it works" (2026-10-29)
An article that takes over 20 seconds, or arrives with empty image frames, counts as broken for Anat. Text runs on gemini-2.5-flash with thinking off (4-5s). Images are made on the server by `generate-images` (Cloudflare flux-1-schnell, then Gemini image; keys for Cloudflare sit in the private faces_secrets table) and stored in article-media. Pollinations is not used: anonymously it serves a weaker model with a watermark, and over its limit it serves a "Free limit reached" card. `usableImage()` hides any engine link that is still in the data. Before reporting a fix, run a real end-to-end on the live site and time it.

## Atlas (2026-10-29)
`/atlas` compares cultures: overlaps by human need, uniqueness by culture, and discovery of new expressions per culture. Tables are derived from the library in `src/lib/atlas.ts` (one culture name per culture via CULTURE_ALIASES; Hebrew and Latin spellings of one concept count once). Distillations come from the `culture-atlas` Edge Function (Gemini 2.5 Flash, thinking off) and are kept with the pasted image and notes in `culture_atlas`. Article creation lives in one place, `src/lib/create.ts`.

## Model output about cultures is verified outside the model (2026-10-29)
The first library expansion, created without review, added invented words, a Finnish curse, a Welsh word for vomiting, a slur and an echo of a Nazi-era slogan. The model's own "confidence" rated them high. Rule: any list of cultural expressions the model proposes is checked against an outside source before it can be created (`culture-atlas` checks English Wikipedia: own page = verified, mention = shown with the source, nowhere = rejected). Never bulk-create model suggestions without that check, and never report generated content as good without reading it.

## Two homes: GitHub Pages and Vercel (2026-10-29)
The site deploys to both, from main: https://anat1969.github.io/cultura-GH/ and https://culturearch.vercel.app (Vercel project cultura-gh; cultura-gh.vercel.app belongs to another project). Vercel builds with the same `/cultura-GH/` base as Pages, and vercel.json maps that prefix onto the root, so absolute paths saved in articles (`/cultura-GH/content/images/...`) work on both.

## Anat's corrections, 2026-10-29 evening
- Permanent saving always happens on its own. No "connect GitHub to save" button, no token, no key: every change goes to the shared Supabase table and bucket automatically, with a visible "נשמר" state and a retry when offline.
- Never crop an image. Frames take the image's own proportions; where a fixed box is unavoidable (cover, card) the whole image is shown over a blurred copy of itself. Generated images are square (1:1), like Anat's own prompts.
- Every concept has at least one image, free and at full quality: the same engines as faces-art (Cloudflare Workers AI flux, Gemini image when it has quota, Pollinations last), rendered server-side and stored in article-media.
- Every culture shows a small flag; every word shows its short meaning right under it.
- Each word carries its origin: time, place, figure, story, with the source (Wikipedia) or marked as a model estimate.
- Cultures are explored on a globe and on a time axis, grouped by region, continent, tradition and period.
- Search always matches keywords (every word of the query, in any field, ignoring niqqud and case).

## Learned building the world page (2026-10-29)
- Cloudflare's free allowance is 10,000 neurons a day, shared with faces-art: about 75-80 images at 6 steps. It resets at midnight UTC. When it is spent the frame waits (original script shown) and is filled on a later visit; never store a weaker image instead, because a stored image is never replaced.
- Gemini 2.5 Flash with thinking off sometimes slips a Cyrillic or Arabic letter into a Hebrew word ("בליסбоа"). generate-dimensions and concept-origin check for mixed scripts and ask again. To audit the library: the SQL regex `[א-ת][а-яА-Яء-ي]|[а-яА-Яء-ي][א-ת]`.
- A Wikipedia title is not proof of meaning: "Ubuntu" is a Linux system. concept-origin shows the model several candidate pages and it names the one about the cultural word, or none.
- The shared table is the library. Local copies of articles it no longer holds are dropped on sync (unless still waiting to be sent), so rejected articles cannot come back from one browser.
- SVG text anchors flip inside an RTL page; drawings use `direction="ltr"` and Hebrew still reads right to left.
- Never `pkill -f` with a pattern that also matches the shell's own command line: it kills the chain.

## From macro to micro: the five scales (2026-10-30)
Anat: culture is read through language and ideas, at every scale, in both directions. The app is organised as one ladder, shown at the top of every article (`ZoomLadder`):
1. **World** - where and when: globe and time axis (`/world`).
2. **Ancient civilization** - the deep root, from ARCHITAIP ("DNA תרבותי", https://architaip.vercel.app, repo ARCHITAIP-GH). `src/data/civilizations.ts` copies its eleven civilizations (archetype, chaos/order, five spatial vectors, colour) and maps countries to them; only direct lines, no forced ancestor. Each civilization links to `architaip.vercel.app/c/<id>`.
3. **Group** - region, continent, tradition, period, civilization or sentence order. Every group gets a reading from `culture-group`: the common denominator AND what each member keeps for itself, a tension axis, a language reading, an action and a haiku. Kept in `culture_atlas` (kind 'group', key `<by>|<group>`), read once.
4. **Language** - `src/data/languages.ts`: word order and gender (WALS Online, 2013), script and letter count (official alphabets), context (Hall, 1976, only where Hall placed the culture). Facts, hand-written, with the source on screen. What a structure means for a culture is shown as a reading, never as a fact.
5. **Word** - `concept-language` reads the English Wiktionary entry: parts, root, word family, what Hebrew lacks. Stored in `origin.lang`, marked wiktionary or model.
Text from the model follows Claude-GH docs/ai-text-standard.md and renders through `Rich` (`**bold**`, `==insight==`, numbers bold, a sentence per line).

## DNA certificate
- Metaphor: a lens that zooms from the globe to a single letter and back.
- Material: paper, ink and stone; a dark ground with warm amber light.
- Colour: amber accent; groups by evenly spaced hues; civilizations keep ARCHITAIP's colours.
- Motion: the globe turns slowly, the ladder steps; nothing moves without meaning.
- Inspiration: the etymological dictionary and the museum wall text.

## Ownership and logo
Anat's app: the logo "אד' ענת שטיבלמן A&I".
