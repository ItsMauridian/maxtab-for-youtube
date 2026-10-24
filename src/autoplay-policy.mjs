import {QUALITY_MODES} from './quality.mjs';

export const DEFAULT_SETTINGS = Object.freeze({
  qualityMode: 'highest',
  autopauseHiddenTabs: true
});

export function sanitizeSettings(input = {}) {
  const qualityMode = QUALITY_MODES.includes(input.qualityMode) ? input.qualityMode : DEFAULT_SETTINGS.qualityMode;
  return {
    qualityMode,
    autopauseHiddenTabs: input.autopauseHiddenTabs !== false
  };
}

export function markHiddenPlayback(state, isPlaying) {
  if (!isPlaying) return state;
  return {
    ...state,
    resumePending: true,
    pausedByExtension: true,
    pauseRequestActive: true
  };
}

export function clearManualHiddenPause(state, pageIsVisible) {
  if (pageIsVisible || !state.resumePending || state.pauseRequestActive) return state;
  return {
    ...state,
    resumePending: false,
    pausedByExtension: false
  };
}

export function shouldAttemptResume(state, pageIsVisible, isPaused) {
  return pageIsVisible && isPaused && state.resumePending && state.pausedByExtension;
}
