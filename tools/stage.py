"""Publish this checkout to the staging site, to test a change before it goes live.

The staging site is the javidyad/javidyad-staging repo, served by GitHub Pages at
https://javidyad.github.io/javidyad-staging/ (every path in the site is relative, so it
works under that folder). This copies the site files into a clone of that repo and
commits them there; push the clone afterwards.

On the way it:
- leaves out CNAME, so the staging site can never claim javidyad.com,
- leaves out .github/, tests/ and tools/, which the site does not need,
- adds <meta name="robots" content="noindex"> and a small gold "staging" ribbon to every page.

    python tools/stage.py --staging /path/to/javidyad-staging-clone
"""
import argparse
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = ("CNAME", ".github/", "tests/", "tools/", ".gitignore", "README.md")
RIBBON = ('<div style="position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:99;padding:3px 14px;'
          'border-radius:0 0 8px 8px;background:#b98a1f;color:#1b2a4a;font:700 12px/1.6 Vazirmatn,Tahoma,sans-serif;'
          'pointer-events:none" lang="fa">نسخه‌ی آزمایشی · STAGING</div>')


def git(*args, cwd=ROOT):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--staging", required=True, type=Path, help="a clone of javidyad/javidyad-staging")
    args = ap.parse_args()
    dest = args.staging.resolve()
    if not (dest / ".git").exists():
        raise SystemExit(f"{dest} is not a git clone")
    if git("status", "--porcelain"):
        raise SystemExit("commit your changes first, so staging shows exactly one commit")

    files = [f for f in git("ls-files").splitlines() if not f.startswith(SKIP)]
    for old in git("ls-files", cwd=dest).splitlines():          # files removed from the site go from staging too
        if old not in files:
            (dest / old).unlink()
    for f in files:
        (dest / f).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / f, dest / f)
        if f.endswith(".html"):
            page = (dest / f).read_text(encoding="utf-8")
            page = page.replace("<head>\n", '<head>\n<meta name="robots" content="noindex">\n', 1)
            page = page.replace("</body>", RIBBON + "\n</body>", 1)
            (dest / f).write_text(page, encoding="utf-8")
    (dest / ".nojekyll").touch()

    source = f"{git('rev-parse', '--abbrev-ref', 'HEAD')} @ {git('rev-parse', '--short', 'HEAD')}"
    git("add", "-A", cwd=dest)
    if not git("status", "--porcelain", cwd=dest):
        return print("staging already shows", source)
    git("commit", "-q", "-m", f"Stage {source}", cwd=dest)
    print(f"committed {source} to {dest}; push it to publish")


if __name__ == "__main__":
    main()
