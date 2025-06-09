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

  // --- Transform static import statements that contain a "from" clause.
  // The regex below requires that there be some import clause (e.g. bindings)
  // before the "from" keyword.
  const staticImportRegex = /import\s+(.+?)\s+from\s+(['"])([^'"]+)\2\s*;?/g;
  code = code.replace(staticImportRegex, (match, clause, quote, moduleSource) => {
    if (isExternalModule(moduleSource) && importMap[moduleSource]) {
      const absoluteUrl = importMap[moduleSource];
      return `import ${clause} from ${quote}${absoluteUrl}${quote};`;
    }
    return match;
  });

  // --- Step 2: Transform dynamic import calls.
  // Regardless of whether the dynamic import argument is a string literal or variable,
  // always replace it with a call to MicroTSM.load().
  // The regex captures the expression inside the parentheses.
  const dynamicImportRegex = /\bimport\s*\(\s*([^)]*?)\s*\)/g;
  code = code.replace(dynamicImportRegex, (_, expr) => {
    return `MicroTSM.load(${expr})`;
  });

  return code;
}
