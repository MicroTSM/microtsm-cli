import { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

/**
 * Creates a Vite plugin that injects a polyfill script into the built HTML file.
 *
 * @description
 * This plugin automatically adds a polyfill script from cdnjs.cloudflare.com
 * into the HTML file during build. The script detects required polyfills
 * based on the browser's user agent string.
 */
export default function createInjectPolyfillPlugin(htmlFileName: string, outDir: string): Plugin {
  const polyfillUrl = 'https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?version=4.8.0';
  const polyfillTag = `<script async src="${polyfillUrl}"></script>`;
  const PLUGIN_NAME = 'microtsm-plugin:inject-polyfill';

  return {
    name: PLUGIN_NAME,
    apply: 'build',
    enforce: 'pre',
    writeBundle() {
      const htmlPath = path.resolve(outDir, htmlFileName);

      if (!fs.existsSync(htmlPath)) {
        console.error(`[${PLUGIN_NAME}] Could not find HTML file at ${htmlPath}.`);
        return;
      }

      let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

      // Look for the first script tag
      const firstScriptIndex = htmlContent.indexOf('<script');

      if (firstScriptIndex !== -1) {
        // Insert polyfill before the first script tag
        htmlContent = htmlContent.slice(0, firstScriptIndex) + polyfillTag + '\n' + htmlContent.slice(firstScriptIndex);
      } else if (htmlContent.includes('</head>')) {
        // If no script tag found, inject before closing head
        htmlContent = htmlContent.replace(/<\/head>/i, `${polyfillTag}\n</head>`);
      } else {
        // If no script or head tag, prepend to file
        htmlContent = polyfillTag + '\n' + htmlContent;
      }

      fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
      console.log(`[${PLUGIN_NAME}] Polyfill script injected in ${htmlPath}`);
    },
  };
}
