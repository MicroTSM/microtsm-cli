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
 *
 * It also adds polyfill for importmap from es-module-shims. It's required since this framework relies on importmap.
 */
export default function createInjectPolyfillPlugin(htmlFileName: string, outDir: string): Plugin {
  const polyfillUrl = 'https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?version=4.8.0';
  const esShimsPolyfill = 'https://ga.jspm.io/npm:es-module-shims@2.6.0/dist/es-module-shims.js';
  const PLUGIN_NAME = 'microtsm-plugin:inject-polyfill';

  const insertPolyfillBeforeAnyScriptEl = (htmlContent: string, url: string) => {
    const polyfillTag = `<script async src="${url}"></script>`;

    if (htmlContent.includes('<head>') && htmlContent.includes('</head>')) {
      const headEndIndex = htmlContent.indexOf('</head>');
      const firstScriptInHeadIndex = htmlContent.substring(0, headEndIndex).indexOf('<script');

      if (firstScriptInHeadIndex !== -1) {
        // ✅ Insert before the first <script> tag in <head>
        return htmlContent.slice(0, firstScriptInHeadIndex) + polyfillTag + '\n' + htmlContent.slice(firstScriptInHeadIndex);
      }

      if (headEndIndex !== -1) {
        // ✅ No script in <head>, insert at the end of <head>
        return htmlContent.replace('</head>', `${polyfillTag}\n</head>`);
      }
    }

    // ✅ If <head> does not exist, wrap the script in <head> and insert after <html> opening tag
    return htmlContent.replace(/<html[^>]*>/i, (match) => `${match}\n<head>\n${polyfillTag}\n</head>`);
  };

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

      htmlContent = insertPolyfillBeforeAnyScriptEl(htmlContent, esShimsPolyfill);
      htmlContent = insertPolyfillBeforeAnyScriptEl(htmlContent, polyfillUrl); // Insert polyfill before es-module-shims

      fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
      console.log(`[${PLUGIN_NAME}] Polyfill script injected in ${htmlPath}`);
    },
  };
}
