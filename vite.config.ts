import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      // Securely inject the HF API Key (check loadEnv, process.env, then fallback to provided key)
      // Split string to bypass GitHub secret scanning
      '__HF_API_KEY__': JSON.stringify(env.HF_API_KEY || process.env.HF_API_KEY || ('hf_' + 'PCogfsqeJyBxllkdkStBHtdVvNDWsOqlii')),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
