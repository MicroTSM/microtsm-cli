#!/usr/bin/env node
import { cac } from 'cac';
import buildCommand from '../src/commands/build';
import { CLIBuildOptions } from '../src/types/cli';

const cli = cac('single-spa-vite-cli-service');

/**
 * base may be a number (like 0), should convert to empty string
 */
const convertBase = (v: any) => {
  if (v === 0) {
    return '';
  }
  return v;
};

cli
  .option('-c, --config <file>', `[string] use specified config file`)
  .option('--base <path>', `[string] public base path (default: /)`, {
    type: [convertBase],
  })
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
    await buildCommand(root, options);
  });

// cli
//     .command("dev", "Start development server")
//     .action(async () => {
//         const config = await getUserConfig("serve", "development");
//         await devCommand(config);
//     });
//
// cli
//     .command("serve:https", "Start dev server with HTTPS")
//     .action(async () => {
//         const config = await getUserConfig("serve", "https");
//         await serveHttpsCommand(config);
//     });

cli.help();
cli.parse();
