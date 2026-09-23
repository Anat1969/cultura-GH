import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installMotionFallback } from '@/lib/motionFallback';
import ErrorBoundary from '@/components/ErrorBoundary';
import './index.css';

installMotionFallback();

// We got here, so the bundle loaded: retire the stale-cache recovery marker and
// drop the cache-busting parameter it may have added to the URL.
try {
  sessionStorage.removeItem('culturearch_boot_retry');
} catch {
  // Storage can be blocked; the marker simply expires with the session.
}
if (window.location.search.includes('r=')) {
  window.history.replaceState(null, '', window.location.pathname + window.location.hash);
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
