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
  // Vitest config: jsdom environment for DOM/interaction tests.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
  },
});
