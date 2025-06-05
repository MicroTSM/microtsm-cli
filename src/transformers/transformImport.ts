import { Plugin } from 'vite';

/**
 * MicroTSM Vite Plugin (External Modules Only – Post-Bundle Transformation)
 *
 * This plugin runs in the final bundle phase (enforce: 'post') and only targets
 * external modules (for example, modules whose id do not start with '.' or '/').
 *
 * It processes:
 *  - Dynamic import() calls: rewriting them to use MicroTSM.load().
 *  - Static external imports: Removing them from the bundle and wrapping the remainder
 *    of the code in a Promise.all() block that dynamically loads these modules via
 *    MicroTSM.load().
 *
 * This ensures internal modules (bundled by Vite) are left intact while external ones
 * are dynamically resolved. Adjust the external test as necessary for your project.
 *
 */
export default function TransformImport(): Plugin {
  // A simple test for external modules:
  // Return true if the moduleSource does NOT start with "." or "/".
  const isExternalModule = (moduleSource: string) => !moduleSource.startsWith('.') && !moduleSource.startsWith('/');

  return {
    name: 'microtsm:transform-import',
    enforce: 'post',

    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        if (chunk.type !== 'chunk') continue;
        let code = chunk.code;

        // --- Step 1: Rewrite dynamic imports.
        // Any occurrence of import(...) will be replaced.
        code = code.replace(/\bimport\(([^)]+)\)/g, 'MicroTSM.load($1)');

        // --- Step 2: Collect external static import statements.
        // This regex handles common cases like:
        //   import { a, b as c } from 'mod';
        //   import d from 'mod';
        //   import * as ns from 'mod';
        const importRegex = /import\s+(.+?)\s+from\s+['"]([^'"]+)['"];?/g;
        let match: RegExpExecArray | null;
        const externalImports: Array<{ clause: string; moduleSource: string }> = [];

        while ((match = importRegex.exec(code)) !== null) {
          const clause = match[1].trim();
          const moduleSource = match[2];
          if (isExternalModule(moduleSource)) {
            externalImports.push({ clause, moduleSource });
          }
        }

        // Remove only external import statements from the code.
        code = code.replace(importRegex, (match, _, moduleSource) => {
          if (isExternalModule(moduleSource)) return '';
          return match; // leave others intact
        });

        // --- Step 3: If any external imports were found, wrap the remaining code.
        if (externalImports.length > 0) {
          // Build an array of MicroTSM.load() calls for these external modules.
          const promiseCalls = externalImports.map((imp) => `MicroTSM.load("${imp.moduleSource}")`).join(',\n  ');

          // Build assignment statements from the import clause.
          // For named imports (starting with "{"), we assign directly.
          // For namespace imports (e.g., "* as ns"), we assign the entire module.
          // Otherwise, assume it's a default import (assign module.default).
          const assignments = externalImports
            .map((imp, index) => {
              if (imp.clause.startsWith('{')) {
                // e.g. import { a, b } from 'mod'
                return `const ${imp.clause} = modules[${index}];`;
              } else if (/^\*\s+as\s+/.test(imp.clause)) {
                // e.g. import * as ns from 'mod'
                // Split by whitespace and pick the alias.
                const parts = imp.clause.split(/\s+/);
                const alias = parts[2];
                return `const ${alias} = modules[${index}];`;
              } else {
                // default import: import d from 'mod'
                return `const ${imp.clause} = modules[${index}].default;`;
              }
            })
            .join('\n');

          // Wrap the remainder of the code inside a Promise.all().then(...).
          const prefix = `Promise.all([${promiseCalls}]).then((modules) => {` + assignments;
          const suffix = '});';
          code = prefix + code + suffix;
        }

        // Write out the transformed code.
        chunk.code = code;
      }
    },
  };
}
