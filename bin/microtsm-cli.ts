#!/usr/bin/env node
import { cac } from 'cac';
import { BuildEnvironmentOptions, createLogger } from 'vite';
import {
  BuilderCLIOptions,
  CLIBuildOptions,
  CLIPreviewOptions,
  CLIServeOptions,
  CLITestOptions,
  GlobalCLIOptions,
  ServeCommandCLIOptions,
} from '../src/types/cli';
import colors from 'picocolors';

import buildCommand from '../src/commands/build';
import getVersion from '../src/utils/getVersion';
import { performance } from 'node:perf_hooks';
import startDevServer from '../src/commands/dev';
import runPreviewServer from '../src/commands/preview';
import eventBus from '../src/utils/eventBus';

const VERSION = getVersion();

const cli = cac('microtsm');

global.__vite_start_time = performance.now();

/**
 * base may be a number (like 0), should convert to empty string
 */
const convertBase = (v: any) => {
  if (v === 0) {
    return '';
  }
  return v;
};

/**
 * host may be a number (like 0), should convert to string
 */
const convertHost = (v: any) => {
  if (typeof v === 'number') {
    return String(v);
  }
  return v;
};

const filterDuplicateOptions = <T extends object>(options: T) => {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1];
    }
  }
};

/**
 * removing global flags before passing as sub-configs command specific
 */
function cleanGlobalCLIOptions<Options extends GlobalCLIOptions>(
  options: Options,
): Omit<Options, keyof GlobalCLIOptions> {
  const ret = { ...options };
  delete ret['--'];
  delete ret.c;
  delete ret.config;
  delete ret.base;
  delete ret.l;
  delete ret.logLevel;
  delete ret.clearScreen;
  delete ret.configLoader;
  delete ret.d;
  delete ret.debug;
  delete ret.f;
  delete ret.filter;
  delete ret.m;
  delete ret.mode;
  delete ret.force;
  delete ret.w;

  // convert the sourcemap option to a boolean if necessary
  if ('sourcemap' in ret) {
    const sourcemap = ret.sourcemap as `${boolean}` | 'inline' | 'hidden';
    ret.sourcemap = sourcemap === 'true' ? true : sourcemap === 'false' ? false : ret.sourcemap;
  }
  if ('watch' in ret) {
    const watch = ret.watch;
    ret.watch = watch ? {} : undefined;
  }

  return ret;
}

/**
 * removing builder flags before passing as command-specific sub-configs
 */
function cleanBuilderCLIOptions<Options extends BuilderCLIOptions>(
  options: Options,
): Omit<Options, keyof BuilderCLIOptions> {
  const ret = { ...options };
  delete ret.app;
  return ret;
}

/**
 * removing serve command flags before passing as command-specific sub-configs
 */
function cleanServeCommandCLIOptions<Options extends ServeCommandCLIOptions>(
  options: Options,
): Omit<Options, keyof ServeCommandCLIOptions> {
  const ret = { ...options };
  delete ret.https;
  return ret;
}

cli
  .option('-c, --config <file>', `[string] use specified config file`)
  .option('--base <path>', `[string] public base path (default: /)`, { type: [convertBase] })
  .option('-l, --logLevel <level>', `[string] info | warn | error | silent`)
  .option('--clearScreen', `[boolean] allow/disable clear screen when logging`)
  .option(
    '--configLoader <loader>',
    `[string] use 'bundle' to bundle the config with esbuild, or 'runner' (experimental) to process it on the fly, or 'native' (experimental) to load using the native runtime (default: bundle)`,
  )
  .option('-d, --debug [feat]', `[string | boolean] show debug logs`)
  .option('-f, --filter <filter>', `[string] filter debug logs`)
  .option('-m, --mode <mode>', `[string] set env mode`);

cli
  .command('build [root]', 'build for production')
  .option('--target <target>', `[string] transpile target (default: 'modules')`)
  .option('--outDir <dir>', `[string] output directory (default: dist)`)
  .option('--assetsDir <dir>', `[string] directory for assets under outDir (default: assets)`)
  .option('--assetsInlineLimit <number>', `[number] base64 inline threshold in bytes (default: 4096)`)
  .option('--ssr [entry]', `[string] build for server-side rendering`)
  .option('--sourcemap [output]', `[boolean | "inline" | "hidden"] output source maps`)
  .option('--minify [minifier]', `[boolean | "terser" | "esbuild"] enable/disable minification`)
  .option('--manifest [name]', `[boolean | string] emit build manifest json`)
  .option('--ssrManifest [name]', `[boolean | string] emit SSR manifest json`)
  .option('--emptyOutDir', `[boolean] force empty outDir`)
  .option('-w, --watch', `[boolean] rebuild on file change`)
  .option('--app', `[boolean] shortcut for builder: {}`)
  .action(async (root: string, options: CLIBuildOptions) => {
    try {
      filterDuplicateOptions(options);
      const buildOptions: BuildEnvironmentOptions = cleanGlobalCLIOptions(cleanBuilderCLIOptions(options));

      await buildCommand(root, options, buildOptions);
    } catch (e: any) {
      const logger = createLogger(options.logLevel);
      logger.error(colors.red(`Error during build:\n${e.stack}`), {
        error: e,
      });
      process.exit(1);
    }
  });

