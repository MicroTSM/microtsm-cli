import { defineRootAppConfig } from '@microtsm/cli';

export default defineRootAppConfig({
  cssImportMap: ['src/importmaps/stylesheets.json'],
  importMap: ['src/importmaps/core-importmap.json', 'src/importmaps/modules-importmap.json'],
  build: {
    rollupOptions: {
      external: ['vue-router'],
    },
  },
});
