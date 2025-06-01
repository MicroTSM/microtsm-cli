import { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';
import { MicroTSMRootAppBuildConfig } from '../config/defineRootAppConfig';

/**
 * Creates a Vite plugin that injects the final entry script tag into the HTML entry file.
 *
 * This plugin does the following:
 * - Locates the HTML file in the build output (using config.htmlEntry, default "index.html").
 * - Removes any <script> tags whose src attribute points to a .ts file.
 * - Computes the output file (assumed to be located at `js/[basename].js` based on config.entryScript).
 * - Injects a new <script> tag of type is "module" and with `crossorigin` attribute before </body> or </head>.
 *
 * This plugin is set with `enforce: 'pre'` so it runs before the import map injection plugins.
 *
 * @returns A Vite plugin instance.
 */
function createInjectEntryScriptPlugin(htmlEntry = 'index.html', entryScript = 'src/main.ts', outDir = 'dist'): Plugin {
  return {
    name: 'microtsm:inject-entry-script-plugin',
    enforce: 'pre',
    writeBundle() {
      if (!fs.existsSync(htmlEntry)) {
        console.error(`[inject-entry-script-plugin] HTML entry not found: ${htmlEntry}`);
        return;
      }

      let htmlContent = fs.readFileSync(htmlEntry, 'utf-8');

      // Remove any <script> tags whose src ends with ".ts"
      htmlContent = htmlContent.replace(/<script\b[^>]*src="[^"]+\.ts"[^>]*><\/script>\s*/gi, '');

      /**
       * Compute the output file name for the entry script.
       * For example, if {@link MicroTSMRootAppBuildConfig.entryScript} is "src/main.ts", the result is "js/main.js".
       */
      const entryBaseName = path.basename(entryScript, path.extname(entryScript)); // e.g., "main"
      const entryOutFile = `js/${entryBaseName}.js`; // TODO: adjust this based on config output.entryFileNames

      // Create the new script tag.
      const scriptTag = `<script type="module" crossorigin src="./${entryOutFile}"></script>`;

      // Inject the new script tag before </body> if present, otherwise before </head>
      if (htmlContent.match(/<\/body>/i)) {
        htmlContent = htmlContent.replace(/<\/body>/i, `${scriptTag}\n</body>`);
      } else if (htmlContent.match(/<\/head>/i)) {
        htmlContent = htmlContent.replace(/<\/head>/i, `${scriptTag}\n</head>`);
      } else {
        // Fallback: append to the end if neither </body> nor </head> are found.
        htmlContent += scriptTag;
      }

      const htmlOutPath = path.join(outDir, htmlEntry);
      fs.writeFileSync(htmlOutPath, htmlContent, 'utf-8');
      console.log(`[inject-entry-script-plugin] Injected entry script: ${scriptTag} into ${htmlOutPath}`);
    },
  };
}

export default createInjectEntryScriptPlugin;
