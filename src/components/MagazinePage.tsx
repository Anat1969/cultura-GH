import React from 'react';
import { motion } from 'framer-motion';
import { Article } from '@/types/article';
import { Badge } from '@/components/ui/badge';
import { OriginLine, PracticeBlock, ProverbLabel, InterpretationLines } from '@/components/CultureBlocks';

interface MagazinePageProps {
  article: Article;
  layoutVariant: number;
}

/**
 * Each article rendered as a full-page magazine spread.
 * 4 layout variants cycle to keep the browsing experience dynamic.
 * CultureArch additions: OriginLine under the title, PracticeBlock after
 * the interpretation, and a "ברוח המושג" label above the proverb.
 */
const MagazinePage: React.FC<MagazinePageProps> = ({ article, layoutVariant }) => {
  const { dimensions, images, concept, tags, createdAt } = article;
  const variant = layoutVariant % 4;

  const dateStr = new Date(createdAt).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fadeUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  };

  const fadeIn = (delay: number) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8, delay },
  });

  const otherTags = (n: number) =>
    tags.filter(t => t !== concept).slice(0, n).map(t => (
      <Badge key={t} variant="secondary" className="text-xs">
        {t}
      </Badge>
    ));

  // Layout 0: Full-bleed image left, text right (editorial spread)
  if (variant === 0) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-2 gap-0">
        <motion.div className="relative overflow-hidden min-h-[50vh] lg:min-h-full" {...fadeIn(0)}>
          {images.exterior ? (
            <img src={images.exterior} alt={dimensions.spaceName} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-l from-background/80 via-transparent to-transparent lg:from-background/60" />
          <motion.div className="absolute bottom-8 right-8 left-8 lg:left-auto lg:max-w-sm" {...fadeIn(0.4)}>
            <ProverbLabel />
            <p className="text-2xl lg:text-3xl font-heading font-bold text-foreground/90 leading-snug drop-shadow-lg">
              ❝{dimensions.proverb}❞
            </p>
          </motion.div>
        </motion.div>

        <div className="flex flex-col justify-center px-8 lg:px-16 py-12 lg:py-20 pb-32">
          <motion.div {...fadeUp}>
            <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4 block">{dateStr}</span>
            <h2 className="text-fluid-xl font-heading font-bold text-primary mb-4 leading-[1.1]">{dimensions.spaceName}</h2>
            <OriginLine origin={dimensions.origin} className="mb-4" />
            <div className="flex gap-2 flex-wrap mb-8">
              <Badge variant="outline" className="text-sm border-primary/30">
                {concept}
              </Badge>
              {otherTags(3)}
            </div>
          </motion.div>

          <motion.div {...fadeIn(0.3)}>
            <div className="w-16 h-[2px] bg-accent mb-6" />
            <p className="text-lg leading-[1.9] text-foreground/85 mb-8 font-body">{dimensions.insight}</p>
          </motion.div>

          <motion.div {...fadeIn(0.5)}>
            <InterpretationLines value={dimensions.interpretation} compact className="mb-6" />
            <PracticeBlock practice={dimensions.practice} compact />
          </motion.div>
        </div>
      </div>
    );
  }

  // Layout 1: Full-bleed hero image with overlaid text (cinematic)
  if (variant === 1) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] relative overflow-hidden flex items-end">
        {images.exterior ? (
          <motion.img
            src={images.exterior}
            alt={dimensions.spaceName}
            className="absolute inset-0 w-full h-full object-cover"
            {...fadeIn(0)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        <div className="relative z-10 w-full px-8 lg:px-20 pb-32 pt-32">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fadeUp}>
              <div className="flex gap-2 flex-wrap mb-4">
                <Badge variant="outline" className="text-sm border-primary/40 bg-background/50 backdrop-blur-sm">
                  {concept}
                </Badge>
                {otherTags(2)}
              </div>
              <h2 className="text-fluid-xl font-heading font-bold text-primary mb-4 leading-[1.1]">{dimensions.spaceName}</h2>
              <OriginLine origin={dimensions.origin} className="mb-6" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              <motion.div {...fadeIn(0.3)}>
                <p className="text-lg leading-[1.9] text-foreground/90 font-body mb-6">{dimensions.insight}</p>
                <PracticeBlock practice={dimensions.practice} compact />
              </motion.div>
              <motion.div {...fadeIn(0.5)}>
                <ProverbLabel />
                <blockquote className="text-2xl font-heading text-accent/90 leading-snug mb-4">❝{dimensions.proverb}❞</blockquote>
                <InterpretationLines value={dimensions.interpretation} compact />
              </motion.div>
            </div>

            <motion.span className="block text-xs text-muted-foreground mt-8" {...fadeIn(0.7)}>
              {dateStr}
            </motion.span>
          </div>
        </div>
      </div>
    );
  }

  // Layout 2: Two images side by side (origin | Israel) with centered text column
  if (variant === 2) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 h-[45vh]">
          <motion.div className="relative overflow-hidden" {...fadeIn(0)}>
            {images.exterior ? (
              <img src={images.exterior} alt="המושג בארץ המקור" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10" />
            )}
            <span className="absolute bottom-3 right-3 text-xs bg-background/60 backdrop-blur-sm rounded px-2 py-1">
              {dimensions.origin.region_en || 'ארץ המקור'}
            </span>
          </motion.div>
          <motion.div className="relative overflow-hidden" {...fadeIn(0.2)}>
            {images.interior ? (
              <img src={images.interior} alt="מרחב מחייה מרפא בישראל" className="w-full h-full object-cover" />
            ) : images.exterior ? (
              <img src={images.exterior} alt={dimensions.spaceName} className="w-full h-full object-cover scale-x-[-1] brightness-90" />
            ) : (
              <div className="w-full h-full bg-gradient-to-bl from-primary/20 to-accent/10" />
            )}
            <span className="absolute bottom-3 right-3 text-xs bg-background/60 backdrop-blur-sm rounded px-2 py-1">ישראל</span>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 lg:px-20 py-12 pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div {...fadeUp}>
              <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3 block">
                {dateStr} · {concept}
              </span>
              <h2 className="text-fluid-xl font-heading font-bold text-primary mb-4 leading-[1.1]">{dimensions.spaceName}</h2>
              <OriginLine origin={dimensions.origin} className="justify-center mb-6" />
              <div className="w-24 h-[2px] bg-accent mx-auto mb-8" />
            </motion.div>

            <motion.p className="text-xl leading-[2] text-foreground/85 font-body mb-8" {...fadeIn(0.3)}>
              {dimensions.insight}
            </motion.p>

            <motion.div {...fadeIn(0.5)}>
              <ProverbLabel />
              <blockquote className="text-2xl font-heading text-accent/80 leading-snug italic">❝{dimensions.proverb}❞</blockquote>
            </motion.div>

            <motion.div className="mt-4 mb-8 max-w-md mx-auto text-right" {...fadeIn(0.6)}>
              <InterpretationLines value={dimensions.interpretation} compact />
            </motion.div>

            <motion.div className="text-right max-w-xl mx-auto" {...fadeIn(0.7)}>
              <PracticeBlock practice={dimensions.practice} compact />
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 3: Asymmetric — narrow image, large text block
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-3 gap-0">
      <div className="lg:col-span-2 flex flex-col justify-center px-8 lg:px-20 py-16 pb-32 order-2 lg:order-1">
        <motion.div {...fadeUp}>
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6 block">{dateStr}</span>
          <h2 className="text-fluid-xl font-heading font-bold text-primary mb-4 leading-[1.1]">{dimensions.spaceName}</h2>
          <OriginLine origin={dimensions.origin} className="mb-4" />
          <div className="flex gap-2 flex-wrap mb-10">
            <Badge variant="outline" className="text-sm border-primary/30">
              {concept}
            </Badge>
            {otherTags(3)}
          </div>
        </motion.div>

        <motion.div {...fadeIn(0.2)}>
          <div className="w-16 h-[2px] bg-accent mb-8" />
          <div className="columns-1 lg:columns-2 gap-12">
            <p className="text-lg leading-[2] text-foreground/85 font-body mb-6">{dimensions.insight}</p>
            <InterpretationLines value={dimensions.interpretation} compact />
          </div>
        </motion.div>

        <motion.div className="mt-10 border-r-2 border-accent pr-6" {...fadeIn(0.5)}>
          <ProverbLabel />
          <blockquote className="text-xl font-heading text-accent/80 leading-snug">❝{dimensions.proverb}❞</blockquote>
        </motion.div>

        <motion.div className="mt-8" {...fadeIn(0.6)}>
          <PracticeBlock practice={dimensions.practice} compact />
        </motion.div>
      </div>

      <motion.div className="relative overflow-hidden min-h-[40vh] lg:min-h-full order-1 lg:order-2" {...fadeIn(0)}>
        {images.interior || images.exterior ? (
          <img
            src={images.interior || images.exterior!}
            alt={dimensions.spaceName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent lg:from-background/30" />
      </motion.div>
    </div>
  );
};

export default MagazinePage;
