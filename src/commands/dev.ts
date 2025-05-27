import { createServer, InlineConfig, mergeConfig, ServerOptions } from 'vite';
import { CLIServeOptions } from '../types/cli';
import { printHelpMessage, printStartupTime, printUrls } from '../server/logger';
import resolveConfig from '../utils/resolveConfig';
import configureHTTPSServer from '../server/configureHttps';
import modifyResolvedUrls from '../server/modifyResolvedUrls';

function defineStandaloneEnv(conf: InlineConfig, value: boolean): void {
  conf.define = {
    ...conf.define,
    __MICROTSM_STANDALONE__: JSON.stringify(value), // Used by microtsm/vue
  };
}

export default async function startDevServer(root: string, options: CLIServeOptions, serverOptions: ServerOptions) {
  let config = await resolveConfig('serve', root, options);

  if (options.https == true && !config.server?.https?.cert) {
    configureHTTPSServer(config);
  }

  defineStandaloneEnv(config, true);

  const inlineConfig: InlineConfig = {
    ...config,
    root,
    base: options.base,
    mode: options.mode,
    configLoader: options.configLoader,
    logLevel: options.logLevel,
    clearScreen: options.clearScreen,
    server: config.server ? mergeConfig(serverOptions, config.server) : serverOptions,
    forceOptimizeDeps: options.force,
    configFile: false, // To tell vite to not manually load the config file, because we already did it
  };

  const server = await createServer(inlineConfig);

  if (!server.httpServer) {
    throw new Error('HTTP server not available');
  }

  const { logger } = server.config;
  await server.listen();

  printStartupTime(config.define?.__APP_NAME__ ?? 'App', logger);

  modifyResolvedUrls(server);
  server.printUrls = () => printUrls(logger, server.resolvedUrls!);
  server.printUrls();
  printHelpMessage(logger);
  server.bindCLIShortcuts({ print: false });
}