cli
  .command('[root]', 'start dev server in standalone mode') // default command
  .alias('dev') // alias to align with the script name
  .option('--host [host]', `[string] specify hostname`, { type: [convertHost] })
  .option('--port <port>', `[number] specify port`)
  .option('--open [path]', `[boolean | string] open browser on startup`)
  .option('--cors', `[boolean] enable CORS`)
  .option('--https', `[boolean] enable HTTPS`)
  .option('--strictPort', `[boolean] exit if specified port is already in use`)
  .option('--force', `[boolean] force the optimizer to ignore the cache and re-bundle`)
  .action(async (root: string, options: CLIServeOptions) => {
    filterDuplicateOptions(options);
    try {
      await startDevServer(root, options, cleanGlobalCLIOptions(cleanServeCommandCLIOptions(options)));
    } catch (e: any) {
      const logger = createLogger(options.logLevel);
      logger.error(colors.red(`Error when starting dev server:\n${e.stack}`), {
        error: e,
      });
      process.exit(1);
    }
  });

cli
  .command('serve [root]', 'start preview server in integrated mode') // default command
  .option('--host [host]', `[string] specify hostname`, { type: [convertHost] })
  .option('--port <port>', `[number] specify port`)
  .option('--open [path]', `[boolean | string] open browser on startup`)
  .option('--cors', `[boolean] enable CORS`)
  .option('--https', `[boolean] enable HTTPS`)
  .option('--strictPort', `[boolean] exit if specified port is already in use`)
  .option('--force', `[boolean] force the optimizer to ignore the cache and re-bundle`)
  .action((root: string, options: CLIServeOptions) => {
    filterDuplicateOptions(options);
    try {
      const watch: CLIBuildOptions['watch'] = {
        include: ['**/*.{vue,html,js,ts,jsx,tsx,css,scss,sass,less,stylus,postcss,json,wasm,mjs,cjs,tsbuildinfo}'],
        exclude: ['node_modules/**', '.git/**', '.hg/**', '.svn/**'],
      };
      const buildOptions: CLIBuildOptions = { watch, sourcemap: false, clearScreen: true, mode: 'development' };
      const buildCommand = cli.commands.find((c) => c.name === 'build');
      buildCommand?.commandAction?.(root, buildOptions);

      eventBus.once('ready-to-preview', () => {
        const previewCommand = cli.commands.find((c) => c.name === 'preview');
        previewCommand?.commandAction?.(root, options);
      });
    } catch (e: any) {
      const logger = createLogger(options.logLevel);
      logger.error(colors.red(`Error when starting dev server:\n${e.stack}`), {
        error: e,
      });
      process.exit(1);
    }
  });

cli
  .command('preview [root]', 'locally preview production build')
  .option('--host [host]', `[string] specify hostname`, { type: [convertHost] })
  .option('--port <port>', `[number] specify port`)
  .option('--strictPort', `[boolean] exit if specified port is already in use`)
  .option('--open [path]', `[boolean | string] open browser on startup`)
  .option('--https', `[boolean] enable HTTPS`)
  .option('--outDir <dir>', `[string] output directory (default: dist)`)
  .action(async (root: string, options: CLIPreviewOptions) => {
    filterDuplicateOptions(options);
    try {
      await runPreviewServer(root, options);
    } catch (e: any) {
      createLogger(options.logLevel).error(colors.red(`Error when starting preview server:\n${e.stack}`), {
        error: e,
      });

      process.exit(1);
    }
  });

cli
  .command('e2e', 'run e2e tests')
  .option('--port <port>', `[number] specify port`, { default: 9090 })
  .option('--headless', `Run test on headless mode`)
  .action(async (options: CLITestOptions) => {
    const { spawn } = await import('child_process');

    const server = spawn(process.execPath, [process.argv[1], '--port', String(options.port)], { stdio: 'inherit' });

    console.log(`Waiting for server to start on http://localhost:${options.port}...`);
    await new Promise<void>((resolve) => {
      const checkServer = async () => {
        const { default: http } = await import('http');
        http
          .get(`http://localhost:${options.port}`, (res: any) => {
            if (res.statusCode === 200) {
              resolve();
            } else {
              setTimeout(checkServer, 1000);
            }
          })
          .on('error', () => {
            setTimeout(checkServer, 1000);
          });
      };
      checkServer();
    });

    console.log('Server is up. Running Cypress...');

    try {
      // Run Cypress tests
      const args = ['cypress', options.headless ? 'run' : 'open', '--e2e'];

      const cypress = spawn('npx', args, {
        stdio: 'inherit',
        shell: true, // You need this when using `npx`
      });

      await new Promise((resolve, reject) => {
        cypress.on('close', (code: number) => {
          if (code === 0) resolve(null);
          else reject(new Error(`Cypress exited with code ${code}`));
        });
      });
    } finally {
      // Cleanup
      server.kill();
    }
  });

cli.help();
cli.version(VERSION);

cli.parse();
