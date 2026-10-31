# tree.py — a street tree as a stylized glb (issue #5 step 3, instanced along the sidewalks).
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/tree.py -- --out asset/models/tree.glb [--preview x.png] [--stats]
#
# About 6.5 m tall: a flared, tapering trunk ('haze'), three short branches, and a rounded canopy
# of seven overlapping smooth spheres ('leaf'), about 4.5 m wide. Origin at the base centre.
# No bevel anywhere: everything here is a lathe, a bar or a sphere. Shared mechanics in
# stylized.py.
#
# blender-detail, 2026-11-01 (sq-banyan agent): HANDOFF noted the canopy silhouette read "faintly
# polygonal up close". Each blob is now pushed out by two octaves of noise into leaf lumps, same
# sphere resolution — triangle count unchanged (1,332), same single
# 'main' node, same size; the lumps break the regular polygon outline into an organic one.

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_lathe, bm_bar, bm_sphere
from mathutils import Vector, noise

# canopy blobs: (x, y, z, radius, vertical squash)
BLOBS = [
    (0.0, 0.0, 5.0, 1.75, 0.85),
    (1.3, 0.5, 4.7, 1.25, 0.85),
    (-1.35, -0.3, 4.6, 1.2, 0.85),
    (0.3, -1.3, 4.65, 1.15, 0.85),
    (-0.2, 1.3, 4.75, 1.1, 0.85),
    (0.6, 0.4, 5.85, 1.05, 0.8),
    (-0.7, -0.5, 5.75, 0.95, 0.8),
]


def trunk():
    prof = [(0, 0), (0.44, 0), (0.36, 0.22), (0.28, 0.6), (0.25, 2.4), (0.2, 3.8), (0, 3.8)]
    S.solid('trunk', 'haze', lambda bm: bm_lathe(bm, prof, n=12), bevel=0)


def branches():
    """Three short bars from the upper trunk into the outer blobs."""
    def build(bm):
        for x, y, z, r, sq in BLOBS[1:4]:
            bm_bar(bm, (0, 0, 3.2), (x * 0.85, y * 0.85, z - 0.2), 0.14)
    S.solid('branches', 'haze', build, bevel=0)


def canopy():
    def build(bm):
        for i, (x, y, z, r, sq) in enumerate(BLOBS):
            c = Vector((x, y, z))
            off = Vector((i * 7.31, i * 3.17, i * 5.53))
            for v in bm_sphere(bm, r, (0, 0, 0), u=12, v=8, scale_z=1.0):
                p = v.co.normalized()
                d = 1.0 + 0.11 * noise.noise(p * 1.8 + off) + 0.05 * noise.noise(p * 3.6 + off * 1.9)
                q = p * (r * d)
                q.z *= sq
                v.co = c + q
    S.solid('canopy', 'leaf', build, bevel=0)


def build():
    trunk()
    branches()
    canopy()


if __name__ == '__main__':
    S.run(build, camera=None)
