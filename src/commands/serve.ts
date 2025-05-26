import { createServer, InlineConfig, mergeConfig, ServerOptions } from 'vite';
import { CLIServeOptions } from '../types/cli';
import resolveConfig from '../utils/resolveConfig';
import viteBasicSslPlugin from '@vitejs/plugin-basic-ssl';
import { generateIndexPage, getEntryFilePath } from '../utils/generateGuide';

function configureHTTPSServer(conf: InlineConfig): void {
  const CERT_NAME = 'serve';

  conf.plugins = [
    ...(conf.plugins || []),
    viteBasicSslPlugin({ name: CERT_NAME, domains: ['*'], certDir: '/Users/.../.devServer/cert' }),
  ];

  conf.server = {
    https: { key: `/Users/.../.devServer/cert/${CERT_NAME}.key`, cert: `/Users/.../.devServer/cert/${CERT_NAME}.crt` },
    cors: { origin: '*', credentials: true },
    ...conf.server,
  };
}

export default async function serveCommand(root: string, options: CLIServeOptions, serverOptions: ServerOptions) {
  let config = await resolveConfig('serve', root, options);

  if (options.https == true && !config.server?.https?.cert) {
    configureHTTPSServer(config);
  }

  const server = await createServer({
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
  });

  if (!server.httpServer) {
    throw new Error('HTTP server not available');
  }

  await generateIndexPage({ entryFilePath: getEntryFilePath(config) });
  await server.listen();
  server.printUrls();
}
