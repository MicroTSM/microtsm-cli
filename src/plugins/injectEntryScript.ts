import { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

function bootstrapScript() {
  navigator.serviceWorker
    .register('/module-transform.sw.js', { type: 'module' })
    .then(async (t) => {
      await navigator.serviceWorker.ready;

      // @ts-ignore
      const e = document.querySelector('script[type="microtsm-importmap"]'),
        r = e && e.textContent ? JSON.parse(e.textContent).imports : {};
      t.active &&
        t.active.postMessage({
          type: 'SET_IMPORT_MAP',
          importMap: r,
        }),
        // @ts-ignore
        import('https://entryjs.co').catch(console.error);
    })
    .catch((t) => console.error('SW registration failed', t));
}

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
      const inlineScript = `(${bootstrapScript.toString()})();`
        .trim()
        .replace('bootstrapScript', '')
        .replace('https://entryjs.co', entryOutFile)
        .replace(/\/\/ @ts-ignore/g, '')
        .replace(/\/\* @vite-ignore \*\//g, '');

      // Create the new inline script tag.
      const scriptTag = `<script type="module">\n${inlineScript}\n</script>`;

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
