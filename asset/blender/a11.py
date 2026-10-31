# a11.py — 新光三越 信義新天地 A11 (Xinyi, across from the 101 podium) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/a11.py -- --out asset/models/src/a11.glb --stats --preview research/blender-detail/models/a11-preview.png
#
# Reference photos (research/reference/xinyi/img/, Wikimedia Commons):
#   A11-facade-2008.jpg       the road face: two pink-granite pier towers with pale stone bands at
#                             every floor, a glazed bay between them behind free-standing dark steel
#                             columns and deep floor beams, a thin flat roof cantilevered over it all.
#   A11-facade-2012.jpg,      the plaza side: open terraces at the 2F deck level with glass
#   A11-oblique-2008.jpg      balustrades and planters, the roof edge overgrown with a hedge,
#                             entrance canopies on slender steel, the skywalk deck tying in at 2F.
#   A11-signage-lightbox.jpg  the red 新光三越 / A11 pylon (text stays canvas in scene-tower.js).
#
# Scene contract (scene-tower.js, row "A11"): A11 = { x0: 14, x1: 30, z0: -403, z1: -385, h: 34, r: 6 }.
# The model is 16 × 18 × 34 stylised units with the origin on the ground at the footprint centre
# (world x 22, z -394). Blender +X = world +x, Blender -Y = world +z (toward the approach camera).
# So the road face (world x = x0 = 14) is Blender x = -8, the camera-side face (world z = z1) is
# Blender y = -9. Place with no rotation. The scene's r 6 rounded corner is NOT kept: no reference
# photo shows one, so the north-west corner is square, glazed behind a free-standing steel frame
# (road face y -9..-3, camera face x -8..4), and the footprint is the full 16 × 18 rectangle.
#
# Kept clear for the scene's own JS parts, which stay:
#   - the two LED screens on the road face (world x0-0.3, z -397, y 11–14.2 and 18–20.4): a flat
#     steel backing panel with frame lips sits behind them, Blender x -8, y -2.2..8.2, z 10.5..21.
#   - the SIGNS hboxes over the west canopy (wallX x0, y 4.7–5.4, z -400.5 / -396.5 / -392.6).
#   - the red logo board (x0-0.2, y 27.5–31.9, z -398.5).
#   - skywalk doors at deck height 6.5: on the road face at world z -392 (the road crossing) and on
#     the south face at world x 15.6 (the mall-front deck to z -409).
#
# Triangle budget 15,000.

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_solid_z, solid, cutter

# ── frame ────────────────────────────────────────────────────────────────────
X0, X1, Y0, Y1 = -8.0, 8.0, -9.0, 9.0         # footprint; Y0 is the camera side, X0 the road face
CY = -3.0                                     # the glazed corner runs from the road face's y -3 ...
TOP = 31.0                                    # granite towers
ROOF0, ROOF1 = 32.4, 33.2                     # the floating cantilever roof
H = 34.0
FLOORS = [6.5, 11.0, 15.5, 20.0, 24.5, 29.0]  # floor lines: 2F is the skywalk deck height
# The free-standing steel frame's colour. Lead, 2026-11-01: model the red exoskeleton seen in
# skywalk-span-IMG3190.jpg. Caveat: A11-facade-2008.jpg (the photo with the A11 plate on its pylon)
# shows the frame dark grey, so the red one may be the neighbouring A9; set 'ink' to go back.
STEEL = 'ink'
GLASS_IN = 1.6                                # the glass stands this far behind the steel line


def lpath(o):
    """The glazed corner's steel line, offset o outward (negative = inward): road face from y -3
    down to the square corner, then the camera face east to the granite pier at x 4."""
    return [(X0 - o, CY), (X0 - o, Y0 - o), (4.0, Y0 - o)]


def lband(bm, o_in, o_out, z0, z1):
    """An L-shaped strip wrapping the glazed corner between offsets o_in and o_out: beams, decks, rails."""
    bm_solid_z(bm, lpath(o_out) + lpath(o_in)[::-1], z0, z1)


