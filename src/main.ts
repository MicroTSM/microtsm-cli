export type * from 'vite';

export { default as defineConfig } from './config/defineConfig';
export { default as defineRootAppConfig } from './config/defineRootAppConfig';
export { default as installPlugins } from './plugins/installPlugins';
export { default as dts } from './plugins/generateDts';
