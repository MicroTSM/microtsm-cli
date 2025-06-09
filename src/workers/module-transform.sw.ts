/// <reference types="typescript/lib/lib.webworker.d.ts" />
let importMap: Record<string, string> = {};

const excludedUrlsPart = ['polyfill', 'module-loader'];

interface SWMessageData {
  type: string;
  importMap?: typeof importMap;
}

self.addEventListener('message', (event: MessageEvent<SWMessageData>) => {
  const { type, importMap: _importMap } = event.data;
  if (type === 'SET_IMPORT_MAP' && _importMap) {
    importMap = _importMap;
  }
});

self.addEventListener('install', () => {
  (self as any).skipWaiting(); // 🚀 Immediately activate the new worker
});

self.addEventListener('activate', (event: any) => {
  console.log('🚀 ~  ~ event: ', event);
  event.waitUntil((self as any).clients.claim()); // Take control over open tabs
});

self.addEventListener('fetch', (e) => {
  const event = e as FetchEvent;
  if (event.request.destination === 'script') {
    event.respondWith(
      fetch(event.request).then((response: Response): Promise<Response> | Response => {
        const contentType: string = response.headers.get('content-type') || '';
        if (contentType.includes('javascript') && !excludedUrlsPart.some((url) => event.request.url.includes(url))) {
          return response.text().then((text: string): Response => {
            const transformed = transformImports(text);
            const blob = new Blob([transformed], { type: 'text/javascript' });
            return new Response(blob, {
              headers: { 'Content-Type': 'text/javascript' },
            });
          });
        }

        return response;
      }),
    );
  }
});

export function transformImports(code: string): string {
  // External modules are those that do _not_ start with "." or "/"
  const isExternalModule = (moduleSource: string) => !moduleSource.startsWith('.') && !moduleSource.startsWith('/');

  // --- Step 1: Transform static import statements.
  // This regex allows zero or more spaces in key places, so it matches both:
  //    import {...} from "module";
  // and
  //    import{...}from"module";
  const staticImportRegex = /import\s*([^'"]+?)\s*from\s*(['"])([^'"]+)\2\s*;?/g;
  code = code.replace(staticImportRegex, (match, clause, quote, moduleSource) => {
    if (isExternalModule(moduleSource) && importMap[moduleSource]) {
      const absoluteUrl = importMap[moduleSource];
      return `import ${clause} from ${quote}${absoluteUrl}${quote};`;
    }
    return match;
  });

  // --- Step 2: Transform dynamic import calls.
  // This regex matches import("module") where module is a literal string.
  const dynamicImportRegex = /\bimport\(\s*(['"])([^'"]+)\1\s*\)/g;
  code = code.replace(dynamicImportRegex, (match, quote, moduleSource) => {
    if (isExternalModule(moduleSource) && importMap[moduleSource]) {
      const absoluteUrl = importMap[moduleSource];
      return `import(${quote}${absoluteUrl}${quote})`;
    }
    return match;
  });

  return code;
}
