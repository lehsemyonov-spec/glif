import { defineConfig } from 'vite';

export default defineConfig({
  // Относительные пути: сайт работает и в корне домена, и на GitHub Pages в подпапке.
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
});
