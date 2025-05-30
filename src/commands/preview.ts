import { CLIPreviewOptions } from '../types/cli';
import { createLogger, InlineConfig } from 'vite';
import { printHelpMessage, printStartupTime, printUrls } from '../server/logger';
import configureHTTPSServer from '../server/configureHttps';
import modifyResolvedUrls from '../server/modifyResolvedUrls';
import getAppName from '../utils/getAppName';
import { resolveConfigFileName } from '../config/resolveConfig';

export default async function runPreviewServer(root: string, options: CLIPreviewOptions) {
  const { preview } = await import('vite');
  const config: InlineConfig = {
    root,
    base: options.base,
    configFile: options.config || resolveConfigFileName(),
    configLoader: options.configLoader,
    logLevel: options.logLevel,
    mode: options.mode,
    build: {
      outDir: options.outDir,
    },
    preview: {
      port: options.port,
      strictPort: options.strictPort,
      host: options.host,
      open: options.open,
    },
  };

  if (options.https == true) {
    configureHTTPSServer(config);
  }

  const logger = createLogger(options.logLevel);
  const server = await preview(config);

  printStartupTime(getAppName(), logger);
  modifyResolvedUrls(server);

  server.printUrls = () => printUrls(createLogger(options.logLevel), server.resolvedUrls!);
  server.printUrls();
  printHelpMessage(logger);
  server.bindCLIShortcuts({ print: false });
}
