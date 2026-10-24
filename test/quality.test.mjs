import test from 'node:test';
import assert from 'node:assert/strict';
import {highestAvailableQuality, resolveQuality} from '../src/quality.mjs';

test('highestAvailableQuality chooses the highest known level and ignores auto', () => {
  assert.equal(highestAvailableQuality(['hd720', 'auto', 'hd2160', 'hd1080']), 'hd2160');
});

test('highestAvailableQuality rejects empty and unknown input', () => {
  assert.equal(highestAvailableQuality([]), null);
  assert.equal(highestAvailableQuality(['auto', 'unknown']), null);
  assert.equal(highestAvailableQuality(null), null);
});

test('resolveQuality falls back to the nearest available level', () => {
  assert.equal(resolveQuality('hd2160', ['hd1080', 'hd720']), 'hd1080');
  assert.equal(resolveQuality('highest', ['medium', 'hd1440']), 'hd1440');
  assert.equal(resolveQuality('auto', ['hd1080']), null);
});
