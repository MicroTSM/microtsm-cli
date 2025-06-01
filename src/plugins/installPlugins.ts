import { PluginOption, UserConfig } from 'vite';
import cssStyleInjectPlugin from 'vite-plugin-css-style-inject';
import ignoreCssImports from './ignoreCssImports';

const pluginCreatorMaps: Record<string, () => PluginOption> = {
  styleInject: cssStyleInjectPlugin,
  ignoreCssImports: ignoreCssImports,
};

export default function installPlugins(config: UserConfig, plugins: string[]) {
  config.plugins = [...(config.plugins || []), ...plugins.map((name) => pluginCreatorMaps[name]())];
}
