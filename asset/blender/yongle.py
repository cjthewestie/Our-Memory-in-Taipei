# yongle.py — 永樂市場 (Yongle Market, 1982) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/yongle.py -- --out asset/models/src/yongle.glb --stats --preview research/blender-detail/models/yongle-preview.png
#
# Reference (research/reference/dadao/sources.md, photos yongle-01..08, Wikimedia Commons): the street
# face is NOT a plain pale block. A two-storey podium wraps the front and both sides: an open
# arcade on pink-granite piers (about 0.7 m square, grey granite bands, plinths and caps), a grey
# concrete fascia over the arcade, an upper storey of red brick with slit windows (front) and
# timber-shuttered windows (sides), a band of square vent holes under the parapet, a grey beam and
# parapet, a stepped brick crenellation on the wings, diamond medallions on the parapets, and over
# the wide centre bay an open balcony behind a concrete upstand, a raised name panel and a small
# triangular pediment with a scroll cartouche (yongle-01, -03, -04, -05). Behind it the beige
# concrete market tower rises with continuous ribbon windows (yongle-02), its top two floors
# stepped in, a sign frame, plant room and water tanks on the roof. The front-left corner carries
# a stair tower whose face holds the vertical 永樂市場 sign.
#
# Scene contract (scene-dadao.js ~412-436): the glb is placed at world (xf -9.3, 0, zc -274) with
# rotation.y = +π/2, so Blender -Y → world +x (toward the road) and Blender +X → world -z. The
# front face is the plane y = 0, the building runs into +y (16 m deep), the 22 m frontage runs
# along X about 0. Origin on the ground at the front face's centre. The canvas signs stay in the
# scene and need flat faces here (worked out from SIGNAGE.light in scene-dadao.js):
#   vertical 永樂市場   — X -9.78..-9.03, z 6.0..13.0, y -0.98..-0.23, bracket at y -0.065
#                          → the stair-tower face and the sign fin (front at y -0.05)
#   永樂布業商場 board  — X ±4.23, z 4.5..5.8, y -0.22..-0.08, mounted to y +0.08 → the balcony upstand
#   rooftop 永樂市場    — X ±4.05, z 24.6..26.4, y 3.93..4.07, mounted to y 4.23 → the roof sign frame
#                          (posts at y 4.3) on the upper roof, whose top is 24.5
# Units are the scene's stylised metres; the photos give the proportions.

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_prism, bm_solid, solid, cutter

# ── dimensions ───────────────────────────────────────────────────────────────
HALF_W = 11.0            # half the frontage (22 m along X)
DEPTH = 16.0             # the block runs y 0..16
ARC_TOP = 3.6            # arcade clear height (ceiling underside)
FASCIA = (3.6, 4.4)      # grey fascia band over the arcade
UP = (4.4, 7.0)          # brick upper storey of the podium
BEAM = (7.0, 7.5)        # grey beam at the podium top
PARA = (7.5, 8.0)        # parapet rim
HALL_HW = 8.6            # the market hall inside the arcades: x ±8.6, y 3..16
HALL_Y0 = 3.0
PIER = 0.7
FRONT_PIERS = (-10.75, -7.3, -4.75, 4.75, 7.3, 10.75)   # corner, flank, centre (centre bay 9.5 c/c)
SIDE_PIER_Y = (3.4, 6.6, 9.8, 13.0, 15.6)
SIDE_WIN_Y = (1.85, 5.0, 8.2, 11.4, 14.3)

T_HW, T_Y0, T_Y1 = 10.4, 3.0, 15.6      # tower behind the podium
T_Z0, T_FLOORS, T_FH = 7.5, 3, 3.4      # → 17.7
T_TOP = T_Z0 + T_FLOORS * T_FH
U_HW, U_Y0 = 8.0, 3.6                   # stepped-in top floors
U_FLOORS, U_FH = 2, 3.3                 # → 24.3, roof slab top 24.5
U_TOP = T_TOP + U_FLOORS * U_FH
ROOF = U_TOP + 0.2

ST_X0, ST_X1, ST_TOP = -11.0, -8.0, 14.3   # front-left stair tower (carries the vertical sign)


