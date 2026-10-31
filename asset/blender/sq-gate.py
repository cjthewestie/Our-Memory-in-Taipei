# sq-gate.py — the three gateways out of the walk-mode square, each after a real Taipei gate.
#
# One glb, three groups (glb nodes), one per gate, all sized to walk.js's opening: clear width
# 2 × SQ.gate = 9.2 (x ±4.6), clear height 7.5, standing on the wall line (y = 0), front -Y in
# Blender = +Z in three.js, so square.js turns each the way walk.js turns its arch().
#
#   'ximen'  西門町 (west). After the pedestrian-zone gateway at 西門町's main entrance by 漢中街 /
#            成都路 (Eagle "Ximending gate 01.JPG", "At the main entrance of Ximending near Zhonghua
#            Rd 2009"; img/ximending-entrance.jpg): two steel lattice masts each side, a deep
#            light-box sign across the top with a row of bulbs under it. Sign slot (canvas text in
#            JS): face at y = -0.36, centre z 8.55, 10.4 × 1.7, both faces.
#   'dadao'  大稻埕 (north). After the 迪化街 red-brick shophouse fronts and the city's 牌樓 gates
#            (img/gate-dizang.jpg, research/reference/dadao): brick piers with stone bands, a
#            segmental brick arch with a keystone, a Baroque crest with a name panel. Sign slot:
#            face at y = -0.56, centre z 9.25, 5.2 × 1.1.
#   'xinyi'  信義 (east). After the glass-and-steel street furniture round 101 and the 信義 skywalk:
#            two glass pylons with steel fins, a thin steel beam with a light line and a sign band.
#            Sign slot: face at y = -0.41, centre z 8.15, 10.0 × 0.9.
#
#   Blender --background --python asset/blender/sq-gate.py -- --out asset/models/src/sq-gate.glb --stats
#
# Budget: ≤ 3.5k triangles per gate (each is used once).

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_cylinder, bm_solid, bm_sphere, bm_bar, cubic

HW, CLEAR = 4.6, 7.5


def solid(*a, **k):
    k.setdefault('smooth', k.get('bevel', S.BEVEL) > 0)
    return S.solid(*a, **k)


def ximen():
    g = 'ximen'
    mast_x = HW + 0.55                       # centre of each side's pair of masts

    def masts(bm):
        for s in (-1, 1):
            for dy in (-0.35, 0.35):
                bm_cylinder(bm, 0.16, 0, 9.6, n=12, center=(s * mast_x, dy))
    solid('x_masts', 'haze', masts, bevel=0, smooth=True, group=g)

    def lattice(bm):                          # the ladder bracing between each pair
        for s in (-1, 1):
            x = s * mast_x
            for k in range(9):
                z = 0.9 + k * 0.9
                bm_bar(bm, (x, -0.35, z), (x, 0.35, z + 0.45), 0.06)
                bm_bar(bm, (x, 0.35, z + 0.45), (x, -0.35, z + 0.9), 0.06)
    solid('x_lattice', 'ink', lattice, bevel=0, group=g)

    def feet(bm):
        for s in (-1, 1):
            bm_box(bm, (0.9, 1.3, 0.5), (s * mast_x, 0, 0.25))
    solid('x_feet', 'walk', feet, bevel=0.04, group=g)
    # the light box: a deep sign across the masts, ink frame, bone faces (canvas text goes on)
    solid('x_box', 'ink', lambda bm: bm_box(bm, (11.4, 0.66, 2.2), (0, 0, 8.55)), bevel=0.05, group=g)
    solid('x_faces', 'bone', lambda bm: bm_box(bm, (10.6, 0.72, 1.75), (0, 0, 8.55)), bevel=0, group=g)
    # a row of bulbs under the box, and a top rail with two finials
    def bulbs(bm):
        for i in range(17):
            x = -5.2 + i * 0.65
            for y in (-0.38, 0.38):
                bm_sphere(bm, 0.09, (x, y, 7.38), u=8, v=5)
    solid('x_bulbs', 'lamp', bulbs, bevel=0, smooth=True, group=g)
    solid('x_rail', 'verm', lambda bm: bm_box(bm, (11.6, 0.8, 0.16), (0, 0, 9.73)), bevel=0.03, group=g)

    def finials(bm):
        for s in (-1, 1):
            bm_sphere(bm, 0.28, (s * mast_x, 0, 10.05), u=12, v=8)
    solid('x_finials', 'verm', finials, bevel=0, smooth=True, group=g)


