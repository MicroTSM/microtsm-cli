import { UserConfig } from 'vite';
import defineConfig from './defineConfig';
import createInjectImportMapPlugin from '../plugins/injectImportMap';
import createInjectEntryScriptPlugin from '../plugins/injectEntryScript';
import createInjectPolyfillPlugin from '../plugins/injectPolyfillPlugin';
import createInjectServiceWorker from '../plugins/injectServiceWorker';

/**
 * Defines dynamic import map configuration.
 *
 * Supported formats:
 * - Single file path as string
 * - Multiple file paths as string array
 * - Function taking an environment object and returning file path(s)
 *
 * @example
 * // Single path
 * importMap: './importmap.json'
 *
 * // Multiple paths
 * importMap: ['./dev.importmap.json', './prod.importmap.json']
 *
 * // Dynamic resolution
 * importMap: (env) => env.prod ? './prod.importmap.json': './dev.importmap.json'
 */
export type ImportMapConfig = string | string[] | ((env: Record<string, any>) => string | string[]);

/**
 * Build configuration for a MicroTSM root application.
 *
 * Provides build-time path resolution and asset management settings.
 */
export interface MicroTSMRootAppBuildConfig extends UserConfig {
  /**
   * Output directory for build artifacts.
   * @default 'dist'
   */
  outDir?: string;

  /**
   * Import map configuration for JavaScript modules.
   *
   * Files are merged into a single imports.json in <outDir>/importmaps.
   * Supports local file paths and environment-based dynamic resolution.
   *
   * Can also be referenced in the HTML entry file's head section using a <script type="importmap"> tag.
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap for more details.
   */
  importMap?: ImportMapConfig;

  /**
   * Import map configuration for CSS stylesheets.
   *
   * Follows the same behavior as {@link importMap}, generating a consolidated stylesheets.json.
   *
   * Cannot be referenced with <script type="importmap"> tag.
   * Instead, add a <link> tag in your HTML head section to reference the stylesheets.
   * This option simplifies conditionally setting stylesheet URLs at build time.
   */
  cssImportMap?: ImportMapConfig;

  /**
   * Entry point script for micro-frontend bootstrapping.
   * @default 'src/main.ts'
   */
  entryScript?: string;

  /**
   * Path to the main HTML entry file.
   * @default 'index.html'
   */
  htmlEntry?: string;

  /**
   * Directory for static assets that will be copied during build.
   *
   * Useful for favicons and other static resources.
   * Content is copied as-is and accessible via /public/ path.
   *
   * @example
   * // In index.html:
   * <link rel="icon" href="/favicons/favicon-32x32.ico">
   *
   * @default 'public'
   */
  publicDir?: string;
}

const ROOT_CONFIG_MARKER = Symbol.for('MicroTSM-CLI.defineRootAppConfig');

export function isDefinedRootAppConfig(config: UserConfig | undefined): boolean {
  return !!config && !!(config as any)[ROOT_CONFIG_MARKER];
}

/**
 * Defines a MicroTSM Root App build configuration alongside MicroTSM CLI.
 *
 * @param config - Root app build configuration object
 * @param config.outDir - Output directory for build artifacts (default: 'dist')
 * @param config.htmlEntry - Path to the main HTML entry file (default: 'index.html')
 * @param config.entryScript - Path to the main script entry file (default: 'src/main.ts')
 * @param config.importMap - Import map configuration for JavaScript modules
 * @param config.cssImportMap - Import map configuration for CSS stylesheets
 * @returns Combined configuration object with generated MicroTSM CLI config
 */
export default function defineRootAppConfig(config: MicroTSMRootAppBuildConfig) {
  const buildInput = config.build?.rollupOptions?.input;
  config.entryScript = config.entryScript ?? 'src/main.ts';
  config.htmlEntry = config.htmlEntry ?? 'index.html';
  config.outDir = config.outDir ?? 'dist';

  const definedConfig = defineConfig({
    build: {
      minify: false,
      ...config.build,
      outDir: config.outDir ?? 'dist',
      rollupOptions: {
        ...config.build?.rollupOptions,
        input:
          typeof buildInput === 'string'
            ? buildInput
            : Array.isArray(buildInput)
              ? [...buildInput, config.entryScript]
              : typeof buildInput === 'object'
                ? {
                    ...buildInput,
                    [config.entryScript]: config.entryScript,
                  }
                : config.entryScript,
        output: {
          entryFileNames: () => 'js/[name].js',
          chunkFileNames: 'js/[name]-[hash].js',
          ...config.build?.rollupOptions?.output,
        },
      },
    },
    plugins: [
      createInjectEntryScriptPlugin(config.htmlEntry, config.entryScript, config.outDir),
      createInjectPolyfillPlugin(config.htmlEntry, config.outDir),
      createInjectImportMapPlugin(config, 'imports'),
      createInjectImportMapPlugin(config, 'stylesheets'),
      createInjectServiceWorker(config.htmlEntry, config.outDir),
    ],
    publicDir: config.publicDir ?? 'public',
  });

  // To mark the config as being generated by this function
  Object.defineProperty(definedConfig, ROOT_CONFIG_MARKER, { value: true });

  return definedConfig;
}
