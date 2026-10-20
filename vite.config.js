import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    proxy: {
      '/api/google-calendar': {
        target:       'https://www.googleapis.com',
        changeOrigin: true,
        rewrite:      path => path.replace(/^\/api\/google-calendar/, '/calendar/v3'),
      },
    },
  },
});
