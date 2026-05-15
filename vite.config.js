import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        auth: resolve(__dirname, 'auth.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        feed: resolve(__dirname, 'feed.html'),
        shop: resolve(__dirname, 'shop.html'),
        menu: resolve(__dirname, 'menu.html'),
        chat: resolve(__dirname, 'chat.html'),
        article: resolve(__dirname, 'article.html'),
      }
    }
  }
});