# sq-scooter.py — a Taiwanese 125cc step-through scooter (Kymco / SYM / Yamaha Cygnus shape) for
# the lantern square, parked in rows of 20+ (CJ 2026-10-31 "i need the square be more realistic").
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/sq-scooter.py -- --out asset/models/src/sq-scooter.glb --stats
#   add --spread (before --) to lay the three variants side by side for the preview only.
#
# Three glb nodes, one per body colour, identical geometry: scooterA (bone white), scooterB (verm
# red), scooterC (ink black with haze trim). Each node is a whole scooter, real size (1.82 long,
# 0.72 wide at the mirrors, 1.27 to the mirror tops), origin on the ground under the middle of the
# wheelbase, front (headlight) toward -Y. References: research/reference/square/props/scooter-01..04
# — the side profile (scooter-01, Kymco right side), the handlebar cover with the headlight in it
# and the shield (scooter-02, Kymco head-on), the sharp Cygnus nose (scooter-03), parked rows (-04).

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_lathe
import sq_lib as L

R = 0.255                      # 12-inch tyre radius
YF, YR = -0.64, 0.62           # front and rear axle
AX = Matrix.Rotation(math.pi / 2, 4, 'Y')       # lathe axis Z -> X (the axle)

VARIANTS = [('scooterA', 'bone', 'haze'), ('scooterB', 'verm', 'bone'), ('scooterC', 'ink', 'haze')]


