# dihua-baroque.py — 巴洛克 style Dihua Street bay (blender-detail pass, 2026-11-01): plaster walls
# ('walk', its own material so the scene recolours it per instance), three French windows per
# floor with segmental heads under pediment hoods on consoles, engaged columns between them, an
# iron balcony grille with a lozenge band (dihua-01, dihua-05), and the curved gable crest
# (屈臣氏大藥房 / 林五湖 / 和成行 style, dihua-01, -02): the crest plate with a moulded border and a
# sunk field, a blank name cartouche at its foot, shoulder volutes on consoles, urns on the
# shoulder pedestals, the medallion in its ring, a finial on the crown, and stucco garlands.
# Shared bay in dihua_common.py; the crest goes in the 'crest' group.
#
#   Blender --background --python asset/blender/dihua-baroque.py -- --out asset/models/src/dihua-baroque.glb

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_solid, bm_prism, bm_lathe, solid
import dihua_common as D

CREST_H = 2.1
CREST_W = 4.5
WIN_W, WIN_H, SILL = 0.8, 2.3, 0.25
ROT_X = Matrix.Rotation(math.pi / 2, 4, 'X')


def crest_profile(scale=1.0, dz=0.0):
    """scene-dadao.js crestGeo, x -0.5..0.5, y 0..1, scaled to CREST_W x CREST_H, sitting on TOP."""
    P = lambda x, y: (x * CREST_W * scale - 0.1, y * CREST_H * scale + D.TOP + dz)
    pts = [P(-0.5, 0), P(0.5, 0), P(0.5, 0.32)]
    pts += [P(*p) for p in S.quad((0.5, 0.32), (0.42, 0.5), (0.27, 0.52), 3)]
    pts.append(P(0.17, 0.6))
    pts += [P(*p) for p in S.cubic((0.17, 0.6), (0.17, 0.92), (0.07, 1.0), (0.0, 1.0), 4)]
    pts += [P(*p) for p in S.cubic((0.0, 1.0), (-0.07, 1.0), (-0.17, 0.92), (-0.17, 0.6), 4)]
    pts.append(P(-0.27, 0.52))
    pts += [P(*p) for p in S.quad((-0.27, 0.52), (-0.42, 0.5), (-0.5, 0.32), 3)]
    return pts


def window_dress(z0, group, sfx, xs):
    """Over each window a segmental pediment hood on two consoles; between the windows an engaged
    column with a base and a capital, standing on the balcony and carrying the string course."""
    def hoods(bm):
        z = z0 + SILL + WIN_H + 0.16
        for x in xs:
            bm_box(bm, (WIN_W + 0.5, 0.26, 0.1), (x, -0.13, z))
            pts = [(x - 0.55, z + 0.05), (x + 0.55, z + 0.05)]
            pts += [(x + 0.55 * math.cos(a), z + 0.05 + 0.26 * math.sin(a)) for a in (0.5, 1.0, 1.57, 2.14, 2.64)]
            bm_solid(bm, pts, -0.22, 0.0)
            for s in (-1, 1):
                bm_box(bm, (0.12, 0.22, 0.26), (x + s * (WIN_W / 2 + 0.16), -0.11, z - 0.18))
    D.flat('hoods' + sfx, 'bone', hoods, group)

    def columns(bm):
        for i in range(len(xs) - 1):
            x = (xs[i] + xs[i + 1]) / 2
            bm_prism(bm, 8, 0.12, 0.105, z0 + 0.4, z0 + D.FH - 0.55, rot=math.pi / 8, center=(x, -0.06))
    solid('columns' + sfx, 'bone', columns, bevel=0.0, group=group)

    def col_ends(bm):
        for i in range(len(xs) - 1):
            x = (xs[i] + xs[i + 1]) / 2
            bm_box(bm, (0.3, 0.26, 0.2), (x, -0.08, z0 + 0.3))
            bm_box(bm, (0.3, 0.26, 0.1), (x, -0.08, z0 + D.FH - 0.5))
            bm_box(bm, (0.36, 0.3, 0.12), (x, -0.1, z0 + D.FH - 0.39))
    D.flat('column_ends' + sfx, 'bone', col_ends, group)


