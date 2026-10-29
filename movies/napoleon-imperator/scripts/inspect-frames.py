"""Make readable contact sheets from the actual public capture-session probes.

These samples expose stage/framing faults. They do not replace whole playback.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
film = json.loads((root / "public/film.json").read_text(encoding="utf-8"))
output = root / "public/outputs/episode-one"
for offset in range(0, len(film["shots"]), 12):
    sheet = Image.new("RGB", (1280, 4*205), "#111722")
    draw = ImageDraw.Draw(sheet)
    for i, shot in enumerate(film["shots"][offset:offset+12]):
        x, y = i%3*426, i//3*205
        image = Image.open(output / f"probe-{shot['id']}-middle.png").convert("RGB")
        image.thumbnail((420, 176))
        sheet.paste(image, (x, y+24))
        draw.text((x+8,y+5), f"{shot['start']:.2f}s · {shot['unit']} / {shot['id']}",fill="#eee0c6")
    sheet.save(output / f"inspection-sheet-{offset//12+1}.jpg", quality=93)
