import { UserConfig } from 'vite';
import cssStyleInjectPlugin from 'vite-plugin-css-style-inject';
import ignoreCssImports from './ignoreCssImports';

const pluginCreatorMaps = {
  styleInject: cssStyleInjectPlugin,
  ignoreCssImports: ignoreCssImports,
};

export default function installPlugins(plugins: (keyof typeof pluginCreatorMaps)[], config?: UserConfig) {
  const pluginsToInstall = plugins.map((name) => pluginCreatorMaps[name]());
  if (config) config.plugins = [...(config.plugins || []), ...pluginsToInstall];
  return pluginsToInstall;
}
