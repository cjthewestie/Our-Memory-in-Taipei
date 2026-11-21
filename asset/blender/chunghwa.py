# chunghwa.py — one 中華商場 block (Chunghwa Market, 1961–1992) and the bridge between two
# blocks, as a stylized glb with three groups: 'block' and 'bridge', which scene-red.js instances
# (8 blocks, 7 bridges), and 'neon', a rooftop sign frame the scene may instance instead of its
# own F() boxes (the board and its text stay canvas).
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/chunghwa.py -- --out asset/models/src/chunghwa.glb [--preview x.png] [--stats]
#
# Detail pass (blender-detail, 2026-11-01), from the period photos in research/reference/ximen/img
# (chunghwa-01 … -10; sources in research/reference/ximen/sources.md):
#   - the road face (chunghwa-03, the 1961 opening; -04, the arcade; -07, a 1960s parade): a
#     continuous ground-floor arcade behind square piers on plinths, cross beams under the soffit
#     at every column, a fluorescent tube per bay, the fascia beam that carries the signboard band;
#     floors 2 and 3 are open corridors behind solid parapets with a sunk panel per bay, a
#     downstand beam under each slab, a deep slab band, coping; canvas awnings on the 2nd floor;
#   - the back (railway) face (chunghwa-09, the model; -05, the aerial): continuous strip windows
#     on floors 2 and 3 with mullions, a sill and a hood, shop openings below;
#   - the end walls (chunghwa-01, -03): a solid wall from the 2nd floor up that rises past the
#     roof as a crown, framed at both edges; the north one is painted (中華商場, the number, the
#     lattice — chunghwa-ends.webp); the south one has a modelled breeze-block lattice panel;
#   - the roof (chunghwa-05, -09): water tanks on steel stands, a concrete tank, stair heads,
#     a shed, TV antennas, vent pipes and a laundry line;
#   - the bridges (chunghwa-06, -07, -09): open 2nd-floor decks on two girders, solid parapet
#     panels between posts, steel bar railings, pale green;
#   - the rooftop neon (chunghwa-01, -06, -08): steel lattice masts and a truss ('neon' group).
#
# Scene contract (scene-red.js §2, kept): road face at y = 0 facing -Y; L, DEPTH, FLOOR, TOP as
# below; the painted shop quads sit 5 cm in front of the arcade back wall (y = ARCADE) and the
# corridor back walls (y = CORR); the painted end quad 5 cm outside the north end wall (x = -L/2),
# from CLEAR to TOP over the full depth and over ARCADE..DEPTH below; the shop light boxes hang on
# the fascia's front (y = -0.18), the vertical boxes on the columns' front (y = -0.075), the
# banners at y = -0.2 in front of the parapets. Box-mapped UVs, 4 m per unit (the concrete map);
# the palette colour picks the painted map (verm = awning stripes, walk/bone/haze/leaf = concrete).
#
# Frame: metres, Blender Z up. Depth runs into +y, the block's length along X about 0, origin on
# the ground at the road face's centre. The -X end is the north end.

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_cylinder, bm_bar, cutter


def solid(name, material, builder, bevel=S.BEVEL, cutters=(), group='main'):
    """S.solid, flat-shaded when it gets no bevel: a smooth-shaded unbevelled box reads as a
    rounded tube (the old fascia did), since nothing hardens its normals."""
    return S.solid(name, material, builder, bevel=bevel, cutters=cutters, group=group, smooth=bevel >= 0.025)

# ── dimensions (metres) ──────────────────────────────────────────────────────
L = 9.4             # block length along the street (X); scene-red.js places them L + GAP apart
GAP = 2.6           # the cross street between two blocks, spanned by the bridge
FLOOR = 3.3         # storey height
FLOORS = 3          # the real count; 2 gives CJ's lower street back (see scene-red.js)
DEPTH = 10.0        # into +y
ARCADE = 3.5        # ground-floor arcade depth: the shop wall stands at y = ARCADE
CORR = 3.0          # upper corridor depth: the shop wall upstairs stands at y = CORR
SLAB = 0.34         # the floor-slab band
PARA = 1.05         # parapet height above the slab
TOP = FLOOR * FLOORS
CLEAR = FLOOR - SLAB
COL_XS = [-L / 2 + 0.3 + k * (L - 0.6) / 4 for k in range(5)]          # 4 bays
BAY_XS = [(COL_XS[k] + COL_XS[k + 1]) / 2 for k in range(4)]
BAY_W = COL_XS[1] - COL_XS[0] - 0.5
UNIT_XS = [-L / 2 + 0.95 + k * 1.9 for k in range(5)]                   # 2 m shop units
END = 0.3           # end-wall thickness
CROWN = 1.3         # how far the end walls rise past the roof slab


