import colors from 'picocolors';
import { performance } from 'node:perf_hooks';
import { Logger, ResolvedServerUrls } from 'vite';
import getVersion from '../utils/getVersion';

const VERSION = getVersion();

export function printStartupTime(appName: string, logger: Logger) {
  const viteStartTime = global.__vite_start_time ?? false;
  const startupDuration = viteStartTime
    ? colors.dim(`⚡ Ready in ${colors.reset(colors.bold(Math.ceil(performance.now() - viteStartTime)))} ms`)
    : '';

  const hasExistingLogs = process.stdout.bytesWritten > 0 || process.stderr.bytesWritten > 0;

  const cliVersion = colors.green(colors.bold(`MicroTSM CLI v${VERSION}`));
  const liveMessage = `Your ${colors.cyan(colors.bold(appName))} is live!`;

  logger.info(`\n${cliVersion} ${startupDuration}\n\n${liveMessage.replace(/"/g, '')}\n`, {
    clear: !hasExistingLogs,
  });
}

export function printHelpMessage(logger: Logger) {
  const helpMessage = `💡 Need help? Press ${colors.yellow('h + Enter')}\n`;
  logger.info(helpMessage);
}

export function printUrls(logger: Logger, urls: ResolvedServerUrls) {
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

  logger.info(`${localAccess} \n ${networkAccess}\n`);
}
