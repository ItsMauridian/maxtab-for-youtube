import test from 'node:test';
import assert from 'node:assert/strict';
import {clearManualHiddenPause, DEFAULT_SETTINGS, markHiddenPlayback, sanitizeSettings, shouldAttemptResume} from '../src/autoplay-policy.mjs';

test('defaults enable highest quality and hidden-tab autopause', () => {
  assert.deepEqual(DEFAULT_SETTINGS, {qualityMode: 'highest', autopauseHiddenTabs: true});
});

test('settings are sanitized without accepting an invalid quality mode', () => {
  assert.deepEqual(sanitizeSettings({}), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings({qualityMode: 'auto', autopauseHiddenTabs: false}), {qualityMode: 'auto', autopauseHiddenTabs: false});
  assert.deepEqual(sanitizeSettings({qualityMode: 'not-a-quality'}), DEFAULT_SETTINGS);
});

test('hidden playing state becomes resumable', () => {
  const state = markHiddenPlayback({resumePending: false, pausedByExtension: false, pauseRequestActive: false}, true);
  assert.equal(state.resumePending, true);
  assert.equal(state.pausedByExtension, true);
  assert.equal(shouldAttemptResume(state, true, true), true);
});

test('a manual hidden pause clears the resume marker', () => {
  const state = clearManualHiddenPause({resumePending: true, pausedByExtension: true, pauseRequestActive: false}, false);
  assert.deepEqual(state, {resumePending: false, pausedByExtension: false, pauseRequestActive: false});
});
