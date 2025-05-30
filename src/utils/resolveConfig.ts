import { ConfigEnv, loadConfigFromFile, UserConfig } from 'vite';
import { GlobalCLIOptions } from '../types/cli';
import { resolve } from 'path';
import { existsSync } from 'fs';
import defineConfig, { isDefinedWithDefineConfig } from '../config/defineConfig';
import configFileNames from '../config/configFileNames';

export default async function resolveConfig(
  command: ConfigEnv['command'],
  root?: string,
  options: GlobalCLIOptions = {},
): Promise<UserConfig> {
  const configEnv: ConfigEnv = { command, mode: options.mode || 'development' };
  let configFile: string | undefined;

  for (const fileName of configFileNames) {
    configFile = (existsSync(resolve(process.cwd(), fileName)) && fileName) || undefined;
  }

  let loaded = await loadConfigFromFile(
    configEnv,
    options.config || configFile,
    root,
    options.logLevel,
    undefined,
    options.configLoader,
  );

  return loaded?.config && isDefinedWithDefineConfig(loaded.config)
    ? loaded.config
    : defineConfig(loaded?.config ?? {});
}