def body():
    """The concrete mass behind the arcade and corridors. Its road faces stay plain (the shop
    fronts are painted on quads the scene lays there); the back face gets strip windows."""
    g = 'block'
    # ground floor: shop openings on the back (railway) face, one per unit, disjoint boxes
    def back_shops(bm):
        for x in UNIT_XS:
            bm_box(bm, (1.5, 0.4, 2.3), (x, DEPTH, 1.14))
    c0 = cutter('cut_back_shops', 'ink', back_shops)
    solid('ground_mass', 'walk', lambda bm: bm_box(bm, (L, DEPTH - ARCADE, FLOOR), (0, (ARCADE + DEPTH) / 2, FLOOR / 2)), cutters=[c0], group=g)
    for f in range(1, FLOORS):
        z0 = f * FLOOR
        c = cutter(f'cut_strip_{f}', 'ink', lambda bm, z0=z0: bm_box(bm, (L - 1.3, 0.36, 1.25), (0, DEPTH, z0 + 1.0 + 0.625)))
        solid(f'upper_mass_{f}', 'walk', lambda bm, z0=z0: bm_box(bm, (L, DEPTH - CORR, FLOOR), (0, (CORR + DEPTH) / 2, z0 + FLOOR / 2)), cutters=[c], group=g)

    # the strip windows' mullions (steel sash) and transom
    def mullions(bm):
        w = L - 1.3
        for f in range(1, FLOORS):
            z0 = f * FLOOR + 1.0
            n = 10
            for i in range(n + 1):
                bm_box(bm, (0.06, 0.06, 1.25), (-w / 2 + i * w / n, DEPTH - 0.1, z0 + 0.625))
            bm_box(bm, (w, 0.05, 0.05), (0, DEPTH - 0.1, z0 + 0.8))
    solid('sash', 'ink', mullions, bevel=0.0, group=g)
    def sills(bm):
        for f in range(1, FLOORS):
            z0 = f * FLOOR + 1.0
            bm_box(bm, (L - 1.1, 0.22, 0.1), (0, DEPTH + 0.06, z0 - 0.05))           # sill
            bm_box(bm, (L - 1.0, 0.45, 0.08), (0, DEPTH + 0.18, z0 + 1.25 + 0.12))   # hood
    solid('sills', 'bone', sills, bevel=0.025, group=g)
    # rolling shutters half down in the back shop openings, and their boxes
    def shutters(bm):
        for x in UNIT_XS:
            bm_box(bm, (1.48, 0.06, 0.9), (x, DEPTH - 0.14, 2.29 - 0.45))
            bm_box(bm, (1.6, 0.18, 0.22), (x, DEPTH + 0.02, 2.42))
    solid('shutters', 'haze', shutters, bevel=0.0, group=g)
    # pilasters between the back shops
    solid('back_piers', 'bone', lambda bm: [bm_box(bm, (0.3, 0.16, FLOOR - 0.05), (-L / 2 + k * 1.9, DEPTH + 0.07, (FLOOR - 0.05) / 2)) for k in range(1, 5)], bevel=0.03, group=g)


