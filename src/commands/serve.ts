import { createServer, InlineConfig, mergeConfig, ServerOptions } from 'vite';
import { CLIServeOptions } from '../types/cli';
import resolveConfig from '../utils/resolveConfig';
import viteBasicSslPlugin from '@vitejs/plugin-basic-ssl';
import { generateIndexPage, getEntryFilePath } from '../utils/generateGuide';
import { performance } from 'node:perf_hooks';
import colors from 'picocolors';
import getVersion from '../utils/getVersion';

const VERSION = getVersion();

function configureHTTPSServer(conf: InlineConfig): void {
  const CERT_NAME = 'serve';

  conf.plugins = [
    ...(conf.plugins || []),
    viteBasicSslPlugin({ name: CERT_NAME, domains: ['*'], certDir: '/Users/.../.devServer/cert' }),
  ];

  conf.server = {
    ...conf.server,
    https: { key: `/Users/.../.devServer/cert/${CERT_NAME}.key`, cert: `/Users/.../.devServer/cert/${CERT_NAME}.crt` },
    cors: { origin: '*', credentials: true },
  };
}

function defineStandaloneEnv(conf: InlineConfig, value: boolean): void {
  conf.define = {
    ...conf.define,
    __MICROTSM_STANDALONE__: JSON.stringify(value),
  };
}

export default async function serveCommand(root: string, options: CLIServeOptions, serverOptions: ServerOptions) {
  let config = await resolveConfig('serve', root, options);

  if (options.https == true && !config.server?.https?.cert) {
    configureHTTPSServer(config);
  }

  defineStandaloneEnv(config, !!options.standalone);

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

  const info = server.config.logger.info;

  const modeString =
    options.mode && options.mode !== 'development' ? `  ${colors.bgGreen(` ${colors.bold(options.mode)} `)}` : '';

  const viteStartTime = global.__vite_start_time ?? false;
  const startupDurationString = viteStartTime
    ? colors.dim(`ready in ${colors.reset(colors.bold(Math.ceil(performance.now() - viteStartTime)))} ms`)
    : '';

  const hasExistingLogs = process.stdout.bytesWritten > 0 || process.stderr.bytesWritten > 0;

  info(`\n  ${colors.green(`${colors.bold('MicroTSM CLI')} v${VERSION}`)}${modeString}  ${startupDurationString}\n`, {
    clear: !hasExistingLogs,
  });

  await generateIndexPage({ entryFilePath: getEntryFilePath(config) });
  await server.listen();

  if (server.resolvedUrls)
    server.resolvedUrls.local = server.resolvedUrls?.local?.filter?.((url) => !url.includes('vite'));

  server.printUrls();
  server.bindCLIShortcuts({ print: true });
}
