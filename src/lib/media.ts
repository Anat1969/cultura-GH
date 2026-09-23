import { supabase } from '@/integrations/supabase/client';
import { Frame, MediaKind } from '@/types/article';

const BUCKET = 'article-media';
const MAX_BYTES = 50 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export const isVideo = (url: string | null): boolean =>
  !!url && /\.(mp4|webm|mov)(\?|$)/i.test(url);

/**
 * Stores a file the user picked in the project's media bucket and returns its
 * permanent public URL. Generators hand out links that expire; this does not,
 * which is the point of letting a frame be filled by hand.
 */
export async function uploadMedia(
  file: File,
  articleId: string,
  frame: Frame,
  kind: MediaKind
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error(`הקובץ גדול מדי (${Math.round(file.size / 1024 / 1024)}MB). המגבלה היא 50MB.`);
  }

  const expected = kind === 'video' ? 'video/' : 'image/';
  if (!file.type.startsWith(expected)) {
    throw new Error(kind === 'video' ? 'יש לבחור קובץ וידאו.' : 'יש לבחור קובץ תמונה.');
  }

  const ext = EXTENSIONS[file.type] ?? file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  // A fresh name each time: the bucket has no delete policy, and overwriting a
  // path would leave viewers on a stale cached copy.
  const path = `${articleId}/${frame}-${kind}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    throw new Error(`ההעלאה נכשלה: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('ההעלאה הצליחה אך לא התקבלה כתובת לקובץ.');
  return data.publicUrl;
}