def build():
    # ── granite pier towers ───────────────────────────────────────────────────
    # A: the road / south / back block (y >= -3); B: the camera-side pier east of the glazed bay.
    cuts = []
    # west ground-floor shopfronts under the canopy, one per SIGNS board (world z -400.5/-396.5/-392.6)
    for yc in (6.5, 2.5, -1.4):
        cuts.append(cutter(f'shop{yc}', 'glass', lambda bm, yc=yc: bm_box(bm, (1.0, 2.9, 4.0), (X0, yc, 2.0))))
    # skywalk doors at the 2F deck (y 6.5): road face at world z -392, south face at world x 15.6
    cuts.append(cutter('door_w', 'glass', lambda bm: bm_box(bm, (1.0, 2.4, 2.8), (X0, -1.7, 6.5 + 1.4))))
    cuts.append(cutter('door_s', 'glass', lambda bm: bm_box(bm, (2.4, 1.0, 2.8), (-6.4, Y1, 6.5 + 1.4))))
    # back service door and a south ground-floor entrance
    cuts.append(cutter('svc_e', 'ink', lambda bm: bm_box(bm, (1.0, 3.0, 3.6), (X1, 4.0, 1.8))))
    cuts.append(cutter('ent_s', 'glass', lambda bm: bm_box(bm, (4.0, 1.0, 4.0), (2.5, Y1, 2.0))))
    solid('granite_a', 'brick', lambda bm: bm_box(bm, (16, 12, TOP), (0, 3, TOP / 2)), cutters=cuts)
    cb = [cutter('ent_n', 'glass', lambda bm: bm_box(bm, (2.8, 1.0, 4.0), (6.0, Y0, 2.0)))]
    solid('granite_b', 'brick', lambda bm: bm_box(bm, (4.0, 6.2, TOP), (6.0, -6.0 + 0.1, TOP / 2)), cutters=cb)

    # pale stone bands at every floor line (the photo's horizontal banding), proud 0.1
    def bands(bm):
        for z in FLOORS:
            bm_box(bm, (16.2, 12.1, 0.32), (0, 3.05, z))
            bm_box(bm, (4.2, 6.2, 0.32), (6.05, -6.0, z))
        bm_box(bm, (16.3, 12.2, 0.5), (0, 3.05, TOP - 0.25))          # coping
        bm_box(bm, (4.3, 6.3, 0.5), (6.05, -6.0, TOP - 0.25))
    solid('bands', 'bone', bands, bevel=0.03)

    # the granite's dark vertical joints (the recessed slot on the photo's right tower)
    def joints(bm):
        for y in (0.5, 5.5):
            bm_box(bm, (0.04, 0.35, TOP - 1), (X1 + 0.02, y, (TOP - 1) / 2 + 0.5))
        for x in (-2.0, 3.0):
            bm_box(bm, (0.35, 0.04, TOP - 1), (x, Y1 + 0.02, (TOP - 1) / 2 + 0.5))
        bm_box(bm, (0.35, 0.04, TOP - 6.5), (6.0, Y0 - 0.02 + 0.1, (TOP - 6.5) / 2 + 5.0))
    solid('joints', 'ink', joints, bevel=0)

    # ── the glazed corner: glass behind a free-standing steel frame ───────────
    # The scene had a rounded corner (r 6) here; no reference photo shows one (facade-2008,
    # oblique-2008, facade-2012 all show square granite corners), so the corner is square and the
    # glazed bay wraps it: road face y -9..-3, camera face x -8..4.
    gi = -GLASS_IN
    glass_plan = [(4.0, CY), (4.0, Y0 + GLASS_IN), (X0 + GLASS_IN, Y0 + GLASS_IN), (X0 + GLASS_IN, CY)]
    solid('glass', 'glass', lambda bm: bm_solid_z(bm, glass_plan, 0, ROOF0), bevel=0.03)
    # clerestory between the granite top and the floating roof
    solid('clerestory', 'glass', lambda bm: (bm_box(bm, (15.0, 11.2, ROOF0 - TOP + 0.1), (0, 3.2, (TOP + ROOF0) / 2)),
                                              bm_box(bm, (3.4, 6.0, ROOF0 - TOP + 0.1), (6.0, -5.8, (TOP + ROOF0) / 2))), bevel=0)

    # mullions on the glass: square sections (bm_bar roll trap), every 1.5 between the columns
    COLS_W = [-6.0]                      # extra road-face columns (y); the corner and x -4.5/-1/2.5 below
    COLS_N = [-4.5, -1.0, 2.5]
    def mullions(bm):
        gx, gy = X0 + GLASS_IN - 0.04, Y0 + GLASS_IN - 0.04
        for y in (-4.5, -7.5):
            bm_box(bm, (0.09, 0.09, ROOF0), (gx, y, ROOF0 / 2))
        for x in (-6.25, -2.75, 0.75, 3.25):
            bm_box(bm, (0.09, 0.09, ROOF0), (x, gy, ROOF0 / 2))
        for z in [3.4] + [f + 2.25 for f in FLOORS]:                    # a transom halfway up every floor
            lband(bm, gi, gi + 0.07, z - 0.04, z + 0.04)
    solid('mullions', 'ink', mullions, bevel=0)

    # the steel frame standing free in front of the glass: columns and deep floor beams
    def steel(bm):
        bm_box(bm, (0.55, 0.55, ROOF0), (X0 + 0.3, Y0 + 0.3, ROOF0 / 2))  # the corner column
        for y in COLS_W:
            bm_box(bm, (0.55, 0.55, ROOF0), (X0 + 0.3, y, ROOF0 / 2))
        for x in COLS_N:
            bm_box(bm, (0.55, 0.55, ROOF0), (x, Y0 + 0.3, ROOF0 / 2))
    solid('columns', STEEL, steel, bevel=0.03)
    # the frame rises through the roof edge as an open crown (the 2006 photo's rooftop frame)
    def crown(bm):
        pts = [(X0 + 0.3, Y0 + 0.3)] + [(X0 + 0.3, y) for y in COLS_W] + [(x, Y0 + 0.3) for x in COLS_N]
        for x, y in pts:
            bm_box(bm, (0.45, 0.45, H - ROOF1), (x, y, (ROOF1 + H) / 2))
        lband(bm, -0.55, 0.0, H - 0.35, H)
    solid('crown', STEEL, crown, bevel=0.03)
    # outrigger arms at every floor, reaching past the column line (the photo's cantilever brackets)
    def outriggers(bm):
        for z in FLOORS[1:]:
            bm_box(bm, (1.3, 0.3, 0.3), (X0 - 0.35, Y0 + 0.3, z))
            bm_box(bm, (0.3, 1.3, 0.3), (X0 + 0.3, Y0 - 0.35, z))
            for y in COLS_W:
                bm_box(bm, (1.3, 0.3, 0.3), (X0 - 0.35, y, z))
            for x in COLS_N:
                bm_box(bm, (0.3, 1.3, 0.3), (x, Y0 - 0.35, z))
    solid('outriggers', STEEL, outriggers, bevel=0.03)
    def beams(bm):
        for z in FLOORS[1:] + [ROOF0 - 0.25]:
            lband(bm, gi, 0.05, z - 0.2, z + 0.25)
    solid('beams', STEEL, beams, bevel=0.03)
    # diagonal tie rods in the glazed bay (the photo's thin cross-bracing at the lower floors)
    def ties(bm):
        for (x0, x1) in ((-4.5, -1.0), (-1.0, 2.5)):
            bm_bar(bm, (x0, Y0 + 0.3, 6.6), (x1, Y0 + 0.3, 10.8), 0.06)
    solid('ties', STEEL, ties, bevel=0)

    # ── 2F terrace wrapping the glazed corner (the deck level), glass balustrade and planters ──
    solid('deck', 'haze', lambda bm: lband(bm, gi, 1.2, 6.25, 6.6), bevel=0.03)
    solid('rail', 'glass', lambda bm: lband(bm, 1.12, 1.18, 6.6, 7.7), bevel=0)
    solid('handrail', 'bone', lambda bm: lband(bm, 1.1, 1.2, 7.7, 7.8), bevel=0)
    solid('planter_box', 'walk', lambda bm: lband(bm, 0.45, 1.0, 6.6, 7.05), bevel=0.03)
    solid('deck_hedge', 'leaf', lambda bm: lband(bm, 0.5, 0.95, 7.05, 7.45), bevel=0.06)

    # ── entrance canopies ──────────────────────────────────────────────────────
    # road face, over the three shopfronts (the scene's canopy part at y 4.2)
    solid('canopy_w', 'glass', lambda bm: bm_box(bm, (2.8, 11.2, 0.12), (X0 - 1.4, 3.0, 4.32)), bevel=0)
    def canopy_w_frame(bm):
        bm_box(bm, (0.18, 11.4, 0.4), (X0 - 2.8, 3.0, 4.25))           # front edge beam
        for y in (-2.6, 8.6):
            bm_box(bm, (2.8, 0.15, 0.3), (X0 - 1.4, y, 4.3))
        for y in (-1.0, 3.0, 7.0):                                     # tie rods back to the wall
            bm_bar(bm, (X0 - 2.75, y, 4.45), (X0, y, 6.3), 0.07)
    solid('canopy_w_frame', 'ink', canopy_w_frame, bevel=0)
    # camera side, over the glazed bay's entrance
    solid('canopy_n', 'glass', lambda bm: bm_box(bm, (6.0, 2.0, 0.12), (1.0, Y0 - 0.4, 4.32)), bevel=0)
    def canopy_n_frame(bm):
        bm_box(bm, (6.2, 0.18, 0.4), (1.0, Y0 - 1.4, 4.25))
        for x in (-1.0, 3.0):
            bm_bar(bm, (x, Y0 - 1.35, 4.45), (x, Y0 + GLASS_IN, 6.2), 0.07)
    solid('canopy_n_frame', 'ink', canopy_n_frame, bevel=0)
    # door hoods over the two skywalk doors
    solid('hoods', 'ink', lambda bm: (bm_box(bm, (1.0, 3.0, 0.3), (X0 - 0.4, -1.7, 9.5)),
                                       bm_box(bm, (3.0, 1.0, 0.3), (-6.4, Y1 + 0.4, 9.5))), bevel=0.03)

    # ── the LED wall backing on the road face (screens themselves are canvas in the scene) ──
    solid('led_back', 'ink', lambda bm: bm_box(bm, (0.16, 10.4, 10.5), (X0 - 0.06, 3.0, 15.75)), bevel=0.03)
    def led_frames(bm):
        for (ya, yb, za, zb) in ((-1.95, 7.95, 10.8, 14.4), (-0.2, 6.2, 17.8, 20.6)):
            d, xc, t = 0.36, X0 - 0.14 - 0.18, 0.16
            bm_box(bm, (d, yb - ya + t, t), (xc, (ya + yb) / 2, za))
            bm_box(bm, (d, yb - ya + t, t), (xc, (ya + yb) / 2, zb))
            bm_box(bm, (d, t, zb - za), (xc, ya, (za + zb) / 2))
            bm_box(bm, (d, t, zb - za), (xc, yb, (za + zb) / 2))
    solid('led_frames', 'haze', led_frames, bevel=0.03)

    # ── the floating cantilever roof ───────────────────────────────────────────
    ov = 2.4                                                           # the photo's deep, thin cantilever
    rx0, rx1, ry0, ry1 = X0 - ov, X1 + 0.3, Y0 - ov, Y1 + 0.3
    solid('roof', 'haze', lambda bm: bm_box(bm, (rx1 - rx0, ry1 - ry0, ROOF1 - ROOF0), ((rx0 + rx1) / 2, (ry0 + ry1) / 2, (ROOF0 + ROOF1) / 2)))
    def soffit(bm):                                                    # ribs under the overhang
        for y in (-7.5, -4.5, -1.0, 2.0, 5.0, 8.0):
            bm_box(bm, (ov + 0.2, 0.12, 0.18), (X0 - ov / 2 + 0.1, y, ROOF0 - 0.09))
        for x in (-6.25, -2.75, 0.75, 4.0, 7.0):
            bm_box(bm, (0.12, ov + 0.2, 0.18), (x, Y0 - ov / 2 + 0.1, ROOF0 - 0.09))
        bm_box(bm, (rx1 - rx0, ry1 - ry0, 0.06), ((rx0 + rx1) / 2, (ry0 + ry1) / 2, ROOF0 - 0.02))   # dark underside
    solid('soffit', 'ink', soffit, bevel=0)
    def fascia(bm):                                                    # dark edge line of the roof slab
        bm_box(bm, (0.06, ry1 - ry0, 0.3), (rx0 - 0.03, (ry0 + ry1) / 2, ROOF0 + 0.4))
        bm_box(bm, (rx1 - rx0, 0.06, 0.3), ((rx0 + rx1) / 2, ry0 - 0.03, ROOF0 + 0.4))
    solid('fascia', 'ink', fascia, bevel=0)

    # ── roof: the hedge along the edge, plant rooms with louvres ───────────────
    def roof_hedge(bm):
        bm_box(bm, (0.7, ry1 - ry0 - 0.6, 0.55), (rx0 + 0.55, (ry0 + ry1) / 2 + 0.3, ROOF1 + 0.275))
        bm_box(bm, (rx1 - rx0 - 1.3, 0.7, 0.55), ((rx0 + rx1) / 2 + 0.35, ry0 + 0.55, ROOF1 + 0.275))
    solid('roof_hedge', 'leaf', roof_hedge, bevel=0.12)
    def plant(bm):
        bm_box(bm, (8.0, 6.0, H - ROOF1), (3.0, 4.0, (ROOF1 + H) / 2))
        bm_box(bm, (3.0, 3.0, H - ROOF1 - 0.2), (-4.0, 5.5, (ROOF1 + H - 0.2) / 2))
    solid('plant', 'walk', plant)
    def louvres(bm):
        for k in range(3):
            z = ROOF1 + 0.2 + k * 0.2
            bm_box(bm, (7.4, 0.06, 0.06), (3.0, 1.0 - 0.04, z))
            bm_box(bm, (0.06, 5.4, 0.06), (-1.0 - 0.04, 4.0, z))
    solid('louvres', 'ink', louvres, bevel=0)


S.run(build, camera=((-30.0, -50.0, 1.6), (0.0, 0.0, 16.0), 45))
