# YouTube Quality Tab Play

An independent, clean-room WebExtension for YouTube. It defaults to the highest quality that YouTube exposes for the current video and pauses playback while a YouTube tab is hidden, resuming only playback that this extension paused.

This project is not affiliated with Google or YouTube. It is not a fork of ImprovedTube and does not copy its source code, assets, translations, or license. It uses standard WebExtension APIs and the public behavior of YouTube's player surface.

The current release targets desktop Firefox and Chromium browsers. Firefox Android is not claimed as supported yet because the package intentionally does not match `m.youtube.com`; mobile support will be added only after a real-device acceptance test.

## Features

- Select the highest available YouTube quality by default.
- Retry quality selection after YouTube's single-page navigation and delayed player initialization.
- Pause playback when the YouTube document becomes hidden or loses focus.
- Resume only when the extension itself paused the video.
- Keep an explicit opt-out for both behaviors in the options page.
- Run the same source flow in Chromium browsers and Firefox.
- Report Firefox autoplay blocks instead of silently pretending playback started.

## Browser policy

Firefox and Chromium can reject script-initiated playback with `NotAllowedError`. The extension cannot override that policy. Firefox users may need to allow autoplay for YouTube in the site's permissions. The extension keeps the resume state pending and shows an actionable notice when playback is blocked.

## Development

This repository intentionally has no third-party runtime dependencies.

```sh
npm test
npm run lint
npm run build
```

For an optional Chromium runtime smoke test, install Python Playwright in the environment and run:

```sh
python3 tools/browser_smoke.py \
  --archive dist/youtube-quality-tabplay-chromium.zip \
  --executable /path/to/chromium
```

This proves extension loading, page-bridge injection, and highest-quality selection. It does not replace a headed manual tab-strip test, because some automation engines keep multiple pages visible.

The build creates deterministic unpacked directories and ZIP files under `dist/` for Chromium, Firefox, and the source tree. Running `npm run build` twice should produce identical SHA-256 hashes. Load the unpacked directory in `chrome://extensions` or `about:debugging` for manual testing. Do not install both the official extension and a development build with the same browser profile unless their IDs differ.

## Clean-room and licensing boundary

The implementation is an independent rewrite. The project is released under the MIT License. Before publishing, review every future contribution and dependency for provenance, add copyright notices where needed, and keep generated build output out of source control unless a release artifact is intentionally attached.

## Manual test matrix

1. Open a YouTube video in an active tab and confirm the default player quality is the highest level exposed by the player.
2. Open a YouTube video in a background tab and confirm it does not continue audible playback.
3. Activate that tab and confirm the extension attempts to resume it.
4. Manually pause a video, switch tabs, and confirm it does not resume unexpectedly.
5. Repeat on Chromium and Firefox, including a Firefox profile with YouTube autoplay denied and allowed.
6. Navigate between related videos and playlists without a full page reload.
7. Test videos with no 4K or no adaptive quality levels.
