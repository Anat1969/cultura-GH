import { v4 as uuid } from 'uuid';
import { generateDimensions } from '@/lib/ai';
import { saveArticleNow } from '@/lib/storage';
import { completeArticle } from '@/lib/complete';
import { Article, buildTags } from '@/types/article';

/**
 * Writes one concept into the library and returns as soon as the text is
 * saved, so the article opens in seconds. The images and the origin story are
 * made on the server right after and appear on the page when ready. Used by
 * the creating screen and by the atlas.
 */
export async function createArticle(
  concept: string,
  hint?: string,
  onStage?: (stage: 'text' | 'images') => void
): Promise<Article> {
  onStage?.('text');
  const dimensions = await generateDimensions(concept, hint);

  const now = new Date().toISOString();
  const article: Article = {
    id: uuid(),
    concept,
    createdAt: now,
    updatedAt: now,
    tags: buildTags(dimensions),
    dimensions,
    images: { exterior: null, interior: null },
    videos: { exterior: null, interior: null },
  };

  // The server functions read the article from the table, so it goes there first.
  await saveArticleNow(article);
  void completeArticle(article);
  return article;
}
