import { createServer, InlineConfig, Logger, mergeConfig, ResolvedServerUrls, ServerOptions } from 'vite';
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

const printUrls = (info: Logger['info'], urls: ResolvedServerUrls) => {
  const hasLocalUrls = urls.local.length > 0;
  const hasNetworkUrls = urls.network.length > 0;

  // Format Local Access
  const localAccess = hasLocalUrls
    ? `🔗 Local Access:\n${urls.local.map((url) => `   ➜  ${colors.green(url)}`).join('\n')}`
    : '';

  // Format Network Access
  const networkAccess = hasNetworkUrls
    ? `\n🌍 Network Access:\n${urls.network.map((url) => `   ➜  ${colors.cyan(url)}`).join('\n')}`
    : `\n🌍 Network Access:\n   ➜  Use ${colors.yellow('--host')} to share externally`;

  info(`${localAccess} \n ${networkAccess}\n`);
};

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

  const viteStartTime = global.__vite_start_time ?? false;
  const startupDuration = viteStartTime
    ? colors.dim(`⚡ Ready in ${colors.reset(colors.bold(Math.ceil(performance.now() - viteStartTime)))} ms`)
    : '';

  const hasExistingLogs = process.stdout.bytesWritten > 0 || process.stderr.bytesWritten > 0;

  const cliVersion = colors.green(colors.bold(`MicroTSM CLI v${VERSION}`));
  const appName = colors.cyan(colors.bold(config.define?.__APP_NAME__ ?? 'App'));
  const liveMessage = `Your ${appName} is live!`;
  const helpMessage = `💡 Need help? Press ${colors.yellow('h + Enter')}\n`;

  info(`\n${cliVersion} ${startupDuration}\n\n${liveMessage.replaceAll('"', '')}\n`, { clear: !hasExistingLogs });

  await generateIndexPage({ entryFilePath: getEntryFilePath(config) });
  await server.listen();

  if (server.resolvedUrls)
    server.resolvedUrls.local = server.resolvedUrls?.local?.filter?.((url) => !url.includes('vite'));

  printUrls(info, server.resolvedUrls!);
  info(helpMessage);
  server.bindCLIShortcuts({ print: false });
}
