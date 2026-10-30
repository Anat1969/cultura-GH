import { callFunction } from '@/lib/ai';
import { getArticleById, refreshArticle, isStoredMedia } from '@/lib/storage';
import { Article } from '@/types/article';

/*
 * Every article ends up whole: a stored image in each frame, the story of
 * where its word comes from, and the anatomy of the word itself. Both are made on the server (generate-images,
 * concept-origin), which reads the article from the table and writes the
 * result back; this asks for them and then takes the server's copy.
 *
 * One article at a time, and each article at most once per visit, so opening
 * the library never fires a burst at the free allowances.
 */

let queue: Promise<void> = Promise.resolve();
const asked = new Set<string>();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function needsCompletion(article: Article): boolean {
  return (
    !isStoredMedia(article.images.exterior) ||
    !isStoredMedia(article.images.interior) ||
    !article.dimensions.origin.story ||
    !article.dimensions.origin.lang?.insight
  );
}

async function ask(fn: string, id: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await callFunction(fn, { articleId: id });
      return;
    } catch (error) {
      // The row may still be on its way to the table, or the free quota is
      // momentarily full: wait and try again. A row the table does not hold is
      // never sent from here - it may have been removed on purpose.
      const message = error instanceof Error ? error.message : '';
      if (!/עוד לא נשמר|המכסה/.test(message)) return;
      await sleep(3000 * (attempt + 1));
    }
  }
}

/** Queues what an article is missing; resolves when the server's copy is back. */
export function completeArticle(article: Article): Promise<void> {
  if (asked.has(article.id) || !needsCompletion(article)) return Promise.resolve();
  asked.add(article.id);
  queue = queue.then(async () => {
    const current = getArticleById(article.id) ?? article;
    if (!isStoredMedia(current.images.exterior) || !isStoredMedia(current.images.interior)) {
      await ask('generate-images', article.id);
      await refreshArticle(article.id);
    }
    if (!current.dimensions.origin.story) {
      await ask('concept-origin', article.id);
      await refreshArticle(article.id);
    }
    if (!current.dimensions.origin.lang?.insight) {
      await ask('concept-language', article.id);
      await refreshArticle(article.id);
    }
  });
  return queue;
}
