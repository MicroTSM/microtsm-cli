#!/usr/bin/env node
import { cac } from 'cac';
import { BuildEnvironmentOptions } from 'vite';
import {
  BuilderCLIOptions,
  CLIBuildOptions,
  CLIServeOptions,
  GlobalCLIOptions,
  ServeCommandCLIOptions,
} from '../src/types/cli';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import buildCommand from '../src/commands/build';
import serveCommand from '../src/commands/serve';

const { version: VERSION } = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));

const cli = cac('microtsm-cli');

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
 * removing global flags before passing as command specific sub-configs
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
 * removing builder flags before passing as command specific sub-configs
 */
function cleanBuilderCLIOptions<Options extends BuilderCLIOptions>(
  options: Options,
): Omit<Options, keyof BuilderCLIOptions> {
  const ret = { ...options };
  delete ret.app;
  return ret;
}

/**
 * removing serve command flags before passing as command specific sub-configs
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
    filterDuplicateOptions(options);
    const buildOptions: BuildEnvironmentOptions = cleanGlobalCLIOptions(cleanBuilderCLIOptions(options));

    await buildCommand(root, options, buildOptions);
  });

cli
  .command('[root]', 'start dev server') // default command
  .alias('serve') // the command is called 'serve' in Vite's API
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
    await serveCommand(root, options, cleanGlobalCLIOptions(cleanServeCommandCLIOptions(options)));
  });

cli.help();
cli.version(VERSION);

cli.parse();
