import {resolveQuality} from './quality.mjs';
import {
  DEFAULT_SETTINGS,
  clearManualHiddenPause,
  markHiddenPlayback,
  sanitizeSettings,
  shouldAttemptResume
} from './autoplay-policy.mjs';

const PAGE_SOURCE = 'youtube-quality-tab-play-page';
const CONTENT_SOURCE = 'youtube-quality-tab-play-content';
const token = new URL(import.meta.url).searchParams.get('token') ?? '';
const state = {
  settings: {...DEFAULT_SETTINGS},
  resumePending: false,
  pausedByExtension: false,
  pauseRequestActive: false,
  boundVideo: null,
  qualityTimers: [],
  lastQuality: null,
  notice: null,
  observerScheduled: false
};

function post(kind, payload = {}) {
  window.postMessage({source: PAGE_SOURCE, kind, token, ...payload}, '*');
}

function pageIsVisible() {
  return document.visibilityState === 'visible' && document.hasFocus();
}

function findPlayer() {
  return window.movie_player
    || document.getElementById('movie_player')
    || document.querySelector('.html5-video-player');
}

function findVideo() {
  return findPlayer()?.querySelector?.('video')
    || document.querySelector('#movie_player video');
}

function isMainVideo(videoElement) {
  return Boolean(videoElement?.closest?.('#movie_player, .html5-video-player'));
}

function showNotice(message) {
  let notice = document.getElementById('ytqta-notice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'ytqta-notice';
    Object.assign(notice.style, {
      position: 'fixed',
      zIndex: '2147483647',
      right: '18px',
      bottom: '18px',
      maxWidth: '360px',
      padding: '12px 14px',
      borderRadius: '8px',
      background: '#202124',
      color: '#fff',
      font: '14px system-ui, sans-serif',
      boxShadow: '0 4px 18px rgba(0,0,0,.35)'
    });
    document.documentElement.appendChild(notice);
  }
  notice.textContent = message;
  state.notice = notice;
  clearTimeout(state.noticeTimer);
  state.noticeTimer = setTimeout(() => {
    notice.remove();
    state.notice = null;
  }, 7000);
}

function handlePlaybackError(error) {
  if (error?.name !== 'NotAllowedError') return;
  state.resumePending = true;
  state.pausedByExtension = true;
  showNotice('Autoplay is blocked. Allow YouTube autoplay in site permissions, then switch tabs again.');
  post('autoplay-blocked');
}

function pauseForHiddenTab(videoElement = findVideo()) {
  if (!state.settings.autopauseHiddenTabs || !videoElement || videoElement.paused) return;
  Object.assign(state, markHiddenPlayback(state, true));
  const consumePauseRequest = () => {
    state.pauseRequestActive = false;
    videoElement.removeEventListener('pause', consumePauseRequest, true);
    clearTimeout(state.pauseTimer);
  };
  videoElement.addEventListener('pause', consumePauseRequest, true);
  try {
    videoElement.pause();
  } finally {
    clearTimeout(state.pauseTimer);
    state.pauseTimer = setTimeout(consumePauseRequest, 250);
  }
}

function resumeAfterTabFocus() {
  const videoElement = findVideo();
  if (!shouldAttemptResume(state, pageIsVisible(), Boolean(videoElement?.paused))) return;

  state.resumePending = false;
  state.pausedByExtension = false;
  const player = findPlayer();
  let result;
  try {
    if (typeof player?.playVideo === 'function') player.playVideo();
    if (videoElement?.paused) result = videoElement.play();
  } catch (error) {
    handlePlaybackError(error);
    return;
  }
  if (result && typeof result.catch === 'function') result.catch(handlePlaybackError);
}

function syncTabPlayback() {
  const videoElement = findVideo();
  bindVideo(videoElement);
  if (!pageIsVisible()) pauseForHiddenTab(videoElement);
  else resumeAfterTabFocus();
}

function bindVideo(videoElement) {
  if (!videoElement || state.boundVideo === videoElement) return;
  state.boundVideo = videoElement;
  videoElement.addEventListener('pause', () => {
    Object.assign(state, clearManualHiddenPause(state, pageIsVisible()));
  }, true);
  videoElement.addEventListener('play', () => {
    if (pageIsVisible()) {
      state.resumePending = false;
      state.pausedByExtension = false;
    }
  }, true);
  videoElement.addEventListener('playing', applyQuality, true);
}

function applyQuality() {
  const player = findPlayer();
  const available = player?.getAvailableQualityLevels?.();
  const target = resolveQuality(state.settings.qualityMode, available);
  if (!player || !target) return false;

  try {
    player.setPlaybackQualityRange?.(target);
    player.setPlaybackQuality?.(target);
    state.lastQuality = target;
    document.documentElement.dataset.ytqtaQuality = target;
    return true;
  } catch (error) {
    console.warn('[MaxTab for YouTube] quality selection failed', error);
    return false;
  }
}

function scheduleQualityRetries() {
  state.qualityTimers.forEach(timer => clearTimeout(timer));
  state.qualityTimers = [];
  state.lastQuality = null;
  const navigationUrl = location.href;
  for (const delay of [0, 250, 800, 1500, 3000]) {
    state.qualityTimers.push(setTimeout(() => {
      if (location.href === navigationUrl) applyQuality();
    }, delay));
  }
}

function installPlayGuard() {
  const originalPlay = HTMLMediaElement.prototype.play;
  if (typeof originalPlay !== 'function' || originalPlay.__ytqtaWrapped) return;

  function guardedPlay(...args) {
    const result = originalPlay.apply(this, args);
    if (isMainVideo(this) && state.settings.autopauseHiddenTabs) {
      const pauseIfHidden = () => {
        if (!pageIsVisible()) pauseForHiddenTab(this);
      };
      if (result && typeof result.then === 'function') {
        result.then(pauseIfHidden).catch(error => {
          if (!pageIsVisible()) handlePlaybackError(error);
        });
      } else {
        queueMicrotask(pauseIfHidden);
      }
    }
    return result;
  }

  guardedPlay.__ytqtaWrapped = true;
  HTMLMediaElement.prototype.play = guardedPlay;
}

function scheduleObserverSync() {
  if (state.observerScheduled) return;
  state.observerScheduled = true;
  setTimeout(() => {
    state.observerScheduled = false;
    bindVideo(findVideo());
    applyQuality();
  }, 200);
}

window.addEventListener('message', event => {
  if (event.source !== window || event.data?.source !== CONTENT_SOURCE || event.data.token !== token) return;
  if (event.data.kind === 'settings') {
    state.settings = sanitizeSettings(event.data.settings);
    scheduleQualityRetries();
    syncTabPlayback();
  }
});

document.addEventListener('visibilitychange', syncTabPlayback, {passive: true});
window.addEventListener('focus', syncTabPlayback, {passive: true});
window.addEventListener('blur', syncTabPlayback, {passive: true});
document.addEventListener('yt-navigate-finish', () => {
  state.boundVideo = null;
  state.resumePending = false;
  state.pausedByExtension = false;
  scheduleQualityRetries();
  syncTabPlayback();
});

document.addEventListener('canplay', event => {
  if (isMainVideo(event.target)) {
    bindVideo(event.target);
    applyQuality();
  }
}, true);

const observer = new MutationObserver(scheduleObserverSync);
observer.observe(document.documentElement, {childList: true, subtree: true});
installPlayGuard();
scheduleQualityRetries();
post('request-settings');
