import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from '@microtsm/cli'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // build: {
  //   rollupOptions: {
  //     // Custom output options
  //     output: {
  //       format: 'esm',
  //       entryFileNames: 'main.js',
  //       chunkFileNames: 'chunks/[name]-[hash].js',
  //     },
  //   },
  // },
  build: {
    lib: {
      entry: './src/main.ts',
      name: 'microtsm',
      formats: ['es'],
      fileName: 'main',
    },
    minify: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
