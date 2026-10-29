import { v4 as uuid } from 'uuid';
import { generateDimensions, generateImages } from '@/lib/ai';
import { saveArticle, getArticleById } from '@/lib/storage';
import { Article, Frame, buildTags } from '@/types/article';

// Images are drawn one article at a time: the free renderer allows about one
// image per 45 seconds, and the atlas can create several articles in a row.
let imageQueue: Promise<void> = Promise.resolve();

function fillImages(article: Article): void {
  // Whatever was put in a frame by hand meanwhile stays.
  const place = (frame: Frame, url: string | null) => {
    const current = getArticleById(article.id) ?? article;
    if (!url || current.images[frame]) return;
    saveArticle({ ...current, images: { ...current.images, [frame]: url } });
  };

  imageQueue = imageQueue.then(async () => {
    try {
      const { exterior, interior } = await generateImages(
        article.dimensions.imagePrompts.exterior,
        article.dimensions.imagePrompts.interior,
        article.id,
        place
      );
      place('exterior', exterior);
      place('interior', interior);
    } catch {
      // No image provider, or it failed. The frames stay empty for the user to
      // fill by hand, which is a supported path, not an error.
    }
  });
}

/**
 * Writes one concept into the library and returns as soon as the text is
 * saved, so the article opens in seconds. Images follow in the background and
 * appear on the page when ready. Used by the creating screen and by the atlas.
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

  // Saved before anything else can fail.
  saveArticle(article);
  fillImages(article);
  return article;
}
