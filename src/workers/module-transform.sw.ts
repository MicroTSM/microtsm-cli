/// <reference types="typescript/lib/lib.webworker.d.ts" />
import { transformImports } from './transformImports';

let importMap: Record<string, string> = {};

const excludedUrlsPart = ['polyfill', 'module-loader'];

interface SWMessageData {
  type: 'SET_IMPORT_MAP';
  importMap?: typeof importMap;
}

self.addEventListener('message', (event: MessageEvent<SWMessageData>) => {
  const { type, importMap: _importMap } = event.data;
  if (type === 'SET_IMPORT_MAP' && _importMap) {
    importMap = _importMap;
  }
});

self.addEventListener('install', () => {
  // Immediately activate the new worker.
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting().then();
});

self.addEventListener('activate', (event: any) => {
  // Take control of all clients / open tabs right away.
  event.waitUntil((self as unknown as ServiceWorkerGlobalScope).clients.claim());
});

/* ------------------------------------------------------------------ */
/* Fetch interception                                                  */
/* ------------------------------------------------------------------ */

/**
 * For every JavaScript response, rewrite import specifiers before the
 * browser evaluates the module.
 */
self.addEventListener('fetch', (e) => {
  const event = e as FetchEvent;

  // Only process script requests.
  if (event.request.destination !== 'script') return;

  event.respondWith(
    fetch(event.request).then(async (response: Response) => {
      const contentType = response.headers.get('content-type') ?? '';

      const isJS = contentType.includes('javascript');
      const isExcluded = excludedUrlsPart.some((u) => event.request.url.includes(u));

      // Skip non-JS or explicitly excluded urls.
      if (!isJS || isExcluded) return response;

      // Transform import specifiers inside the JS payload.
      const originalSource = await response.text();
      const transformedSource = await transformImports(originalSource, importMap);

      const blob = new Blob([transformedSource], {
        type: 'text/javascript',
      });

      return new Response(blob, {
        headers: { 'Content-Type': 'text/javascript' },
      });
    }),
  );
});
