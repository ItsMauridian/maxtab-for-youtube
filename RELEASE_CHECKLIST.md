# Release checklist

## Automated checks

- [x] `npm test`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Chromium runtime smoke on a real YouTube page
- [x] Firefox `web-ext lint`
- [x] Firefox temporary add-on installation through `web-ext run`
- [x] Source and runtime archives pass ZIP integrity checks
- [x] Firefox `.xpi` archive is generated from the same deterministic package
- [x] `CHANGELOG.md` documents each public release
- [x] `SHA256SUMS.txt` is generated with every build
- [x] Manifest permissions and icon paths are covered by tests
- [x] No secret-like values found in the source tree

## Required manual acceptance

- [ ] Chromium headed browser: open a YouTube video in a background tab, confirm it is paused, activate the tab, confirm extension-paused playback resumes.
- [ ] Chromium headed browser: manually pause a video, switch tabs, confirm it does not resume unexpectedly.
- [ ] Firefox headed browser: repeat both cases with YouTube autoplay denied.
- [ ] Firefox headed browser: allow autoplay for YouTube and repeat the resume case.
- [ ] Related-video and playlist navigation keeps quality selection active.
- [ ] A video without 4K falls back to its highest available level.

## Publication gate

- [ ] Hive independent review completed.
- [ ] Select the public repository owner and name.
- [ ] Create an initial Git commit with the intended maintainer identity.
- [ ] Push source only, not generated `dist/` output unless a release policy says otherwise.
- [ ] Publish Chromium and Firefox archives as a tagged release.
- [ ] Submit store listings only after the manual acceptance checks are recorded.
