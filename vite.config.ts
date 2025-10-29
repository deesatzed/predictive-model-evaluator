import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
        'import.meta.env.VITE_LLM_PROVIDER': JSON.stringify(env.VITE_LLM_PROVIDER || 'gemini'),
        'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY || env.OPENROUTER_API_KEY),
        'import.meta.env.VITE_OPENROUTER_MODEL': JSON.stringify(env.VITE_OPENROUTER_MODEL || ''),
        'import.meta.env.VITE_MLX_BASE_URL': JSON.stringify(env.VITE_MLX_BASE_URL || ''),
        'import.meta.env.VITE_MLX_MODEL': JSON.stringify(env.VITE_MLX_MODEL || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
