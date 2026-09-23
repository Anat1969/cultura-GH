import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';
import PublishButton from '@/components/PublishButton';
import PromptStudio from '@/components/PromptStudio';
import { OriginLine, PracticeBlock, InterpretationLines } from '@/components/CultureBlocks';
import { getArticleById, saveArticle } from '@/lib/storage';
import { Article, articleLede } from '@/types/article';
import { isVideo } from '@/lib/media';
import { useToast } from '@/hooks/use-toast';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

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
  }, [id, navigate]);

  if (!article) return null;
  const d = article.dimensions;
  const hero = article.images.exterior || article.images.interior;
  const heroVideo = article.videos.exterior || article.videos.interior;

  return (
    <article className="min-h-screen pb-20">
      {/* Cover */}
      <header className="relative">
        <div className="relative h-[46vh] min-h-[320px] overflow-hidden">
          {hero ? (
            <img src={hero} alt="" className="h-full w-full object-cover" />
          ) : heroVideo && isVideo(heroVideo) ? (
            <video src={heroVideo} muted loop autoPlay playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-transparent to-accent/15">
              <span
                className="font-heading text-[8rem] leading-none text-accent/50"
                dir="auto"
                style={{
                  fontFamily:
                    "'Playfair Display', 'Noto Serif JP', 'Noto Naskh Arabic', 'Noto Serif Devanagari', serif",
                }}
              >
                {d.origin.script || article.concept}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />
        </div>

        <div className="container relative z-10 -mt-32 max-w-3xl px-4">
          <Breadcrumbs
            items={[
              { label: 'בית', to: '/' },
              { label: 'ספרייה', to: '/library' },
              { label: d.spaceName },
            ]}
          />

          <motion.div {...fade()}>
            <span className="mb-3 block text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {new Date(article.createdAt).toLocaleDateString('he-IL')}
            </span>
            <h1 className="text-fluid-xl font-heading font-bold leading-[1.05] text-primary">
              {d.spaceName}
            </h1>

            {/* The standfirst: the line that earns the read */}
            <p className="mt-5 border-r-2 border-accent pr-4 text-fluid-md leading-relaxed text-foreground/90">
              {articleLede(d)}
            </p>

            <OriginLine origin={d.origin} className="mt-6" />

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
          </motion.div>
        </div>
      </header>

      <div className="container max-w-3xl space-y-12 px-4 pt-12">
        <motion.section {...fade(0.05)}>
          <div className="mb-4 h-px w-16 bg-accent" />
          <p className="text-lg leading-[1.9] text-foreground/85">{d.insight}</p>
        </motion.section>

        <motion.section {...fade(0.1)} className="rounded-xl border border-border bg-card/60 p-6">
          <span className="mb-2 block text-xs tracking-wide text-muted-foreground">ברוח המושג</span>
          <blockquote className="font-heading text-2xl leading-snug text-accent">
            ❝{d.proverb}❞
          </blockquote>
        </motion.section>

        <motion.section {...fade(0.15)}>
          <h2 className="mb-4 font-heading text-lg font-bold text-accent">גשר לתרבות המקומית</h2>
          <InterpretationLines value={d.interpretation} />
        </motion.section>

        <motion.section {...fade(0.2)}>
          <h2 className="mb-4 font-heading text-lg font-bold text-accent">ליישום</h2>
          <PracticeBlock practice={d.practice} />
        </motion.section>

        <motion.section {...fade(0.25)} className="space-y-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-accent">פרומפטים ומסגרות</h2>
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

        <motion.footer {...fade(0.3)} className="flex flex-wrap justify-center gap-3 pt-4">
          <Button onClick={() => navigate(`/edit/${article.id}`)}>עריכה</Button>
          <PublishButton article={article} />
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
