import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import Toaster from '@/components/ui/toaster';
import { syncArticlesFromGithub, syncArticlesFromSupabase } from '@/lib/storage';

import HomePage from '@/pages/Home';
import OutputPage from '@/pages/Output';
import ArticleViewPage from '@/pages/ArticleView';
import LibraryPage from '@/pages/Library';
import ConceptBrowser from '@/pages/ConceptBrowser';
import EditorPage from '@/pages/Editor';
import SettingsPage from '@/pages/Settings';
import AtlasPage from '@/pages/Atlas';
import { retryPending } from '@/lib/storage';

// The globe brings d3 and a world map; it loads only when the page is opened.
const WorldPage = lazy(() => import('@/pages/World'));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Both shared sources, then local edits on top. Failures fall back to
    // whatever localStorage already holds.
    syncArticlesFromGithub()
      .then(() => syncArticlesFromSupabase())
      .finally(() => {
        setReady(true);
        // Anything that did not reach the server last time goes now.
        void retryPending();
      });
  }, []);

  return (
    <ThemeProvider>
      <HashRouter>
        <ScrollToTop />
        <Header />
        <main key={String(ready)}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/generate" element={<OutputPage />} />
            <Route path="/article/:id" element={<ArticleViewPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/atlas" element={<AtlasPage />} />
            <Route
              path="/world"
              element={
                <Suspense fallback={<p className="py-20 text-center text-muted-foreground">טוען את הגלובוס…</p>}>
                  <WorldPage />
                </Suspense>
              }
            />
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