def frame():
    """Piers and columns through every floor, plinths, beams, slab bands, parapets, the fascia."""
    g = 'block'
    solid('columns', 'bone', lambda bm: [bm_box(bm, (0.5, 0.55, TOP), (x, 0.2, TOP / 2)) for x in COL_XS], group=g)
    # pier plinths at the arcade floor
    solid('plinths', 'walk', lambda bm: [bm_box(bm, (0.6, 0.6, 0.32), (x, 0.2, 0.16)) for x in COL_XS], bevel=0.03, group=g)
    def slabs(bm):
        for f in range(1, FLOORS + 1):
            z = f * FLOOR
            back = ARCADE if f == 1 else CORR
            bm_box(bm, (L + 0.1, back + 0.25, SLAB), (0, back / 2 - 0.12, z - SLAB / 2))
    solid('slabs', 'bone', slabs, group=g)
    # the soffits: the underside of each slab over the arcade and corridors
    def soffit(bm):
        for f in range(1, FLOORS):
            back = ARCADE if f == 1 else CORR
            bm_box(bm, (L - 0.05, back, 0.06), (0, back / 2, f * FLOOR - SLAB - 0.03))
    solid('soffit', 'haze', soffit, bevel=0.0, group=g)
    # cross beams from each column to the back wall under every slab (the coffered arcade ceiling
    # in chunghwa-04), and a downstand beam along the front of each upper slab
    def beams(bm):
        for f in range(1, FLOORS + 1):
            back = ARCADE if f == 1 else CORR
            zb = f * FLOOR - SLAB - 0.2
            if f < FLOORS:
                for x in COL_XS:
                    bm_box(bm, (0.32, back - 0.55, 0.4), (x, 0.45 + (back - 0.55) / 2, zb))     # stops 0.1 short: the painted quads are 5 cm off the wall
            if f > 1:
                bm_box(bm, (L - 0.1, 0.25, 0.3), (0, 0.12, zb + 0.05))
    solid('beams', 'walk', beams, bevel=0.03, group=g)
    # parapet walls between the columns on floors 2 and 3, each with a sunk panel on its face
    for f in range(1, FLOORS):
        def pcut(bm, f=f):
            for x in BAY_XS:
                bm_box(bm, (BAY_W - 0.36, 0.08, PARA - 0.36), (x, -0.07, f * FLOOR + PARA / 2 + 0.02))
        c = cutter(f'cut_para_{f}', 'walk', pcut)
        solid(f'parapets_{f}', 'walk', lambda bm, f=f: [bm_box(bm, (BAY_W + 0.02, 0.2, PARA), (x, 0.05, f * FLOOR + PARA / 2)) for x in BAY_XS], bevel=0.03, cutters=[c], group=g)
    # the roof parapet: front (over the columns' line) and back
    def roof_para(bm):
        for x in BAY_XS:
            bm_box(bm, (BAY_W + 0.02, 0.2, 0.7), (x, 0.05, TOP + 0.35))
        bm_box(bm, (L - 2 * END, 0.16, 0.55), (0, DEPTH - 0.08, TOP + 0.3 + 0.275))
    solid('roof_parapet', 'walk', roof_para, bevel=0.03, group=g)
    def coping(bm):
        for f in range(1, FLOORS + 1):
            z = f * FLOOR + (PARA if f < FLOORS else 0.7)
            bm_box(bm, (L + 0.05, 0.3, 0.08), (0, 0.05, z + 0.04))
        bm_box(bm, (L - 2 * END, 0.26, 0.06), (0, DEPTH - 0.08, TOP + 0.88))
    solid('coping', 'bone', coping, bevel=0.025, group=g)
    # the roof slab over everything behind the corridors
    solid('roof', 'haze', lambda bm: bm_box(bm, (L, DEPTH - 0.1, 0.3), (0, DEPTH / 2 + 0.05, TOP + 0.15)), bevel=0.03, group=g)
    # the fascia over the arcade that carries the signboard band (text is canvas in the scene):
    # front face at y = -0.18, where scene-red.js hangs the light boxes; a drip lip on top
    solid('fascia', 'bone', lambda bm: bm_box(bm, (L, 0.16, 0.52), (0, -0.1, FLOOR - SLAB - 0.2)), bevel=0.02, group=g)
    solid('fascia_lip', 'walk', lambda bm: bm_box(bm, (L + 0.05, 0.26, 0.07), (0, -0.07, FLOOR - SLAB + 0.08)), bevel=0.0, group=g)


