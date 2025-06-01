import { Plugin } from 'vite';
import defineConfig from './defineConfig';
import fs from 'fs';
import path from 'path';

/**
 * Interface representing the structure of import maps configuration.
 */
export interface ImportMap {
  imports: Record<string, string>;
}

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
export interface MicroTSMRootAppBuildConfig {
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

/**
 * Defines a MicroTSM Root App build configuration alongside MicroTSM CLI.
 *
 * @param config - Root app build configuration object
 * @param config.outDir - Output directory for build artifacts (default: 'dist')
 * @param config.htmlEntry - Path to the main HTML entry file (default: 'index.html')
 * @param config.importMap - Import map configuration for JavaScript modules
 * @param config.cssImportMap - Import map configuration for CSS stylesheets
 * @returns Combined configuration object with generated MicroTSM CLI config
 */
export default function defineRootAppConfig(config: MicroTSMRootAppBuildConfig) {
  return defineConfig({
    build: {
      outDir: config.outDir ?? 'dist',
      rollupOptions: {
        input: config.htmlEntry ?? 'index.html',
      },
      minify: false,
    },
    plugins: [createImportMapPlugin(config, 'imports'), createImportMapPlugin(config, 'stylesheets')],
    publicDir: config.publicDir ?? 'public',
  });
}

/**
 * Creates a MicroTSM CLI plugin that handles import maps during the build process.
 * The plugin merges multiple import map files into a single consolidated file.
 *
 * @param config - MicroTSM root app build configuration
 * @param config.outDir - Output directory path (default: 'dist')
 * @param config.importMap - JavaScript import map configuration
 * @param config.cssImportMap - CSS import map configuration
 * @param type - Type of import map to process ('imports' or 'stylesheets')
 * @returns Vite plugin instance for import map processing
 * @throws {Error} If import map files cannot be read or merged
 */
function createImportMapPlugin(config: MicroTSMRootAppBuildConfig, type: 'imports' | 'stylesheets'): Plugin {
  let env: Record<string, any> = {};

  return {
    name: 'microtsm-importmap',
    configResolved(this, config) {
      env = config.env;
      env.PROD = config.env.mode === 'production';
      env.DEV = config.env.mode === 'development';
    },
    buildStart() {
      console.log(`\n[MicroTSM] Starting import map ${type} processing...`);
      const importMapDir = path.resolve(config.outDir ?? 'dist', 'importmaps');

      const importMapConfig = type === 'imports' ? config.importMap : config.cssImportMap;
      let importMaps: string[] = [];

      if (typeof importMapConfig === 'function') {
        const result = importMapConfig(env);
        importMaps = Array.isArray(result) ? result : [result];
      } else if (importMapConfig) {
        importMaps = Array.isArray(importMapConfig) ? importMapConfig : [importMapConfig];
      }

      if (importMaps) {
        console.log(`[MicroTSM] Processing ${importMaps.length} import map file(s)`);

        let mergedImportMap: ImportMap | string[] =
          type === 'imports'
            ? {
                imports: {},
              }
            : [];

        importMaps.forEach((filePath) => {
          console.log(`[MicroTSM] Reading import map from: ${filePath}`);
          const importMap: ImportMap | string[] = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }));

          if (Array.isArray(mergedImportMap)) {
            mergedImportMap = (Array.isArray(importMap) && mergedImportMap.concat(importMap)) || [];
          } else if ('imports' in importMap) {
            Object.assign(mergedImportMap.imports, importMap.imports);
          }
        });

        const destPath = path.join(importMapDir, `${type}.json`);
        console.log(`[MicroTSM] Writing merged import map to: ${path.relative(process.cwd(), destPath)}`);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, JSON.stringify(mergedImportMap), { encoding: 'utf-8' });
      }
    },
  };
}
