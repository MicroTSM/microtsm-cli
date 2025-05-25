import path from 'path';

import { createBuilder, InlineConfig } from 'vite';
import { readFileSync } from 'fs';
import resolveConfig from '../utils/resolveConfig';
import { CLIBuildOptions } from '../types/cli';

export default async function buildCommand(root?: string, options: CLIBuildOptions = {}) {
  let config = await resolveConfig('build', options.mode);

  const inlineConfig: InlineConfig = {
    ...config,
    root,
    mode: options.mode,
    clearScreen: true,
    configFile: false, // To tell vite to not manually load the config file, because we already did it
  };

  const builder = await createBuilder(inlineConfig, true);
  await builder.buildApp();

  const manifestPath = (function getManifestPath() {
    if (typeof config.build?.manifest === 'string') {
      return config.build.manifest;
    }

    return config.build?.manifest === true ? '.vite/manifest.json' : undefined;
  })();

  if (manifestPath) {
    const manifestFullPath = path.resolve('dist', manifestPath);
    try {
      const manifest = JSON.parse(readFileSync(manifestFullPath, 'utf-8'));
      console.log('Built manifest:', manifest);
    } catch (error) {
      console.error(`Failed to read manifest at ${manifestFullPath}:`, error);
    }
  }

  //   generateIndexPage({});
}