def lights():
    """A fluorescent tube in a dark housing per bay, under the arcade and both corridors."""
    g = 'block'
    def housings(bm):
        for f in range(1, FLOORS):
            back = ARCADE if f == 1 else CORR
            for x in BAY_XS:
                bm_box(bm, (1.3, 0.14, 0.06), (x, back * 0.45, f * FLOOR - SLAB - 0.06 - 0.03))
    solid('tube_housing', 'ink', housings, bevel=0.0, group=g)
    def tubes(bm):
        for f in range(1, FLOORS):
            back = ARCADE if f == 1 else CORR
            z = f * FLOOR - SLAB - 0.06 - 0.09
            for x in BAY_XS:
                bm_cylinder(bm, 0.025, -0.6, 0.6, n=6, xform=Matrix.Translation((x, back * 0.45, z)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    solid('tubes', 'bone', tubes, bevel=0.0, group=g)


def awnings():
    """Canvas awnings over the 2nd-floor corridor bays, sloping out, on steel arms."""
    g = 'block'
    z = FLOOR + 2.55
    tilt = Matrix.Rotation(math.radians(24), 4, 'X')
    def canvas(bm):
        for x in BAY_XS:
            bm_box(bm, (BAY_W - 0.1, 1.0, 0.04), (0, 0, 0), Matrix.Translation((x, -0.25, z)) @ tilt)
            bm_box(bm, (BAY_W - 0.1, 0.03, 0.2), (x, -0.71, z - 0.3))         # the valance
    solid('awning', 'verm', canvas, bevel=0.0, group=g)
    def arms(bm):
        for x in BAY_XS:
            for s in (-1, 1):
                ax = x + s * (BAY_W / 2 - 0.15)
                bm_bar(bm, (ax, 0.05, z + 0.12), (ax, -0.66, z - 0.2), 0.03)
    solid('awning_arms', 'ink', arms, bevel=0.0, group=g)


def ends():
    """The two end walls: solid from the 2nd floor up, rising past the roof as a crown, framed at
    the road and back edges. North (-X) is painted by the scene; south (+X) gets a modelled
    breeze-block lattice panel."""
    g = 'block'
    z0 = FLOOR - SLAB
    h = TOP + CROWN - z0
    LY, LZ = 5.3, FLOOR + 0.4                      # the south lattice panel: centre depth, bottom
    solid('end_north', 'walk', lambda bm: bm_box(bm, (END, DEPTH, h), (-L / 2 + END / 2, DEPTH / 2, z0 + h / 2)), group=g)
    c = cutter('cut_lattice', 'ink', lambda bm: bm_box(bm, (0.24, 2.6, 5.0), (L / 2, LY, LZ + 2.5)))
    solid('end_south', 'walk', lambda bm: bm_box(bm, (END, DEPTH, h), (L / 2 - END / 2, DEPTH / 2, z0 + h / 2)), cutters=[c], group=g)
    # the frames: a pier at each edge standing 0.15 proud of the wall, and a cap on the crown
    def frames(bm):
        for x0, sgn in ((-L / 2, 1), (L / 2, -1)):
            for y in (0.2, DEPTH - 0.2):
                bm_box(bm, (END + 0.15, 0.4, TOP + CROWN + 0.05), (x0 + sgn * END / 2 - sgn * 0.075, y, (TOP + CROWN + 0.05) / 2))
            bm_box(bm, (END + 0.25, DEPTH + 0.1, 0.12), (x0 + sgn * END / 2 - sgn * 0.05, DEPTH / 2, TOP + CROWN + 0.06))
    solid('end_frames', 'bone', frames, bevel=0.03, group=g)
    # the south lattice: a grid of concrete fins in the recess
    def lattice(bm):
        x = L / 2 - 0.08
        y0, y1, zb, zt = LY - 1.3, LY + 1.3, LZ, LZ + 5.0
        nv, nh = 9, 17
        for i in range(1, nv):
            bm_box(bm, (0.12, 0.06, zt - zb), (x, y0 + i * (y1 - y0) / nv, (zb + zt) / 2))
        for j in range(1, nh):
            bm_box(bm, (0.12, y1 - y0, 0.06), (x, (y0 + y1) / 2, zb + j * (zt - zb) / nh))
    solid('lattice', 'bone', lattice, bevel=0.0, group=g)


def rooftop():
    """Stair heads, water tanks, a shed, TV antennas, vent pipes and a laundry line on the bare
    roof. The band 2..5.6 m deep stays clear for the neon frames and the National tower."""
    g = 'block'
    z0 = TOP + 0.3
    heads = ((1.6, 7.4), (-3.0, 7.0))
    solid('stair_head', 'bone', lambda bm: [bm_box(bm, (2.2, 2.4, 2.1), (x, y, z0 + 1.05)) for x, y in heads], group=g)
    solid('stair_lid', 'walk', lambda bm: [bm_box(bm, (2.5, 2.7, 0.14), (x, y, z0 + 2.17)) for x, y in heads], bevel=0.03, group=g)
    solid('stair_door', 'ink', lambda bm: [bm_box(bm, (0.8, 0.1, 1.7), (x, y - 1.22, z0 + 0.85)) for x, y in heads], bevel=0.0, group=g)
    # steel stands and round water tanks
    tanks = ((-0.6, 8.6), (3.8, 8.3))
    def stands(bm):
        for cx, cy in tanks:
            for sx in (-1, 1):
                for sy in (-1, 1):
                    bm_box(bm, (0.1, 0.1, 1.0), (cx + sx * 0.5, cy + sy * 0.5, z0 + 0.5))
            bm_box(bm, (1.2, 1.2, 0.08), (cx, cy, z0 + 1.0))
    solid('tank_stand', 'ink', stands, bevel=0.0, group=g)
    def round_tanks(bm):
        for cx, cy in tanks:
            bm_cylinder(bm, 0.7, z0 + 1.04, z0 + 2.2, n=16, center=(cx, cy))
            bm_cylinder(bm, 0.18, z0 + 2.2, z0 + 2.32, n=8, center=(cx, cy))
    solid('water_tank', 'haze', round_tanks, bevel=0.03, group=g)
    # a concrete tank on stubby legs by the back edge, and a tin shed
    solid('concrete_tank', 'walk', lambda bm: bm_box(bm, (2.2, 1.3, 1.2), (-3.2, 9.0, z0 + 0.5 + 0.6)), group=g)
    solid('tank_legs', 'walk', lambda bm: [bm_box(bm, (0.25, 0.25, 0.5), (-3.2 + sx * 0.85, 9.0 + sy * 0.4, z0 + 0.25)) for sx in (-1, 1) for sy in (-1, 1)], bevel=0.0, group=g)
    solid('shed', 'haze', lambda bm: bm_box(bm, (1.6, 1.4, 1.6), (3.9, 6.4, z0 + 0.8)), bevel=0.03, group=g)
    solid('shed_roof', 'ink', lambda bm: bm_box(bm, (1.9, 1.7, 0.06), (0, 0, 0), Matrix.Translation((3.9, 6.4, z0 + 1.68)) @ Matrix.Rotation(math.radians(8), 4, 'X')), bevel=0.0, group=g)
    # pipes from the tanks down to the roof, and vent stacks
    def pipes(bm):
        for cx, cy in tanks:
            bm_box(bm, (0.3, 0.08, 0.08), (cx + 0.82, cy, z0 + 1.3))
            bm_box(bm, (0.08, 0.08, 1.3), (cx + 0.94, cy, z0 + 0.65))
        for x, y in ((2.8, 9.4), (-4.1, 6.0), (0.3, 6.2)):
            bm_cylinder(bm, 0.07, z0, z0 + 1.1, n=6, center=(x, y))
    solid('pipes', 'haze', pipes, bevel=0.0, group=g)
    # TV antennas: a mast, three cross bars and a stay; square sections (bm_bar keeps no roll)
    def antennas(bm):
        for x, y, hgt in ((-4.0, 1.2, 2.6), (4.0, 1.4, 2.2), (1.2, 9.4, 3.0)):
            bm_box(bm, (0.05, 0.05, hgt), (x, y, z0 + hgt / 2))
            for k, w in enumerate((1.1, 0.8, 0.55)):
                bm_box(bm, (w, 0.03, 0.03), (x, y, z0 + hgt - 0.15 - k * 0.3))
            bm_bar(bm, (x, y, z0 + hgt * 0.6), (x + 0.5 * (1 if x < 0 else -1), y + 0.5, z0), 0.025)
    solid('antennas', 'ink', antennas, bevel=0.0, group=g)
    # a laundry line between two poles, three sheets on it
    def laundry_poles(bm):
        for x in (-2.4, 0.6):
            bm_box(bm, (0.06, 0.06, 1.8), (x, 5.9, z0 + 0.9))
        bm_box(bm, (3.0, 0.02, 0.02), (-0.9, 5.9, z0 + 1.75))
    solid('laundry_line', 'ink', laundry_poles, bevel=0.0, group=g)
    solid('laundry', 'bone', lambda bm: [bm_box(bm, (0.55, 0.02, 0.7), (x, 5.9, z0 + 1.38)) for x in (-1.8, -1.0, -0.1)], bevel=0.0, group=g)


def bridge():
    """The 2nd-floor bridge across the cross street to the next block: an open deck on two
    girders, solid parapet panels between posts, a bar railing on top, pale green steel."""
    g = 'bridge'
    span, w, z = GAP + 0.6, 2.6, FLOOR
    yc = 1.6
    solid('deck', 'bone', lambda bm: bm_box(bm, (span, w, 0.22), (0, yc, z - 0.11)), bevel=0.03, group=g)
    solid('girders', 'leaf', lambda bm: [bm_box(bm, (span, 0.22, 0.5), (0, yc + s * (w / 2 - 0.12), z - 0.47)) for s in (-1, 1)], bevel=0.03, group=g)
    solid('joists', 'leaf', lambda bm: [bm_box(bm, (0.1, w - 0.44, 0.18), (-span / 2 + 0.1 + i * (span - 0.2) / 6, yc, z - 0.31)) for i in range(7)], bevel=0.0, group=g)
    nP = 4
    xs = [-span / 2 + i * span / nP for i in range(nP + 1)]
    def posts(bm):
        for s in (-1, 1):
            y = yc + s * (w / 2 - 0.06)
            for x in xs:
                bm_box(bm, (0.1, 0.12, 1.1), (min(max(x, -span / 2 + 0.05), span / 2 - 0.05), y, z + 0.55))
    solid('posts', 'leaf', posts, bevel=0.0, group=g)
    def panels(bm):
        for s in (-1, 1):
            y = yc + s * (w / 2 - 0.06)
            for i in range(nP):
                bm_box(bm, (span / nP - 0.14, 0.06, 0.55), ((xs[i] + xs[i + 1]) / 2, y, z + 0.3))
    solid('panels', 'bone', panels, bevel=0.0, group=g)
    solid('kick', 'leaf', lambda bm: [bm_box(bm, (span, 0.16, 0.06), (0, yc + s * (w / 2 - 0.06), z + 0.6)) for s in (-1, 1)], bevel=0.0, group=g)
    def rails(bm):
        for s in (-1, 1):
            y = yc + s * (w / 2 - 0.06)
            bm_box(bm, (span, 0.08, 0.06), (0, y, z + 1.1))
            n = int(span / 0.2)
            for i in range(1, n):
                bm_box(bm, (0.03, 0.03, 0.47), (-span / 2 + i * span / n, y, z + 0.865))
    solid('rails', 'leaf', rails, bevel=0.0, group=g)
    # the deck's edge fascia, the band you see from the street
    solid('deck_edge', 'leaf', lambda bm: [bm_box(bm, (span, 0.06, 0.3), (0, yc + s * (w / 2 + 0.02), z - 0.15)) for s in (-1, 1)], bevel=0.0, group=g)


def neon():
    """The rooftop sign frame (chunghwa-01, -08): two square lattice masts and a truss on top,
    where scene-red.js puts its F() frame (3.5 m deep, ±1.9 m along the block, from the roof at
    TOP + 0.3 to 3.4 m above it). The board and its text stay canvas."""
    g = 'neon'
    y0 = TOP + 0.3
    yd, H, a = 3.5, 3.4, 0.36
    def masts(bm):
        for mx in (-1.9, 1.9):
            for sx in (-1, 1):
                for sy in (-1, 1):
                    bm_box(bm, (0.07, 0.07, H), (mx + sx * a / 2, yd + sy * a / 2, y0 + H / 2))
            n = 6
            for sy in (-1, 1):
                for i in range(n):
                    za, zb = y0 + i * H / n, y0 + (i + 1) * H / n
                    xa, xb = (mx - a / 2, mx + a / 2) if i % 2 == 0 else (mx + a / 2, mx - a / 2)
                    bm_bar(bm, (xa, yd + sy * a / 2, za), (xb, yd + sy * a / 2, zb), 0.035)
            bm_box(bm, (0.6, 0.6, 0.12), (mx, yd, y0 + 0.06))
    solid('masts', 'ink', masts, bevel=0.0, group=g)
    def truss(bm):
        for zz in (y0 + 1.7, y0 + H):
            for sy in (-1, 1):
                bm_box(bm, (4.2, 0.07, 0.07), (0, yd + sy * a / 2, zz))
            n = 8
            for i in range(n):
                xa = -2.1 + i * 4.2 / n
                bm_bar(bm, (xa, yd - a / 2, zz), (xa + 4.2 / n, yd + a / 2, zz), 0.03)
    solid('truss', 'ink', truss, bevel=0.0, group=g)


def build():
    body()
    frame()
    lights()
    awnings()
    ends()
    rooftop()
    bridge()
    neon()


if __name__ == '__main__':
    S.run(build, camera=((-16, -14, 7), (0, 2, 5), 45), uvs=4.0)
