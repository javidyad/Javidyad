"""Give the css/ and js/ files a new ?v= in every page and script.

GitHub Pages lets browsers keep files for 10 minutes. A new ?v= makes them fetch the new
copies right after a deploy, so a page never runs with an older script. Run it after
changing anything in css/ or js/:

    python tools/bump_version.py
"""
import re
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
version = time.strftime("%Y%m%d%H%M")
for f in [*ROOT.glob("*.html"), *ROOT.glob("js/*.js")]:
    text = f.read_text(encoding="utf-8")
    new = re.sub(r"(\.(?:css|js))\?v=\w+", rf"\1?v={version}", text)
    if new != text:
        f.write_text(new, encoding="utf-8")
        print(f"{f.relative_to(ROOT)}: ?v={version}")
