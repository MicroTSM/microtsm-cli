import { ConfigEnv, loadConfigFromFile, UserConfig } from 'vite';
import { defineConfig, isDefinedWithDefineConfig } from './defineConfig';
import { GlobalCLIOptions } from '../types/cli';

export default async function resolveConfig(
  command: ConfigEnv['command'],
  root?: string,
  options: GlobalCLIOptions = {},
): Promise<UserConfig> {
  const configEnv: ConfigEnv = { command, mode: options.mode || 'development' };

  let loaded = await loadConfigFromFile(
    configEnv,
    options.config,
    root,
    options.logLevel,
    undefined,
    options.configLoader,
  );

  return loaded?.config && isDefinedWithDefineConfig(loaded.config)
    ? loaded.config
    : defineConfig(loaded?.config ?? {});
}
