import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

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
