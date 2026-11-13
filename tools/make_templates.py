#!/usr/bin/env python3
"""
Builds the poster background for every poster language from the English Template.jpg.

It paints over the English text blocks and draws each language's text in their place,
so the flag, portrait, red lines and every coordinate used by js/poster.js stay identical.
The text is drawn in Archivo (SIL OFL, tools/fonts/), so any language can be added here
without other fonts: add it to TEXT, run this script, and list it in CONFIG.templates.

    pip install pillow numpy opencv-python-headless
    python tools/make_templates.py                 # every language
    python tools/make_templates.py --only sv fr    # some of them

English keeps its original lettering; only the footer is replaced. Languages whose word for
"killed" depends on the person's gender (French, Spanish, Italian) get a second template,
Template-<lang>-f.jpg, with the feminine form.

All positions were measured on a 1823 px wide copy of Template.jpg and are scaled to the
size of the input, so the full-resolution Template.jpg gives full-resolution results.
"""
import argparse
import os
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

REF_W = 1823  # width of the copy the coordinates were measured on
FOOT = '#TELLTHEWORLD'
FONT = os.path.join(os.path.dirname(__file__), 'fonts', 'Archivo.ttf')

# title, red line, black line; a (masculine, feminine) pair where the red line changes with gender
TEXT = {
    'en': None,  # original lettering, new footer only
    'de': ('SAGT ES DER WELT', 'IM IRAN GETÖTET', 'BEI DEN LANDESWEITEN PROTESTEN IM JANUAR'),
    'sv': ('BERÄTTA FÖR VÄRLDEN', 'DÖDAD I IRAN', 'UNDER DE LANDSOMFATTANDE PROTESTERNA I JANUARI'),
    'fr': ('DITES-LE AU MONDE', ('TUÉ EN IRAN', 'TUÉE EN IRAN'), 'PENDANT LES MANIFESTATIONS NATIONALES DE JANVIER'),
    'it': ('DITELO AL MONDO', ('UCCISO IN IRAN', 'UCCISA IN IRAN'), 'DURANTE LE PROTESTE NAZIONALI DI GENNAIO'),
    'nl': ('VERTEL HET DE WERELD', 'GEDOOD IN IRAN', 'TIJDENS DE LANDELIJKE PROTESTEN IN JANUARI'),
    'es': ('CUÉNTALE AL MUNDO', ('ASESINADO EN IRÁN', 'ASESINADA EN IRÁN'), 'DURANTE LAS PROTESTAS NACIONALES DE ENERO'),
}


def font(size, weight, width):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight, width])
    return f


