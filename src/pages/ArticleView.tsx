import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';
import SaveStatus from '@/components/SaveStatus';
import FitImage, { usableImage } from '@/components/FitImage';
import { OriginStory } from '@/components/CultureMarks';
import { ZoomLadder, WordAndLanguage } from '@/components/LanguageBlocks';
import { completeArticle } from '@/lib/complete';
import PromptStudio from '@/components/PromptStudio';
import { OriginLine, PracticeBlock, InterpretationLines } from '@/components/CultureBlocks';
import { getArticleById, saveArticle, ARTICLE_SAVED } from '@/lib/storage';
import { Article, articleLede } from '@/types/article';
import { isVideo } from '@/lib/media';
import { useToast } from '@/hooks/use-toast';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/** While a frame waits for its image, the word's own script holds the place. */
const ScriptPlate: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex aspect-square w-full items-center justify-center bg-muted">
    <span
      className="px-6 text-center font-heading text-[clamp(4rem,12vw,9rem)] leading-none text-foreground/35"
      dir="auto"
      style={{
        fontFamily: "'Playfair Display', 'Noto Serif JP', 'Noto Naskh Arabic', 'Noto Serif Devanagari', serif",
      }}
    >
      {text}
    </span>
  </div>
);

const ArticleViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (!id) return;
    const found = getArticleById(id);
    if (!found) {
      navigate('/library', { replace: true });
      return;
    }
    setArticle(found);
    // Whatever it still lacks (a stored image, the origin story) is made now.
    void completeArticle(found);
  }, [id, navigate]);

  // Images arrive after the text; show them as soon as they are saved.
  useEffect(() => {
    const onSaved = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) return;
      const fresh = id ? getArticleById(id) : undefined;
      if (fresh) setArticle(fresh);
    };
    window.addEventListener(ARTICLE_SAVED, onSaved);
    return () => window.removeEventListener(ARTICLE_SAVED, onSaved);
  }, [id]);

  if (!article) return null;
  const d = article.dimensions;
  const hero = usableImage(article.images.exterior) || usableImage(article.images.interior);
  const heroVideo = article.videos.exterior || article.videos.interior;
  // The second image only when it is not the one already opening the page.
  const interior = usableImage(article.images.interior);
  const local = interior && interior !== hero ? interior : null;

  return (
    <article className="min-h-screen pb-20">
      {/* Opening spread: the word's image in its own proportions, no frame,
          and the title beside it. On a phone the image runs edge to edge. */}
      <header className="container max-w-6xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'בית', to: '/' },
            { label: 'ספרייה', to: '/library' },
            { label: d.spaceName },
          ]}
        />

        <div className="mt-4 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <motion.figure {...fade()} className="-mx-4 sm:mx-0 lg:sticky lg:top-24 lg:order-last">
            {hero ? (
              <FitImage
                src={hero}
                alt={d.spaceName}
                mode="natural"
                loading="eager"
                imgClassName="shadow-[0_24px_48px_-28px_rgb(0_0_0/0.45)]"
              />
            ) : heroVideo && isVideo(heroVideo) ? (
              <video src={heroVideo} muted loop autoPlay playsInline className="block h-auto w-full" />
            ) : (
              <ScriptPlate text={d.origin.script || article.concept} />
            )}
            {d.origin.region_en && (
              <figcaption className="mt-2 px-4 text-xs text-muted-foreground sm:px-0">
                {d.origin.culture ? `${d.origin.culture} · ` : ''}
                <span dir="ltr">{d.origin.region_en}</span>
              </figcaption>
            )}
          </motion.figure>

          <motion.div {...fade(0.05)} className="min-w-0">
            <span className="mb-3 block text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {new Date(article.createdAt).toLocaleDateString('he-IL')}
            </span>
            <h1 className="text-fluid-xl font-heading font-bold leading-[1.05] text-primary">
              {d.spaceName}
            </h1>

            {/* The standfirst: the line that earns the read */}
            <p className="mt-5 border-r-2 border-primary pr-4 text-fluid-md leading-relaxed text-foreground/90">
              {articleLede(d)}
            </p>

            <OriginLine origin={d.origin} className="mt-6" />
            <ZoomLadder article={article} />

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{article.concept}</Badge>
              {d.humanNeed && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(`/concept/${encodeURIComponent(d.humanNeed)}?mode=need`)
                  }
                >
                  {d.humanNeed}
                </Badge>
              )}
              {d.origin.culture && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(`/concept/${encodeURIComponent(d.origin.culture)}?mode=culture`)
                  }
                >
                  {d.origin.culture}
                </Badge>
              )}
            </div>

            <div className="mt-10 mb-4 h-px w-16 bg-primary" />
            <p className="text-lg leading-[1.9] text-foreground/85">{d.insight}</p>
          </motion.div>
        </div>
      </header>

      <div className="container max-w-3xl space-y-12 px-4 pt-14">
        <motion.div {...fade(0.08)}>
          <OriginStory origin={d.origin} />
        </motion.div>

        <motion.div {...fade(0.09)}>
          <WordAndLanguage article={article} />
        </motion.div>

        <motion.section {...fade(0.1)} className="rounded-none border border-border bg-card/60 p-6">
          <span className="mb-2 block text-xs tracking-wide text-muted-foreground">ברוח המושג</span>
          <blockquote className="font-heading text-2xl leading-snug text-accent">
            ❝{d.proverb}❞
          </blockquote>
        </motion.section>

      </div>

      {/* The word at home in Israel: the second image beside the text that
          translates it, so the reading and the place are seen together. */}
      <div className="container max-w-6xl px-4 pt-14">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          {local && (
            <motion.figure {...fade(0.12)} className="-mx-4 sm:mx-0 lg:sticky lg:top-24 lg:order-last">
              <FitImage
                src={local}
                alt={`${d.spaceName}: מרחב בישראל`}
                mode="natural"
                imgClassName="shadow-[0_24px_48px_-28px_rgb(0_0_0/0.45)]"
              />
              <figcaption className="mt-2 px-4 text-xs text-muted-foreground sm:px-0">המושג כמרחב בישראל</figcaption>
            </motion.figure>
          )}
          <div className={`min-w-0 space-y-12 ${local ? '' : 'lg:col-span-2 mx-auto w-full max-w-3xl'}`}>
            <motion.section {...fade(0.15)}>
              <h2 className="mb-4 font-heading text-lg font-bold text-primary">גשר לתרבות המקומית</h2>
              <InterpretationLines value={d.interpretation} />
            </motion.section>

            <motion.section {...fade(0.2)}>
              <h2 className="mb-4 font-heading text-lg font-bold text-primary">ליישום</h2>
              <PracticeBlock practice={d.practice} />
            </motion.section>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl space-y-12 px-4 pt-14">
        <motion.section {...fade(0.25)} className="space-y-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-primary">פרומפטים ומסגרות</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              העתיקי פרומפט, צרי איתו תמונה או סרטון, והעלי למסגרת. מה שמועלה נשמר לצמיתות.
            </p>
          </div>
          {(['exterior', 'interior'] as const).map(frame => (
            <PromptStudio
              key={frame}
              article={article}
              frame={frame}
              onChange={next => {
                setArticle(next);
                saveArticle(next);
              }}
            />
          ))}
        </motion.section>

        <motion.footer {...fade(0.3)} className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <SaveStatus id={article.id} className="basis-full text-center" />
          <Button onClick={() => navigate(`/edit/${article.id}`)}>עריכה</Button>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({ title: 'הקישור הועתק' });
            }}
          >
            שתף
          </Button>
          <Button variant="ghost" onClick={() => navigate('/library')}>
            לספרייה
          </Button>
        </motion.footer>
      </div>
    </article>
  );
};

export default ArticleViewPage;
