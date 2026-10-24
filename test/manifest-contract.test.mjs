import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';

const root = new URL('../', import.meta.url);

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

test('Chromium and Firefox manifests stay least-privilege and self-contained', async () => {
  for (const browser of ['chromium', 'firefox']) {
    const manifest = await json(`manifests/${browser}.json`);
    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.name, 'YouTube Quality Tab Play');
    assert.deepEqual(manifest.permissions, ['storage']);
    assert.deepEqual(manifest.host_permissions, ['https://www.youtube.com/*']);
    assert.equal('background' in manifest, false);
    assert.equal(manifest.content_scripts[0].run_at, 'document_start');
    assert.deepEqual(manifest.web_accessible_resources[0].resources.sort(), [
      'src/autoplay-policy.mjs',
      'src/page.mjs',
      'src/quality.mjs'
    ]);
    for (const icon of Object.values(manifest.icons)) {
      assert.equal(existsSync(new URL(icon, root)), true, `missing ${icon}`);
    }
  }

  const firefox = await json('manifests/firefox.json');
  assert.deepEqual(firefox.browser_specific_settings.gecko.data_collection_permissions, {required: ['none']});
  const packageJson = await json('package.json');
  assert.equal(packageJson.dependencies, undefined);
  assert.equal(packageJson.devDependencies, undefined);
});
