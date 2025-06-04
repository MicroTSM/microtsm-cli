import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from '@microtsm/cli'
import vue from '@vitejs/plugin-vue'

const conf = defineConfig({
  plugins: [vue()],
  build: {
    minify: false,
    // target: ['chrome80', 'firefox74', 'safari13.1', 'edge80'],
    // target: ['chrome120', 'firefox119', 'safari17.4', 'edge120'],
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

export default conf
