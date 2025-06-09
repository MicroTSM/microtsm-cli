import { Plugin } from 'vite';
import fs from 'fs';
import path, { dirname } from 'path';
import { insertScriptBefore } from './injectPolyfillPlugin';
import { findUpSync } from 'find-up';
import { fileURLToPath } from 'url';

const SW_FILE_NAME = './module-transform.sw.js';
const SET_IMPORT_MAP_SCRIPT =
  'navigator.serviceWorker?.ready.then((t=>{const e=document.querySelector(\'script[type="microtsm-importmap"]\'),r=e?.textContent?JSON.parse(e?.textContent):{imports:{}};t.active&&t.active.postMessage({type:"SET_IMPORT_MAP",importMap:r.imports})}));';
const SERVICE_WORKER_SCRIPT = `navigator.serviceWorker.register("${SW_FILE_NAME}",{type:"module"});${SET_IMPORT_MAP_SCRIPT}`;
const SW_SOURCE_DIR = './workers';

function createInjectServiceWorker(htmlEntry = 'index.html', outDir = 'dist', _ = 'src/main.ts'): Plugin {
  return {
    name: 'service-worker-inject',
    enforce: 'pre',
    apply: 'build',
    writeBundle() {
      const htmlOutPath = path.resolve(outDir, htmlEntry);
      if (!fs.existsSync(htmlOutPath)) {
        console.error(`[service-worker-inject] HTML entry not found: ${htmlEntry}`);
        return;
      }

      let htmlContent = fs.readFileSync(htmlOutPath, 'utf-8');

      htmlContent = insertScriptBefore(htmlContent, `<script type="module">${SERVICE_WORKER_SCRIPT}</script>`);

      fs.writeFileSync(htmlOutPath, htmlContent, 'utf-8');

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
