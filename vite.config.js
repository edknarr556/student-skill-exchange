import { defineConfig } from 'vite';

// Vanilla JS single-page app. No framework plugins required.
export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
