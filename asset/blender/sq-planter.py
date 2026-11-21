# sq-planter.py — a concrete planter box with low shrubs, and a potted plant, for the lantern square
# (CJ 2026-10-31 "i need the square be more realistic"; the 紅樓 front plaza has raised concrete
# planters along its edges, and every shopfront has a pot or two outside).
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/sq-planter.py -- --out asset/models/src/sq-planter.glb --stats
#   add --spread (before --) to lay the two nodes side by side for the preview only.
#
# Two nodes, each with its origin at its own base centre, front toward -Y, real size:
#   planter      1.8 x 0.6 x 0.55 m cast-concrete box with a chamfered lip, dark soil just below the
#                rim, and a hedge of red-tipped photinia to about 1.3 m
#   pottedPlant  a 0.45 m terracotta pot with a leafy plant, about 1.1 m tall
# References: research/reference/square/props/scooter-01 (the sidewalk planter of red-tipped
# photinia behind the parked scooters), Eagle MVWPCCYQ2B8DP / MVWPC4K1JST02 (the Red House plaza
# edge), research/reference/ximen/img/redhouse-04 (the north plaza).

import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_lathe, bm_sphere
import sq_lib as L

W, D, H = 1.8, 0.6, 0.55


def planter(T):
    g = 'planter'

    def box(bm):
        bm_box(bm, (W, D, H - 0.06), (0, 0, (H - 0.06) / 2), T)
        bm_box(bm, (W + 0.06, D + 0.06, 0.08), (0, 0, H - 0.04), T)          # the lip
    S.solid('box', 'walk', box, bevel=0.03, group=g)
    S.solid('soil', 'ink', lambda bm: bm_box(bm, (W - 0.12, D - 0.12, 0.04), (0, 0, H - 0.02), T), bevel=0, group=g)

    def shrubs(bm):
        for x, r, h in ((-0.6, 0.38, 0.85), (-0.02, 0.42, 1.0), (0.58, 0.37, 0.8)):
            for v in bm_sphere(bm, r, (x, 0, H + 0.12 + h / 2 - r), u=8, v=5, scale_z=h / (2 * r)):
                v.co = T @ v.co
        for x in (-0.33, 0.27):                                                # smaller tufts between
            for v in bm_sphere(bm, 0.22, (x, -0.1, H + 0.12), u=7, v=5, scale_z=0.9):
                v.co = T @ v.co
    S.solid('shrubs', 'leaf', shrubs, bevel=0, group=g)

    def tips(bm):                                                              # the red new growth of photinia
        for x, z in ((-0.05, H + 0.66), (0.55, H + 0.5)):
            for v in bm_sphere(bm, 0.17, (x, -0.08, z), u=6, v=4, scale_z=0.8):
                v.co = T @ v.co
    S.solid('tips', 'verm', tips, bevel=0, group=g)


def potted(T):
    g = 'pottedPlant'
    prof = [(0, 0.02), (0.15, 0.0), (0.2, 0.36), (0.235, 0.38), (0.235, 0.45), (0.2, 0.45), (0.19, 0.4), (0, 0.4)]
    S.solid('pot', 'brick', lambda bm: bm_lathe(bm, prof, n=10, xform=T), bevel=0, group=g)

    def leaves(bm):
        for c, r, sz in (((0, 0, 0.72), 0.3, 1.0), ((-0.13, 0.06, 0.95), 0.2, 1.1), ((0.12, -0.05, 0.9), 0.2, 1.0)):
            for v in bm_sphere(bm, r, c, u=7, v=5, scale_z=sz):
                v.co = T @ v.co
    S.solid('leaves', 'leaf', leaves, bevel=0, group=g)


def build():
    planter(L.offset(2.4))
    potted(L.offset(2.4))


if __name__ == '__main__':
    S.run(build, camera=L.camera(None))
