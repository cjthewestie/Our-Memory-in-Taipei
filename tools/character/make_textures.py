# make_textures.py — paints the Noodles girl's face and her sweater front as flat illustration textures.
# The face is DRAWN, not modelled: flat painted eyes read as the character on CJ's sheet
# (Eagle: illustration-noodles-girl-three-views-warm-tones), where glossy 3D eyeballs read as a doll.
# Run with the system Python (needs Pillow):  python3 tools/character/make_textures.py <out_dir>
import sys, math, random
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
S = 2048                                    # drawn large, saved at half size for clean edges
SKIN, SKIN_SHADE, INK = (246, 184, 150), (226, 122, 86), (22, 17, 16)
# The head is a ball about 0.36 m across; the texture is a straight-on view of its front.
# u = 0.5 + x / 0.36, v = 0.5 + (z - head centre) / 0.36   (x to her left, z up)
def px(x, z): return (S * (0.5 + x / 0.36), S * (0.5 - z / 0.36))
def m(d): return d / 0.36 * S                # metres to pixels

img = Image.new('RGB', (S, S), SKIN)
# soft warm shading: under the eyes, the cheeks, the nose
soft = Image.new('RGBA', (S, S), (0, 0, 0, 0)); sd = ImageDraw.Draw(soft)
def blob(x, z, rx, rz, col, a):
    cx, cy = px(x, z); sd.ellipse([cx - m(rx), cy - m(rz), cx + m(rx), cy + m(rz)], fill=(*col, a))
for sx in (1, -1):
    blob(sx * 0.082, -0.058, 0.034, 0.02, SKIN_SHADE, 120)      # cheeks
blob(0.004, -0.042, 0.012, 0.009, SKIN_SHADE, 170)              # nose
img.paste(Image.alpha_composite(img.convert('RGBA'), soft.filter(ImageFilter.GaussianBlur(S * 0.012))).convert('RGB'))
d = ImageDraw.Draw(img)

EX, EZ, EW, EH = 0.066, -0.028, 0.04, 0.037                      # eye centre (x, z from head centre), half width, half height
for sx in (1, -1):
    cx, cy = px(sx * EX, EZ); w, h = m(EW), m(EH)
    # the white, then a large blue iris, dark at the top and lighter below
    d.ellipse([cx - w, cy - h, cx + w, cy + h], fill=(250, 240, 224))
    iw, ih = w * 0.66, h * 0.92; ix = cx - sx * w * 0.06
    iris = Image.new('RGB', (int(iw * 2) + 2, int(ih * 2) + 2)); idr = ImageDraw.Draw(iris)
    for yy in range(iris.height):
        t = yy / iris.height; idr.line([(0, yy), (iris.width, yy)], fill=(int(24 + 58 * t), int(40 + 84 * t), int(96 + 96 * t)))
    mask = Image.new('L', iris.size, 0); ImageDraw.Draw(mask).ellipse([0, 0, iris.width - 1, iris.height - 1], fill=255)
    img.paste(iris, (int(ix - iw), int(cy - ih)), mask); d = ImageDraw.Draw(img)
    d.ellipse([ix - iw * 0.46, cy - ih * 0.42, ix + iw * 0.46, cy + ih * 0.5], fill=(16, 22, 52))        # pupil
    d.ellipse([ix - iw * 0.62, cy - ih * 0.5, ix - iw * 0.2, cy - ih * 0.12], fill=(255, 255, 255))       # highlight
    d.ellipse([ix + iw * 0.2, cy + ih * 0.3, ix + iw * 0.42, cy + ih * 0.5], fill=(190, 214, 255))
    # the upper lid: a flat, heavy line that cuts the top of the eye, which gives her the calm half-lidded look
    lid = cy - h * 0.46
    d.rectangle([cx - w * 1.3, cy - h * 1.3, cx + w * 1.3, lid], fill=SKIN)
    d.polygon([(cx - sx * w * 1.02, lid + h * 0.22), (cx - sx * w * 0.5, lid - h * 0.16), (cx + sx * w * 0.6, lid - h * 0.2), (cx + sx * w * 1.3, lid - h * 0.02),
               (cx + sx * w * 1.52, lid - h * 0.42), (cx + sx * w * 1.18, lid + h * 0.26), (cx + sx * w * 0.5, lid + h * 0.12), (cx - sx * w * 0.5, lid + h * 0.14)], fill=INK)
    for k in (0.9, 1.12):                                                                                   # two lashes at the outer corner
        d.line([(cx + sx * w * k, lid + h * 0.1), (cx + sx * w * (k + 0.3), lid - h * 0.06 + h * 0.36 * (k - 0.9))], fill=INK, width=int(m(0.0035)))
    d.arc([cx - w * 0.9, cy - h * 0.2, cx + w * 0.9, cy + h * 1.02], 25 if sx > 0 else 95, 85 if sx > 0 else 155, fill=INK, width=int(m(0.0028)))   # a short lower lash line
    # the brow: a thick dark oval, high on the forehead and tilted
    bx, by = px(sx * 0.06, 0.062); brow = Image.new('RGBA', (int(m(0.07)), int(m(0.04))), (0, 0, 0, 0))
    ImageDraw.Draw(brow).ellipse([m(0.008), m(0.006), m(0.062), m(0.034)], fill=(*INK, 255))
    brow = brow.rotate(sx * -14, resample=Image.BICUBIC, expand=True); img.paste(brow, (int(bx - brow.width / 2), int(by - brow.height / 2)), brow); d = ImageDraw.Draw(img)
    random.seed(7 + sx)
    for _ in range(7):                                                                                      # freckles
        fx, fy = px(sx * (0.07 + random.uniform(-0.028, 0.028)), -0.064 + random.uniform(-0.012, 0.012)); r = m(random.uniform(0.0018, 0.0028))
        d.ellipse([fx - r, fy - r, fx + r, fy + r], fill=(196, 104, 74))
