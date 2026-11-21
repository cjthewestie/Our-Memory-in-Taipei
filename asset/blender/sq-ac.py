# sq-ac.py — a split air-conditioner outdoor unit on its wall bracket, for the facades around the
# lantern square (CJ 2026-10-31 "i need the square be more realistic").
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/sq-ac.py -- --out asset/models/src/sq-ac.glb --stats
#
# One node `ac`, real size: the unit 0.80 wide x 0.30 deep x 0.58 tall in pale casing, the round fan
# grille (dark disc behind a cross of guard bars) on the left of the front, the service cover and
# the copper-pipe stubs on the right, standing on two steel L-brackets with diagonal braces.
# Origin: ON THE WALL PLANE (y = 0), centred in x, at the foot of the bracket braces (z = 0); the
# unit sticks out of the wall toward -Y. Place it so y = 0 touches the facade, front = outward.
# References: research/reference/square/props/ac-01 (Panasonic unit on a Taipei wall, bracket and
# pipes), ac-02 (units on angled brackets), Eagle MVWPJELD2U6B5 (a facade covered in units) and
# MVWPDSZUXMT2D (承德路 arcade fronts).

import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_lathe

W, D, HU = 0.80, 0.30, 0.58
Z0 = 0.32                      # top of the bracket arms = bottom of the unit
Y0 = -0.05                     # gap between the wall and the back of the unit
G = 'ac'


def build():
    S.solid('casing', 'bone', lambda bm: bm_box(bm, (W, D, HU), (0, Y0 - D / 2, Z0 + HU / 2)), bevel=0.025, group=G)
    yf = Y0 - D                                                            # the front face
    gx, gz, gr = -0.12, Z0 + HU / 2, 0.215
    rot = Matrix.Rotation(1.5708, 4, 'X')                                  # lathe axis Z -> -Y
    S.solid('fan', 'ink', lambda bm: bm_lathe(bm, [(0, 0), (gr, 0), (gr, 0.012), (0, 0.012)], n=10,
                                               xform=Matrix.Translation((gx, yf + 0.002, gz)) @ rot), bevel=0, group=G)

    def guard(bm):
        bm_box(bm, (2 * gr, 0.012, 0.018), (gx, yf - 0.014, gz))         # guard bars over the fan
        bm_box(bm, (0.018, 0.012, 2 * gr), (gx, yf - 0.014, gz))
        bm_box(bm, (0.16, 0.02, 0.2), (0.27, yf - 0.006, Z0 + 0.22))     # service cover
        for k in (0, 1):                                                  # pipe stubs into the wall
            bm_box(bm, (0.03, 0.06 + abs(Y0) + D * 0.35, 0.03), (W / 2 - 0.05 - 0.05 * k, -0.04 - D * 0.15, Z0 + 0.1 + 0.05 * k))
    S.solid('trim', 'haze', guard, bevel=0, group=G)

    def bracket(bm):
        for x in (-0.28, 0.28):
            bm_box(bm, (0.04, 0.42, 0.04), (x, -0.21, Z0 - 0.02))         # arm under the unit
            bm_bar(bm, (x, -0.02, 0.02), (x, -0.36, Z0 - 0.04), 0.03)     # diagonal brace
    S.solid('bracket', 'ink', bracket, bevel=0, group=G)


if __name__ == '__main__':
    S.run(build, camera=((1.4, -2.3, 1.3), (0, -0.2, 0.55), 30))
