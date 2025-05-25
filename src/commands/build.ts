import path from 'path';

import resolveConfig from '../utils/resolveConfig';
import { createBuilder, InlineConfig } from 'vite';
import { readFileSync } from 'fs';
import { CLIBuildOptions } from '../types/cli';
import { generateIndexPage } from '../utils/generateGuide';

interface ManifestEntry {
  file: string;
  name: string;
  src: string;
  isEntry: boolean;
  css?: string[];
}

type Manifest = Record<string, ManifestEntry>;

function getEntryFilePath(config: InlineConfig) {
  let entryFilePath = '/js/app.js';

  const manifestPath = (function getManifestPath() {
    if (typeof config.build?.manifest === 'string') {
      return config.build.manifest;
    }

    return config.build?.manifest === true ? '.vite/manifest.json' : undefined;
  })();

  if (manifestPath) {
    const manifestFullPath = path.resolve('dist', manifestPath);
    try {
      const manifest: Manifest = JSON.parse(readFileSync(manifestFullPath, 'utf-8'));

      entryFilePath = Object.values(manifest).find((value) => value.isEntry)?.file || entryFilePath;
    } catch (error) {
      console.error(`Failed to read manifest at ${manifestFullPath}:`, error);
    }
  }

  return entryFilePath;
}

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
  await generateIndexPage({ entryFilePath: getEntryFilePath(config) });
}