# a small, slightly lopsided smile
mx, my = px(0.006, -0.088)
d.arc([mx - m(0.02), my - m(0.02), mx + m(0.02), my + m(0.008)], 25, 150, fill=(120, 52, 40), width=int(m(0.0034)))
img.resize((1024, 1024), Image.LANCZOS).save(f'{OUT}/face.png')

# ── the sweater front: cream knit with a noodle-bowl mark on the chest ───────────────────────────
# (CJ's sheet shows a three-circle mouse head there. That shape is Disney's mark, so the brand's own
# bowl stands in.)   u = 0.5 + x / 0.6, v = (z - 0.50) / 0.6
T = 2048; sw = Image.new('RGB', (T, T), (238, 224, 196)); s = ImageDraw.Draw(sw)
random.seed(3)
for i in range(0, T, 14): s.line([(i, 0), (i, T)], fill=(231, 216, 187), width=3)          # knit ribs, faint
cx, cy = T * 0.5, T * (1 - (0.80 - 0.50) / 0.6); u = T / 0.6
s.pieslice([cx - 0.055 * u, cy - 0.05 * u, cx + 0.055 * u, cy + 0.05 * u], 0, 180, fill=INK)         # the bowl
s.rectangle([cx - 0.06 * u, cy - 0.006 * u, cx + 0.06 * u, cy + 0.004 * u], fill=INK)                # its rim
s.rectangle([cx - 0.022 * u, cy + 0.045 * u, cx + 0.022 * u, cy + 0.056 * u], fill=INK)              # its foot
for dx in (0.012, 0.03):                                                                              # chopsticks
    s.line([(cx + (dx - 0.012) * u, cy - 0.004 * u), (cx + (dx + 0.036) * u, cy - 0.078 * u)], fill=INK, width=int(0.007 * u))
for k in (-0.03, -0.012):                                                                             # two curls of steam
    pts = [(cx + (k + 0.008 * math.sin(t * 5)) * u, cy - (0.016 + t * 0.05) * u) for t in [i / 20 for i in range(21)]]
    s.line(pts, fill=INK, width=int(0.005 * u), joint='curve')
sw.resize((1024, 1024), Image.LANCZOS).save(f'{OUT}/sweater.png')
print('wrote', OUT + '/face.png', OUT + '/sweater.png')
