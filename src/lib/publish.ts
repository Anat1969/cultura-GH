import { Article } from '@/types/article';
import { getGithubToken } from '@/lib/settings';

/** The repository that stores the published library. */
export const REPO = 'Anat1969/cultura-GH';

const DISPATCH_URL = `https://api.github.com/repos/${REPO}/dispatches`;

/**
 * Hands one article to the repository's publish workflow. The workflow downloads
 * the images and commits everything, so the article outlives this browser and
 * the image host's short-lived URLs.
 */
export async function publishArticle(article: Article): Promise<void> {
  const token = getGithubToken();
  if (!token) {
    throw new Error('לא נשמר מפתח GitHub. פתח "הגדרות" והדבק אסימון.');
  }

  const response = await fetch(DISPATCH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'publish-article',
      client_payload: { article },
    }),
  });

  if (response.status === 204) return;

  if (response.status === 401) {
    throw new Error('האסימון נדחה. ודא שהעתקת אותו במלואו ושהוא עדיין בתוקף.');
  }
  if (response.status === 403 || response.status === 404) {
    throw new Error(
      `לאסימון אין הרשאת כתיבה ל-${REPO}. צריך Fine-grained token עם Contents: Read and write.`
    );
  }

  let detail = '';
  try {
    detail = ((await response.json()) as { message?: string }).message ?? '';
  } catch {
    // Body is not always JSON; the status is enough.
  }
  throw new Error(`הפרסום נכשל (${response.status}). ${detail}`.trim());
}
