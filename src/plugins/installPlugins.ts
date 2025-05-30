import { PluginOption, UserConfig } from 'vite';
import cssStyleInjectPlugin from 'vite-plugin-css-style-inject';

const pluginCreatorMaps: Record<string, () => PluginOption> = {
  styleInject: cssStyleInjectPlugin,
};

export default function installPlugins(config: UserConfig, plugins: string[]) {
  config.plugins = [...(config.plugins || []), ...plugins.map((name) => pluginCreatorMaps[name]())];
}
