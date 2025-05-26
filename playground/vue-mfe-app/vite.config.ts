import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'single-spa-vite-cli-service'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      // Custom output options
      output: {
        format: 'esm',
        entryFileNames: 'main.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
