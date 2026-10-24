(() => {
  'use strict';

  const extensionApi = globalThis.browser ?? globalThis.chrome;
  const PAGE_SOURCE = 'youtube-quality-tab-play-page';
  const CONTENT_SOURCE = 'youtube-quality-tab-play-content';
  const token = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const defaults = {qualityMode: 'highest', autopauseHiddenTabs: true};

  if (!extensionApi?.runtime?.getURL || !extensionApi.storage?.local) return;

  const pageScript = document.createElement('script');
  pageScript.type = 'module';
  pageScript.src = `${extensionApi.runtime.getURL('src/page.mjs')}?token=${encodeURIComponent(token)}`;
  pageScript.dataset.ytqta = token;
  (document.head || document.documentElement).appendChild(pageScript);
  pageScript.addEventListener('load', () => pageScript.remove(), {once: true});

  function readSettings() {
    return Promise.resolve(extensionApi.storage.local.get(defaults))
      .then(settings => window.postMessage({
        source: CONTENT_SOURCE,
        kind: 'settings',
        token,
        settings
      }, '*'))
      .catch(() => {});
  }

  window.addEventListener('message', event => {
    if (event.source !== window || event.data?.source !== PAGE_SOURCE || event.data.token !== token) return;
    if (event.data.kind === 'request-settings') readSettings();
  });

  extensionApi.storage.onChanged?.addListener(() => readSettings());
  readSettings();
})();
