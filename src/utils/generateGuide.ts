import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InlineConfig, Manifest } from 'vite';

const getTemplatePath = (fileName: string) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../templates/' + fileName);
};

export async function generateIndexPage(config: { entryFilePath: string }) {
  const outputPath = path.resolve('dist/index.html');

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const html = await ejs.renderFile(getTemplatePath('index.ejs'), {
    entryPath: config.entryFilePath,
    packageName: process.env.__APP_NAME__,
  });

  fs.writeFileSync(outputPath, html);
}

export function getEntryFilePath(config: InlineConfig) {
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
      const manifest: Manifest = JSON.parse(fs.readFileSync(manifestFullPath, 'utf-8'));

      entryFilePath = Object.values(manifest).find((value) => value.isEntry)?.file || entryFilePath;
    } catch (error) {
      console.error(`Failed to read manifest at ${manifestFullPath}:`, error);
    }
  }

  return entryFilePath;
}
