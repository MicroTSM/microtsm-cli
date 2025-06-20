import { Plugin } from 'vite';
import fs from 'fs';
import path, { dirname } from 'path';
import { findUpSync } from 'find-up';
import { fileURLToPath } from 'url';

const SW_FILE_NAME = './module-transform.sw.js';
const SW_SOURCE_DIR = './workers';

function createInjectServiceWorker(outDir = 'dist'): Plugin {
  return {
    name: 'service-worker-inject',
    enforce: 'pre',
    apply: 'build',
    writeBundle() {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const packageDistPath = findUpSync('dist', {
        cwd: __dirname,
        type: 'directory',
      });

      const swSourcePath = path.resolve(packageDistPath!, SW_SOURCE_DIR, SW_FILE_NAME);
      const swDestPath = path.resolve(outDir, SW_FILE_NAME);

      if (fs.existsSync(swSourcePath)) {
        const swContent = fs.readFileSync(swSourcePath, 'utf-8');
        const modifiedContent = swContent.replace(/from\s+["']\.\.\/chunks\/(.*?)\.js["']/g, 'from "./$1.js"');
        fs.writeFileSync(swDestPath, modifiedContent, 'utf-8');

        // Copy imported files
        const importMatches = swContent.match(/from\s+["']\.\.\/chunks\/(.*?)\.js["']/g) || [];
        for (const match of importMatches) {
          const fileName = match.match(/\/chunks\/(.*?)\.js/)?.[1];
          if (fileName) {
            const sourceFile = path.resolve(packageDistPath!, 'chunks', `${fileName}.js`);
            const destFile = path.resolve(outDir, `${fileName}.js`);
            if (fs.existsSync(sourceFile)) {
              fs.copyFileSync(sourceFile, destFile);
            }
          }
        }
      } else {
        console.error(`[service-worker-inject] Service worker source not found: ${SW_FILE_NAME}`);
      }
    },
  };
}

export default createInjectServiceWorker;
