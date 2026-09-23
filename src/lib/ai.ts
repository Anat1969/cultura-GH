import { GeneratedDimensions } from '@/types/article';
import { hasAnthropicKey, hasImageKey } from '@/lib/settings';

// The Anthropic SDK is a large dependency and is only needed once the user
// actually generates something, so it is pulled in on demand.
const claude = () => import('@/lib/claude');

/** True when text generation can run — the Claude key is the only requirement. */
export function canGenerate(): boolean {
  return hasAnthropicKey();
}

/** True when the article can also get its two images. */
export function canGenerateImages(): boolean {
  return hasImageKey();
}

export async function generateDimensions(
  concept: string,
  hint?: string
): Promise<GeneratedDimensions> {
  return (await claude()).generateDimensionsWithClaude(concept, hint);
}

export async function generateImages(
  exteriorPrompt: string,
  interiorPrompt: string
): Promise<{ exterior: string; interior: string }> {
  return (await claude()).generateImagesWithFal(exteriorPrompt, interiorPrompt);
}
