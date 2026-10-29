# CLAUDE.md

## A&I logo button
The top bar holds only the app name (links home), content navigation, and ONE logo button "אד' ענת שטיבלמן A&I" (`<ai-menu>` from https://appofapp-gh.vercel.app/ai-menu.js). Every editing and development action (העתקת קישור, שיחת הפיתוח, פרויקט המחקר, התקנת האפליקציה, edit mode, add, delete) lives only inside it, never as loose buttons. Standard: https://github.com/Anat1969/AppOfApp-GH/blob/main/docs/ai-menu-standard.md

## AI generation never depends on one paid key
`generate-dimensions` tries Claude (ANTHROPIC_API_KEY) and, when it is missing or rejected, falls back to Gemini (GEMINI_API_KEY, free tier, shared in the Supabase project). The user is never asked to paste a key to get an article. Keep this fallback in any new AI function.
