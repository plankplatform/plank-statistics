import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';

  return {
    server: {
      open: true,
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    base: env.VITE_BASE_PATH || '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: isDev ? 'assets/[name].[hash].js' : 'assets/[name].js',
          chunkFileNames: isDev ? 'assets/[name].[hash].js' : 'assets/[name].js',
          assetFileNames: isDev ? 'assets/[name].[hash].[ext]' : 'assets/[name].[ext]',
        },
      },
    },
  };
});
