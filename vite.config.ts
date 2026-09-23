import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// base is set for GitHub Pages project sites (https://<user>.github.io/<repo>/).
// Override with VITE_BASE=/ when deploying to a root domain.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/cultura-GH/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
