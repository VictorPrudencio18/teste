/// <reference types="node" />
import { defineConfig, loadEnv } from 'vite';
// @ts-ignore
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const baseFromEnv = env.BASE_URL || env.VITE_BASE || '/';
    return {
      // Base path is configurable to support both Vercel ('/') and GitHub Pages ('/repo/')
      base: baseFromEnv,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY)
      },
      resolve: {
        alias: {
          '@': resolve(import.meta.dirname || __dirname, '.'),
        }
      }
    };
});
