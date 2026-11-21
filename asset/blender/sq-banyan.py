# sq-banyan.py — 榕樹 (Ficus microcarpa) for the lantern square in front of 西門紅樓 (blender-detail, 2026-11-01).
#
# CJ, 2026-10-31: "i need the square be more realistic"; the Orchestrator's list: "榕樹 trees with real canopy".
# References: research/reference/square/trees/sources.md (banyan-06 洲美屈原宮神樹 for the silhouette and the
# compare angle, banyan-02/03 for the spreading limbs, banyan-04/05 for the fluted grey bark).
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/sq-banyan.py -- \
#       --out asset/models/src/sq-banyan.glb --stats --preview research/blender-detail/models/sq-banyan-preview.png
#
# Two nodes, each with its origin on the ground at the trunk centre (stand them side by side yourself):
#   banyanL — canopy about 12 wide, 9 tall      banyanM — canopy about 8 wide, 6.5 tall
# Each one: a fluted, buttressed trunk ('haze'), seven spreading main limbs and three rising ones as
# tapered rotation-minimising tubes, hanging aerial roots (a few reach the ground as prop roots, a
# curtain of fused roots hugs the trunk), a canopy of twelve noise-displaced leaf masses ('leaf',
# subdivided icospheres, flattened underneath, smooth shaded — not one blob, no facets), and a round
# tree-pit grate: dark soil disc ('ink'), cast-iron frame, ring and radial bars ('road').
# Budget: <= 6,000 triangles per variant. No bevel: everything is a tube, a displaced sphere or a
# thin bar (stylized.py rule: none on thin bars).

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bmesh
from mathutils import Vector, noise

import stylized as S


# ── geometry helpers (local to this script) ──────────────────────────────────
def tube(bm, pts, radii, n=6, cap_start=True, cap_end=True):
    """Tapered tube along a polyline with rotation-minimising frames (no twist, unlike bm_bar)."""
    pts = [Vector(p) for p in pts]
    tans = []
    for i in range(len(pts)):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, len(pts) - 1)]
        tans.append((b - a).normalized())
    t0 = tans[0]
    ref = Vector((0, 0, 1)) if abs(t0.z) < 0.9 else Vector((1, 0, 0))
    u = t0.cross(ref).normalized()
    rings = []
    prev_t = t0
    for p, t, r in zip(pts, tans, radii):
        q = prev_t.rotation_difference(t)
        u = (q @ u).normalized()
        v = t.cross(u).normalized()
        prev_t = t
        rings.append([bm.verts.new(p + (u * math.cos(k * 2 * math.pi / n) + v * math.sin(k * 2 * math.pi / n)) * r)
                      for k in range(n)])
    for a, b in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
    if cap_start:
        c = bm.verts.new(pts[0] - tans[0] * radii[0] * 0.3)
        for k in range(n):
            bm.faces.new((rings[0][(k + 1) % n], rings[0][k], c))
    if cap_end:
        c = bm.verts.new(pts[-1] + tans[-1] * radii[-1] * 0.5)
        for k in range(n):
            bm.faces.new((rings[-1][k], rings[-1][(k + 1) % n], c))


