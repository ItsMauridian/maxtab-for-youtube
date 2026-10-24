# Security policy

Please report security issues privately to the project maintainers before opening a public issue. Do not include passwords, cookies, tokens, or private browsing data in a report.

The extension is intentionally narrow:

- host access is limited to `https://www.youtube.com/*`;
- storage is used only for local settings;
- no remote scripts, analytics, or external network requests are required;
- page messages are scoped with a per-page token and settings are allowlisted before use;
- web-accessible resources are limited to the page bridge and its local modules.

If a browser policy blocks playback, the extension reports the failure. It does not attempt to bypass browser permissions or inject credentials.
