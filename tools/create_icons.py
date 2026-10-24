from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
out = ROOT / 'src' / 'icons'
out.mkdir(parents=True, exist_ok=True)

for size in (16, 32, 48, 128):
    image = Image.new('RGBA', (size, size), '#121722')
    draw = ImageDraw.Draw(image)
    radius = max(2, size // 6)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill='#2f67d8')
    pad = max(2, size // 5)
    triangle = [(pad, pad), (pad, size - pad), (size - pad, size // 2)]
    draw.polygon(triangle, fill='#ffffff')
    bar_width = max(1, size // 16)
    for index, height in enumerate((0.25, 0.48, 0.72, 0.9)):
        x = size - pad - (index + 1) * (bar_width + max(1, size // 32))
        top = size - pad - round((size - 2 * pad) * height)
        draw.rectangle((x, top, x + bar_width, size - pad), fill='#a9c7ff')
    image.save(out / f'{size}.png')
print('icons generated')
