import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex w-full max-w-sm flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => dismiss(t.id)}
            className={cn(
              'pointer-events-auto cursor-pointer rounded-lg border p-4 shadow-lg backdrop-blur-xl',
              t.variant === 'destructive'
                ? 'border-destructive/40 bg-destructive/15 text-foreground'
                : 'border-border bg-card/90 text-card-foreground'
            )}
          >
            {t.title && <p className="text-sm font-bold">{t.title}</p>}
            {t.description && (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t.description}</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toaster;
