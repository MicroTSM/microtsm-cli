import { ConfigEnv, loadConfigFromFile, UserConfig } from 'vite';
import { defineConfig, isDefinedWithDefineConfig } from './defineConfig';
import { GlobalCLIOptions } from '../types/cli';
import { resolve } from 'path';
import { existsSync } from 'fs';

export default async function resolveConfig(
  command: ConfigEnv['command'],
  root?: string,
  options: GlobalCLIOptions = {},
): Promise<UserConfig> {
  const configEnv: ConfigEnv = { command, mode: options.mode || 'development' };
  const configFileName = 'microtsm.config.ts';
  const configFile = existsSync(resolve(process.cwd(), configFileName)) ? configFileName : undefined;

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