def parapet():
    top = D.TOP
    D.cornice('bone', top + 0.14, depth=0.52)
    D.dentils('bone', top - 0.42, n=10, size=0.1, proud=0.1, y=-0.06)

    solid('crest', 'walk', lambda bm: bm_solid(bm, crest_profile(), 0.0, 0.5), bevel=0.0, smooth=False, group='crest')
    solid('crest_band', 'bone', lambda bm: bm_solid(bm, crest_profile(0.96, 0.03), -0.08, 0.0), bevel=0.02, group='crest')
    solid('crest_field', 'walk', lambda bm: bm_solid(bm, crest_profile(0.8, 0.12), -0.1, -0.06), bevel=0.0, smooth=False, group='crest')

    # the name cartouche at the foot of the crest (blank — text stays canvas), with ears
    def cartouche(bm):
        bm_box(bm, (1.9, 0.1, 0.5), (-0.1, -0.16, top + 0.5))
        for s in (-1, 1):
            bm_solid(bm, [(-0.12, -0.25), (0.12, -0.25), (0.2, 0.25), (-0.2, 0.25)], -0.2, -0.1,
                     Matrix.Translation((-0.1 + s * 1.03, 0, top + 0.5)))
    D.flat('cartouche', 'bone', cartouche, 'crest')

    # shoulder volutes, each a disc and its eye, carried on stepped consoles
    def volutes(bm):
        for s in (-1, 1):
            x = -0.1 + s * 0.27 * CREST_W
            m = Matrix.Translation((x, -0.04, top + 0.52 * CREST_H)) @ Matrix.Rotation(-math.pi / 2, 4, 'X')
            bm_prism(bm, 10, 0.26, 0.26, 0.0, 0.14, rot=0, xform=m)
            m2 = Matrix.Translation((x, -0.18, top + 0.52 * CREST_H)) @ Matrix.Rotation(-math.pi / 2, 4, 'X')
            bm_prism(bm, 8, 0.12, 0.12, 0.0, 0.12, rot=0, xform=m2)
    solid('volutes', 'bone', volutes, bevel=0.0, group='crest')

    def consoles(bm):
        for s in (-1, 1):
            x = -0.1 + s * 0.27 * CREST_W
            for w, h, dz in ((0.44, 0.14, 0.0), (0.34, 0.12, 0.14), (0.24, 0.1, 0.26)):
                bm_box(bm, (w, 0.36, h), (x, -0.02, top + 0.9 + dz))
    D.flat('crest_consoles', 'bone', consoles, 'crest')

    # pedestals at the two shoulder ends, each with an urn (dihua-02)
    def pedestals(bm):
        for s in (-1, 1):
            x = -0.1 + s * (CREST_W / 2 - 0.22)
            bm_box(bm, (0.44, 0.5, 0.2), (x, 0.16, top + CREST_H * 0.32 + 0.1))
    D.trim('crest_pedestals', 'bone', pedestals, 'crest')
    def urns(bm):
        prof = [(0.0, 0.0), (0.12, 0.0), (0.08, 0.06), (0.16, 0.2), (0.12, 0.36), (0.06, 0.4), (0.09, 0.46), (0.0, 0.5)]
        for s in (-1, 1):
            x = -0.1 + s * (CREST_W / 2 - 0.22)
            bm_lathe(bm, prof, n=6, xform=Matrix.Translation((x, 0.16, top + CREST_H * 0.32 + 0.2)))
    solid('urns', 'bone', urns, bevel=0.0, group='crest')

    # the medallion in its ring, and the finial on the crown
    solid('medallion', 'lamp', lambda bm: bm_prism(bm, 12, 0.3, 0.3, 0.0, 0.14, rot=0,
          xform=Matrix.Translation((-0.1, -0.06, top + 1.3)) @ ROT_X), bevel=0.0, group='crest')
    solid('medallion_ring', 'bone', lambda bm: bm_prism(bm, 12, 0.4, 0.4, 0.0, 0.08, rot=0,
          xform=Matrix.Translation((-0.1, -0.02, top + 1.3)) @ ROT_X), bevel=0.0, group='crest')
    def finial(bm):
        prof = [(0.0, 0.0), (0.16, 0.0), (0.1, 0.1), (0.14, 0.24), (0.05, 0.36), (0.0, 0.5)]
        bm_lathe(bm, prof, n=8, xform=Matrix.Translation((-0.1, 0.2, top + CREST_H - 0.02)))
    solid('finial', 'bone', finial, bevel=0.0, group='crest')

    # stucco garlands: a swag of bars hanging from the medallion ring to the shoulders
    def garlands(bm):
        for s in (-1, 1):
            pts = [(-0.1 + s * (0.35 + 0.17 * i), top + 1.2 - 0.32 * math.sin(i / 4 * math.pi)) for i in range(5)]
            for a, b in zip(pts, pts[1:]):
                S.bm_bar(bm, (a[0], -0.13, a[1]), (b[0], -0.13, b[1]), 0.08)
    D.flat('garlands', 'bone', garlands, 'crest')


def build():
    D.build_bay(parapet, wall='walk', trim='bone', pil='bone', sash='bone', stone='bone', pier_col='walk',
                windows=3, kind='seg', win_w=WIN_W, win_h=WIN_H, sill=SILL, balcony=True,
                rail='iron', rail_col='ink', floor_extra=window_dress)


if __name__ == '__main__':
    S.run(build, camera=D.PREVIEW_CAM)
