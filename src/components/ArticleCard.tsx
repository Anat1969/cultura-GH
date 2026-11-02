import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Article, articleLede } from '@/types/article';
import { isVideo } from '@/lib/media';
import FitImage, { usableImage } from '@/components/FitImage';
import { Flag, Gloss } from '@/components/CultureMarks';

/**
 * The library's unit: a cover, the word in its own script, and the one line
 * that says why the piece is worth opening. Everything else waits inside.
 */
const ArticleCard: React.FC<{ article: Article; index?: number }> = ({ article, index = 0 }) => {
  const navigate = useNavigate();
  const d = article.dimensions;
  const cover = usableImage(article.images.exterior) || usableImage(article.images.interior);
  const motion_ = article.videos.interior || article.videos.exterior;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/article/${article.id}`)}
      className="group relative flex cursor-pointer flex-col"
    >
      {/* The image is the card: whole, square, no frame around it. */}
      <div className="relative aspect-square overflow-hidden bg-muted shadow-[0_14px_30px_-22px_rgb(0_0_0/0.5)] transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_26px_44px_-24px_rgb(0_0_0/0.55)] group-active:translate-y-0">
        {cover ? (
          <FitImage
            src={cover}
            alt={d.spaceName}
            className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : motion_ && isVideo(motion_) ? (
          <video src={motion_} muted loop playsInline className="h-full w-full object-cover" />
        ) : (
          // No media yet: the original script carries the card on its own.
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="font-heading text-6xl text-foreground/35"
              dir="auto"
              style={{
                fontFamily:
                  "'Playfair Display', 'Noto Serif JP', 'Noto Naskh Arabic', 'Noto Serif Devanagari', serif",
              }}
            >
              {d.origin.script || article.concept.slice(0, 2)}
            </span>
          </div>
        )}

        {d.humanNeed && (
          <span className="absolute right-3 top-3 bg-white/85 px-2.5 py-1 text-[11px] font-medium text-neutral-900 shadow-sm backdrop-blur-md">
            {d.humanNeed}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 pt-4">
        <h3 className="font-heading text-xl font-bold leading-tight text-foreground">{d.spaceName}</h3>
        <p className="flex items-center gap-1.5 text-xs text-foreground/80">
          <Flag article={article} />
          <span className="font-semibold">{article.concept}</span>
          {d.origin.culture && <span className="text-muted-foreground">· {d.origin.culture}</span>}
        </p>
        {d.origin.literal && <Gloss text={d.origin.literal} />}
        <p className="line-clamp-3 text-sm leading-relaxed text-foreground/75">{articleLede(d)}</p>
        <div className="mt-auto flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
          <span dir="ltr">{d.origin.transliteration}</span>
          <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">קרא ←</span>
        </div>
      </div>
    </motion.article>
  );
};

export default ArticleCard;
