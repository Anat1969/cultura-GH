import FitImage, { usableImage } from '@/components/FitImage';
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
  const { dimensions, concept, tags, createdAt } = article;
  const images = { exterior: usableImage(article.images.exterior), interior: usableImage(article.images.interior) };
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

  // Every image stands in its own column, whole and in its own proportions:
  // no box around it, no veil over it. The text sits beside it, never on it.
  const Picture: React.FC<{ src: string | null; alt: string; caption?: string; className?: string }> = ({
    src,
    alt,
    caption,
    className = '',
  }) => (
    <motion.figure className={`-mx-6 sm:mx-0 ${className}`} {...fadeIn(0)}>
      {src ? (
        <FitImage src={src} alt={alt} mode="natural" imgClassName="shadow-[0_24px_48px_-28px_rgb(0_0_0/0.45)]" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-muted">
          <span className="px-6 text-center font-heading text-7xl text-foreground/30" dir="auto">
            {dimensions.origin.script || concept}
          </span>
        </div>
      )}
      {caption && <figcaption className="mt-2 px-6 text-xs text-muted-foreground sm:px-0">{caption}</figcaption>}
    </motion.figure>
  );

  const Proverb: React.FC<{ size?: string }> = ({ size = 'text-2xl' }) => (
    <div>
      <ProverbLabel />
      <blockquote className={`${size} font-heading font-bold leading-snug text-foreground`}>❝{dimensions.proverb}❞</blockquote>
    </div>
  );

  const Title: React.FC<{ center?: boolean; tagCount?: number }> = ({ center, tagCount = 3 }) => (
    <motion.div {...fadeUp}>
      <span className="mb-4 block text-xs uppercase tracking-[0.3em] text-muted-foreground">{dateStr}</span>
      <h2 className="mb-4 text-fluid-xl font-heading font-bold leading-[1.1] text-primary">{dimensions.spaceName}</h2>
      <OriginLine origin={dimensions.origin} className={`mb-4 ${center ? 'justify-center' : ''}`} />
      <div className={`mb-8 flex flex-wrap gap-2 ${center ? 'justify-center' : ''}`}>
        <Badge variant="outline" className="text-sm">
          {concept}
        </Badge>
        {otherTags(tagCount)}
      </div>
    </motion.div>
  );

  const shell = 'container mx-auto max-w-6xl px-6 pt-10 pb-32';
  const split = 'grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14';

  // Layout 0: editorial spread, text on the right, the image on the left
  if (variant === 0) {
    return (
      <div className={shell}>
        <div className={split}>
          <div className="lg:sticky lg:top-24 lg:order-last">
            <Picture src={images.exterior} alt={dimensions.spaceName} caption={dimensions.origin.region_en} />
          </div>
          <div className="min-w-0">
            <Title />
            <motion.div {...fadeIn(0.3)}>
              <div className="mb-6 h-[2px] w-16 bg-primary" />
              <p className="mb-8 font-body text-lg leading-[1.9] text-foreground/85">{dimensions.insight}</p>
            </motion.div>
            <motion.div className="space-y-8" {...fadeIn(0.5)}>
              <Proverb />
              <InterpretationLines value={dimensions.interpretation} compact />
              <PracticeBlock practice={dimensions.practice} compact />
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 1: the image on the right, the proverb opening the text on the left
  if (variant === 1) {
    return (
      <div className={shell}>
        <div className={split}>
          <div className="lg:sticky lg:top-24">
            <Picture src={images.exterior} alt={dimensions.spaceName} caption={dimensions.origin.region_en} />
          </div>
          <div className="min-w-0">
            <Title tagCount={2} />
            <motion.div className="mb-8 border-r-2 border-primary pr-5" {...fadeIn(0.2)}>
              <Proverb size="text-3xl" />
            </motion.div>
            <motion.div className="space-y-8" {...fadeIn(0.4)}>
              <p className="font-body text-lg leading-[1.9] text-foreground/90">{dimensions.insight}</p>
              <InterpretationLines value={dimensions.interpretation} compact />
              <PracticeBlock practice={dimensions.practice} compact />
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 2: the two images side by side (origin | Israel), the text below
  if (variant === 2) {
    return (
      <div className={shell}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Picture src={images.exterior} alt="המושג בארץ המקור" caption={dimensions.origin.region_en || 'ארץ המקור'} />
          <Picture src={images.interior} alt="מרחב מחייה בישראל" caption="ישראל" />
        </div>

        <div className="mx-auto mt-12 max-w-3xl text-center">
          <Title center />
          <motion.p className="mb-8 font-body text-xl leading-[2] text-foreground/85" {...fadeIn(0.3)}>
            {dimensions.insight}
          </motion.p>
          <motion.div {...fadeIn(0.5)}>
            <Proverb />
          </motion.div>
          <motion.div className="mx-auto mt-6 mb-8 max-w-md text-right" {...fadeIn(0.6)}>
            <InterpretationLines value={dimensions.interpretation} compact />
          </motion.div>
          <motion.div className="mx-auto max-w-xl text-right" {...fadeIn(0.7)}>
            <PracticeBlock practice={dimensions.practice} compact />
          </motion.div>
        </div>
      </div>
    );
  }

  // Layout 3: a narrow image column, a wide text block in two columns
  return (
    <div className={shell}>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:order-last">
          <Picture
            src={images.interior || images.exterior}
            alt={dimensions.spaceName}
            caption={images.interior ? 'המושג כמרחב בישראל' : dimensions.origin.region_en}
          />
        </div>
        <div className="min-w-0">
          <Title />
          <motion.div {...fadeIn(0.2)}>
            <div className="mb-8 h-[2px] w-16 bg-primary" />
            <div className="columns-1 gap-12 lg:columns-2">
              <p className="mb-6 font-body text-lg leading-[2] text-foreground/85">{dimensions.insight}</p>
              <InterpretationLines value={dimensions.interpretation} compact />
            </div>
          </motion.div>
          <motion.div className="mt-10 border-r-2 border-primary pr-6" {...fadeIn(0.5)}>
            <Proverb size="text-xl" />
          </motion.div>
          <motion.div className="mt-8" {...fadeIn(0.6)}>
            <PracticeBlock practice={dimensions.practice} compact />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MagazinePage;
