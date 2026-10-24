from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
FILES = [
    ROOT / 'LICENSE',
    ROOT / 'README.md',
    ROOT / 'CONTRIBUTING.md',
    ROOT / 'SECURITY.md',
    ROOT / 'PROVENANCE.md',
]
DIRECTORIES = [ROOT / 'src']
SOURCE_EXCLUDES = {'.git', 'dist', 'node_modules', '__pycache__'}


def write_archive(archive: Path, root: Path, paths: list[Path]) -> None:
    if archive.exists():
        archive.unlink()
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as output:
        for path in sorted(paths):
            if not path.is_file():
                continue
            relative = path.relative_to(root).as_posix()
            info = zipfile.ZipInfo(relative, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            output.writestr(info, path.read_bytes())


def build(browser: str) -> None:
    staging = DIST / browser
    archive = DIST / f'youtube-quality-tabplay-{browser}.zip'
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)
    for source in FILES:
        shutil.copy2(source, staging / source.name)
    for source in DIRECTORIES:
        shutil.copytree(source, staging / source.name)
    manifest = json.loads((ROOT / 'manifests' / f'{browser}.json').read_text())
    (staging / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    write_archive(archive, staging, list(staging.rglob('*')))
    with zipfile.ZipFile(archive) as check:
        assert check.testzip() is None
        json.loads(check.read('manifest.json'))
        assert 'LICENSE' in check.namelist()


def build_source() -> None:
    archive = DIST / 'youtube-quality-tabplay-source.zip'
    paths = [
        path for path in ROOT.rglob('*')
        if path.is_file() and not (set(path.relative_to(ROOT).parts) & SOURCE_EXCLUDES)
    ]
    write_archive(archive, ROOT, paths)
    with zipfile.ZipFile(archive) as check:
        assert check.testzip() is None
        assert 'LICENSE' in check.namelist()


if __name__ == '__main__':
    DIST.mkdir(exist_ok=True)
    build('chromium')
    build('firefox')
    build_source()
    print('built dist/chromium, dist/firefox and source ZIP archive')
