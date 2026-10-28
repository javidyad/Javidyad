"""Download candidates for the Javidnam list from Iran International's Javidnaman platform.

Used with the platform's permission. Reads the people list embedded in
https://javidnaman.iranintl.com/, measures every photo (only the first bytes are
fetched for that), and downloads the ones whose width and height are both at
least --min-side px. Writes <out>/candidates.csv (id, name_fa, place, age,
width, height) and <out>/photos/<id>.<ext>.

    python tools/fetch_javidnaman.py --out /path/to/scratch/javidnaman --min-side 1000

The English names and cities are then written into javidnam/source.csv by hand
(names and cities follow the conventions already used in that file), and tools/build_javidnam.py builds the site files from it.
"""
import argparse
import csv
import io
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageFile

SITE = "https://javidnaman.iranintl.com/"
IMAGE_URL = "https://d1fwhlqkr1vj82.cloudfront.net/image/{}"   # getPersonImageUrl() in the site's scripts
UA = {"User-Agent": "javidyad.com poster maker (memorial, non-commercial)"}


def get(url, headers=None, timeout=60):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("Content-Type", "")


def load_people():
    html, _ = get(SITE)
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)</script>', html.decode("utf-8"), flags=re.S)
    payload = "".join(json.loads('"' + c + '"') for c in chunks)
    start = payload.index('"people":[') + len('"people":')
    people, _ = json.JSONDecoder().raw_decode(payload[start:])
    return people


def image_size(data):
    p = ImageFile.Parser()
    p.feed(data)
    return p.image.size if p.image else None


def measure(pid):
    """Size from the first 64 KB; falls back to the whole file when the header is further in."""
    try:
        head, _ = get(IMAGE_URL.format(pid), {"Range": "bytes=0-65535"})
        size = image_size(head)
        if size:
            return pid, size, None
        data, ctype = get(IMAGE_URL.format(pid))
        return pid, Image.open(io.BytesIO(data)).size, (data, ctype)
    except Exception as e:  # a broken or missing photo just leaves the person out
        return pid, None, str(e)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--min-side", type=int, default=1000)
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()
    (args.out / "photos").mkdir(parents=True, exist_ok=True)

    people = {p["_id"]: p for p in load_people() if p.get("hasProfileImage")}
    print(f"{len(people)} people with a photo on the platform")
    with ThreadPoolExecutor(args.workers) as ex:
        sizes = list(ex.map(measure, people))
    failed = [pid for pid, size, _ in sizes if not size]
    good = [(pid, size, full) for pid, size, full in sizes if size and min(size) >= args.min_side]
    print(f"{len(good)} photos are at least {args.min_side} px on both sides; {len(failed)} could not be read")

    def download(item):
        pid, size, full = item
        data, ctype = full if isinstance(full, tuple) else get(IMAGE_URL.format(pid))
        ext = ".png" if "png" in ctype else ".webp" if "webp" in ctype else ".jpg"
        (args.out / "photos" / f"{pid}{ext}").write_bytes(data)
        return pid

    with ThreadPoolExecutor(args.workers) as ex:
        list(ex.map(download, good))
    with open(args.out / "candidates.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "name_fa", "place", "age", "width", "height"])
        for pid, (width, height), _ in sorted(good, key=lambda g: people[g[0]].get("place") or ""):
            p = people[pid]
            w.writerow([pid, p.get("name", "").strip(), (p.get("place") or "").strip(), p.get("age", ""), width, height])
    json.dump({pid: list(size) for pid, size, _ in sizes if size}, open(args.out / "sizes.json", "w"))


if __name__ == "__main__":
    main()
