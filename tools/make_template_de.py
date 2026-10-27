#!/usr/bin/env python3
"""
Builds Template-de.jpg (German poster background) from the English Template.jpg.

It paints over the four English text blocks and draws the German text in their place,
so the flag, portrait, red lines and every coordinate used by index.html stay identical.

Usage:
    pip install pillow numpy opencv-python-headless
    python tools/make_template_de.py --template Template.jpg --fonts "C:/Windows/Fonts" --out Template-de.jpg

Fonts (installed with Microsoft Office on Windows):
    FRAHV.TTF  Franklin Gothic Heavy      (title, red line, black line)
    FRADM.TTF  Franklin Gothic Demi       (footer)

All positions below were measured on a 1823 px wide copy of Template.jpg and are scaled
to whatever size the input is, so a full-resolution Template.jpg gives a full-resolution result.
"""
import argparse, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

REF_W = 1823  # width of the copy the coordinates were measured on

TEXT = {
    'title': 'SAGT ES DER WELT',
    'red':   'IM IRAN GETÖTET',
    'black': 'BEI DEN LANDESWEITEN PROTESTEN IM JANUAR',
    'foot':  'FRANKFURT  •  7. NOVEMBER',
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--template', default='Template.jpg')
    ap.add_argument('--fonts', default='C:/Windows/Fonts')
    ap.add_argument('--out', default='Template-de.jpg')
    ap.add_argument('--min-width', type=int, default=4213,
                    help='upscale smaller inputs to at least this width (the live Template.jpg is about 4213 px)')
    args = ap.parse_args()

    heavy = os.path.join(args.fonts, 'FRAHV.TTF')
    demi = os.path.join(args.fonts, 'FRADM.TTF')

    src = Image.open(args.template).convert('RGB')
    out_w = max(src.width, args.min_width)
    out_h = round(src.height * out_w / src.width)
    img = src.resize((out_w, out_h), Image.LANCZOS) if out_w != src.width else src
    K = out_w / REF_W
    a = np.array(img).astype(np.float32)

    def S(v): return int(round(v * K))

    # ---- 1. remove the English text ----
    paper = a[S(600):S(700), S(420):S(1408)].mean(axis=(0, 1))
    a[S(86):S(382), S(420):S(1408)] = paper                     # TELL THE WORLD

    def erase(x0, y0, x1, y1):                                  # row-wise blend between both sides
        x0, y0, x1, y1 = S(x0), S(y0), S(x1), S(y1)
        for y in range(y0, y1):
            l = a[y, x0 - 6:x0 - 2].mean(axis=0); r = a[y, x1 + 2:x1 + 6].mean(axis=0)
            t = np.linspace(0, 1, x1 - x0)[:, None]
            a[y, x0:x1] = l * (1 - t) + r * t
    erase(160, 2198, 1672, 2334)    # KILLED DURING IRAN'S
    erase(90, 2333, 1745, 2440)     # NATIONWIDE PROTESTS IN JANUARY
    erase(470, 2472, 1355, 2542)    # FRANKFURT • 7 NOVEMBER (side lines kept)
    out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

    # ---- 2. draw the German text ----
    def ink_mask(text, fpath, size, tracking):
        f = ImageFont.truetype(fpath, size)
        asc, desc = f.getmetrics()
        m = Image.new('L', (int(f.getlength(text) + tracking * size * len(text) + size), asc + desc + size // 2), 0)
        d = ImageDraw.Draw(m)
        x = size // 4; base = asc + size // 4
        for i, c in enumerate(text):
            d.text((x, base), c, font=f, fill=255, anchor='ls')
            pair = text[i:i + 2]
            x += (f.getlength(pair) - f.getlength(text[i + 1]) if len(pair) == 2 else f.getlength(c)) + tracking * size
        return np.array(m), base

    def place(text, fpath, cap_top, baseline, cx, condense=1.0, ink_x=None, tracking=0.0, fill=(0, 0, 0),
              grad=None, halo=0, max_w=None, bold=0, dots=None):
        cap_top, baseline, cx = cap_top * K, baseline * K, cx * K
        max_w = max_w * K if max_w else None
        halo, bold = round(halo * K), round(bold * K)
        size = 600
        cap = -ImageFont.truetype(fpath, size).getbbox('H', anchor='ls')[1]
        arr, base = ink_mask(text, fpath, size, tracking)
        xs = np.where(arr > 40)[1]; arr = arr[:, xs.min():xs.max() + 1]
        sy = (baseline - cap_top) / cap
        w = (ink_x[1] - ink_x[0]) * K if ink_x else arr.shape[1] * sy * condense
        if max_w: w = min(w, max_w)
        h = int(round(arr.shape[0] * sy))
        m = cv2.resize(arr, (int(round(w)), h), interpolation=cv2.INTER_AREA)
        if bold: m = cv2.dilate(m, np.ones((1, bold * 2 + 1), np.uint8))
        top = int(round(baseline - base * sy))
        if dots:  # pull umlaut dots down close to the capitals and shrink them: (scale, gap in ref px)
            cap_row = int(round(cap_top - top)); scale, gap = dots[0], dots[1] * K
            n, lab, st, _ = cv2.connectedComponentsWithStats((m > 40).astype(np.uint8))
            new = m.copy()
            for i in range(1, n):
                x, y, dw, dh, _ = st[i]
                if y + dh <= cap_row:
                    sel = lab[y:y + dh, x:x + dw] == i
                    piece = np.where(sel, m[y:y + dh, x:x + dw], 0)
                    new[y:y + dh, x:x + dw][sel] = 0
                    pw, ph = max(1, int(dw * scale)), max(1, int(dh * scale))
                    piece = cv2.resize(piece, (pw, ph), interpolation=cv2.INTER_AREA)
                    nx, ny = x + (dw - pw) // 2, int(cap_row - gap - ph)
                    new[ny:ny + ph, nx:nx + pw] = np.maximum(new[ny:ny + ph, nx:nx + pw], piece)
            m = new
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
    place(TEXT['title'], heavy, 100, 367, cx=915, ink_x=(443, 1387), tracking=0.05, fill=(5, 5, 6), halo=4, bold=3)
    place(TEXT['red'], heavy, 2219, 2329, cx=916, tracking=0.015, grad=RED, halo=3, max_w=1520, dots=(0.78, 4))
    place(TEXT['black'], heavy, 2344, 2428, cx=916, condense=0.80, fill=(8, 7, 9), halo=3, max_w=1610)
    place(TEXT['foot'], demi, 2487, 2526, cx=912, condense=0.95, tracking=0.12, fill=(16, 14, 18), max_w=790)

    out.save(args.out, quality=95, subsampling=0)
    print(f'saved {args.out} ({out.width}x{out.height})')

if __name__ == '__main__':
    main()