def build(src, title, red, black, keep_text=False):
    K = src.width / REF_W
    a = np.array(src).astype(np.float32)

    def S(v): return int(round(v * K))

    # ---- 1. remove the English text ----
    def erase(x0, y0, x1, y1):                                  # row-wise blend between both sides
        x0, y0, x1, y1 = S(x0), S(y0), S(x1), S(y1)
        for y in range(y0, y1):
            l = a[y, x0 - 6:x0 - 2].mean(axis=0); r = a[y, x1 + 2:x1 + 6].mean(axis=0)
            t = np.linspace(0, 1, x1 - x0)[:, None]
            a[y, x0:x1] = l * (1 - t) + r * t
    if not keep_text:
        paper = a[S(600):S(700), S(420):S(1408)].mean(axis=(0, 1))
        a[S(40):S(382), S(420):S(1408)] = paper                 # TELL THE WORLD (and room for accents above)
        erase(160, 2198, 1672, 2334)    # KILLED DURING IRAN'S
        erase(90, 2333, 1745, 2440)     # NATIONWIDE PROTESTS IN JANUARY
    erase(470, 2472, 1355, 2542)        # FRANKFURT • 7 NOVEMBER (side lines kept)
    out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

    # ---- 2. draw the new text ----
    def ink_mask(text, f, size, tracking):
        asc, desc = f.getmetrics()
        m = Image.new('L', (int(f.getlength(text) + tracking * size * len(text) + size), asc + desc + size), 0)
        d = ImageDraw.Draw(m)
        x = size // 4; base = asc + size // 2
        for i, c in enumerate(text):
            d.text((x, base), c, font=f, fill=255, anchor='ls')
            pair = text[i:i + 2]
            x += (f.getlength(pair) - f.getlength(text[i + 1]) if len(pair) == 2 else f.getlength(c)) + tracking * size
        return np.array(m), base

    def place(text, weight, cap_top, baseline, cx, ink_x=None, widths=(100, 90, 80, 70, 62), tracking=0.0,
              fill=(0, 0, 0), grad=None, halo=0, max_w=None):
        """Draw text between cap_top and baseline, centred on cx. Archivo's own width axis does most of the
        fitting (the widest width that fits, or for ink_x the one closest to it), so letters are squeezed or
        stretched as little as possible; accents above the capitals keep their proportions."""
        cap_top, baseline, cx = cap_top * K, baseline * K, cx * K
        target = (ink_x[1] - ink_x[0]) * K if ink_x else max_w * K
        halo = round(halo * K)
        size = 600
        best = None
        for wd in widths:
            f = font(size, weight, wd)
            cap = -f.getbbox('H', anchor='ls')[1]
            arr, base = ink_mask(text, f, size, tracking)
            xs = np.where(arr > 40)[1]; arr = arr[:, xs.min():xs.max() + 1]
            sy = (baseline - cap_top) / cap
            natural = arr.shape[1] * sy
            fits = natural <= target
            score = abs(natural - target) if ink_x else (0 if fits else natural - target)
            if best is None or score < best[0]:
                best = (score, arr, base, sy, natural, cap)
            if fits and not ink_x:
                break
        _, arr, base, sy, natural, cap = best
        w = target if ink_x else min(natural, target)
        sx = w / arr.shape[1]
        h = int(round(arr.shape[0] * sy))
        m = cv2.resize(arr, (int(round(w)), h), interpolation=cv2.INTER_AREA)
        top = int(round(baseline - base * sy))
        cap_row = int(round(cap_top - top))
        if abs(sx / sy - 1) > 0.05:          # accents and dots: undo the uneven scaling, keep them on top of the capitals
            n, lab, st, _ = cv2.connectedComponentsWithStats((m > 40).astype(np.uint8))
            fixed = m.copy()
            for i in range(1, n):
                x, y, dw, dh, _ = st[i]
                if y + dh <= cap_row + 2:
                    sel = lab[y:y + dh, x:x + dw] == i
                    piece = np.where(sel, m[y:y + dh, x:x + dw], 0)
                    fixed[y:y + dh, x:x + dw][sel] = 0
                    ph = max(1, int(round(dh * sx / sy)))
                    piece = cv2.resize(piece, (dw, ph), interpolation=cv2.INTER_AREA)
                    gap = cap_row - (y + dh)
                    ny = max(0, cap_row - gap - ph)
                    fixed[ny:ny + ph, x:x + dw] = np.maximum(fixed[ny:ny + ph, x:x + dw], piece)
            m = fixed
        left = int(round(cx - m.shape[1] / 2))
        mask = Image.fromarray(m)
        if halo:
            k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (halo * 2 + 1, halo * 2 + 1))
            out.paste((255, 255, 250), (left, top), Image.fromarray(cv2.GaussianBlur(cv2.dilate(m, k), (0, 0), halo * 0.5)))
        if grad:
            pos, stops = np.array(grad[0]), np.array(grad[1], np.float32)
            rel = np.clip((np.arange(m.shape[0]) + top - cap_top) / (baseline - cap_top), 0, 1)
            g = np.zeros((m.shape[0], m.shape[1], 3), np.uint8)
            for ch in range(3): g[:, :, ch] = np.interp(rel, pos, stops[:, ch])[:, None]
            out.paste(Image.fromarray(g), (left, top), mask)
        else:
            out.paste(fill, (left, top), mask)

    RED = ([0, 0.12, 0.5, 0.85, 1], [(208, 23, 42), (226, 8, 26), (205, 7, 22), (168, 5, 14), (150, 15, 25)])
    if not keep_text:
        place(title, 900, 100, 367, cx=915, ink_x=(443, 1387), widths=(62, 66, 70, 75), tracking=0.03, fill=(5, 5, 6), halo=4)
        place(red, 900, 2219, 2329, cx=916, tracking=0.01, grad=RED, halo=3, max_w=1520)
        place(black, 900, 2344, 2428, cx=916, tracking=0.01, fill=(8, 7, 9), halo=3, max_w=1610)
    place(FOOT, 600, 2487, 2526, cx=912, widths=(100,), tracking=0.12, fill=(16, 14, 18), max_w=790)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--template', default='Template.jpg')
    ap.add_argument('--only', nargs='*', help='languages to build (default: all)')
    args = ap.parse_args()
    src = Image.open(args.template).convert('RGB')
    for lang, t in TEXT.items():
        if args.only and lang not in args.only:
            continue
        if t is None:
            out = build(src, None, None, None, keep_text=True)
            out.save('Template-en.jpg', quality=90, subsampling=0)
            print('saved Template-en.jpg')
            continue
        title, red, black = t
        for red_text, suffix in ((red, ''),) if isinstance(red, str) else ((red[0], ''), (red[1], '-f')):
            name = f'Template-{lang}{suffix}.jpg'
            build(src, title, red_text, black).save(name, quality=90, subsampling=0)
            print('saved', name)


if __name__ == '__main__':
    main()
