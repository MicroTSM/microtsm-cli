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
  const entryRoot =
    config.build?.lib && typeof config.build.lib === 'object' && 'entry' in config.build.lib
      ? typeof config.build.lib.entry === 'string'
        ? config.build.lib.entry.split('/').slice(0, -1).join('/') // To get the directory of the entry file
        : './src'
      : './src';

  const plugin = dtsPlugin({
    logLevel: 'silent',
    entryRoot,
    outDir: config.build?.outDir,
    ...options,
  });

  config.plugins = config.plugins ? [...config.plugins, plugin] : [plugin];
}
