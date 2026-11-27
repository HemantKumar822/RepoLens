import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.PORT || '4173';
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      proxy: { '/api': `http://127.0.0.1:${apiPort}` },
    },
    build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
  };
});
