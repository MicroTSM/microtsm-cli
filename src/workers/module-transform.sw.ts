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
  const isExternalModule = (moduleSource: string) =>
    !(moduleSource.startsWith('.') || moduleSource.startsWith('/') || moduleSource.startsWith('..'));

  // The regex below matches static import statements with or without "from" clause:
  //
  // Breakdown:
  //   - ^import\s/            : "import" followed by optional whitespace
  //   - (?:([\w*\s{},]+)\s*from\s*)?  : first optional group, captures any characters (letters, spaces, curly braces, commas, asterisks)
  //                                that appear before the "from" keyword
  //   - (['"])                : captures quote type (either ' or ")
  //   - ([^'"]+)              : captures module specifier (content between quotes)
  //   - \2                    : matches closing quote (must match what was captured in group 2)
  //   - \s*;?                 : optional trailing whitespace and semicolon
  const staticImportRegex = /import\s*(?:([\w*\s{},]+)\s*from\s*)?(['"])([^'"]+)\2\s*;?/g;

  code = code.replace(staticImportRegex, (match, clause, quote, moduleSource) => {
    if (isExternalModule(moduleSource) && importMap[moduleSource]) {
      const absoluteUrl = importMap[moduleSource];
      // If there is a clause, return: "import <clause> from <absoluteUrl>;"
      // If there isn't (side effect import), return: "import <absoluteUrl>;"
      return clause ? `import ${clause}from ${quote}${absoluteUrl}${quote};` : `import ${quote}${absoluteUrl}${quote};`;
    }
    return match;
  });

  // Handle dynamic imports with MicroTSM.load:
  const dynamicImportRegex = /\bimport\s*\(\s*([^)]*?)\s*\)/g;
  code = code.replace(dynamicImportRegex, (_, expr) => {
    return `MicroTSM.load(${expr})`;
  });

  return code;
}
