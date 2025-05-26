import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
const nodeBuiltInModules = [
  'path',
  'fs',
  'url',
  'child_process',
  'events',
  'node:path',
  'node:fs',
  'node:events',
  'node:util',
  'node:perf_hooks',
];

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      input: {
        cli: resolve(__dirname, 'bin/microtsm-cli.ts'),
        lib: resolve(__dirname, 'src/main.ts'),
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
      external: ['crypto', ...nodeBuiltInModules, ...Object.keys(pkg.dependencies || {})],
    },
  },
  publicDir: 'static',
  plugins: [dts({ entryRoot: './src', outDir: 'dist', tsconfigPath: './tsconfig.json', exclude: ['**/*.test.ts'] })],
  server: { watch: { ignored: ['**/playground/**', 'dist'] } },
});
