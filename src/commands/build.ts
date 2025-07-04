import resolveConfig from '../config/resolveConfig';
import { BuildEnvironmentOptions, createBuilder, InlineConfig, mergeConfig } from 'vite';
import { CLIBuildOptions } from '../types/cli';
import { generateIndexPage } from '../guide/generateGuide';
import { performance } from 'node:perf_hooks';
import getEntryFilePath from '../guide/getEntry';
import getVersion from '../utils/getVersion';
import colors from 'picocolors';
import eventBus from '../utils/eventBus';
import installPlugins from '../plugins/installPlugins';
import { isDefinedRootAppConfig } from '../config/defineRootAppConfig';

export default async function buildCommand(
  root?: string,
  options: CLIBuildOptions = {},
  buildOptions: BuildEnvironmentOptions = {},
) {
  const config = await resolveConfig('build', root, options);

  if (options.standalone) {
    delete config.build?.lib;
    if (config.build && config.build.rollupOptions) {
      config.build.rollupOptions.input = 'index.html';
    }

    delete config.build?.rollupOptions?.external;
  }

  if (!options.standalone) installPlugins(['styleInject'], config);

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
  const prefix = 'MicroTSM v' + getVersion();

  let isDev: boolean = false;

  Object.keys(builder.environments).forEach((name) => {
    const { logger } = builder.environments[name];
    builder.environments[name].logger = {
      ...logger,
      info(message: string, opts) {
        message = message.replace(/vite v[\d.]+/i, prefix);

        if (message.includes('development')) {
          message = message.replace('development', 'development in integrated mode');
          isDev = true;
        }

        if (message.includes('modules')) {
          message += `\n\n📦 Built assets successfully:`;
        }

        if (message.includes('built in')) {
          const duration = Math.ceil(performance.now() - (global.__vite_start_time || 0));

          message = `\n${colors.green('✓')} Build completed in ${colors.bold(duration + 'ms')}`;
          message += ` — Ready to ${colors.cyan(isDev ? 'preview' : 'deploy')}! \n`;

          eventBus.emit('build-completed');
          global.__vite_start_time = performance.now();
        }

        if (message.includes('build started')) {
          global.__vite_start_time = performance.now();
        }

        logger.info(message, opts);
      },
    };
  });

  const buildingRootApp = isDefinedRootAppConfig(config);

  eventBus.once('build-completed', async () => {
    // Only generate guide for MFE, not root app
    if (!buildingRootApp && !options.standalone) {
      await generateIndexPage({ entryFilePath: getEntryFilePath(config) });
    }

    eventBus.emit('ready-to-preview');
  });

  await builder.buildApp();
}
