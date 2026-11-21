# cityhall.py — 台北市政府 (Taipei City Hall, 1994) as a stylized glb, seen far off on the Xinyi horizon.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/cityhall.py -- --out asset/models/src/cityhall.glb --stats --preview research/blender-detail/models/cityhall-preview.png
# Triangle budget: 6,000 (blender-detail brief, 2026-11-01).
#
# Reference (research/blender-detail/models/ref-cityhall/sources.md, Wikimedia Commons): the
# head-on view from the 市府路 axis (Taipei-City-Hall-face-20050531.jpg, public domain) and the
# oblique from 市府路/松壽路 (…intersection-20100721.jpg). What the photos show and this builds:
#   - a symmetrical block, 12 storeys: a dark recessed two-storey base, then ten storeys of a
#     punched window grid (square windows between beige tile piers and spandrels), a plain cap;
#   - two tall plain pylons either side of the centre court, two storeys above the wings, where
#     the festival banners hang (blank boards here; text stays canvas in JS);
#   - a recessed centre court: the back block's window grid above a low granite entrance block
#     (portal with two columns, a name board, a row of cypresses on its roof garden);
#   - small porch pavilions at the pylon bases; the corners step down two storeys at the ends;
#   - the double-cross plan: front wings, a back bar and two north-south cross arms, which leave
#     four light courts behind the front wings.
#
# Size: the scene contract, not metres. scene-tower.js draws the horizon silhouette at x -46,
# z -505, 153 wide (x ±76.5), 50 deep (y ±25) and 57.8 tall at the top; this model fills the same
# envelope. Frame: origin on the ground at the centre, the front (the 市府路 side, toward the
# approach camera) faces -Y. Windows are relief, not booleans: an ink core with tile piers and
# spandrels standing 0.5 proud of it, unbevelled (thin bars), which keeps the far-off grid cheap.

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_prism, solid, cutter

FL = 3.6                 # one storey
BASE = 2 * FL            # the dark two-storey base
WING_N = 10              # storeys of window grid above the base (12 storeys in all)
WING_TOP = BASE + WING_N * FL          # 43.2
CAP = 1.2
END_N = 8                # the stepped end blocks: two storeys lower
END_TOP = BASE + END_N * FL            # 36.0
PYLON_TOP = 54.0
TOP = 57.8               # the scene's silhouette top (roof box on the pylons)

XW0, XW1 = 18.0, 66.0    # front wings, either side of the centre court
XE = 76.0                # the outer edge (the caps overhang it by REL, to the scene's 76.5)
Y0, Y1 = -25.0, 25.0     # front, back
WING_YB = -7.0           # back face of the front wings
BACK_Y0 = 7.0            # front face of the back bar
ARM_X, ARM_W = 42.0, 14.0               # the two north-south cross arms
END_Y0, END_Y1 = -20.0, 20.0            # end blocks, set back from the wing front
PX0, PX1, PY1 = 14.5, 24.0, -11.0       # pylons
REL = 0.5                # how far the tile grid stands proud of the ink core
PIER, SPAN = 1.15, 1.9  # pier width, spandrel height: the photos show about as much wall as window


def grid(bm, axis, plane, sgn, a, b, z0, nf, nb):
    """Window grid on one face: piers and spandrels standing proud of the plane.
    axis 'y': the face lies in y = plane, runs along x from a to b, outward normal sgn*Y.
    axis 'x': the face lies in x = plane, runs along y from a to b, outward normal sgn*X."""
    z1 = z0 + nf * FL
    off = plane + sgn * REL / 2
    step = (b - a) / nb

    def box(u, w, zc, h):
        if axis == 'y':
            bm_box(bm, (w, REL, h), (u, off, zc))
        else:
            bm_box(bm, (REL, w, h), (off, u, zc))
    for i in range(nb + 1):                                   # piers, the end ones doubled
        w = PIER * (2.0 if i in (0, nb) else 1.0)
        u = a + i * step + (w / 2 if i == 0 else -w / 2 if i == nb else 0)
        box(u, w, (z0 + z1) / 2, z1 - z0)
    for k in range(nf + 1):                                   # spandrels, one per floor line
        zc = z0 + k * FL + (SPAN / 2 if k == 0 else -SPAN / 2 if k == nf else 0)
        box((a + b) / 2, b - a, zc, SPAN)


