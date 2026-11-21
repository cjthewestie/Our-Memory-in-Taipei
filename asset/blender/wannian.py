# wannian.py — 萬年商業大樓 (Wannien Commercial Building, 1973) on 西寧南路 as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/wannian.py -- --out asset/models/src/wannian.glb [--preview x.png] [--stats]
#
# Reference (research/reference/ximen/img/wannien-01..08.jpg): a ten-storey concrete slab on the
# corner of 西寧南路 and 峨嵋街. Read from the photos: the street faces are a close rhythm of
# vertical concrete fins with small windows between them and faint floor bands; the street
# corner is chamfered and carries the tall vertical 萬年商業大樓 sign under a pill-shaped
# 年萬 roundel; the top floor leans back as a dark mansard hood; a pale shop band (the 豪華鐘錶
# fascia) wraps the ground floor and the corner, with the arcade glazing and a steel-framed
# lobby portal (wannien-04/05) under it; split AC units hang between the fins; vertical shop
# signs climb both faces. On the roof, the hall of the old ice rink and the steel frame that
# carries the roof name board (scene-red.js §4).
#
# Text stays canvas: every sign here is a blank board or a frame for a scene board. The scene
# keeps its board() calls (the roof name, the corner 萬年, the seven shop signs); this model gives
# them their backing and leaves the plane they sit on (world x XF+0.04, local y -7.04) clear.
#
# Frame: metres, Blender Z up, origin on the ground at the footprint centre. 16 m along X (the
# scene's W, along world z), 14 m deep along Y (the scene's D). Front (the 西寧南路 face) is the
# plane y = -7 facing -Y (→ +Z in three.js); scene-red.js rotates the root +π/2 so it faces +x,
# which sends Blender +X to world -z: the chamfered street corner at local -X lands at the world
# +z end, where the scene hangs the corner 萬年 board (z + W/2 - 1.5). 10 storeys × 3.3 = 33 m.
#
# Triangle budget 12,000.

import math
import os
import sys

import bmesh

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_cylinder, bm_solid, solid, cutter
from mathutils import Matrix

HX, HY = 8.0, 7.0          # half width (X), half depth (Y)
FH, ST = 3.3, 10
H = FH * ST                 # 33: roof line
CH = 2.6                    # the street-corner chamfer: a 3.7 m face, the sign corner of wannien-03/-07
REC = 0.28                  # how far the wall stands behind the fin faces
TOP = H - FH                # 29.7: the mansard floor starts here
BAND_Z = (3.0, 3.95)        # the ground-floor fascia band
FIN_STEP = 0.8


def plan(off, ch=CH):
    """Footprint outline offset inward by `off`, the front-left (street) corner chamfered."""
    k = ch - off * (math.sqrt(2) - 1)
    x0, x1, y0, y1 = -HX + off, HX - off, -HY + off, HY - off
    return [(x0 + k, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0 + k)]


def street(out, ch=CH):
    """Like plan(), but grown outward only on the two street faces: the back and the +X side stay
    on the party lines, so nothing crosses into the neighbours' lots."""
    k = ch + out * (math.sqrt(2) - 1)
    x0, y0 = -HX - out, -HY - out
    return [(x0 + k, y0), (HX, y0), (HX, HY), (x0, HY), (x0, y0 + k)]


def bm_loft(bm, p0, z0, p1, z1):
    """Two plan rings of the same vertex count joined into a closed solid (a frustum)."""
    a = [bm.verts.new((x, y, z0)) for x, y in p0]
    b = [bm.verts.new((x, y, z1)) for x, y in p1]
    n = len(a)
    bm.faces.new(a[::-1])
    bm.faces.new(b)
    for i in range(n):
        bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))


# bays along the front (x) and the side (y): fin positions on each street face
FRONT_FINS = [-HX + CH + 0.35 + i * FIN_STEP for i in range(int((2 * HX - CH - 0.6) / FIN_STEP) + 1)]
SIDE_FINS = [-HY + CH + 0.35 + i * FIN_STEP for i in range(int((2 * HY - CH - 0.6) / FIN_STEP) + 1)]


def skip(i, j):
    """Deterministic gaps in the window grid: the photos show blank bays, not a perfect grid."""
    return (i * 7 + j * 3) % 5 == 0


