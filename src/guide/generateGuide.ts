import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const getTemplatePath = (fileName: string) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const paths = [
    path.resolve(__dirname, '../../static/templates/' + fileName), // Dev
    path.resolve(__dirname, '../templates/' + fileName), // Prod (relative to dist/bin)
    path.resolve(__dirname, '../../templates/' + fileName), // Prod (relative to dist/chunks)
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }

  return paths[1];
};

export async function generateIndexPage(config: { entryFilePath: string; outDir?: string }) {
  const outputPath = path.resolve(`${config.outDir}/index.html`);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const html = await ejs.renderFile(getTemplatePath('index.ejs'), {
    entryPath: config.entryFilePath,
    packageName: process.env.__APP_NAME__,
  });

  fs.writeFileSync(outputPath, html);
}
