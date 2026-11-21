# sq-pole.py — a Taipower concrete utility pole (電線桿) for the streets around the lantern square
# (CJ 2026-10-31 "i need the square be more realistic").
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/sq-pole.py -- --out asset/models/src/sq-pole.glb --stats
#
# One node `pole`, real size, 11.0 m tall: a tapering round concrete pole (0.19 -> 0.10 m) with the
# yellow-and-black warning sleeve at its foot (as on every pole beside a Taiwanese road), a pole-top
# transformer can on its brackets, and two steel cross-arms with diagonal braces carrying five
# white porcelain pin insulators. Origin at the base centre. The cross-arms run along X, so the
# power lines run along +-Y (along the street, the pole row is laid out along Y).
#
# Wire attachment points (insulator tops; Blender (x, y, z) -> three.js (x, z, -y)). The arms sit on
# the street face, Blender y = -0.16, so three.js z = +0.16 before rotation:
#   upper arm  Blender z 10.655:  x = -0.85, -0.40, +0.85
#   lower arm  Blender z  9.855:  x = -0.70, +0.70
#   telecom bundle (no insulator, cables lashed to the pole face): x 0, y -0.17, z 6.6
# References: research/reference/square/props/pole-03 (concrete pole, steel cross-arm with braces,
# white pin insulators), pole-01 (pole-top equipment and cable bundle), pole-02 / street-01
# (Sanchong street poles with the yellow-black sleeve and the transformer platform), Eagle
# MVWPDX9YVR322 / MVWPJJDSPVZ7E (scooter streets with power lines overhead).

import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
import sq_lib as L
from stylized import bm_box, bm_bar, bm_lathe

G = 'pole'
HT = 11.0
ZU, ZL = 10.4, 9.6            # cross-arm centres
UPPER = (-0.85, -0.40, 0.85)
LOWER = (-0.70, 0.70)


def r_at(z):
    return 0.19 + (0.10 - 0.19) * z / HT


def build():
    S.solid('shaft', 'haze', lambda bm: bm_lathe(bm, [(0, 0), (r_at(0), 0), (r_at(HT), HT), (0.07, HT + 0.05), (0, HT + 0.06)], n=10), bevel=0, group=G)

    # warning sleeve: yellow 0..2.0 m with two black bands
    S.solid('sleeve', 'lamp', lambda bm: bm_lathe(bm, [(0, 0.0), (0.205, 0.0), (0.2, 2.0), (0, 2.0)], n=10), bevel=0, group=G)

    def bands(bm):
        for z in (0.45, 1.25):
            bm_lathe(bm, [(0, z), (0.21, z), (0.21, z + 0.4), (0, z + 0.4)], n=10)
    S.solid('bands', 'ink', bands, bevel=0, group=G)

    def steel(bm):
        bm_box(bm, (2.0, 0.09, 0.09), (0, -0.16, ZU))                  # upper cross-arm on the street face
        bm_box(bm, (1.6, 0.09, 0.09), (0, -0.16, ZL))                  # lower cross-arm
        for z, half in ((ZU, 0.7), (ZL, 0.55)):
            for s in (-1, 1):
                bm_bar(bm, (0, -0.16, z - 0.55), (s * half, -0.16, z - 0.03), 0.04)   # braces
        for z in (7.15, 7.85):
            bm_box(bm, (0.12, 0.36, 0.06), (0, 0.24, z))               # transformer brackets
        bm_box(bm, (0.04, 0.04, 2.5), (0.14, 0.17, 7.2))               # drop lead down the pole
    S.solid('steel', 'ink', steel, bevel=0, group=G)

    S.solid('transformer', 'haze', lambda bm: bm_lathe(bm, [(0, 7.05), (0.26, 7.05), (0.26, 7.9), (0.2, 8.0), (0, 8.0)], n=10,
                                                         xform=Matrix.Translation((0, 0.42, 0))), bevel=0, group=G)

    def insulators(bm):
        prof = [(0, 0), (0.03, 0), (0.08, 0.06), (0.05, 0.12), (0.075, 0.16), (0, 0.21)]
        for z, xs in ((ZU + 0.045, UPPER), (ZL + 0.045, LOWER)):
            for x in xs:
                bm_lathe(bm, prof, n=6, xform=Matrix.Translation((x, -0.16, z)))
    S.solid('insulators', 'bone', insulators, bevel=0, group=G)


if __name__ == '__main__':
    S.run(build, camera=L.camera(((9.0, -13.0, 5.0), (0, 0, 5.6), 48)))
