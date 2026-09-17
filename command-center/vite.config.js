import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../docs/command-center',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: assetInfo => assetInfo.name?.endsWith('.css') ? 'assets/app-[hash].css' : 'assets/[name][extname]'
      }
    }
  }
});
