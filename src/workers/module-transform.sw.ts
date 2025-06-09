/// <reference types="typescript/lib/lib.webworker.d.ts" />
import { transformImports } from '../transformers/transformImport';

const excludedUrlsPart = ['polyfill', 'module-loader'];

self.addEventListener('fetch', (e) => {
  const event = e as FetchEvent;
  if (event.request.destination === 'script') {
    event.respondWith(
      fetch(event.request).then((response: Response): Promise<Response> | Response => {
        const contentType: string = response.headers.get('content-type') || '';
        if (contentType.includes('javascript') && !excludedUrlsPart.some((url) => event.request.url.includes(url))) {
          return response.text().then((text: string): Response => {
            const transformed = transformImports(text);
            console.log("🚀 ~  ~ transformed: ", transformed);
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
