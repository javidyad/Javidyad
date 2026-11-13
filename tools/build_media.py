"""Add photos to the campaign gallery, or designs to the posters and placards page.

    python tools/build_media.py gallery  --src <folder> [--csv notes.csv]
    python tools/build_media.py placards --src <folder> [--csv notes.csv]

Every file in --src is added once (a file already on the page, byte for byte, is skipped), after the
items already there, in file-name order. The optional CSV has a header row and these columns, all but
the first optional:

    file, caption (English), caption (Persian), credit        for the gallery
    file, title (English), title (Persian), credit            for placards

Gallery: photos are re-encoded without EXIF (location, camera) as gallery/photos/<id>.jpg, long side at
most FULL px, with gallery/thumbs/<id>.jpg for the page.
Placards: the file is offered for download as it is, any size or format, from placards/files/; images
are re-saved without their metadata first. placards/previews/<id>.jpg shows it on the page (PDFs: the
first page, made with pdftoppm from poppler-utils).
Ids are the start of each file's SHA-1, so no original file name ends up on the site.
"""
import argparse
import csv
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageOps

FULL = 2000      # gallery photos, long side
THUMB_W = 600    # gallery thumbnails and placard previews, width
IMAGES = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff", ".bmp"}


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40]


def clean_image(src):
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        im.load()
    return im


def preview(src, out):
    """First page or the image itself, THUMB_W px wide, as JPEG."""
    if src.suffix.lower() == ".pdf":
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(["pdftoppm", "-f", "1", "-l", "1", "-r", "80", "-png", "-singlefile", str(src), f"{tmp}/p"], check=True)
            im = Image.open(f"{tmp}/p.png"); im.load()
    else:
        im = clean_image(src)
    im = im.convert("RGB")
    im = im.resize((THUMB_W, round(im.height * THUMB_W / im.width)), Image.LANCZOS)
    im.save(out, quality=82, optimize=True, progressive=True)
    return im.size


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("kind", choices=["gallery", "placards"])
    ap.add_argument("--src", required=True, type=Path)
    ap.add_argument("--csv", type=Path)
    args = ap.parse_args()

    root = Path(args.kind)
    sub = ("photos", "thumbs") if args.kind == "gallery" else ("files", "previews")
    for d in sub:
        (root / d).mkdir(parents=True, exist_ok=True)
    items_path = root / "items.json"
    items = json.loads(items_path.read_text(encoding="utf-8")) if items_path.exists() else []
    have = {it["id"] for it in items}

    notes = {}
    if args.csv:
        with open(args.csv, encoding="utf-8-sig", newline="") as f:
            for row in list(csv.reader(f))[1:]:
                row = [c.strip() for c in row] + [""] * 4
                if row[0]:
                    notes[row[0].lower()] = row[1:4]

    added = 0
    for src in sorted(p for p in args.src.iterdir() if p.is_file() and not p.name.startswith(".")):
        pid = hashlib.sha1(src.read_bytes()).hexdigest()[:12]
        if pid in have:
            continue
        en, fa, credit = notes.get(src.name.lower(), ["", "", ""])
        if args.kind == "gallery":
            if src.suffix.lower() not in IMAGES:
                print(f"  skipped {src.name}: not a photo", file=sys.stderr); continue
            im = clean_image(src).convert("RGB")
            im.thumbnail((FULL, FULL), Image.LANCZOS)
            im.save(root / "photos" / f"{pid}.jpg", quality=85, optimize=True, progressive=True)
            th = im.resize((THUMB_W, round(im.height * THUMB_W / im.width)), Image.LANCZOS)
            th.save(root / "thumbs" / f"{pid}.jpg", quality=80, optimize=True, progressive=True)
            item = {"id": pid, "w": th.width, "h": th.height, "caption": en, "caption_fa": fa, "credit": credit}
        else:
            ext = src.suffix.lower()
            name = f"{slug(en) or 'javidyad'}-{pid[:6]}{ext}"
            dest = root / "files" / name
            if ext in IMAGES:
                im = clean_image(src)
                im.save(dest, **({"quality": 95} if ext in (".jpg", ".jpeg") else {}))
            elif ext == ".pdf":
                shutil.copyfile(src, dest)
            else:
                print(f"  skipped {src.name}: only images and PDFs can be previewed", file=sys.stderr); continue
            w, h = preview(src if ext == ".pdf" else dest, root / "previews" / f"{pid}.jpg")
            item = {"id": pid, "file": name, "size": dest.stat().st_size, "w": w, "h": h, "title": en, "title_fa": fa, "credit": credit}
        items.append({k: v for k, v in item.items() if v != ""})
        have.add(pid); added += 1

    items_path.write_text("[\n" + ",\n".join(json.dumps(i, ensure_ascii=False) for i in items) + "\n]\n", encoding="utf-8")
    print(f"{added} added, {len(items)} on the {args.kind} page")


if __name__ == "__main__":
    main()