# ─────────────────────────────────────────────────────────────────────────────
# ground floor: the hall behind the arcades, its shop openings and roller shutters
# ─────────────────────────────────────────────────────────────────────────────
FRONT_SHOPS = [(-6.7, True), (-3.9, False), (-1.2, None), (1.6, True), (4.4, False), (7.1, True)]   # None = the open stair entrance
SIDE_SHOPS = [(5.0, True), (8.2, False), (11.4, True), (14.3, False)]
SHOP_W, SHOP_H = 2.3, 2.75


def shutter_h(down):
    return SHOP_H - 0.1 if down else 1.2


def ground_floor():
    def hall(bm):
        bm_box(bm, (2 * HALL_HW, DEPTH - HALL_Y0, ARC_TOP), (0, (HALL_Y0 + DEPTH) / 2, ARC_TOP / 2))

    def openings(bm):
        for x, down in FRONT_SHOPS:
            depth = 6.0 if down is None else 1.0               # the stair entrance runs deep into the hall
            bm_box(bm, (SHOP_W, depth, SHOP_H), (x, HALL_Y0 - 0.5 + depth / 2, SHOP_H / 2 - 0.05))
        for y, _ in SIDE_SHOPS:
            for s in (-1, 1):
                bm_box(bm, (1.0, SHOP_W, SHOP_H), (s * HALL_HW, y, SHOP_H / 2 - 0.05))
    solid('hall', 'walk', hall, bevel=0.03, cutters=(cutter('shop_openings', 'ink', openings),))

    # roller shutters: a haze panel set in the opening (down = full, half = upper part) with ribs,
    # and the shutter box over every opening (yongle-02, the ground floor on the side street)
    def shutters(bm):
        for x, down in FRONT_SHOPS:
            if down is None:
                continue
            h = shutter_h(down)
            bm_box(bm, (SHOP_W - 0.04, 0.06, h), (x, HALL_Y0 + 0.15, SHOP_H - 0.1 - h / 2))
        for y, down in SIDE_SHOPS:
            h = shutter_h(down)
            for s in (-1, 1):
                bm_box(bm, (0.06, SHOP_W - 0.04, h), (s * (HALL_HW - 0.15), y, SHOP_H - 0.1 - h / 2))
    solid('shutters', 'haze', shutters, bevel=0.0)

    def ribs(bm):
        for x, down in FRONT_SHOPS:
            if down is None:
                continue
            h = shutter_h(down)
            z = SHOP_H - 0.25
            while z > SHOP_H - 0.1 - h + 0.1:
                bm_box(bm, (SHOP_W - 0.1, 0.04, 0.035), (x, HALL_Y0 + 0.11, z))
                z -= 0.4
        for y, down in SIDE_SHOPS:
            h = shutter_h(down)
            z = SHOP_H - 0.25
            while z > SHOP_H - 0.1 - h + 0.1:
                for s in (-1, 1):
                    bm_box(bm, (0.04, SHOP_W - 0.1, 0.035), (s * (HALL_HW - 0.11), y, z))
                z -= 0.4
    solid('shutter_ribs', 'bone', ribs, bevel=0.0)

    def boxes(bm):
        for x, _ in FRONT_SHOPS:
            bm_box(bm, (SHOP_W + 0.2, 0.36, 0.34), (x, HALL_Y0 - 0.18, SHOP_H + 0.12))
        for y, _ in SIDE_SHOPS:
            for s in (-1, 1):
                bm_box(bm, (0.36, SHOP_W + 0.2, 0.34), (s * (HALL_HW + 0.18), y, SHOP_H + 0.12))
    solid('shutter_boxes', 'haze', boxes, bevel=0.03)

    # the stair up from the open entrance (yongle-01 centre): a flight inside the hall
    def stair(bm):
        for i in range(8):
            bm_box(bm, (2.0, 0.34, 0.3), (-1.2, HALL_Y0 + 0.6 + i * 0.34, 0.15 + i * 0.3))
    solid('entrance_stair', 'haze', stair, bevel=0.0)

    solid('arcade_ceiling', 'walk', lambda bm: bm_box(bm, (2 * HALF_W, DEPTH, 0.16), (0, DEPTH / 2, ARC_TOP + 0.08)), bevel=0.03)


