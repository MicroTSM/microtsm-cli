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
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SET_IMPORT_MAP',
              importMap,
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
      })
      .catch((err) => console.error('SW registration failed', err));
  } else {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 0;
    let isSupported = false;

    const getVersion = (regex: RegExp) => {
      const match = ua.match(regex);
      return match ? parseFloat(match[1]) : null;
    };

    if (/Chrome\/(\d+\.\d+|\d+)/.test(ua) && !/Edg|OPR/.test(ua)) {
      browser = 'Chrome';
      version = getVersion(/Chrome\/(\d+\.\d+|\d+)/) ?? version;
      isSupported = version >= 64;
    } else if (/Firefox\/(\d+\.\d+|\d+)/.test(ua)) {
      browser = 'Firefox';
      version = getVersion(/Firefox\/(\d+\.\d+|\d+)/) ?? version;
      isSupported = version >= 67;
    } else if (/Version\/(\d+\.\d+|\d+).+Safari/.test(ua) && !/Chrome/.test(ua)) {
      browser = 'Safari';
      version = getVersion(/Version\/(\d+\.\d+|\d+)/) ?? version;
      isSupported = version >= 11.1;
    } else if (/Edg\/(\d+\.\d+|\d+)/.test(ua)) {
      browser = 'Edge';
      version = getVersion(/Edg\/(\d+\.\d+|\d+)/) ?? version;
      isSupported = version >= 79;
    }

    if (!isSupported) {
      alert(
        `Your browser is not supported.\n\n` +
          `Detected: ${browser} ${version || '(unknown version)'}\n\n` +
          `Please use one of the following supported browsers:\n` +
          `- Chrome 64+\n- Firefox 67+\n- Safari 11.1+\n- Edge 79+`,
      );

      document.body.innerHTML =
        '<h2 style="text-align:center; margin-top:20vh;">Unsupported Browser</h2>' +
        '<p style="text-align:center;">Please switch to a supported browser:<br>Chrome 64+, Firefox 67+, Safari 11.1+, Edge 79+</p>';
      throw new Error('Unsupported browser');
    }
  }
}
