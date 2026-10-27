"""Build the Javidnam list (javidnam/people.json, photos and thumbnails) from a sheet.

The sheet is a CSV (Google Sheets: File > Download > CSV) with one person per row
and these seven columns, in this order. The first row is a header and is skipped.

    1. name on the poster, English letters only (A-Z a-z space . ' ’ -), max 40
    2. name in Persian
    3. province in English  (leave 3 and 4 both empty when it is not known)
    4. province in Persian
    5. city in English      (leave 5 and 6 both empty when it is not known; a city needs a province)
    6. city in Persian
    7. photo file name (found in --photos, case-insensitive; extension optional)

Every problem in the sheet is reported at once, and nothing is written until the
sheet is clean. The owner's rule: a photo smaller than MIN_SIDE px on either side
is not used at all, since it would print blurry. Photos are re-encoded, which also strips EXIF (location, camera).

    python tools/build_javidnam.py --csv people.csv --photos originals/ --out javidnam/

Writes:
    javidnam/people.json          [{id, name, name_fa, province, province_fa, city, city_fa}, ...] in sheet order;
                                  province and city are null when unknown
    javidnam/photos/<id>.jpg      long side at most FULL_MAX px, for the poster
    javidnam/thumbs/<id>.jpg      THUMB_W x THUMB_H crop, for the list page
"""
import argparse
import csv
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

FULL_MAX = 3200          # the photo box is about 3100 px wide in a 16 MP export
THUMB_W, THUMB_H = 360, 480
FOCUS_Y = 0.3            # same framing as CONFIG.focusY in index.html: keep faces in the crop
MIN_SIDE = 1000          # the owner's quality rule
NAME_RE = re.compile(r"^[A-Za-z .'’-]{1,40}$")
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff", ".bmp"}


def slugify(name, taken):
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "person"
    slug, n = base, 2
    while slug in taken:
        slug, n = f"{base}-{n}", n + 1
    taken.add(slug)
    return slug


def find_photo(photos, wanted):
    wanted = wanted.strip().lower()
    for p in photos:
        if p.name.lower() == wanted or (p.stem.lower() == wanted and p.suffix.lower() in IMAGE_EXT):
            return p
    return None


def read_rows(csv_path):
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    return [(i, [c.strip() for c in r] + [""] * (7 - len(r))) for i, r in enumerate(rows[1:], start=2) if any(c.strip() for c in r)]


def check_place(where, kind, en, fa, fa_of, errors):
    """A province or city must be given in both languages, and always spelled the same way."""
    if bool(en) != bool(fa):
        errors.append(f"{where}: give the {kind} in both English and Persian, or leave both empty")
    elif en and fa_of.setdefault(en, fa) != fa:
        errors.append(f"{where}: {kind} {en!r} is written {fa!r} here but {fa_of[en]!r} earlier")


def near_duplicates(kind, names, errors):
    """The same place written two ways in English ("Tehran" / "tehran ") would become two groups."""
    by_key = {}
    for n in names:
        by_key.setdefault(re.sub(r"\W+", "", n.lower()), set()).add(n)
    for variants in by_key.values():
        if len(variants) > 1:
            errors.append(f"{kind} {sorted(variants)} look like the same place written differently")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--csv", required=True, type=Path)
    ap.add_argument("--photos", required=True, type=Path)
    ap.add_argument("--out", default=Path("javidnam"), type=Path)
    args = ap.parse_args()

    photos = [p for p in args.photos.rglob("*") if p.is_file()]
    errors, warnings, people, taken, seen_names = [], [], [], set(), {}
    province_fa_of, city_fa_of, province_of = {}, {}, {}
    for line, (name, name_fa, province, province_fa, city, city_fa, photo, *_) in read_rows(args.csv):
        where = f"row {line}"
        if not NAME_RE.match(name):
            errors.append(f"{where}: English name {name!r} must be 1-40 English letters (space . ' ’ - allowed)")
        for label, value in (("Persian name", name_fa), ("photo", photo)):
            if not value:
                errors.append(f"{where}: {label} is empty")
        check_place(where, "province", province, province_fa, province_fa_of, errors)
        check_place(where, "city", city, city_fa, city_fa_of, errors)
        if city and not province:
            errors.append(f"{where}: city {city!r} has no province")
        elif city and province_of.setdefault(city, province) != province:
            errors.append(f"{where}: city {city!r} is in {province!r} here but in {province_of[city]!r} earlier")
        if name.lower() in seen_names:
            warnings.append(f"{where}: {name!r} also appears on row {seen_names[name.lower()]}")
        seen_names.setdefault(name.lower(), line)
        src = find_photo(photos, photo) if photo else None
        if photo and not src:
            errors.append(f"{where}: photo {photo!r} not found in {args.photos}")
        elif src:
            with Image.open(src) as im:
                w, h = ImageOps.exif_transpose(im).size
            if min(w, h) < MIN_SIDE:
                errors.append(f"{where}: photo {src.name} is {w} x {h}; both sides must be at least {MIN_SIDE} px")
        people.append({"line": line, "name": " ".join(name.split()), "name_fa": name_fa, "province": province, "province_fa": province_fa,
                       "city": city, "city_fa": city_fa, "src": src})
    near_duplicates("provinces", province_fa_of, errors)
    near_duplicates("cities", city_fa_of, errors)

    if errors:
        print(f"{len(errors)} problem(s) in the sheet, nothing was written:", *errors, sep="\n  ", file=sys.stderr)
        sys.exit(1)

    for d in ("photos", "thumbs"):
        (args.out / d).mkdir(parents=True, exist_ok=True)
    out = []
    for p in people:
        pid = slugify(p["name"], taken)
        with Image.open(p["src"]) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            full = im.copy()
            full.thumbnail((FULL_MAX, FULL_MAX), Image.LANCZOS)
            full.save(args.out / "photos" / f"{pid}.jpg", quality=86, optimize=True, progressive=True)
            k = max(THUMB_W / im.width, THUMB_H / im.height)
            w, h = round(im.width * k), round(im.height * k)
            th = im.resize((w, h), Image.LANCZOS)
            x, y = (w - THUMB_W) // 2, round((h - THUMB_H) * FOCUS_Y)
            th.crop((x, y, x + THUMB_W, y + THUMB_H)).save(args.out / "thumbs" / f"{pid}.jpg", quality=80, optimize=True, progressive=True)
        out.append({"id": pid, "name": p["name"], "name_fa": p["name_fa"], **{k: p[k] or None for k in ("province", "province_fa", "city", "city_fa")}})

    # remove files of people who are no longer in the sheet
    for d in ("photos", "thumbs"):
        for f in (args.out / d).glob("*.jpg"):
            if f.stem not in taken:
                f.unlink()
    (args.out / "people.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    print(f"{len(out)} people in {len(city_fa_of)} cities and {len(province_fa_of)} provinces written to {args.out}")
    for w in warnings:
        print("  warning:", w)


if __name__ == "__main__":
    main()
