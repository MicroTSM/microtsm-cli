import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    target: 'node20',
    outDir: 'dist',
    emptyOutDir: true,
    ssr: true,
    rollupOptions: {
      input: {
        cli: path.resolve(__dirname, 'bin/vite-single-spa-cli.ts'),
        lib: path.resolve(__dirname, 'src/main.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: (chunk) => {
          if (chunk.name === 'cli') return 'bin/cli.js';
          if (chunk.name === 'lib') return 'main.js';
          return 'assets/[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
      external: ['path', 'fs', 'url', 'child_process', 'vite'],
    },
  },
  plugins: [dts({ entryRoot: './src', outDir: 'dist', tsconfigPath: './tsconfig.json', exclude: ['**/*.test.ts'] })],
  server: { watch: { ignored: ['**/playground/**'] } },
});
