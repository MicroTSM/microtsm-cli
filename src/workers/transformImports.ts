export function transformImports(code: string, importMap: Record<string, string> = {}): string {
  const isExternalModule = (moduleSource: string): boolean =>
    !(moduleSource.startsWith('.') || moduleSource.startsWith('/') || moduleSource.startsWith('..'));

  const clauseRegex = /import\s*([A-Za-z0-9_$\s{},\-*]+?)(?=\s*from\b)\s*from\s*(['"])([^'"]+)\2\s*;?/g;

  code = code.replace(clauseRegex, (match, clause: string, quote: string, moduleSource: string) => {
    if (isExternalModule(moduleSource) && importMap && importMap[moduleSource]) {
      const absoluteUrl = importMap[moduleSource];
      return `import ${clause.trim()} from ${quote}${absoluteUrl}${quote};`;
    }
    return match;
  });

  const sideEffectRegex = /import\s*(['"])([^'"]+)\1\s*;?/g;
  code = code.replace(sideEffectRegex, (match, quote: string, moduleSource: string) => {
    if (isExternalModule(moduleSource) && importMap && importMap[moduleSource]) {
      const absoluteUrl = importMap[moduleSource];
      return `import ${quote}${absoluteUrl}${quote};`;
    }
    return match;
  });

  const dynamicImportRegex = /\bimport\s*\(\s*([^)]*?)\s*\)/g;
  code = code.replace(dynamicImportRegex, (_match, expr: string) => {
    return `MicroTSM.load(${expr}, import.meta.url)`;
  });

  return code;
}
