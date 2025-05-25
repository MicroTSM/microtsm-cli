import { ConfigEnv, loadConfigFromFile, UserConfig } from 'vite';
import { defineConfig, isDefinedWithDefineConfig } from './defineConfig';
import { CLIBuildMode } from '../types/cli';

export default async function resolveConfig(
  command: ConfigEnv['command'],
  mode: CLIBuildMode = 'development',
): Promise<UserConfig> {
  const configEnv: ConfigEnv = { command, mode };
  let loaded = await loadConfigFromFile(configEnv);

  return loaded?.config && isDefinedWithDefineConfig(loaded.config)
    ? loaded.config
    : defineConfig(loaded?.config ?? {});
}
