import { InlineConfig, Manifest } from 'vite';
import path from 'path';
import fs from 'fs';

function getManifestPath(config: InlineConfig) {
  if (typeof config.build?.manifest === 'string') {
    return config.build.manifest;
  }

  return config.build?.manifest === true ? '.vite/manifest.json' : undefined;
}

export function readManifest(
  config: InlineConfig,
  manifestPath: string | undefined = getManifestPath(config),
): Manifest | undefined {
  if (manifestPath) {
    const manifestFullPath = path.resolve(config.build?.outDir ?? 'dist', manifestPath);
    try {
      return JSON.parse(fs.readFileSync(manifestFullPath, 'utf-8')) as Manifest;
    } catch (error) {
      console.error(`Failed to read manifest at ${manifestFullPath}:`, error);
    }
  }
}

export default function getEntryFilePath(config: InlineConfig) {
  let entryFilePath = '/js/app.js';

  const manifest = readManifest(config);

  entryFilePath = (manifest && Object.values(manifest).find((value) => value.isEntry)?.file) || entryFilePath;

  return entryFilePath;
}
