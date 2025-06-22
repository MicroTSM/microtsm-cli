import { InlineConfig, Manifest } from 'vite';
import path from 'path';
import fs from 'fs';

export default function getEntryFilePath(config: InlineConfig) {
  let entryFilePath = '/js/app.js';

  const manifestPath = (function getManifestPath() {
    if (typeof config.build?.manifest === 'string') {
      return config.build.manifest;
    }

    return config.build?.manifest === true ? '.vite/manifest.json' : undefined;
  })();

  if (manifestPath) {
    const manifestFullPath = path.resolve(config.build?.outDir ?? 'dist', manifestPath);
    try {
      const manifest: Manifest = JSON.parse(fs.readFileSync(manifestFullPath, 'utf-8'));

      entryFilePath = Object.values(manifest).find((value) => value.isEntry)?.file || entryFilePath;
    } catch (error) {
      console.error(`Failed to read manifest at ${manifestFullPath}:`, error);
    }
  }

  return entryFilePath;
}
