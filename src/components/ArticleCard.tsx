import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Article, articleLede } from '@/types/article';
import { isVideo } from '@/lib/media';

/**
 * The library's unit: a cover, the word in its own script, and the one line
 * that says why the piece is worth opening. Everything else waits inside.
 */
const ArticleCard: React.FC<{ article: Article; index?: number }> = ({ article, index = 0 }) => {
  const navigate = useNavigate();
  const d = article.dimensions;
  const cover = article.images.interior || article.images.exterior;
  const motion_ = article.videos.interior || article.videos.exterior;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/article/${article.id}`)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-500 hover:border-accent/50 hover:shadow-xl hover:shadow-black/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : motion_ && isVideo(motion_) ? (
          <video src={motion_} muted loop playsInline className="h-full w-full object-cover" />
        ) : (
          // No media yet: the original script carries the card on its own.
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-transparent to-accent/15">
            <span
              className="font-heading text-6xl text-accent/70"
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

        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-heading text-xl font-bold leading-tight text-foreground drop-shadow">
            {d.spaceName}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {article.concept}
            {d.origin.culture && ` · ${d.origin.culture}`}
          </p>
        </div>

        {d.humanNeed && (
          <span className="absolute right-3 top-3 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md">
            {d.humanNeed}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">{articleLede(d)}</p>
        <div className="mt-auto flex items-center justify-between text-[11px] text-muted-foreground">
          <span dir="ltr">{d.origin.transliteration}</span>
          <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            קרא ←
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export default ArticleCard;
