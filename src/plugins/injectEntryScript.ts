import { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

import { registerServiceWorker } from '../workers/register-sw';

/**
 * Creates a Vite plugin that injects an inline bootstrap script into the HTML entry file.
 *
 * This plugin does the following:
 * - Locates the HTML file in the build output (using config.htmlEntry, default "index.html").
 * - Removes any <script> tags whose src attribute points to a .ts file.
 * - Computes the output file name for the entry script (assumed to be located at `js/[basename].js`
 *   based on config.entryScript).
 * - Injects a new inline <script> tag of type "module" (with `crossorigin` attribute),
 *   which registers the service worker and waits until it controls the page before
 *   dynamically importing the main entry module.
 *
 * This plugin is set with `enforce: 'pre'` so it runs before the import map injection plugins.
 *
 * @returns A Vite plugin instance.
 */
function createInjectEntryScriptPlugin(htmlEntry = 'index.html', entryScript = 'src/main.ts', outDir = 'dist'): Plugin {
  const PLUGIN_NAME = 'microtsm-plugin:inject-entry-script';
  return {
    name: PLUGIN_NAME,
    enforce: 'pre', // Ensure this plugin runs before the import map injection plugins.
    writeBundle() {
      if (!fs.existsSync(htmlEntry)) {
        console.error(`[${PLUGIN_NAME}] HTML entry not found: ${htmlEntry}`);
        return;
      }

      let htmlContent = fs.readFileSync(htmlEntry, 'utf-8');

      // Remove any <script> tags whose src ends with ".ts"
      htmlContent = htmlContent.replace(/<script\b[^>]*src="[^"]+\.ts"[^>]*><\/script>\s*/gi, '');

      // Compute the output file name for the entry script.
      // In your build, if MicroTSMRootAppBuildConfig.entryScript is "src/main.ts",
      // the result is expected to be "js/main.js"
      const entryBaseName = path.basename(entryScript, path.extname(entryScript)); // e.g., "main"
      // This is used in the dynamic import below.
      const entryOutFile = `/js/${entryBaseName}.js`;

      // Define the inline bootstrap code.
      // It registers the SW, waits until a controller is available (force reload if necessary),
      // posts the import map from the <script type="microtsm-importmap"> tag,
      // then dynamically imports the entry script.
      const registerScript = `(${registerServiceWorker.toString()})();`
        .trim()
        .replace('bootstrapScript', '')
        .replace('https://entryjs.co', entryOutFile)
        .replace(/\/\/ @ts-ignore/g, '')
        .replace(/\/\* @vite-ignore \*\//g, '');

      const registerScriptFileName = 'register-sw.js';
      const scriptOutPath = path.join(outDir, registerScriptFileName);
      fs.mkdirSync(path.dirname(scriptOutPath), { recursive: true });
      fs.writeFileSync(scriptOutPath, registerScript, { encoding: 'utf-8' });

      // Create the new inline script tag.
      const scriptTag = `<script type="module" src="/${registerScriptFileName}"></script>`;

      // Inject the new inline script tag before "</head>" if it exists,
      // otherwise create a <head> section at the beginning.
      if (htmlContent.match(/<\/head>/i)) {
        htmlContent = htmlContent.replace(/<\/head>/i, `${scriptTag}\n</head>`);
      } else {
        htmlContent = `<head>\n${scriptTag}\n</head>\n${htmlContent}`;
      }

      const htmlOutPath = path.join(outDir, htmlEntry);
      fs.writeFileSync(htmlOutPath, htmlContent, 'utf-8');
      console.log(`[${PLUGIN_NAME}] Injected entry script: into ${htmlOutPath}`);
    },
  };
}

export default createInjectEntryScriptPlugin;
