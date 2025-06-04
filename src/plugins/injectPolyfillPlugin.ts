import { Plugin } from 'vite';

/**
 * Creates a Vite plugin that injects a polyfill script into the built HTML file.
 *
 * @description
 * This plugin automatically adds a polyfill script from cdnjs.cloudflare.com
 * into the HTML file during build. The script detects required polyfills
 * based on the browser's user agent string.
 *
 * @param {string} [htmlEntry='index.html'] - The name of the HTML entry file to inject the polyfill into
 * @internal {@link MicroTSMRootAppBuildConfig.htmlEntry}
 */
export default function createInjectPolyfillPlugin(htmlEntry: string = 'index.html'): Plugin {
  return {
    name: 'vite-plugin-inject-polyfill',
    enforce: 'post',
    apply: 'build', // Only run during build
    generateBundle(_, bundle) {
      const htmlFile = bundle[htmlEntry] || bundle['index.html'];
      if (htmlFile && htmlFile.type === 'asset') {
        const htmlContent =
          typeof htmlFile.source === 'string' ? htmlFile.source : new TextDecoder().decode(htmlFile.source); // Convert Uint8Array to string

        // Inject the polyfill script before closing </head>
        htmlFile.source = htmlContent.replace(
          '</head>',
          `<script async src="https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?version=4.8.0"></script>\n</head>`,
        );
      }
    },
  };
}
