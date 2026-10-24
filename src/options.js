const extensionApi = globalThis.browser ?? globalThis.chrome;
const defaults = {qualityMode: 'highest', autopauseHiddenTabs: true};
const qualityMode = document.querySelector('#qualityMode');
const autopauseHiddenTabs = document.querySelector('#autopauseHiddenTabs');
const save = document.querySelector('#save');
const status = document.querySelector('#status');

async function load() {
  const settings = await Promise.resolve(extensionApi.storage.local.get(defaults));
  qualityMode.value = settings.qualityMode;
  autopauseHiddenTabs.checked = settings.autopauseHiddenTabs !== false;
}

save.addEventListener('click', async () => {
  await extensionApi.storage.local.set({
    qualityMode: qualityMode.value,
    autopauseHiddenTabs: autopauseHiddenTabs.checked
  });
  status.textContent = 'Saved.';
  setTimeout(() => { status.textContent = ''; }, 1800);
});

load().catch(() => { status.textContent = 'Unable to read extension settings.'; });
