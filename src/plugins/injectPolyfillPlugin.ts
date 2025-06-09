import { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

export const insertScriptBefore = (htmlContent: string, code: string) => {
  if (htmlContent.includes('<head>') && htmlContent.includes('</head>')) {
    const headEndIndex = htmlContent.indexOf('</head>');
    const firstScriptInHeadIndex = htmlContent.substring(0, headEndIndex).indexOf('<script');

    if (firstScriptInHeadIndex !== -1) {
      // ✅ Insert before the first <script> tag in <head>
      return htmlContent.slice(0, firstScriptInHeadIndex) + code + '\n' + htmlContent.slice(firstScriptInHeadIndex);
    }

    if (headEndIndex !== -1) {
      // ✅ No script in <head>, insert at the end of <head>
      return htmlContent.replace('</head>', `${code}\n</head>`);
    }
  }

  // ✅ If <head> does not exist, wrap the script in <head> and insert after <html> opening tag
  return htmlContent.replace(/<html[^>]*>/i, (match) => `${match}\n<head>\n${code}\n</head>`);
};

/**
 * Creates a Vite plugin that injects a polyfill script into the built HTML file.
 *
 * @description
 * This plugin automatically adds a polyfill script from cdnjs.cloudflare.com
 * into the HTML file during build. The script detects required polyfills
 * based on the browser's user agent string.
 */
export default function createInjectPolyfillPlugin(htmlFileName: string, outDir: string): Plugin {
  const polyfillUrl = import.meta.env.CLOUDFLARE_POLYFILL_URL;
  const importMapPolyfill = import.meta.env.MODULE_LOADER_URL;
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

      const getTag = (url: string, type?: string) => {
        return `<script defer src="${url}" ${type ? `type="${type}"` : ''}></script>`;
      };

      htmlContent = insertScriptBefore(htmlContent, getTag(importMapPolyfill, 'module'));
      htmlContent = insertScriptBefore(htmlContent, getTag(polyfillUrl)); // Insert polyfill before importmap polyfill

      fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
      console.log(`[${PLUGIN_NAME}] Polyfill script injected in ${htmlPath}`);
    },
  };
}