def quad_pts(p0, p1, p2, segs):
    p0, p1, p2 = Vector(p0), Vector(p1), Vector(p2)
    return [(1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2 for t in (i / segs for i in range(segs + 1))]


def annulus(bm, r0, r1, z0, z1, n):
    """A flat ring (washer) standing on Z: inner radius r0, outer r1."""
    def ring(r, z):
        return [bm.verts.new((r * math.cos(k * 2 * math.pi / n), r * math.sin(k * 2 * math.pi / n), z)) for k in range(n)]
    ib, ob, ot, it = ring(r0, z0), ring(r1, z0), ring(r1, z1), ring(r0, z1)
    for k in range(n):
        j = (k + 1) % n
        bm.faces.new((ob[k], ob[j], ot[j], ot[k]))      # outer wall
        bm.faces.new((it[k], it[j], ib[j], ib[k]))      # inner wall
        bm.faces.new((ot[k], ot[j], it[j], it[k]))      # top
        bm.faces.new((ib[k], ib[j], ob[j], ob[k]))      # bottom


def leaf_mass(bm, center, rad, seed, subdiv=3):
    """One clustered leaf mass: an icosphere pushed out by two octaves of noise into lumps, the
    underside flattened the way a banyan's canopy hangs level. rad = (rx, ry, rz)."""
    res = bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
    off = Vector((seed * 7.31, seed * 3.17, seed * 5.53))
    c = Vector(center)
    for v in res['verts']:
        p = v.co.normalized()
        d = 1.0 + 0.18 * noise.noise(p * 1.6 + off) + 0.07 * noise.noise(p * 3.2 + off * 1.9)
        q = p * d
        if q.z < 0:
            q.z *= 0.72
        v.co = c + Vector((q.x * rad[0], q.y * rad[1], q.z * rad[2]))


def trunk(bm, h, r_mid, r_base, r_top, seed):
    """Fluted, buttressed trunk: rings of a lathe whose radius follows lobes that fade upward and
    twist a little, the way Ficus microcarpa trunks are made of fused roots."""
    n = 20
    zs = [0.0, 0.18, 0.5, 1.0, 1.6, 2.2, 0.8 * h, h]
    rings = []
    for z in zs:
        f = z / h
        R = r_base + (r_mid - r_base) * min(1.0, (z / (0.32 * h)) ** 0.6) if z < 0.32 * h else r_mid + (r_top - r_mid) * ((z - 0.32 * h) / (0.68 * h))
        amp = 0.30 * (1 - f) ** 2 + 0.08
        tw = 0.6 * f + seed
        ring = []
        for k in range(n):
            th = k * 2 * math.pi / n
            m = 1 + amp * (0.6 * math.cos(5 * th + tw) + 0.4 * math.cos(8 * th - 1.3 * tw)) + 0.05 * math.cos(13 * th + 3 * tw)
            ring.append(bm.verts.new((R * m * math.cos(th), R * m * math.sin(th), z)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
    bm.faces.new(rings[0][::-1])
    c = bm.verts.new((0, 0, h + 0.15))
    for k in range(n):
        bm.faces.new((rings[-1][k], rings[-1][(k + 1) % n], c))


# ── one tree ─────────────────────────────────────────────────────────────────
def banyan(group, sh, sv, seed):
    """sh, sv: horizontal and vertical scale against the large tree (12 wide, 9 tall)."""
    rnd = random.Random(seed)
    H = lambda x: x * sh
    Z = lambda z: z * sv
    trunk_h = Z(3.3)
    pit = H(2.0)

    # canopy layout (large-tree metres): outer ring of 7, inner ring of 4, one crown
    masses = []
    a0 = rnd.uniform(0, 2 * math.pi)
    for k in range(7):
        a = a0 + k * 2 * math.pi / 7 + rnd.uniform(-0.15, 0.15)
        R = 3.75 + rnd.uniform(-0.25, 0.25)
        masses.append(('outer', a, R, 5.0 + rnd.uniform(-0.3, 0.3), (2.35, 2.25, 2.0)))
    for k in range(3):
        a = a0 + 0.45 + k * 2 * math.pi / 3 + rnd.uniform(-0.2, 0.2)
        masses.append(('inner', a, 1.9 + rnd.uniform(-0.2, 0.2), 6.75 + rnd.uniform(-0.2, 0.2), (2.5, 2.4, 1.8)))
    masses.append(('crown', 0.0, 0.3, 7.55, (2.4, 2.4, 1.45)))

    def canopy(bm):
        for i, (kind, a, R, z, rad) in enumerate(masses):
            s = rnd.uniform(0.92, 1.08)
            leaf_mass(bm, (H(R * math.cos(a)), H(R * math.sin(a)), Z(z)),
                      (H(rad[0] * s), H(rad[1] * s), Z(rad[2] * s)), seed * 13 + i)
    S.solid(group + '_canopy', 'leaf', canopy, bevel=0, group=group)

    limbs = []   # (polyline, radii) — kept so the aerial roots can hang from them

    def wood(bm):
        trunk(bm, trunk_h, H(0.55), H(0.95), H(0.42), seed * 0.7)
        for kind, a, R, z, rad in masses:
            d = Vector((math.cos(a), math.sin(a), 0))
            if kind == 'outer':
                z0 = Z(2.4 + rnd.uniform(0, 0.7))
                p0 = d * H(0.15) + Vector((0, 0, z0))
                p1 = d * H(2.0) + Vector((0, 0, z0 + Z(0.25)))
                p2 = d * H(R * 0.85) + Vector((0, 0, Z(z - 0.25)))
                pts = quad_pts(p0, p1, p2, 5)
                rs = [H(0.32) * (1 - 0.7 * i / 5) for i in range(6)]
                tube(bm, pts, rs, n=6, cap_start=False)
                limbs.append((pts, rs))
                # a secondary branch off the limb's outer half
                b0 = pts[3]
                side = Vector((-d.y, d.x, 0)) * (1 if rnd.random() < 0.5 else -1)
                b2 = b0 + side * H(1.6) + d * H(0.6) + Vector((0, 0, Z(1.1)))
                tube(bm, quad_pts(b0, (b0 + b2) / 2 + Vector((0, 0, Z(-0.2))), b2, 3),
                     [H(0.12), H(0.09), H(0.07), H(0.05)], n=5, cap_start=False)
            elif kind == 'inner':
                p0 = Vector((0, 0, trunk_h - Z(0.4)))
                p2 = d * H(R * 0.8) + Vector((0, 0, Z(z - 0.6)))
                p1 = (p0 + p2) / 2 + d * H(0.3)
                pts = quad_pts(p0, p1, p2, 4)
                tube(bm, pts, [H(0.3) * (1 - 0.65 * i / 4) for i in range(5)], n=6, cap_start=False)

        # hanging aerial roots: thin strands from the main limbs; the ones near the trunk reach the
        # ground inside the pit as prop roots
        for li, (pts, rs) in enumerate(limbs):
            for j in range(3):
                t = 0.35 + 0.2 * j + rnd.uniform(-0.05, 0.05)
                f = t * (len(pts) - 1)
                i = int(f)
                p = pts[i].lerp(pts[min(i + 1, len(pts) - 1)], f - i)
                p = p + Vector((rnd.uniform(-0.1, 0.1), rnd.uniform(-0.1, 0.1), -rs[i] * 0.6))
                horiz = Vector((p.x, p.y, 0)).length
                prop = (j == 0 and li in (0, 3, 5) and horiz < pit * 0.95)
                if prop:
                    end = Vector((p.x * 0.9 + rnd.uniform(-0.2, 0.2), p.y * 0.9 + rnd.uniform(-0.2, 0.2), -0.05))
                    r0, r1 = H(rnd.uniform(0.06, 0.09)), H(rnd.uniform(0.1, 0.14))
                    sides = 6
                else:
                    end = p + Vector((rnd.uniform(-0.15, 0.15), rnd.uniform(-0.15, 0.15), -Z(rnd.uniform(1.0, 2.4))))
                    end.z = max(end.z, Z(1.4))
                    r0, r1 = H(0.035), H(0.02)
                    sides = 4
                mid = p.lerp(end, 0.5) + Vector((rnd.uniform(-0.12, 0.12), rnd.uniform(-0.12, 0.12), 0))
                tube(bm, [p, mid, end], [r0, (r0 + r1) / 2, r1], n=sides, cap_start=False)
            # a second, shorter strand bundle at the limb's tip
            p = pts[-2] + Vector((0, 0, -rs[-2]))
            end = p + Vector((0, 0, -Z(rnd.uniform(0.8, 1.5))))
            tube(bm, [p, p.lerp(end, 0.5), end], [H(0.03), H(0.025), H(0.018)], n=4, cap_start=False)

        # fused-root curtain hugging the trunk
        for k in range(6):
            th = k * 2 * math.pi / 6 + 0.3
            d = Vector((math.cos(th), math.sin(th), 0))
            top = d * H(0.42) + Vector((0, 0, trunk_h - Z(0.3)))
            mid = d.lerp(Vector((-d.y, d.x, 0)), 0.15) * H(0.56) + Vector((0, 0, trunk_h * 0.5))
            bot = d * H(0.86) + Vector((0, 0, -0.02))
            tube(bm, [top, mid, bot], [H(0.05), H(0.07), H(0.11)], n=5, cap_start=False)
    S.solid(group + '_wood', 'haze', wood, bevel=0, group=group)

    # tree-pit: soil disc, cast-iron frame, one inner ring and radial bars
    def soil(bm):
        S.bm_cylinder(bm, pit - H(0.05), -0.02, 0.015, n=24)
    S.solid(group + '_soil', 'ink', soil, bevel=0, group=group)

    def grate(bm):
        annulus(bm, pit - H(0.14), pit, 0.0, 0.06, 32)
        for k in range(10):
            th = k * 2 * math.pi / 10
            d = Vector((math.cos(th), math.sin(th), 0))
            a = d * H(1.02)
            b = d * (pit - H(0.1))
            S.bm_bar(bm, a + Vector((0, 0, 0.025)), b + Vector((0, 0, 0.025)), H(0.055))
    S.solid(group + '_grate', 'road', grate, bevel=0, group=group)


def build():
    banyan('banyanL', 1.0, 1.0, 11)
    banyan('banyanM', 8.0 / 12.0, 6.5 / 9.0, 23)


# ── previews: the glb has both nodes at the origin, so the preview spreads them out itself ──
def previews(joined, path):
    from mathutils import Vector as V
    by = {o.name: o for o in joined}
    base, ext = os.path.splitext(path)
    # 1. compare angle: banyanL alone, eye height, a little left of front — like banyan-06
    by['banyanM'].hide_render = True
    S.preview(base + '-L' + ext, joined, camera=((-5.0, -15.5, 1.5), (0.6, 0.0, 4.9), 52))
    by['banyanM'].hide_render = False
    # 2. both side by side, 3/4 view
    by['banyanM'].location = V((11.0, 2.0, 0.0))
    S.preview(path, joined, camera=((14.0, -24.0, 9.0), (5.0, 0.0, 3.6), 40))
    by['banyanM'].location = V((0.0, 0.0, 0.0))


if __name__ == '__main__':
    argv = sys.argv
    prev = None
    if '--preview' in argv:
        i = argv.index('--preview')
        prev = argv[i + 1]
        del argv[i:i + 2]
    joined = S.run(build, camera=None)
    for o in joined:
        lo, hi = S.bounds([o])
        print(f'[model] {o.name} bounds x {lo.x:.2f}..{hi.x:.2f}  y {lo.y:.2f}..{hi.y:.2f}  z {lo.z:.2f}..{hi.z:.2f}')
    if prev:
        previews(joined, prev)
        print(f'[model] preview {prev}')
