import { v4 as uuid } from 'uuid';
import { generateDimensions, generateImages } from '@/lib/ai';
import { saveArticle } from '@/lib/storage';
import { Article, buildTags } from '@/types/article';

/**
 * Writes one concept into the library: text first, saved at once so nothing
 * paid for is lost, then images. Used by the creating screen and by the atlas,
 * which creates several in a row.
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

  onStage?.('images');
  try {
    const images = await generateImages(dimensions.imagePrompts.exterior, dimensions.imagePrompts.interior);
    const withImages = { ...article, images };
    saveArticle(withImages);
    return withImages;
  } catch {
    // No image provider, or it failed. The frames stay empty for the user to
    // fill by hand, which is a supported path, not an error.
    return article;
  }
}
