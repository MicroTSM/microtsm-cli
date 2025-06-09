import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

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
  define: {
    'import.meta.env.CLOUDFLARE_POLYFILL_URL': JSON.stringify(
      'https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?version=4.8.0',
    ),
    'import.meta.env.MODULE_LOADER_URL': JSON.stringify(
      'http://localhost:4174/module-loader.js', // 'https://cdn.jsdelivr.net/npm/microtsm@0.0.26/dist/module-loader.js',
    ),
  },
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
        'bin/cli.js': resolve(__dirname, 'bin/microtsm-cli.ts'),
        'main.js': resolve(__dirname, 'src/main.ts'),
        'workers/module-transform.sw': resolve(__dirname, 'src/workers/module-transform.sw.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
      external: [
        'crypto',
        'typescript',
        'vite-plugin-mkcert',
        ...nodeBuiltInModules,
        ...Object.keys(pkg.dependencies || {}),
      ],
    },
  },
  publicDir: 'static',
  plugins: [
    dts({ entryRoot: './src', outDir: 'dist', tsconfigPath: './tsconfig.json', exclude: ['**/*.test.ts'] }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/types/client.d.ts',
          dest: '',
        },
      ],
    }),
  ],
  server: { watch: { ignored: ['**/playground/**', 'dist'] } },
});