def mirror(fn):
    for s in (-1, 1):
        fn(s)


def build():
    # ── the ink cores: everything behind the window grid ─────────────────────
    def cores(bm):
        for s in (-1, 1):
            xa, xb = sorted((s * XW0, s * XW1))
            bm_box(bm, (XW1 - XW0, WING_YB - Y0, WING_TOP), ((xa + xb) / 2, (Y0 + WING_YB) / 2, WING_TOP / 2))   # front wing
            bm_box(bm, (ARM_W, BACK_Y0 - WING_YB, WING_TOP), (s * ARM_X, 0, WING_TOP / 2))                         # cross arm
            xa, xb = sorted((s * XW1, s * XE))
            bm_box(bm, (XE - XW1, END_Y1 - END_Y0, END_TOP), ((xa + xb) / 2, 0, END_TOP / 2))                      # stepped end block
        bm_box(bm, (2 * XW1, Y1 - BACK_Y0, WING_TOP), (0, (BACK_Y0 + Y1) / 2, WING_TOP / 2))                       # back bar
        bm_box(bm, (2 * PX0, BACK_Y0 - PY1, WING_TOP), (0, (PY1 + BACK_Y0) / 2, WING_TOP / 2))                     # court back wall
    solid('cores', 'ink', cores, bevel=0, smooth=False)

    # ── the dark base: two storeys, a shade darker than the tile ─────────────
    def base(bm):
        for s in (-1, 1):
            xa, xb = sorted((s * XW0, s * XW1))
            bm_box(bm, (XW1 - XW0 - 0.6, 0.6, BASE - 0.4), ((xa + xb) / 2, Y0 + 0.9, BASE / 2))
            xa, xb = sorted((s * XW1, s * XE))
            bm_box(bm, (XE - XW1 - 1.2, 0.6, BASE - 0.4), ((xa + xb) / 2, END_Y0 + 0.9, BASE / 2))
    solid('base', 'road', base, bevel=0, smooth=False)

    # ── the tile window grid on every face the approach camera sees ──────────
    def tiles(bm):
        for s in (-1, 1):
            xa, xb = sorted((s * XW0, s * XW1))
            grid(bm, 'y', Y0, -1, xa, xb, BASE, WING_N, 20)                          # wing front
            grid(bm, 'x', s * XW0, -s, Y0, WING_YB, BASE, WING_N, 6)                 # wing face on the court
            xa, xb = sorted((s * XW1, s * XE))
            grid(bm, 'y', END_Y0, -1, xa, xb, BASE, END_N, 4)                        # end block front
            grid(bm, 'x', s * XE, s, END_Y0, END_Y1, BASE, END_N, 13)                # end block outer side
            grid(bm, 'x', s * XW1, s, Y0, END_Y0, BASE, WING_N, 2)                   # wing end, in front of the step
        grid(bm, 'y', PY1, -1, -PX0, PX0, BASE, WING_N, 12)                          # back block over the court
    solid('grid', 'walk', tiles, bevel=0, smooth=False)

    # ── caps: a plain tile parapet over each block ───────────────────────────
    def caps(bm):
        for s in (-1, 1):
            xa, xb = sorted((s * XW0, s * XW1))
            bm_box(bm, (XW1 - XW0 + 2 * REL, WING_YB - Y0 + REL, CAP), ((xa + xb) / 2, (Y0 + WING_YB) / 2 - REL / 2, WING_TOP + CAP / 2))
            xa, xb = sorted((s * XW1, s * XE))
            bm_box(bm, (XE - XW1 + REL, END_Y1 - END_Y0 + 2 * REL, CAP), ((xa + xb) / 2 + s * REL / 2, 0, END_TOP + CAP / 2))
            bm_box(bm, (ARM_W, BACK_Y0 - WING_YB, CAP), (s * ARM_X, 0, WING_TOP + CAP / 2))
        bm_box(bm, (2 * XW1 + 2 * REL, Y1 - BACK_Y0 + REL, CAP), (0, (BACK_Y0 + Y1) / 2, WING_TOP + CAP / 2))
        bm_box(bm, (2 * PX0, BACK_Y0 - PY1 + REL, CAP), (0, (PY1 + BACK_Y0) / 2 - REL / 2, WING_TOP + CAP / 2))
    solid('caps', 'walk', caps)

    # ── the two pylons: plain tile, two storeys above the wings ──────────────
    def pylons(bm):
        for s in (-1, 1):
            bm_box(bm, (PX1 - PX0, BACK_Y0 - Y0 + 1.0, PYLON_TOP), (s * (PX0 + PX1) / 2, (Y0 - 1.0 + BACK_Y0) / 2, PYLON_TOP / 2))
    solid('pylons', 'walk', pylons)

    def pylon_slits(bm):    # the narrow stair windows on the court face and the outer face
        for s in (-1, 1):
            for xf in (s * PX0, s * PX1):
                bm_box(bm, (0.3, 1.6, PYLON_TOP - BASE - 6), (xf - (0.1 if abs(xf) == PX0 else -0.1) * s, Y0 + 4.0, (PYLON_TOP + BASE - 6) / 2))
    solid('slits', 'ink', pylon_slits, bevel=0, smooth=False)

    def roofbox(bm):        # lift-machine rooms on the pylons (the scene's top line)
        for s in (-1, 1):
            bm_box(bm, (6.0, 9.0, TOP - PYLON_TOP), (s * (PX0 + PX1) / 2, -12.0, (PYLON_TOP + TOP) / 2))
        for s in (-1, 1):
            for x in (30.0, 54.0):
                bm_box(bm, (5.0, 6.0, 2.4), (s * x, 14.0, WING_TOP + CAP + 1.2))
    solid('roofbox', 'walk', roofbox)

    def banners(bm):        # blank banner boards on the pylon fronts
        for s in (-1, 1):
            bm_box(bm, (PX1 - PX0 - 1.2, 0.3, 20.0), (s * (PX0 + PX1) / 2, Y0 - 1.0 - 0.15, 38.0))
    solid('banners', 'bone', banners, bevel=0, smooth=False)

    # ── the granite entrance block in the court ──────────────────────────────
    EW, EH, EY1 = 2 * PX0, 16.0, PY1
    portal = cutter('portal', 'ink', lambda bm: bm_box(bm, (18.0, 6.0, 17.0), (0, Y0, 0)))
    solid('entrance', 'road', lambda bm: bm_box(bm, (EW, EY1 - Y0, EH), (0, (Y0 + EY1) / 2, EH / 2)), cutters=[portal])

    def columns(bm):
        for x in (-4.5, 4.5):
            bm_box(bm, (1.6, 1.6, 8.5), (x, Y0 + 1.5, 4.25))
        bm_box(bm, (18.0, 0.8, 0.8), (0, Y0 + 0.6, 8.1))                     # lintel under the board
    solid('columns', 'road', columns)

    def doors(bm):          # glazed doors deep in the portal
        bm_box(bm, (10.0, 0.4, 4.0), (0, Y0 + 2.6, 2.0))
    solid('doors', 'glass', doors, bevel=0, smooth=False)

    solid('nameboard', 'bone', lambda bm: bm_box(bm, (14.0, 0.3, 2.6), (0, Y0 - 0.15, 11.6)), bevel=0, smooth=False)

    def cypress(bm):        # the row of cypresses on the roof garden
        for i in range(12):
            x = -12.0 + i * (24.0 / 11)
            bm_prism(bm, 6, 0.75, 0.05, EH, EH + 3.4, center=(x, Y0 + 1.6))
        bm_box(bm, (2 * PX0 - 1.0, 4.0, 0.8), (0, Y0 + 4.0, EH + 0.4))     # the hedge bed
    solid('garden', 'leaf', cypress, bevel=0, smooth=False)

    # ── porch pavilions at the pylon bases ───────────────────────────────────
    def porches(bm):
        for s in (-1, 1):
            bm_box(bm, (7.0, 6.0, 7.0), (s * 28.0, Y0 + 3.0, 3.5))
    porch_doors = cutter('porch_doors', 'ink', lambda bm: [bm_box(bm, (4.0, 2.0, 9.0), (s * 28.0, Y0, 0)) for s in (-1, 1)])
    solid('porches', 'walk', porches, cutters=[porch_doors])


if __name__ == '__main__':
    S.run(build, camera=((0.0, -230.0, 2.0), (0.0, 0.0, 24.0), 32))
