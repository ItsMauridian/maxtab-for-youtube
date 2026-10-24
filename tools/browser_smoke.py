#!/usr/bin/env python3
"""Optional Chromium runtime smoke test.

Requires Python Playwright and a Chromium executable. This proves extension
loading, page-bridge injection, and highest-quality selection. Real tab-strip
visibility changes still need a headed manual test because automation engines
may keep every page visible.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import tempfile
import zipfile
from pathlib import Path

from playwright.async_api import async_playwright


async def run(archive: Path, executable: str, video_url: str) -> None:
    with tempfile.TemporaryDirectory(prefix="ytqta-extension-") as extension_dir, tempfile.TemporaryDirectory(prefix="ytqta-profile-") as profile_dir:
        with zipfile.ZipFile(archive) as package:
            package.extractall(extension_dir)

        async with async_playwright() as playwright:
            context = await playwright.chromium.launch_persistent_context(
                profile_dir,
                executable_path=executable,
                headless=True,
                args=[
                    f"--disable-extensions-except={extension_dir}",
                    f"--load-extension={extension_dir}",
                    "--autoplay-policy=no-user-gesture-required",
                    "--no-sandbox",
                ],
            )
            try:
                page = context.pages[0] if context.pages else await context.new_page()
                await page.goto(video_url, wait_until="domcontentloaded", timeout=60_000)
                await page.wait_for_timeout(10_000)
                result = await page.evaluate(
                    """() => {
                        const player = window.movie_player || document.querySelector('#movie_player');
                        const video = document.querySelector('#movie_player video, video');
                        return {
                            ready: Boolean(video),
                            available: player?.getAvailableQualityLevels?.() ?? [],
                            playbackQuality: player?.getPlaybackQuality?.() ?? null,
                            playHooked: Boolean(HTMLMediaElement.prototype.play.__ytqtaWrapped),
                        };
                    }"""
                )
                print(json.dumps(result, indent=2))
                assert result["ready"], "YouTube video element was not available"
                assert result["playHooked"], "page bridge did not hook media playback"
                assert result["available"], "YouTube exposed no quality levels"
                assert result["playbackQuality"] == result["available"][0], "highest quality was not selected"
            finally:
                await context.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--executable", required=True)
    parser.add_argument("--video-url", default="https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    args = parser.parse_args()
    asyncio.run(run(args.archive, args.executable, args.video_url))


if __name__ == "__main__":
    main()
