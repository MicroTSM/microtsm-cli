import fs from 'fs';
import ejs from 'ejs';
import path from 'path';

export async function generateIndexPage(config: { entryFilePath: string }) {
  const templatePath = path.resolve('templates/index.template.ejs');

  const outputPath = path.resolve('dist/index.html');

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const html = await ejs.renderFile(templatePath, {
    entryPath: config.entryFilePath,
    packageName: process.env.__APP_NAME__,
  });

  fs.writeFileSync(outputPath, html);
}
