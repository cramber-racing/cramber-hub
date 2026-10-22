# Draws the installer artwork (NSIS Modern UI) from the Cramber logo and the
# app's display font. Run from Software/ after changing the logo:
#
#   uv run --with pillow --with fonttools --with brotli src-tauri/installer/make_images.py
#
# sidebar.bmp  164x314  welcome and finish pages
# header.bmp   150x57   top-right of the other pages

import io
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
FONT = ROOT / "node_modules/@fontsource-variable/lexend-zetta/files/lexend-zetta-latin-wght-normal.woff2"

BACKGROUND = (10, 10, 10)
FOREGROUND = (255, 255, 255)
MUTED = (105, 105, 105)
PRIMARY = (37, 99, 235)

# The logo (src/lib/components/layout/Logo.svelte) on a 200x200 grid: straight lines only.
LOGO = [(0, 83.18), (59.57, 186.36), (139.68, 186.36), (179.57, 117.27), (99.90, 117.27),
        (80.48, 83.64), (159.68, 83.64), (199.57, 14.55), (39.63, 14.55)]

SCALE = 4  # draw large, then shrink: smooth edges


def font(size, weight):
    woff = TTFont(FONT)
    woff.flavor = None
    data = io.BytesIO()
    woff.save(data)
    data.seek(0)
    f = ImageFont.truetype(data, size * SCALE)
    f.set_variation_by_axes([weight])
    return f


def logo(draw, x, y, size, color):
    k = size * SCALE / 200
    draw.polygon([((x * SCALE) + px * k, (y * SCALE) + py * k) for px, py in LOGO], fill=color)


def canvas(width, height, color):
    image = Image.new("RGB", (width * SCALE, height * SCALE), color)
    return image, ImageDraw.Draw(image)


def save(image, width, height, name):
    image.resize((width, height), Image.LANCZOS).save(OUT / name, "BMP")


def sidebar():
    w, h = 164, 314
    image, draw = canvas(w, h, BACKGROUND)
    logo(draw, 22, 34, 40, FOREGROUND)
    draw.text((22 * SCALE, 92 * SCALE), "CRAMBER", font=font(11, 700), fill=FOREGROUND)
    draw.text((22 * SCALE, 110 * SCALE), "HUB", font=font(11, 400), fill=MUTED)
    # Accent line and a large faint mark, like the app's cards.
    draw.rectangle([22 * SCALE, 140 * SCALE, 46 * SCALE, 142 * SCALE], fill=PRIMARY)
    logo(draw, 60, 200, 150, (22, 22, 22))
    save(image, w, h, "sidebar.bmp")


def header():
    w, h = 150, 57
    image, draw = canvas(w, h, (255, 255, 255))
    logo(draw, 112, 15, 27, BACKGROUND)
    save(image, w, h, "header.bmp")


sidebar()
header()
print(f"Wrote {OUT / 'sidebar.bmp'} and {OUT / 'header.bmp'}")
