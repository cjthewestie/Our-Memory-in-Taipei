# dihua-min.py — 閩南 style Dihua Street bay (blender-detail pass, 2026-11-01): plain red brick,
# two windows per floor in granite surrounds with timber louvred shutters folded open
# (yongle-05, dihua-03, dihua-07), and the 閩南 parapet — a corbelled brick cornice, three
# brick panels each holding a grille of green-glazed vent tiles (花磚), a raised name plaque
# with a stepped head in the middle, end piers, and a granite coping. Shared bay in
# dihua_common.py; everything here goes in the 'crest' group.
#
#   Blender --background --python asset/blender/dihua-min.py -- --out asset/models/src/dihua-min.glb

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, solid, cutter
import dihua_common as D


def parapet():
    top = D.TOP
    # corbelled brick cornice: two oversailing courses over a dentil row
    def corbel(bm):
        bm_box(bm, (D.W, 0.2, 0.12), (0, -0.08, top - 0.3))
        bm_box(bm, (D.W, 0.32, 0.14), (0, -0.14, top - 0.14))
    D.trim('corbel', 'brick', corbel, 'crest', bevel=0.03)
    D.dentils('brick', top - 0.46, n=18, size=0.1, proud=0.12, y=-0.02)
    solid('string_course', 'walk', lambda bm: bm_box(bm, (D.W, 0.36, 0.08), (0, -0.14, top + 0.0)), bevel=0.0, smooth=False, group='crest')

    # the parapet wall, three panels sunk into its street face
    panels = ((-1.55, 1.1), (1.15, 1.1))
    def sink(bm):
        for dx, w in panels:
            bm_box(bm, (w, 0.24, 0.52), (dx, -0.02, top + 0.47))
    c = cutter('parapet_panels', 'ink', sink)
    solid('parapet', 'brick', lambda bm: bm_box(bm, (D.W, 0.4, 0.86), (0, 0.2, top + 0.43)), cutters=(c,),
          bevel=0.0, smooth=False, group='crest')

    # green glazed vent tiles in the panels: a grid of small bars (花磚 grille)
    def grille(bm):
        for dx, w in panels:
            for k in range(5):
                bm_box(bm, (0.05, 0.05, 0.52), (dx - w / 2 + (k + 0.5) * w / 5, 0.04, top + 0.47))
            for z in (0.3, 0.47, 0.64):
                bm_box(bm, (w, 0.05, 0.05), (dx, 0.04, top + z))
    D.flat('vent_tiles', 'glass', grille, 'crest')

    # the central name plaque, raised, with a stepped (馬背-like) head — blank, text is canvas
    def plaque(bm):
        bm_box(bm, (1.2, 0.5, 1.1), (-0.2, 0.0, top + 0.55))
        bm_box(bm, (0.9, 0.5, 0.2), (-0.2, 0.0, top + 1.2))
        bm_box(bm, (0.5, 0.5, 0.16), (-0.2, 0.0, top + 1.38))
    D.trim('plaque_wall', 'brick', plaque, 'crest', bevel=0.03)
    D.flat('plaque_face', 'walk', lambda bm: bm_box(bm, (0.86, 0.06, 0.56), (-0.2, -0.27, top + 0.62)), 'crest')

    def piers(bm):
        for x in (-D.HW + 0.22, D.HW - 0.22):
            bm_box(bm, (0.44, 0.5, 1.06), (x, 0.15, top + 0.53))
    D.trim('parapet_piers', 'brick', piers, 'crest', bevel=0.03)

    def coping(bm):
        bm_box(bm, (D.W, 0.52, 0.1), (0, 0.18, top + 0.91))
        for x in (-D.HW + 0.22, D.HW - 0.22):
            bm_box(bm, (0.56, 0.62, 0.12), (x, 0.15, top + 1.12))
        bm_box(bm, (1.36, 0.62, 0.1), (-0.2, 0.0, top + 1.51))
        bm_box(bm, (1.04, 0.62, 0.08), (-0.2, 0.0, top + 1.14))
    D.trim('coping', 'walk', coping, 'crest')


def vents(z0, group, sfx, xs):
    """The row of small square vents in the brick band under each storey's string course
    (yongle-05), dark, flush with the brick."""
    def b(bm):
        for i in range(9):
            bm_box(bm, (0.14, 0.04, 0.14), (D.CX - 1.8 + i * 0.45, -0.01, z0 + D.FH - 0.62))
    D.flat('vents' + sfx, 'ink', b, group)


def build():
    D.build_bay(parapet, wall='brick', trim='walk', pil='brick', sash='walk', wood='ink', stone='walk',
                shop_wall='haze', shop_frame='walk',
                windows=2, kind='rect', win_w=0.92, win_h=1.95, sill=0.7, shutters=True,
                floor_extra=vents)


if __name__ == '__main__':
    S.run(build, camera=D.PREVIEW_CAM)
