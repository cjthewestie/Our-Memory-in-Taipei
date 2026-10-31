# dihua-yang.py — 洋樓 style Dihua Street bay (blender-detail pass, 2026-11-01): red brick, three
# round-arched French windows per floor in pale surrounds with keystones, a balcony with turned
# balusters in front of them (dihua-04, dihua-05), and the parapet: a dentil cornice, a
# balustrade between two pedestals with ball finials, and a small pediment over a blank name
# plaque in the middle. Shared bay in dihua_common.py; the parapet goes in the 'crest' group.
#
#   Blender --background --python asset/blender/dihua-yang.py -- --out asset/models/src/dihua-yang.glb

import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_prism, bm_solid
import dihua_common as D

WIN_W, WIN_H, SILL = 0.8, 2.35, 0.25


def keystones(z0, group, sfx, xs):
    def b(bm):
        z = z0 + SILL + WIN_H + 0.08
        for x in xs:
            bm_solid(bm, [(x - 0.1, z - 0.12), (x + 0.1, z - 0.12), (x + 0.14, z + 0.2), (x - 0.14, z + 0.2)], -0.14, 0.0)
    D.flat('keystones' + sfx, 'bone', b, group)


def parapet():
    top = D.TOP
    D.cornice('bone', top + 0.14, depth=0.52)
    D.dentils('bone', top - 0.42, n=12, size=0.1, proud=0.1, y=-0.06)

    px = (-D.HW + 0.3, D.HW - 0.3)
    def pedestals(bm):
        for x in px:
            bm_box(bm, (0.5, 0.5, 1.0), (x, 0.1, top + 0.64))
    D.trim('parapet_pedestals', 'bone', pedestals, 'crest', bevel=0.03)
    def pedestal_caps(bm):
        for x in px:
            bm_box(bm, (0.62, 0.62, 0.12), (x, 0.1, top + 1.2))
            bm_box(bm, (0.4, 0.4, 0.12), (x, 0.1, top + 1.32))
    D.flat('pedestal_caps', 'bone', pedestal_caps, 'crest')
    solid_ball = lambda bm: [S.bm_sphere(bm, 0.17, (x, 0.1, top + 1.55), 8, 6) for x in px]
    S.solid('finials', 'bone', solid_ball, bevel=0.0, group='crest')

    # balustrade between the pedestals, in two runs either side of the central pediment
    runs = ((-D.HW + 0.55, -0.95), (0.55, D.HW - 0.55))
    def rails(bm):
        for a, b in runs:
            bm_box(bm, (b - a, 0.42, 0.16), ((a + b) / 2, 0.1, top + 0.22))
            bm_box(bm, (b - a, 0.4, 0.14), ((a + b) / 2, 0.1, top + 1.0))
    D.trim('rails', 'bone', rails, 'crest')
    def balusters(bm):
        for a, b in runs:
            n = 4
            for i in range(n):
                x = a + (i + 0.5) * (b - a) / n
                bm_prism(bm, 4, 0.05, 0.09, top + 0.3, top + 0.58, rot=0.785, center=(x, 0.1))
                bm_prism(bm, 4, 0.09, 0.05, top + 0.58, top + 0.93, rot=0.785, center=(x, 0.1))
    D.flat('parapet_balusters', 'bone', balusters, 'crest')

    # the central pediment over the name plaque
    def pediment(bm):
        bm_box(bm, (1.5, 0.44, 1.0), (-0.2, 0.08, top + 0.64))                       # tablet wall
        bm_solid(bm, [(-1.1, top + 1.14), (0.7, top + 1.14), (-0.2, top + 1.6)], -0.2, 0.3)
    S.solid('pediment', 'brick', pediment, bevel=0.03, group='crest')
    def ped_trim(bm):
        bm_box(bm, (1.9, 0.5, 0.12), (-0.2, 0.0, top + 1.14))
        for s in (-1, 1):
            S.bm_bar(bm, (-0.2 + s * 1.02, -0.22, top + 1.18), (-0.2, -0.22, top + 1.68), 0.12)
        bm_box(bm, (1.16, 0.06, 0.6), (-0.2, -0.16, top + 0.66))                      # blank plaque
    D.trim('pediment_trim', 'bone', ped_trim, 'crest')


def build():
    D.build_bay(parapet, wall='brick', trim='bone', pil='bone', sash='bone', stone='walk',
                windows=3, kind='arch', win_w=WIN_W, win_h=WIN_H, sill=SILL, balcony=True,
                rail='baluster', rail_col='bone', floor_extra=keystones)


if __name__ == '__main__':
    S.run(build, camera=D.PREVIEW_CAM)
