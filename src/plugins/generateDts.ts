import { Plugin, InlineConfig } from 'vite';

import dtsPlugin, { PluginOptions } from 'vite-plugin-dts';

export default function dts(options: PluginOptions = {}) {
  const plugin: Plugin = {
    name: 'microtsm:dts',
    apply: 'build',
    enforce: 'post',
  };

  Object.defineProperty(plugin, 'pluginOptions', { value: options });

  return plugin;
}

export function configureDtsPlugin(config: InlineConfig, options: PluginOptions = {}) {
  const entryFile =
    config.build?.lib && typeof config.build.lib === 'object' && 'entry' in config.build.lib
      ? typeof config.build.lib.entry === 'string'
        ? config.build.lib.entry // To get the directory of the entry file
        : './src/main.ts'
      : './src/main.ts';

  const plugin = dtsPlugin({
    logLevel: 'silent',
    entryRoot: entryFile.split('/').slice(0, -1).join('/'),
    outDir: config.build?.outDir,
    include: entryFile,
    ...options,
  });

  config.plugins = config.plugins ? [...config.plugins, plugin] : [plugin];
}