# ─────────────────────────────────────────────────────────────────────────────
# the granite piers: plinth, shaft with grey bands, cap
# ─────────────────────────────────────────────────────────────────────────────
def pier_spots():
    """(x, y, size, top) for every pier."""
    out = []
    for x in FRONT_PIERS:
        corner = abs(x) > 10
        top = 9.0 if abs(x) < 5 else 8.7
        out.append((x, 0.25 if corner else 0.15, 0.9 if corner else PIER, top))
    for y in SIDE_PIER_Y:
        for s in (-1, 1):
            out.append((s * 10.85, y, PIER, 8.2))
    return out


def piers():
    spots = pier_spots()

    def shafts(bm):
        for x, y, sz, top in spots:
            bm_box(bm, (sz, sz, top), (x, y, top / 2))
    solid('piers', 'walk', shafts, bevel=0.03)

    def bands(bm):
        for x, y, sz, top in spots:
            bm_box(bm, (sz + 0.14, sz + 0.14, 0.5), (x, y, 0.25))                  # plinth
            for z in (1.3, 2.5, 5.0, 6.2):                                          # grey granite bands
                bm_box(bm, (sz + 0.05, sz + 0.05, 0.1), (x, y, z))
            bm_box(bm, (sz + 0.16, sz + 0.16, 0.18), (x, y, top + 0.09))           # cap
    solid('pier_bands', 'haze', bands, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# the brick upper storey of the podium, its windows, vents, sills and shutters
# ─────────────────────────────────────────────────────────────────────────────
FRONT_SLITS = [-8.25, -6.45, -5.6, 5.6, 6.45, 8.2, 8.95, 9.7]
SLIT_W, SLIT_Z = 0.45, (5.0, 6.2)
VENT_Z = 6.62
SIDE_WIN_W, SIDE_WIN_Z = 1.1, (5.0, 6.5)


def vent_xs():
    xs = []
    for a, b in ((-7.3, -4.75), (4.75, 7.3), (7.3, 10.25)):
        lo, hi = a + 0.6, b - 0.6
        n = int((hi - lo) // 0.55)
        xs += [lo + (hi - lo) * i / n for i in range(n + 1)]
    return xs


def upper_storey():
    z0, z1 = UP
    zb = ARC_TOP + 0.16

    def body(bm):
        bm_box(bm, (2 * HALF_W, DEPTH, z1 - zb), (0, DEPTH / 2, (zb + z1) / 2))

    def balcony(bm):                                             # the open centre bay
        bm_box(bm, (8.7, 1.9, 3.0), (0, 0.45, 5.9))

    def windows(bm):
        for x in FRONT_SLITS:
            bm_box(bm, (SLIT_W, 0.8, SLIT_Z[1] - SLIT_Z[0]), (x, 0.0, sum(SLIT_Z) / 2))
        for x in vent_xs():
            bm_box(bm, (0.16, 0.5, 0.16), (x, 0.0, VENT_Z))
        for y in SIDE_WIN_Y:
            for s in (-1, 1):
                bm_box(bm, (0.8, SIDE_WIN_W, SIDE_WIN_Z[1] - SIDE_WIN_Z[0]), (s * HALF_W, y, sum(SIDE_WIN_Z) / 2))
    solid('upper_storey', 'brick', body,
          cutters=(cutter('balcony_recess', 'ink', balcony), cutter('upper_windows', 'ink', windows)))

    # the balcony: concrete upstand carrying the 永樂布業商場 board, two brick piers dividing the
    # opening into three (yongle-01), a stone coping on the upstand
    solid('balcony_upstand', 'haze', lambda bm: bm_box(bm, (8.7, 0.35, 5.95 - z0), (0, 0.175, (z0 + 5.95) / 2)), bevel=0.03)
    solid('balcony_coping', 'walk', lambda bm: bm_box(bm, (8.8, 0.45, 0.1), (0, 0.17, 6.0)), bevel=0.0)

    def bpiers(bm):
        for x in (-1.45, 1.45):
            bm_box(bm, (0.55, 0.55, z1 - 6.05), (x, 1.05, (6.05 + z1) / 2))
    solid('balcony_piers', 'brick', bpiers, bevel=0.03)

    def sills(bm):
        for x in FRONT_SLITS:
            bm_box(bm, (SLIT_W + 0.2, 0.22, 0.1), (x, -0.06, SLIT_Z[0] - 0.05))       # granite sill
            bm_box(bm, (SLIT_W + 0.12, 0.12, 0.12), (x, -0.02, SLIT_Z[1] + 0.06))    # lintel
        for y in SIDE_WIN_Y:
            for s in (-1, 1):
                bm_box(bm, (0.22, SIDE_WIN_W + 0.2, 0.1), (s * (HALF_W + 0.06), y, SIDE_WIN_Z[0] - 0.05))
                bm_box(bm, (0.12, SIDE_WIN_W + 0.12, 0.12), (s * (HALF_W + 0.02), y, SIDE_WIN_Z[1] + 0.06))
    solid('window_stone', 'walk', sills, bevel=0.0)

    def leaves(bm):                                              # timber shutters folded open (yongle-04)
        for y in SIDE_WIN_Y:
            for s in (-1, 1):
                for d in (-1, 1):
                    bm_box(bm, (0.06, 0.42, 1.45), (s * (HALF_W + 0.05), y + d * (SIDE_WIN_W / 2 + 0.24), sum(SIDE_WIN_Z) / 2))
    solid('shutter_leaves', 'ink', leaves, bevel=0.0)

    def glazing(bm):                                             # a pale glazing bar in each slit
        for x in FRONT_SLITS:
            bm_box(bm, (0.05, 0.05, SLIT_Z[1] - SLIT_Z[0]), (x, 0.1, sum(SLIT_Z) / 2))
            bm_box(bm, (SLIT_W, 0.05, 0.05), (x, 0.1, SLIT_Z[0] + 0.75))
    solid('slit_bars', 'bone', glazing, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# grey bands: fascia, beam, parapet with cap; crenellation, medallions, pediment
# ─────────────────────────────────────────────────────────────────────────────
def bands_and_parapet():
    def grey(bm):
        for z0, z1 in (FASCIA, BEAM):
            h = z1 - z0
            bm_box(bm, (2 * HALF_W + 0.3, 0.45, h), (0, 0.075, (z0 + z1) / 2))                    # front y -0.15..0.3
            for s in (-1, 1):
                bm_box(bm, (0.45, DEPTH, h), (s * (HALF_W - 0.075), DEPTH / 2, (z0 + z1) / 2))
        z0, z1 = PARA
        bm_box(bm, (2 * HALF_W, 0.3, z1 - z0), (0, 0.15, (z0 + z1) / 2))
        for s in (-1, 1):
            bm_box(bm, (0.3, DEPTH, z1 - z0), (s * (HALF_W - 0.15), DEPTH / 2, (z0 + z1) / 2))
        bm_box(bm, (2 * HALF_W, 0.3, z1 - z0), (0, DEPTH - 0.15, (z0 + z1) / 2))
        bm_box(bm, (2 * HALF_W, DEPTH, 0.2), (0, DEPTH / 2, BEAM[1] - 0.1))                    # podium roof deck
    solid('grey_bands', 'haze', grey, bevel=0.04)

    def cap(bm):
        z = PARA[1] + 0.05
        bm_box(bm, (2 * HALF_W + 0.2, 0.5, 0.1), (0, 0.1, z))
        for s in (-1, 1):
            bm_box(bm, (0.5, DEPTH + 0.2, 0.1), (s * (HALF_W - 0.1), DEPTH / 2, z))
        bm_box(bm, (2 * HALF_W + 0.2, 0.5, 0.1), (0, DEPTH - 0.1, z))
    solid('parapet_cap', 'walk', cap, bevel=0.0)

    def merlons(bm):                                             # stepped brick crenellation (yongle-01 right wing)
        for x0, x1 in ((7.75, 10.25), (-7.0, -5.3), (5.3, 7.0)):
            n = 4 if x1 - x0 > 2 else 3
            for i in range(n):
                x = x0 + (x1 - x0) * (i + 0.5) / n
                h = 0.55 if i % 2 == 0 else 0.35
                bm_box(bm, (0.42, 0.3, h), (x, 0.15, PARA[1] + 0.1 + h / 2))
        for y in (2.0, 5.0, 11.0, 14.0):                         # and along both sides
            for s in (-1, 1):
                bm_box(bm, (0.3, 0.9, 0.45), (s * (HALF_W - 0.15), y, PARA[1] + 0.1 + 0.225))
    solid('merlons', 'brick', merlons, bevel=0.0)

    def medallions(bm):                                          # diamond medallions on the parapets (yongle-03)
        r = 0.42
        pts = [(0, -r), (r, 0), (0, r), (-r, 0)]
        zc = (BEAM[0] + PARA[1]) / 2
        for s in (-1, 1):
            m = S.Matrix.Translation((s * (HALF_W + 0.02), 8.2, zc)) @ S.Matrix.Rotation(math.pi / 2, 4, 'Z')
            bm_solid(bm, pts, -0.08, 0.08, xform=m)
        for x in (-6.0, 6.0, 9.0):
            m = S.Matrix.Translation((x, -0.17, zc))
            bm_solid(bm, [(px * 0.7, pz * 0.7) for px, pz in pts], -0.05, 0.05, xform=m)
    solid('medallions', 'walk', medallions, bevel=0.0)


def pediment():
    """Over the centre bay: the raised name panel, cornice, triangular pediment, cartouche."""
    def panel(bm):
        bm_box(bm, (10.3, 0.55, 1.3), (0, 0.12, 8.65))                            # 8.0..9.3
        bm_solid(bm, [(-4.7, 9.45), (4.7, 9.45), (0, 10.7)], -0.05, 0.45)         # the gable
    solid('pediment', 'haze', panel, bevel=0.04)

    def trim(bm):
        bm_box(bm, (6.8, 0.12, 0.85), (0, -0.2, 8.65))                            # raised name panel (blank)
        bm_box(bm, (11.0, 0.8, 0.16), (0, 0.1, 9.38))                             # cornice
        bm_bar(bm, (-5.1, -0.22, 9.4), (0.0, -0.22, 10.85), 0.18)                 # raking mouldings (square: roll-safe)
        bm_bar(bm, (5.1, -0.22, 9.4), (0.0, -0.22, 10.85), 0.18)
        bm_box(bm, (0.35, 0.35, 0.35), (0, 0.05, 10.9))                           # finial block
    solid('pediment_trim', 'walk', trim, bevel=0.03)

    def cartouche(bm):                                           # the scroll cartouche in the tympanum
        ell = [(0.75 * math.cos(a), 0.36 * math.sin(a)) for a in [i * 2 * math.pi / 14 for i in range(14)]]
        bm_solid(bm, [(x, z + 9.95) for x, z in ell], -0.16, -0.05)
        for s in (-1, 1):
            ring = [(s * 1.0 + 0.2 * math.cos(a), 9.85 + 0.2 * math.sin(a)) for a in [i * 2 * math.pi / 10 for i in range(10)]]
            bm_solid(bm, ring, -0.14, -0.05)
    solid('cartouche', 'bone', cartouche, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# the tower behind: ribbon window bands, mullions, floor-band ledges (yongle-02)
# ─────────────────────────────────────────────────────────────────────────────
def band_block(name, half_w, y0, y1, z0, floors, fh, win_z0=0.9, win_h=1.5, step=1.05):
    h = floors * fh
    yc, d = (y0 + y1) / 2, y1 - y0
    pad, recess = 0.6, 0.3

    def block(bm):
        bm_box(bm, (2 * half_w, d, h), (0, yc, z0 + h / 2))

    def recesses(bm):
        for f in range(floors):
            zc = z0 + f * fh + win_z0 + win_h / 2
            bm_box(bm, (2 * (half_w - pad), recess + 0.5, win_h), (0, y0 - 0.25 + recess / 2, zc))
            for s in (-1, 1):
                bm_box(bm, (recess + 0.5, d - 2 * pad, win_h), (s * (half_w + 0.25 - recess / 2), yc, zc))
    solid(name, 'bone', block, cutters=(cutter(name + '_recess', 'ink', recesses),))

    def mullions(bm):
        for f in range(floors):
            zc = z0 + f * fh + win_z0 + win_h / 2
            nx = int((2 * (half_w - pad) - 0.3) // step)
            for i in range(nx + 1):
                bm_box(bm, (0.08, 0.2, win_h), (-(nx * step) / 2 + i * step, y0 + 0.12, zc))
            bm_box(bm, (2 * (half_w - pad), 0.06, 0.06), (0, y0 + 0.2, zc + 0.2))        # transom
            ny = int((d - 2 * pad - 0.3) // step)
            for s in (-1, 1):
                for i in range(ny + 1):
                    bm_box(bm, (0.2, 0.08, win_h), (s * (half_w - 0.12), yc - (ny * step) / 2 + i * step, zc))
                bm_box(bm, (0.06, d - 2 * pad, 0.06), (s * (half_w - 0.2), yc, zc + 0.2))
    solid(name + '_mullions', 'walk', mullions, bevel=0.0)

    def ledges(bm):                                              # floor band: a proud ledge at each sill
        for f in range(floors):
            zc = z0 + f * fh + win_z0 - 0.08
            bm_box(bm, (2 * half_w + 0.24, 0.24, 0.16), (0, y0 - 0.06, zc))
            for s in (-1, 1):
                bm_box(bm, (0.24, d + 0.1, 0.16), (s * (half_w + 0.06), yc, zc))
    solid(name + '_ledges', 'walk', ledges, bevel=0.03)


def tower():
    band_block('tower', T_HW, T_Y0, T_Y1, T_Z0, T_FLOORS, T_FH)
    solid('tower_roof', 'haze', lambda bm: bm_box(bm, (2 * T_HW + 0.2, T_Y1 - T_Y0 + 0.2, 0.25), (0, (T_Y0 + T_Y1) / 2, T_TOP + 0.125)), bevel=0.03)
    band_block('upper', U_HW, U_Y0, T_Y1, T_TOP, U_FLOORS, U_FH)
    solid('upper_roof', 'haze', lambda bm: bm_box(bm, (2 * U_HW + 0.2, T_Y1 - U_Y0 + 0.2, 0.2), (0, (U_Y0 + T_Y1) / 2, U_TOP + 0.1)), bevel=0.03)

    def pipes(bm):                                               # drainpipes down the tower faces (yongle-02)
        for s in (-1, 1):
            bm_box(bm, (0.16, 0.16, T_TOP - T_Z0 - 0.4), (s * (T_HW - 0.35), T_Y0 - 0.1, (T_Z0 + T_TOP) / 2))
            bm_box(bm, (0.16, 0.16, U_TOP - T_TOP - 0.3), (s * (U_HW - 0.35), U_Y0 - 0.1, (T_TOP + U_TOP) / 2))
    solid('drainpipes', 'haze', pipes, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# the front-left stair tower with the vertical sign fin
# ─────────────────────────────────────────────────────────────────────────────
def stair_tower():
    w = ST_X1 - ST_X0
    xc = (ST_X0 + ST_X1) / 2
    z0 = BEAM[0]
    dy = T_Y0 + 0.2

    def body(bm):
        bm_box(bm, (w, dy, ST_TOP - z0), (xc, dy / 2, (z0 + ST_TOP) / 2))

    def slots(bm):
        for z in (8.9, 10.7, 12.5):
            bm_box(bm, (0.32, 0.6, 1.2), (-10.55, 0.0, z))                        # front
            bm_box(bm, (0.6, 0.4, 1.2), (ST_X0, 1.6, z))                          # side
    solid('stair_tower', 'bone', body, cutters=(cutter('stair_slots', 'ink', slots),))
    solid('stair_cap', 'haze', lambda bm: bm_box(bm, (w + 0.3, dy + 0.3, 0.25), (xc, dy / 2, ST_TOP + 0.125)), bevel=0.03)

    def bands(bm):                                               # floor bands in line with the tower ledges
        for f in range(1, 3):
            z = T_Z0 + f * T_FH - 0.1
            bm_box(bm, (w + 0.16, 0.16, 0.16), (xc, -0.05, z))
            bm_box(bm, (0.16, dy, 0.16), (ST_X0 - 0.05, dy / 2, z))
    solid('stair_bands', 'walk', bands, bevel=0.0)

    # the vertical sign frame: a flat fin the scene's 永樂市場 box bolts to (X -9.78..-9.03, z 6..13)
    solid('vsign_fin', 'haze', lambda bm: bm_box(bm, (1.1, 0.1, 13.3 - 5.85), (-9.4, 0.0, (5.85 + 13.3) / 2)), bevel=0.03)


# ─────────────────────────────────────────────────────────────────────────────
# rooftop: the sign frame (canvas text fills it), plant room, tanks; AC units on the lower roof
# ─────────────────────────────────────────────────────────────────────────────
def rooftop():
    z0 = ROOF

    def frame(bm):
        for x in (-4.4, -1.5, 1.5, 4.4):
            bm_box(bm, (0.15, 0.15, 2.15), (x, 4.3, z0 + 1.075))
            bm_bar(bm, (x, 4.3, z0 + 1.9), (x, 6.4, z0), 0.12)                    # struts back to the roof
        for z in (z0 + 0.12, z0 + 1.0, z0 + 2.05):
            bm_box(bm, (9.0, 0.15, 0.12), (0, 4.3, z))
    solid('sign_frame', 'ink', frame, bevel=0.0)

    def plant(bm):
        bm_box(bm, (4.4, 4.0, 2.6), (-4.0, 11.6, z0 + 1.3))

    def plant_cuts(bm):
        bm_box(bm, (0.9, 0.5, 1.9), (-4.4, 9.6, z0 + 1.05))
        for x in (-5.6, -2.9):
            bm_box(bm, (0.8, 0.5, 0.6), (x, 9.6, z0 + 1.9))
    solid('plant_room', 'bone', plant, cutters=(cutter('plant_openings', 'ink', plant_cuts),))
    solid('plant_cap', 'haze', lambda bm: bm_box(bm, (4.7, 4.3, 0.2), (-4.0, 11.6, z0 + 2.7)), bevel=0.03)

    tanks = ((4.2, 10.6, 1.15, 2.0), (4.2, 13.7, 0.9, 1.6))

    def tank(bm):
        for cx, cy, r, h in tanks:
            S.bm_cylinder(bm, r, z0 + 0.7, z0 + 0.7 + h, n=16, center=(cx, cy))
            bm_prism(bm, 16, r + 0.08, 0.25, z0 + 0.7 + h, z0 + 1.15 + h, rot=0, center=(cx, cy))
    solid('water_tanks', 'haze', tank, bevel=0.03)

    def legs(bm):
        for cx, cy, r, h in tanks:
            for dx in (-0.6, 0.6):
                for dy in (-0.6, 0.6):
                    bm_box(bm, (0.14, 0.14, 0.7), (cx + dx, cy + dy, z0 + 0.35))
            bm_box(bm, (1.6, 0.12, 0.12), (cx, cy, z0 + 0.66))
            bm_box(bm, (0.12, 1.6, 0.12), (cx, cy, z0 + 0.66))
        for x in (-7.6, 7.6):                                     # vent stacks at the roof corners
            S.bm_cylinder(bm, 0.18, z0, z0 + 1.6, n=10, center=(x, 14.8))
    solid('tank_legs', 'ink', legs, bevel=0.0)

    def acs(bm):                                                 # condensers on the lower roof ring
        for y in (5.5, 8.5, 11.5, 14.4):
            for s in (-1, 1):
                bm_box(bm, (0.7, 1.0, 0.75), (s * 9.2, y, T_TOP + 0.25 + 0.375))
    solid('ac_units', 'bone', acs, bevel=0.03)

    def fans(bm):
        for y in (5.5, 8.5, 11.5, 14.4):
            for s in (-1, 1):
                m = S.Matrix.Translation((s * 9.56, y, T_TOP + 0.25 + 0.375)) @ S.Matrix.Rotation(math.pi / 2, 4, 'Y')
                S.bm_cylinder(bm, 0.28, -0.03, 0.03, n=8, xform=m)
    solid('ac_fans', 'ink', fans, bevel=0.0)


def build():
    ground_floor()
    piers()
    upper_storey()
    bands_and_parapet()
    pediment()
    tower()
    stair_tower()
    rooftop()


if __name__ == '__main__':
    # roughly the yongle-04 view: the front from the front-left, low, with the left side receding
    S.run(build, camera=((-15.5, -21.0, 1.8), (1.5, 4.0, 9.5), 62))
