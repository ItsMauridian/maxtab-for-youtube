from __future__ import annotations

import json
import hashlib
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
PROJECT_SLUG = 'maxtab-for-youtube'
FILES = [
    ROOT / 'LICENSE',
    ROOT / 'README.md',
    ROOT / 'CHANGELOG.md',
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
    archive = DIST / f'{PROJECT_SLUG}-{browser}.zip'
    xpi = DIST / f'{PROJECT_SLUG}-firefox.xpi' if browser == 'firefox' else None
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
    if xpi is not None:
        write_archive(xpi, staging, list(staging.rglob('*')))
    with zipfile.ZipFile(archive) as check:
        assert check.testzip() is None
        json.loads(check.read('manifest.json'))
        assert 'LICENSE' in check.namelist()
    if xpi is not None:
        with zipfile.ZipFile(xpi) as check:
            assert check.testzip() is None
            assert check.read('manifest.json') == (staging / 'manifest.json').read_bytes()


def build_source() -> None:
    archive = DIST / f'{PROJECT_SLUG}-source.zip'
    paths = [
        path for path in ROOT.rglob('*')
        if path.is_file() and not (set(path.relative_to(ROOT).parts) & SOURCE_EXCLUDES)
    ]
    write_archive(archive, ROOT, paths)
    with zipfile.ZipFile(archive) as check:
        assert check.testzip() is None
        assert 'LICENSE' in check.namelist()


def write_checksums() -> None:
    names = [
        f'{PROJECT_SLUG}-chromium.zip',
        f'{PROJECT_SLUG}-firefox.zip',
        f'{PROJECT_SLUG}-firefox.xpi',
        f'{PROJECT_SLUG}-source.zip',
    ]
    lines = []
    for name in names:
        digest = hashlib.sha256((DIST / name).read_bytes()).hexdigest()
        lines.append(f'{digest}  {name}')
    (DIST / 'SHA256SUMS.txt').write_text('\n'.join(lines) + '\n')


if __name__ == '__main__':
    DIST.mkdir(exist_ok=True)
    build('chromium')
    build('firefox')
    build_source()
    write_checksums()
    print('built dist/chromium, dist/firefox, Firefox XPI, source ZIP and SHA256SUMS')