def scooter(g, body, trim, T):
    # wheels: ink tyres, haze rims with an ink hub
    def tyres(bm):
        prof = [(0.17, -0.055), (0.2, -0.065), (0.245, -0.06), (R, 0), (0.245, 0.06), (0.2, 0.065), (0.17, 0.055)]
        for y in (YF, YR):
            L.ring(bm, prof, n=14, xform=T @ Matrix.Translation((0, y, R)) @ AX)
    S.solid(g + '_tyres', 'ink', tyres, bevel=0, group=g)

    def rims(bm):
        prof = [(0, -0.05), (0.06, -0.05), (0.17, -0.04), (0.17, 0.04), (0.06, 0.05), (0, 0.05)]
        for y in (YF, YR):
            bm_lathe(bm, prof, n=10, xform=T @ Matrix.Translation((0, y, R)) @ AX)
    S.solid(g + '_rims', 'haze', rims, bevel=0, group=g)

    # body panels in the body colour: front shield with the nose, the handlebar cover, the rear
    # body under the seat, the front fender
    def panels(bm):
        shield = [(-0.47, 0.30), (-0.55, 0.42), (-0.70, 0.50), (-0.80, 0.60), (-0.79, 0.74),
                  (-0.66, 0.96), (-0.56, 1.0), (-0.50, 0.96), (-0.47, 0.62), (-0.40, 0.32)]
        L.side(bm, shield, -0.15, 0.15, T)
        L.side(bm, [(-0.62, 0.86), (-0.72, 0.74), (-0.70, 0.60), (-0.60, 0.66)], -0.2, 0.2, T)     # the nose/knee panel
        cover = [(-0.60, 0.98), (-0.66, 1.04), (-0.56, 1.11), (-0.42, 1.10), (-0.38, 1.03), (-0.46, 0.98)]
        L.side(bm, cover, -0.15, 0.15, T)                                     # handlebar cover
        upper = [(-0.08, 0.52), (-0.02, 0.72), (0.40, 0.74), (0.78, 0.80), (0.92, 0.78),
                 (0.95, 0.66), (0.86, 0.54), (0.62, 0.50)]
        L.side(bm, upper, -0.2, 0.2, T)                                       # side panels under the seat
        lower = [(-0.04, 0.30), (-0.10, 0.54), (0.66, 0.54), (0.40, 0.40), (0.20, 0.32)]
        L.side(bm, lower, -0.14, 0.14, T)                                     # the narrower belly
        fender = [(YF - 0.20, 0.36), (YF - 0.14, 0.53), (YF + 0.02, 0.58), (YF + 0.16, 0.52),
                  (YF + 0.12, 0.46), (YF + 0.0, 0.52), (YF - 0.12, 0.47), (YF - 0.15, 0.34)]
        L.side(bm, fender, -0.075, 0.075, T)
    S.solid(g + '_body', body, panels, bevel=0.03, group=g)

    # dark plastics: the floorboard, the seat, the inner shield
    def dark(bm):
        L.side(bm, [(-0.46, 0.25), (-0.40, 0.33), (-0.02, 0.33), (0.08, 0.25)], -0.19, 0.19, T)   # floorboard
        seat = [(-0.06, 0.72), (-0.07, 0.79), (0.02, 0.84), (0.40, 0.84), (0.66, 0.89),
                (0.84, 0.90), (0.90, 0.84), (0.86, 0.78), (0.40, 0.76)]
        L.side(bm, seat, -0.17, 0.17, T)
        L.side(bm, [(-0.47, 0.34), (-0.44, 0.92), (-0.40, 0.88), (-0.40, 0.36)], -0.15, 0.15, T)  # inner shield face
    S.solid(g + '_dark', 'ink', dark, bevel=0.025, group=g)

    # mechanics in the trim colour: fork legs, the engine/swing arm (left), grab rail, handlebar
    def mech(bm):
        for x in (-0.06, 0.06):
            bm_bar(bm, (x, -0.55, 0.62), (x, YF, R), 0.04, xform=T)                    # fork legs
        L.side(bm, [(0.08, 0.20), (0.06, 0.40), (0.40, 0.42), (YR + 0.06, 0.32), (YR + 0.04, 0.18), (0.40, 0.16)], 0.06, 0.18, T)   # engine + belt case
        L.tube(bm, [(-0.17, 0.62, 0.80), (-0.18, 0.86, 0.84), (0, 0.97, 0.86), (0.18, 0.86, 0.84), (0.17, 0.62, 0.80)], 0.016, n=6, xform=T)  # grab rail
        bm_box(bm, (0.72, 0.035, 0.035), (0, -0.47, 1.06), T)                         # handlebar
    S.solid(g + '_mech', trim, mech, bevel=0, group=g)

    # black bits: grips, mirrors on stalks, muffler (right), shock, kickstand
    def black(bm):
        for s in (-1, 1):
            bm_box(bm, (0.12, 0.045, 0.045), (s * 0.31, -0.47, 1.06), T)              # grips
            bm_bar(bm, (s * 0.22, -0.48, 1.08), (s * 0.29, -0.50, 1.24), 0.018, xform=T)   # mirror stalks
            bm_box(bm, (0.14, 0.03, 0.09), (s * 0.31, -0.50, 1.27), T)                # mirror heads
        L.tube(bm, [(-0.15, 0.10, 0.20), (-0.17, 0.40, 0.27), (-0.17, 0.78, 0.33)], 0.05, n=8, xform=T)   # muffler
        bm_bar(bm, (0.15, YR - 0.02, R), (0.15, 0.50, 0.58), 0.04, xform=T)                       # rear shock
        bm_bar(bm, (0.16, 0.0, 0.25), (0.21, 0.12, 0.02), 0.025, xform=T)                         # side stand
    S.solid(g + '_black', 'ink', black, bevel=0, group=g)

    # lamps and plate
    S.solid(g + '_head', 'lamp', lambda bm: L.side(bm, [(-0.63, 1.03), (-0.66, 1.06), (-0.60, 1.09), (-0.58, 1.05)], -0.09, 0.09, T), bevel=0, group=g)
    S.solid(g + '_tail', 'verm', lambda bm: L.side(bm, [(0.90, 0.70), (0.955, 0.66), (0.96, 0.73), (0.92, 0.77)], -0.11, 0.11, T), bevel=0, group=g)
    # Taiwan plate 21 x 13 cm, white, on a bracket under the tail, leaning back 15 deg; text stays canvas in JS
    S.solid(g + '_plate', 'bone', lambda bm: bm_box(bm, (0.21, 0.012, 0.13), (0, 0, 0), T @ Matrix.Translation((0, 0.99, 0.55)) @ Matrix.Rotation(math.radians(-15), 4, 'X')), bevel=0, group=g)


ONLY = None
if '--only' in sys.argv:                     # preview helper: build one variant (index after the flag)
    i = sys.argv.index('--only')
    ONLY = int(sys.argv[i + 1])
    del sys.argv[i:i + 2]
CAM = os.environ.get('SQ_CAM')               # preview helper: "x,y,z,tx,ty,tz,fov"


def build():
    for k, (g, body, trim) in enumerate(VARIANTS):
        if ONLY is not None and k != ONLY:
            continue
        scooter(g, body, trim, L.offset(1.0))


if __name__ == '__main__':
    cam = None
    if CAM:
        v = [float(t) for t in CAM.split(',')]
        cam = (v[0:3], v[3:6], v[6])
    S.run(build, camera=cam)
