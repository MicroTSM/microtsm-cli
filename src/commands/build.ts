import resolveConfig from '../utils/resolveConfig';
import { BuildEnvironmentOptions, createBuilder, InlineConfig, mergeConfig } from 'vite';
import { CLIBuildOptions } from '../types/cli';

export default async function buildCommand(
  root?: string,
  options: CLIBuildOptions = {},
  buildOptions: BuildEnvironmentOptions = {},
) {
  let config = await resolveConfig('build', root, options);

  const inlineConfig: InlineConfig = {
    ...config,
    root,
    base: options.base,
    mode: options.mode,
    configLoader: options.configLoader,
    logLevel: options.logLevel,
    clearScreen: options.clearScreen,
    build: config.build ? mergeConfig(buildOptions, config.build) : buildOptions,
    ...(options.app ? { builder: {} } : {}),
    configFile: false, // To tell vite to not manually load the config file, because we already did it
  };

  const builder = await createBuilder(inlineConfig, true);
  await builder.buildApp();
}
