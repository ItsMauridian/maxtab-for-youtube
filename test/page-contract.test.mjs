import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';

test('page bridge implements the quality and hidden-tab contract', async () => {
  assert.equal(existsSync(new URL('../src/page.mjs', import.meta.url)), true);
  const source = await readFile(new URL('../src/page.mjs', import.meta.url), 'utf8');
  assert.match(source, /getAvailableQualityLevels/);
  assert.match(source, /setPlaybackQuality/);
  assert.match(source, /HTMLMediaElement\.prototype\.play/);
  assert.match(source, /document\.visibilityState/);
  assert.match(source, /NotAllowedError/);
  assert.match(source, /pausedByExtension/);
  assert.match(source, /addEventListener\('playing'/);
  assert.match(source, /ytqtaQuality/);
});
