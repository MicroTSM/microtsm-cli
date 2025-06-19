const urlCache = new Map<string, string>();

/**
 * Rewrites all import statements in a JS/TS module source:
 *
 * - Rewrites static and side-effect imports using provided `importMap`:
 *   • exact specifier match → replace
 *   • prefix match (e.g., 'pkg/') → resolve with HEAD against multiple extensions
 * - Rewrites dynamic imports to `MicroTSM.load(...)`
 *
 * Note: This function is async because it resolves prefix-based imports via HEAD requests.
 *
 * @param code      The JavaScript/TypeScript module source as a string
 * @param importMap Import map with exact and prefix (ending in `/`) mappings
 * @returns         Transformed code with updated import URLs
 */
export async function transformImports(code: string, importMap: Record<string, string> = {}): Promise<string> {
  const isBare = (s: string) => !s.startsWith('.') && !s.startsWith('/') && !s.startsWith('..');

  /** Resolve a bare import specifier to a full URL */
  const resolveUrl = async (specifier: string): Promise<string | undefined> => {
    if (urlCache.has(specifier)) {
      return urlCache.get(specifier);
    }

    // Exact match
    if (importMap[specifier]) return importMap[specifier];

    // Prefix match with extension resolution
    const prefixes = Object.keys(importMap)
      .filter((k) => k.endsWith('/') && specifier.startsWith(k))
      .sort((a, b) => b.length - a.length);

    if (prefixes.length) {
      const prefix = prefixes[0];
      const base = importMap[prefix];
      const rest = specifier.slice(prefix.length);

      const candidates = [
        `${rest}.js`,
        `${rest}.mjs`,
        `${rest}.es.js`,
        `${rest}.esm.js`,
        `${rest}/index.js`,
        `${rest}/index.mjs`,
        `${rest}/index.es.js`,
        `${rest}/index.esm.js`,
      ];

      for (const path of candidates) {
        const full = base + path;
        try {
          const res = await fetch(full, { method: 'HEAD' });
          if (res.ok) {
            urlCache.set(specifier, full); // ✅ cache hit
            return full;
          }
        } catch {
          // Ignore errors and try next
        }
      }
    }

    return undefined;
  };

  // Transform static import statements
  const staticRE = /import\s*([A-Za-z0-9_$\s{},*\n\r-]+?)\s*from\s*(['"])([^'"]+)\2\s*;?/g;
  const staticMatches = [...code.matchAll(staticRE)];

  for (const match of staticMatches) {
    const fullMatch = match[0];
    const clause = match[1];
    const quote = match[2];
    const src = match[3];

    if (isBare(src)) {
      const url = await resolveUrl(src);
      if (url) {
        const replacement = `import ${clause.trim()} from ${quote}${url}${quote};`;
        code = code.replace(fullMatch, replacement);
      }
    }
  }

  // Transform side-effect imports
  const sideEffectRE = /import\s*(['"])([^'"]+)\1\s*;?/g;
  const sideEffectMatches = [...code.matchAll(sideEffectRE)];

  for (const match of sideEffectMatches) {
    const fullMatch = match[0];
    const quote = match[1];
    const src = match[2];

    if (isBare(src)) {
      const url = await resolveUrl(src);
      if (url) {
        const replacement = `import ${quote}${url}${quote};`;
        code = code.replace(fullMatch, replacement);
      }
    }
  }

  // Transform dynamic imports → MicroTSM.load(...)
  const dynamicRE = /\bimport\s*\(\s*([^)]*?)\s*\)/g;
  code = code.replace(dynamicRE, (_m, expr: string) => {
    return `MicroTSM.load(${expr}, import.meta.url)`;
  });

  return code;
}
