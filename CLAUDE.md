# CLAUDE.md

## A&I logo button
The top bar holds only the app name (links home), content navigation, and ONE logo button "אד' ענת שטיבלמן A&I" (`<ai-menu>` from https://appofapp-gh.vercel.app/ai-menu.js). Every editing and development action (העתקת קישור, שיחת הפיתוח, פרויקט המחקר, התקנת האפליקציה, edit mode, add, delete) lives only inside it, never as loose buttons. Standard: https://github.com/Anat1969/AppOfApp-GH/blob/main/docs/ai-menu-standard.md

## AI generation runs on free Gemini, not Claude
Anat's decision (2026-10-29): text generation uses only the free Gemini key (GEMINI_API_KEY, shared in the Supabase project). No Anthropic SDK, no Claude key, no key field in the UI. The user is never asked to paste a key to get an article.
