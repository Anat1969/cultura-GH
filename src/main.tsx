import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installMotionFallback } from '@/lib/motionFallback';
import './index.css';

installMotionFallback();

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
