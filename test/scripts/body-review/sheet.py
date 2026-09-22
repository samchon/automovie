"""Compose a contact sheet: rows = states, columns = views. usage: sheet.py <frames-dir> <out.png> <mode> <state,...> [view,...]"""
import sys, os
from PIL import Image, ImageDraw
frames, out, mode, states = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split(",")
views = sys.argv[5].split(",") if len(sys.argv) > 5 else ["front", "left-three-quarter", "left", "back"]
cell = int(sys.argv[6]) if len(sys.argv) > 6 else 360
tiles = []
for s in states:
    row = []
    for v in views:
        p = os.path.join(frames, f"{s}-{v}-{mode}.png")
        im = Image.open(p).convert("RGB")
        w, h = im.size
        # crop to a centred column when the figure is tall
        im.thumbnail((cell, cell))
        row.append(im)
    tiles.append(row)
W = cell * len(views); H = (cell + 18) * len(states)
sheet = Image.new("RGB", (W, H), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for r, (s, row) in enumerate(zip(states, tiles)):
    y = r * (cell + 18)
    d.text((4, y + 2), s, fill=(230, 230, 230))
    for c, im in enumerate(row):
        sheet.paste(im, (c * cell + (cell - im.width) // 2, y + 18 + (cell - im.height) // 2))
sheet.save(out)
print(out, sheet.size)
