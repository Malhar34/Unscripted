import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  define: {
    'process.env.REACT_APP_SERVER_URL': JSON.stringify(
      process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'
    ),
  },
});
