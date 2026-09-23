import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import Toaster from '@/components/ui/toaster';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { canGenerate } from '@/lib/ai';
import { syncArticlesFromSupabase } from '@/lib/storage';

import HomePage from '@/pages/Home';
import OutputPage from '@/pages/Output';
import ArticleViewPage from '@/pages/ArticleView';
import LibraryPage from '@/pages/Library';
import ConceptBrowser from '@/pages/ConceptBrowser';
import EditorPage from '@/pages/Editor';
import SettingsPage from '@/pages/Settings';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

/** Shown while nothing can generate yet, pointing at the one screen that fixes it. */
const SetupNotice: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const { pathname } = useLocation();
  if (canGenerate() || dismissed || pathname === '/settings') return null;
  return (
    <div className="border-b border-accent/30 bg-accent/10 px-4 py-2 text-center text-xs text-foreground/80">
      כדי ליצור מושגים חדשים צריך מפתח Claude.{' '}
      <Link to="/settings" className="underline hover:text-accent">
        פתח הגדרות והדבק מפתח
      </Link>
      . הספרייה המקומית פעילה גם בלעדיו.
      <button onClick={() => setDismissed(true)} className="mr-3 underline hover:text-accent">
        סגור
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    // Pull the shared library once on boot; failures fall back to localStorage.
    syncArticlesFromSupabase().finally(() => setReady(true));
  }, []);

  return (
    <ThemeProvider>
      <HashRouter>
        <ScrollToTop />
        <SetupNotice />
        <Header />
        <main key={String(ready)}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/generate" element={<OutputPage />} />
            <Route path="/article/:id" element={<ArticleViewPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/concepts" element={<ConceptBrowser />} />
            <Route path="/concept/:concept" element={<ConceptBrowser />} />
            <Route path="/edit/:id" element={<EditorPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster />
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
