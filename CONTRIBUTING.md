# Contributing

Thanks for helping with YouTube Quality Tab Play.

## Source boundary

This is an independent clean-room project. Do not copy code, assets, translations, tests, or license text from unrelated extensions unless the material has a compatible license and its provenance is recorded. Describe behavioral observations and public browser/API documentation separately from implementation code.

## Development checks

Run all of these before opening a pull request:

```sh
npm test
npm run lint
npm run build
```

For browser behavior, test a fresh Chromium profile and a fresh Firefox profile. Record the browser version, extension build, YouTube URL class, autoplay permission state, and whether the result was manually observed or automated.

## Pull requests

Keep changes focused. Add a regression test for behavior changes, preserve the least-privilege manifest, and do not add remote code, analytics, or unrelated host permissions.