def dadao():
    g = 'dadao'
    pier = 1.3
    px = HW + pier / 2

    def piers(bm):
        for s in (-1, 1):
            bm_box(bm, (pier, pier, 7.2), (s * px, 0, 3.6))
    solid('d_piers', 'brick', piers, bevel=0.05, group=g)

    def bands(bm):                            # stone quoin bands and capitals, as on 迪化街 fronts
        for s in (-1, 1):
            for z in (1.6, 3.2, 4.8):
                bm_box(bm, (pier + 0.08, pier + 0.08, 0.28), (s * px, 0, z))
            bm_box(bm, (pier + 0.3, pier + 0.3, 0.45), (s * px, 0, 0.22))
            bm_box(bm, (pier + 0.3, pier + 0.3, 0.3), (s * px, 0, 7.35))
    solid('d_bands', 'bone', bands, bevel=0.03, group=g)
    # the segmental arch: a brick band over the opening, its soffit at CLEAR
    rise, outer = 0.9, 1.0

    def arch(bm):
        n = 14
        inner_pts, outer_pts = [], []
        for i in range(n + 1):
            t = i / n
            x = -HW + 2 * HW * t
            z = CLEAR - 0.9 + rise * math.sin(math.pi * t)
            inner_pts.append((x, z))
            outer_pts.append((x, z + outer))
        pts = [(-HW - pier, CLEAR - 0.9), *inner_pts, (HW + pier, CLEAR - 0.9), (HW + pier, CLEAR + 0.6), *outer_pts[::-1], (-HW - pier, CLEAR + 0.6)]
        # simplify the joins: inner arc from left to right, then right pier top, outer arc back
        bm_solid(bm, pts, -0.5, 0.5)
    solid('d_arch', 'brick', arch, bevel=0.03, group=g)
    solid('d_key', 'bone', lambda bm: bm_box(bm, (0.6, 1.1, 1.1), (0, 0, CLEAR + 0.45)), bevel=0.03, group=g)
    solid('d_cornice', 'bone', lambda bm: bm_box(bm, (2 * (HW + pier) + 0.5, 1.3, 0.3), (0, 0, CLEAR + 1.2)), bevel=0.03, group=g)
    # the Baroque crest over the cornice: scrolls up to a rounded pediment, a name panel in it
    def crest(bm):
        L = []
        L += [(-3.4, 0)]
        L += cubic((-3.4, 0), (-3.4, 0.9), (-2.4, 0.6), (-2.2, 1.3), n=6)
        L += cubic((-2.2, 1.3), (-2.0, 2.3), (-1.0, 2.5), (0, 2.6), n=6)
        R = [(-x, z) for x, z in L[::-1]]
        bm_solid(bm, L + R[1:-1] + [(3.4, 0)], -0.45, 0.45, Matrix.Translation((0, 0, CLEAR + 1.35)))
    solid('d_crest', 'brick', crest, bevel=0.04, group=g)
    solid('d_panel', 'bone', lambda bm: bm_box(bm, (5.4, 0.2, 1.3), (0, -0.45, CLEAR + 1.75)), bevel=0.02, group=g)
    solid('d_finial', 'bone', lambda bm: bm_sphere(bm, 0.3, (0, 0, CLEAR + 4.15), u=12, v=8), bevel=0, smooth=True, group=g)

    def urns(bm):
        for s in (-1, 1):
            bm_box(bm, (0.7, 0.7, 0.5), (s * px, 0, CLEAR + 1.6))
            bm_sphere(bm, 0.32, (s * px, 0, CLEAR + 2.1), u=12, v=8, scale_z=1.2)
    solid('d_urns', 'bone', urns, bevel=0, smooth=True, group=g)


def xinyi():
    g = 'xinyi'
    px = HW + 0.5

    def pylons(bm):
        for s in (-1, 1):
            bm_box(bm, (0.9, 0.9, 9.0), (s * px, 0, 4.5))
    solid('y_pylons', 'glass', pylons, bevel=0.04, group=g)

    def fins(bm):
        for s in (-1, 1):
            for dx in (-0.5, 0.5):
                bm_box(bm, (0.08, 0.16, 9.2), (s * px + dx, -0.5, 4.6))
                bm_box(bm, (0.08, 0.16, 9.2), (s * px + dx, 0.5, 4.6))
            for z in (1, 2.5, 4, 5.5, 7):
                bm_box(bm, (1.0, 1.0, 0.06), (s * px, 0, z))
    solid('y_fins', 'haze', fins, bevel=0, group=g)
    solid('y_beam', 'haze', lambda bm: bm_box(bm, (2 * px + 1.6, 0.7, 1.2), (0, 0, 8.15)), bevel=0.04, group=g)
    solid('y_band', 'ink', lambda bm: bm_box(bm, (10.2, 0.8, 0.95), (0, 0, 8.15)), bevel=0, group=g)
    solid('y_light', 'lamp', lambda bm: bm_box(bm, (2 * px + 1.6, 0.74, 0.07), (0, 0, 7.5)), bevel=0, group=g)
    solid('y_cap', 'glass', lambda bm: bm_box(bm, (2 * px + 2.2, 1.1, 0.12), (0, 0, 8.84)), bevel=0.03, group=g)

    def bases(bm):
        for s in (-1, 1):
            bm_box(bm, (1.3, 1.3, 0.3), (s * px, 0, 0.15))
    solid('y_bases', 'walk', bases, bevel=0.04, group=g)


def build():
    ximen()
    dadao()
    xinyi()


def spread_preview(joined):
    if '--preview' not in sys.argv:
        return
    import bpy
    path = sys.argv[sys.argv.index('--preview') + 1]
    for o in joined:
        o.location.x = {'ximen': -14, 'dadao': 0, 'xinyi': 14}[o.name]
    S.preview(path, joined, camera=((4, -34, 8), (0, 0, 5), 45))


if __name__ == '__main__':
    spread_preview(S.run(build))
