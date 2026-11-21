# sq_lib.py — small local helpers for the lantern-square street props (sq-scooter, sq-lamp, sq-ac,
# sq-pole, sq-planter; blender-detail 2026-11-01). stylized.py stays untouched (brief: helpers go
# in a <name>_lib.py); these are the bits the prop scripts share.
#
#   tube(bm, pts, r)          round tube along a polyline (lamp arms, fork legs, grab rails)
#   ring(bm, profile)         a (r, z) profile revolved into a ring with a hole (tyres)
#   side(bm, pts_yz, x0, x1)  a side-view (y, z) polygon extruded across X (scooter body panels)
#   offset(step)              per-node translation: zero for export, steps along X with --spread
#
# --spread (before --) lays the nodes of a multi-node glb out in a row for the preview only;
# never export a spread build.

import math
import sys

import bmesh
from mathutils import Matrix, Vector

import stylized as S

SPREAD = '--spread' in sys.argv
if SPREAD:
    sys.argv.remove('--spread')
_slot = [0]


def offset(step):
    T = Matrix.Translation((_slot[0] * step if SPREAD else 0, 0, 0))
    _slot[0] += 1
    return T


def tube(bm, pts, r, n=8, xform=None):
    """A round tube swept along a polyline: one ring per point normal to the local tangent, capped."""
    pts = [Vector(p) for p in pts]
    rings = []
    for i, p in enumerate(pts):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, len(pts) - 1)]
        q = (b - a).normalized().to_track_quat('Z', 'Y')
        rings.append([bm.verts.new(p + q @ Vector((r * math.cos(k * 2 * math.pi / n), r * math.sin(k * 2 * math.pi / n), 0))) for k in range(n)])
    for a, b in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    if xform is not None:
        bmesh.ops.transform(bm, matrix=xform, verts=[v for rg in rings for v in rg])


def ring(bm, profile, n=12, xform=None):
    """A closed (r, z) profile revolved about Z into a ring with a hole (a tyre)."""
    rings = [[bm.verts.new((r * math.cos(i * 2 * math.pi / n), r * math.sin(i * 2 * math.pi / n), z)) for i in range(n)] for r, z in profile]
    m = len(rings)
    for j in range(m):
        a, b = rings[j], rings[(j + 1) % m]
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if xform is not None:
        bmesh.ops.transform(bm, matrix=xform, verts=[v for rg in rings for v in rg])


# side view: a (y, z) polygon becomes stylized.bm_solid's (x, z) profile with x = -y, extruded
# along Y from x0 to x1, then turned -90 deg about Z so the extrusion runs along X and the
# profile's first axis lands back on world Y.
_SIDE = Matrix.Rotation(-math.pi / 2, 4, 'Z')


def side(bm, pts_yz, x0, x1, xform=None):
    m = _SIDE if xform is None else xform @ _SIDE
    return S.bm_solid(bm, [(-y, z) for y, z in pts_yz], x0, x1, m)


def camera(default):
    """Preview camera: SQ_CAM="x,y,z,tx,ty,tz,fov" overrides the script's default (for the
    side-by-side compare renders); never affects the exported glb."""
    import os
    c = os.environ.get('SQ_CAM')
    if not c:
        return default
    v = [float(t) for t in c.split(',')]
    return (v[0:3], v[3:6], v[6])
