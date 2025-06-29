import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
const nodeBuiltInModules = [
  'path',
  'http',
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
    __CLOUDFLARE_POLYFILL_URL__: JSON.stringify(
      'https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?version=4.8.0',
    ),
    __MODULE_LOADER_URL__: JSON.stringify('https://cdn.jsdelivr.net/npm/microtsm@{VERSION}/dist/module-loader/index.js'),
    __MICROTSM_URL__: JSON.stringify('https://cdn.jsdelivr.net/npm/microtsm@{VERSION}/dist/'),
    __MICROTSM_VERSION__: JSON.stringify('0.0.57'),
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
        'bin/cli': resolve(__dirname, 'bin/microtsm-cli.ts'),
        'main': resolve(__dirname, 'src/main.ts'),
        'workers/module-transform.sw': resolve(__dirname, 'src/workers/module-transform.sw.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
      external: ['crypto', 'typescript', ...nodeBuiltInModules, ...Object.keys(pkg.dependencies || {})],
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