def build():
    global C45
    C45 = Matrix.Translation((-HX + CH / 2, -HY + CH / 2, 0)) @ Matrix.Rotation(-math.pi / 4, 4, 'Z')
    # ── the slab: wall plane recessed behind the fins, up to the mansard floor ─────────────
    solid('body', 'haze', lambda bm: bm_solid_z(bm, plan(REC), 0, TOP + 0.2))
    # back and +X side are party walls against the neighbours: the plan covers them in full
    # ── the mansard hood: the top floor leaning back, dark, as in every photo ──────────────
    solid('mansard', 'road', lambda bm: bm_loft(bm, street(0.05), TOP, plan(1.0), H))
    solid('roof', 'haze', lambda bm: bm_solid_z(bm, plan(1.1), H - 0.05, H + 0.35))
    # the cornice lip between the fin zone and the hood
    solid('cornice', 'bone', lambda bm: bm_loft(bm, street(0.12), TOP - 0.35, street(0.12), TOP), bevel=0.03)

    # ── fins: deep vertical concrete ribs on both street faces, floor 2 to the hood ───────
    def fins(bm):
        for x in FRONT_FINS:
            bm_box(bm, (0.2, REC + 0.02, TOP - 3.95), (x, -HY + (REC + 0.02) / 2 - 0.02 + 0.02, (TOP + 3.95) / 2))
        for y in SIDE_FINS:
            bm_box(bm, (REC + 0.02, 0.2, TOP - 3.95), (-HX + (REC + 0.02) / 2, y, (TOP + 3.95) / 2))
    solid('fins', 'bone', fins, bevel=0.03)
    # the corner pier on the chamfer, the spine the vertical sign hangs from
    # C45: the chamfer face's frame: x along the face, -y outward, origin on the outline's chamfer line
    solid('corner', 'haze', lambda bm: bm_box(bm, (CH * 1.414 + 0.1, 0.4, TOP - 3.95), (0, 0.2, (TOP + 3.95) / 2), C45), bevel=0.04)
    # a fin at each edge of the chamfer, so the rib rhythm turns the corner as in wannien-07
    def corner_fins(bm):
        for u in (-CH * 0.707 + 0.12, CH * 0.707 - 0.12):
            bm_box(bm, (0.24, 0.3, TOP - 3.95), (u, 0.05, (TOP + 3.95) / 2), C45)
    solid('corner_fins', 'bone', corner_fins, bevel=0.03)

    # ── floor bands: a thin ledge at each floor line between the fins ──────────────────────
    def bands(bm):
        for f in range(1, ST - 1):
            z = f * FH + 0.6
            bm_box(bm, (2 * HX - CH - 0.1, 0.14, 0.14), ((-HX + CH + HX) / 2, -HY + REC - 0.06, z))
            bm_box(bm, (0.14, 2 * HY - CH - 0.1, 0.14), (-HX + REC - 0.06, (-HY + CH + HY) / 2, z))
    solid('bands', 'haze', bands, bevel=0, smooth=False)

    # ── windows: one small window per bay per floor, dark glass with a pale sill ───────────
    wins, sills, acs = [], [], []
    for f in range(1, ST - 1):
        z = f * FH + 1.35
        for i, (a, b) in enumerate(zip(FRONT_FINS, FRONT_FINS[1:])):
            if not skip(i, f):
                wins.append(('f', (a + b) / 2, z))
                if (i + 2 * f) % 9 == 4:
                    acs.append(('f', (a + b) / 2, z - 1.0))
        for i, (a, b) in enumerate(zip(SIDE_FINS, SIDE_FINS[1:])):
            if not skip(i + 3, f):
                wins.append(('s', (a + b) / 2, z))
                if (i + 3 * f) % 8 == 2:
                    acs.append(('s', (a + b) / 2, z - 1.0))

    def windows(bm):
        for side, u, z in wins:
            if side == 'f':
                bm_box(bm, (0.42, 0.06, 1.05), (u, -HY + REC - 0.02, z))
            else:
                bm_box(bm, (0.06, 0.42, 1.05), (-HX + REC - 0.02, u, z))
    solid('windows', 'ink', windows, bevel=0, smooth=False)

    def ac(bm):
        for side, u, z in acs:
            if side == 'f':
                bm_box(bm, (0.5, 0.26, 0.36), (u, -HY + REC - 0.14, z))
            else:
                bm_box(bm, (0.26, 0.5, 0.36), (-HX + REC - 0.14, u, z))
    solid('ac', 'walk', ac, bevel=0.025)

    # ── ground floor: arcade glazing, pale piers, the fascia band wrapping the corner ──────
    def glazing(bm):
        bm_box(bm, (2 * HX - CH - 0.4, 0.06, 2.9), ((-HX + CH + HX) / 2, -HY + REC + 0.35, 1.55))
        bm_box(bm, (0.06, 2 * HY - CH - 0.4, 2.9), (-HX + REC + 0.35, (-HY + CH + HY) / 2, 1.55))
        bm_box(bm, (CH * 1.414, 0.06, 2.9), (0, 0, 1.55), Matrix.Translation((-HX + CH / 2 + 0.45, -HY + CH / 2 + 0.45, 0)) @ Matrix.Rotation(-math.pi / 4, 4, 'Z'))
    solid('glazing', 'ink', glazing, bevel=0, smooth=False)

    def piers(bm):
        for x in [-HX + CH + 0.3 + i * 3.2 for i in range(5)] + [HX - 0.3]:
            bm_box(bm, (0.45, 0.45, BAND_Z[0]), (x, -HY + 0.25, BAND_Z[0] / 2))
        for y in [-HY + CH + 0.3 + i * 3.0 for i in range(4)] + [HY - 0.3]:
            bm_box(bm, (0.45, 0.45, BAND_Z[0]), (-HX + 0.25, y, BAND_Z[0] / 2))
    solid('piers', 'bone', piers, bevel=0.03)

    # mullions in the glazing
    def mullions(bm):
        for x in [-HX + CH + 0.3 + i * 0.8 for i in range(int((2 * HX - CH - 0.6) / 0.8) + 1)]:
            bm_box(bm, (0.06, 0.06, 2.9), (x, -HY + REC + 0.3, 1.55))
        for y in [-HY + CH + 0.3 + i * 0.8 for i in range(int((2 * HY - CH - 0.6) / 0.8) + 1)]:
            bm_box(bm, (0.06, 0.06, 2.9), (-HX + REC + 0.3, y, 1.55))
    solid('mullions', 'walk', mullions, bevel=0, smooth=False)

    # the fascia band: a pale box proud of both faces and the chamfer (the 豪華鐘錶 band), red rule under it
    solid('fascia', 'bone', lambda bm: bm_loft(bm, street(0.9, CH + 0.6), BAND_Z[0], street(0.9, CH + 0.6), BAND_Z[1]))
    solid('fascia_rule', 'verm', lambda bm: bm_loft(bm, street(0.92, CH + 0.6), BAND_Z[0] - 0.14, street(0.92, CH + 0.6), BAND_Z[0]), bevel=0, smooth=False)
    solid('soffit', 'walk', lambda bm: bm_loft(bm, street(0.85, CH + 0.6), BAND_Z[0] - 0.2, plan(0.2, CH + 0.6), BAND_Z[0] - 0.14), bevel=0, smooth=False)

    # the lobby portal (wannien-04, -05): a steel frame, a deep dark mouth, a blank name board
    PX = 1.2
    mouth = cutter('mouth', 'ink', lambda bm: bm_box(bm, (2.8, 2.6, 2.9), (PX, -HY + 0.7, 1.45 - 0.05)))
    solid('portal', 'walk', lambda bm: bm_box(bm, (3.4, 0.4, 3.15), (PX, -HY + 0.1, 1.575)), cutters=[mouth], bevel=0.03)

    # ── the street corner: the 年萬 roundel and the spine of the vertical name sign ───────
    # Both sit on the chamfer, as in every photo. The scene's 萬年 board moves onto this spine
    # (see .scratch/blender-detail/notes/wannian.md): face plane local y -0.14 in C45, z 12..22.
    solid('sign_back', 'ink', lambda bm: bm_box(bm, (2.2, 0.14, 10.4), (0, -0.07, 17.0), C45), bevel=0.03)

    def brackets(bm):
        for z in (12.4, 17.0, 21.6):
            for u in (-0.9, 0.9):
                bm_box(bm, (0.1, 0.3, 0.1), (u, 0.1, z), C45)
    solid('sign_brackets', 'ink', brackets, bevel=0, smooth=False)

    RZ, RR, RO = 23.65, 0.95, 0.85   # roundel centre height, disc-frame radius, half spacing
    def pill(bm):
        pts = [(RO + RR * math.cos(a), RZ + RR * math.sin(a)) for a in [-math.pi / 2 + i * math.pi / 10 for i in range(11)]]
        pts += [(-RO + RR * math.cos(a), RZ + RR * math.sin(a)) for a in [math.pi / 2 + i * math.pi / 10 for i in range(11)]]
        bm_solid(bm, pts, -0.22, 0.05, C45)
    solid('roundel', 'ink', pill, bevel=0.03)

    rot = Matrix.Rotation(math.pi / 2, 4, 'X')
    solid('roundel_face', 'bone', lambda bm: [bm_cylinder(bm, 0.74, 0, 0.08, n=20, xform=C45 @ Matrix.Translation((u, -0.30, RZ)) @ rot) for u in (-RO, RO)], bevel=0, smooth=False)
    solid('roundel_ring', 'verm', lambda bm: [bm_cylinder(bm, 0.84, 0, 0.04, n=20, xform=C45 @ Matrix.Translation((u, -0.24, RZ)) @ rot) for u in (-RO, RO)], bevel=0, smooth=False)

    # ── blade signs on the side face (峨嵋街), blank boards in the palette ──────────────────
    blades = [(-3.2, 5.0, 6.0, 'verm'), (0.6, 7.0, 7.5, 'lamp'), (3.8, 4.5, 5.5, 'bone'), (6.0, 9.0, 6.5, 'verm')]
    for k, (y, z0, h, col) in enumerate(blades):
        solid(f'blade{k}', col, lambda bm, y=y, z0=z0, h=h: bm_box(bm, (1.0, 0.16, h), (-HX - 0.65, y, z0 + h / 2)), bevel=0.03)
    def blade_arms(bm):
        for y, z0, h, _ in blades:
            for z in (z0 + 0.4, z0 + h - 0.4):
                bm_bar(bm, (-HX + REC, y, z), (-HX - 0.2, y, z), 0.08)
    solid('blade_arms', 'ink', blade_arms, bevel=0, smooth=False)
    # two flat vertical signs on the side face, as on the front
    flats = [(-5.0, 9.0, 8.0, 'bone'), (2.4, 12.0, 9.0, 'verm')]
    for k, (y, z0, h, col) in enumerate(flats):
        solid(f'flat{k}', col, lambda bm, y=y, z0=z0, h=h: bm_box(bm, (0.12, 1.2, h), (-HX - 0.06, y, z0 + h / 2)), bevel=0.03)

    # ── roof: the old ice-rink hall, its clerestory and the frame of the roof name board ───
    HALL = (-5.0, 5.0, -2.0, 6.0)        # x0, x1, y0, y1: the scene's hall footprint (centre 2 m back)
    HZ0, HZ1 = H + 0.35, H + 2.55
    hall_win = cutter('hall_win', 'ink', lambda bm: bm_box(bm, (9.2, 8.6, 0.7), (0, 2.0, HZ1 - 0.7)))
    solid('hall', 'bone', lambda bm: bm_box(bm, (10, 8, HZ1 - HZ0), (0, 2.0, (HZ0 + HZ1) / 2)), cutters=[hall_win])
    # a shallow barrel roof over the rink
    def barrel(bm):
        pts = [(-5.2 * math.cos(i * math.pi / 8), HZ1 + 1.3 * math.sin(i * math.pi / 8)) for i in range(9)]
        bm_solid(bm, pts, -2.15, 6.15)
    solid('hall_roof', 'haze', barrel, bevel=0.03)
    # rooftop plant: AC condensers and a water tank
    def plant(bm):
        for x, y in ((6.0, 4.5), (6.0, 2.8), (-6.2, 5.2)):
            bm_box(bm, (1.2, 0.9, 1.0), (x, y, H + 0.35 + 0.5))
        bm_box(bm, (2.2, 2.2, 1.8), (5.5, -1.0, H + 0.35 + 0.9))
    solid('plant', 'walk', plant, bevel=0.03)
    # the steel frame behind the roof name board (board: local y -6, x -6..6, z 33.6..37)
    def frame(bm):
        yb = -5.82
        for x in (-6.0, -3.0, 0.0, 3.0, 6.0):
            bm_bar(bm, (x, yb, H + 0.35), (x, yb, H + 3.75), 0.12)
            bm_bar(bm, (x, yb, H + 3.4), (x, yb + 2.0, H + 0.35), 0.1)
        for z in (H + 0.9, H + 2.2, H + 3.45):
            bm_bar(bm, (-6.1, yb, z), (6.1, yb, z), 0.1)
    solid('board_frame', 'ink', frame, bevel=0, smooth=False)
    # parapet rail round the roof
    def rail(bm):
        p = plan(1.15)
        for (x0, y0), (x1, y1) in zip(p, p[1:] + p[:1]):
            bm_bar(bm, (x0, y0, H + 1.25), (x1, y1, H + 1.25), 0.06)
    solid('rail', 'ink', rail, bevel=0, smooth=False)


def bm_solid_z(bm, pts, z0, z1):
    return S.bm_solid_z(bm, pts, z0, z1)


if __name__ == '__main__':
    # roughly wannien-07's view: from across the junction, the chamfered corner centred, both faces
    S.run(build, camera=((-27, -26, 1.7), (-3, -2, 14.5), 66))
