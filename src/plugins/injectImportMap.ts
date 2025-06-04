import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { MicroTSMRootAppBuildConfig } from '../config/defineRootAppConfig';

/**
 * Interface representing the structure of import maps configuration.
 */
export interface ImportMap {
  imports: Record<string, string>;
}

/**
 * Creates a MicroTSM CLI plugin that handles import maps during the build process.
 * For type "imports", the plugin merges multiple import map files and injects the inline
 * import map into the HTML entry file specified in config (defaults to index.html).
 *
 * For type "stylesheets", the plugin writes the merged import map to a separate JSON file.
 *
 * @param config - MicroTSM root app build configuration.
 * @param type - Type of import map to process ('imports' or 'stylesheets').
 * @returns Vite plugin instance for import map processing.
 */
function createInjectImportMapPlugin(config: MicroTSMRootAppBuildConfig, type: 'imports' | 'stylesheets'): Plugin {
  let env: Record<string, any> = {};
  const PLUGIN_NAME = 'microtsm-plugin:inject-import-map';

  return {
    name: PLUGIN_NAME,

    configResolved(resolvedConfig) {
      env = resolvedConfig.env;
      env.PROD = resolvedConfig.env.MODE === 'production';
      env.DEV = resolvedConfig.env.MODE === 'development';
    },

    writeBundle() {
      const importMapDir = path.resolve(config.outDir ?? 'dist', 'importmaps');
      const importMapConfig = type === 'imports' ? config.importMap : config.cssImportMap;
      let importMaps: string[] = [];

      if (typeof importMapConfig === 'function') {
        const result = importMapConfig(env);
        importMaps = Array.isArray(result) ? result : [result];
      } else if (importMapConfig) {
        importMaps = Array.isArray(importMapConfig) ? importMapConfig : [importMapConfig];
      }

      if (importMaps && importMaps.length > 0) {
        // For "imports", our merged structure starts as an object with an `imports` property.
        // For "stylesheets", it would be an array.
        let mergedImportMap: ImportMap | string[] = type === 'imports' ? { imports: {} } : [];

        importMaps.forEach((filePath) => {
          const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
          const importMap: ImportMap | string[] = JSON.parse(content);

          if (Array.isArray(mergedImportMap)) {
            mergedImportMap = (Array.isArray(importMap) && mergedImportMap.concat(importMap)) || [];
          } else if ('imports' in importMap) {
            Object.assign(mergedImportMap.imports, importMap.imports);
          }
        });

        if (type === 'imports') {
          // Instead of writing to a file, inject the merged import map directly into the HTML entry.
          const htmlEntry = config.htmlEntry ?? 'index.html';
          const outputHtmlPath = path.join(config.outDir ?? 'dist', htmlEntry);

          if (fs.existsSync(outputHtmlPath)) {
            let htmlContent = fs.readFileSync(outputHtmlPath, 'utf-8');
            const importMapScript = `<script type="microtsm-importmap">\n${JSON.stringify(mergedImportMap, null, 2)}\n</script>\n`;
            // Insert the import map inline before the closing </head> tag.
            htmlContent = htmlContent.replace(/<\/head>/i, importMapScript + '</head>');
            fs.writeFileSync(outputHtmlPath, htmlContent, { encoding: 'utf-8' });
            console.log(`[${PLUGIN_NAME}] Inserted inline import map into ${htmlEntry}`);
          } else {
            console.error(`[${PLUGIN_NAME}] HTML entry not found at ${outputHtmlPath}`);
          }
        } else {
          // For "stylesheets", write the merged map as a separate JSON file.
          const destPath = path.join(importMapDir, `${type}.json`);
          console.log(`[${PLUGIN_NAME}] Writing merged import map to: ${path.relative(process.cwd(), destPath)}`);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, JSON.stringify(mergedImportMap), { encoding: 'utf-8' });
        }
      }
    },
  };
}

export default createInjectImportMapPlugin;
