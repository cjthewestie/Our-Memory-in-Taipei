# sq-lamp.py — a Taipei road street lamp for the lantern square (CJ 2026-10-31 "i need the square be
# more realistic"; the 紅樓 front plaza basis).
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/sq-lamp.py -- --out asset/models/src/sq-lamp.glb --stats
#
# One node `lamp`, real size: 9.5 m to the top of the luminaire. A low concrete footing with a flange
# cover, a slim tapering round steel pole (0.30 -> 0.13 m) with the service door near the base,
# a single arm that curves up and out 1.45 m, and a flat cobra-head luminaire with a
# glowing lens on its underside. Origin at the base centre, the arm (and the light) toward -Y.
# References: Eagle MVWPC4K1JST02 and MVWPCCYQ2B8DP (the Red House plaza on 漢中街 / 成都路: tall
# slim grey poles, one arm curving up and out, flat head), research/reference/square/props/lamp-01 (alley pole
# with door and fittings), lamp-02 (Zhongxiao/Zhongshan road lamps, single-arm cobra heads).

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_lathe
import sq_lib as L

H = 8.3                      # where the pole turns into the arm
TIP = (0.0, -1.45, 9.35)       # arm end, the luminaire hangs here


def build():
    S.solid('footing', 'walk', lambda bm: bm_box(bm, (0.6, 0.6, 0.2), (0, 0, 0.1)), bevel=0.04, group='lamp')

    prof = [(0, 0.2), (0.24, 0.2), (0.24, 0.32), (0.17, 0.42), (0.15, 0.6), (0.068, H), (0, H)]
    S.solid('pole', 'haze', lambda bm: bm_lathe(bm, prof, n=12), bevel=0, group='lamp')

    def arm(bm):
        pts = [(0, 0, H - 0.4)] + [(0, y, z) for y, z in S.quad((0, H + 0.05), (0.02, H + 1.0), (TIP[1] + 0.35, TIP[2] - 0.02), n=6)]
        L.tube(bm, pts, 0.055, n=8)
    S.solid('arm', 'haze', arm, bevel=0, group='lamp')

    # the cobra head: a long flat shell, tilted up 14 deg at the tip, with the lens under it
    Th = Matrix.Translation((0, TIP[1], TIP[2])) @ Matrix.Rotation(math.radians(-14), 4, 'X')
    shell = [(0.45, 0.02), (0.30, 0.11), (-0.42, 0.10), (-0.55, 0.03), (-0.55, -0.05), (0.45, -0.07)]
    S.solid('head', 'haze', lambda bm: L.side(bm, shell, -0.17, 0.17, Th), bevel=0.03, group='lamp')
    S.solid('lens', 'lamp', lambda bm: bm_box(bm, (0.26, 0.7, 0.03), (0, -0.06, -0.08), Th), bevel=0, group='lamp')

    def fittings(bm):
        bm_box(bm, (0.12, 0.05, 0.42), (0, -0.15, 0.95))                    # service door
        bm_box(bm, (0.22, 0.22, 0.26), (0, -0.16, 3.2))                    # control box clamped to the pole
        for z in (3.05, 3.35):
            bm_box(bm, (0.26, 0.26, 0.03), (0, -0.04, z))                  # its clamps
    S.solid('fittings', 'ink', fittings, bevel=0, group='lamp')


if __name__ == '__main__':
    S.run(build, camera=((15.0, 3.0, 3.0), (0, -0.8, 4.6), 40))
