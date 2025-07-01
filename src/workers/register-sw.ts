export function registerServiceWorker(): void {
  if (navigator.serviceWorker) {
    navigator.serviceWorker
      .register('/module-transform.sw.js', { type: 'module' })
      .then(async (registration) => {
        await new Promise((resolve) => {
          // @ts-ignore
          navigator.serviceWorker.controller ? resolve(null) : location.reload();
        });

        const scriptEl = document.querySelector('script[type="microtsm-importmap"]');
        const importMap = scriptEl && scriptEl.textContent ? JSON.parse(scriptEl.textContent).imports : {};

        const setImportMap = () => {
          const overrides = JSON.parse(localStorage.importMapOverrides);
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SET_IMPORT_MAP',
              importMap: { ...importMap, ...overrides },
            });
          }
        };

        if (registration.active) {
          setImportMap();
        }

        // @ts-ignore
        import('https://entryjs.co').catch(console.error);

        // Reassign the import map when the window regains focus.
        // Some browsers may clear the import map from memory when the tab is suspended,
        // resulting in an empty import map and potential errors when the tab becomes active again.
        window.addEventListener('focus', setImportMap);
        window.addEventListener('microtsm:root-app-relaunch', setImportMap);

        window.onbeforeunload = () => {
          window.removeEventListener('focus', setImportMap);
          window.removeEventListener('microtsm:root-app-relaunch', setImportMap);
        };
      })
      .catch((err) => console.error('SW registration failed', err));
  } else {
    // For browser that not support service workers
    fetch(__MICROTSM_URL__.replace('{VERSION}', __MICROTSM_VERSION__) + 'misc/unsupported-browser.html')
      .then((res) => res.text())
      .then((html) => {
        document.open();
        document.writeln(html);
        document.close();
      });
  }
}

declare const __MICROTSM_URL__: string;
declare const __MICROTSM_VERSION__: string;
