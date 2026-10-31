# skywalk.py — 信義空橋, the Xinyi elevated skywalk (blender-detail, 2026-11-01).
#
# Two glb nodes, both with their origin on the ground at the piece's centre, length along X:
#   crossing — one road crossing, 18 long (x -9..9), deck 3.6 wide (y -1.8..1.8), walking surface
#              at z 6.72 (the scene's crowd stands at y 6.7). Round piers with capitals at x ±8,
#              y ±1.2 on the sidewalks, a stair down to each sidewalk at x ±8.2 descending toward -Y
#              (Blender) = +Z (three.js), i.e. toward the approaching camera, as rampGeo did.
#   segment  — a 1-long (x -0.5..0.5), 3-wide (y -1.5..1.5) straight piece for the mall-front run,
#              no piers, no stairs; its ends are cut flat with no bevel so copies butt seamlessly.
#
# From the photos (research/reference/xinyi/img/skywalk-*): a pale steel box girder with a cladding
# fascia band and a light strip, granite paving, glass balustrade on cream flat posts with two
# stainless rails, a shallow arched canopy of glass panels on white rib frames standing on slender
# round posts, a lamp strip along the canopy crown, round piers with flared capitals, and stairs
# with stainless cheek walls, open to the sky (no stair cover — lead, 2026-11-01, from the
# reference set: "uncovered stairs with curved stainless balustrades"). Glass sides 1.1 high, the
# canopy crown about 3 above the deck.
#
# The underside stays simple and pale: the girder is one 'haze' solid with a flat soffit, nothing
# hangs below it, so the scene can give that material an unlit haze look (the camera passes under
# at y 3–5). Triangle budget 10,000 for both nodes.

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

DECK_TOP = 6.72      # paving surface
GIRDER_TOP = 6.62
GIRDER_BOT = 6.02    # soffit: well clear of the camera's y 5
BAL_H = 1.1          # balustrade height above the paving
CANOPY_EAVE = 9.4    # top of the canopy posts
CANOPY_RISE = 0.55   # arch rise of the canopy over its width

ROT_X = Matrix.Rotation(math.pi / 2, 4, 'Z')   # (u, v) profile in Y-Z, extruded along X


def solid_x(bm, pts_yz, x0, x1, xform=None):
    """Extrude a closed (y, z) profile along X from x0 to x1."""
    m = ROT_X if xform is None else xform @ ROT_X
    return S.bm_solid(bm, pts_yz, -x1, -x0, m)


def rod_x(bm, x0, x1, y, z, r, n=8):
    """A round bar along X (handrails, purlins): a Z cylinder turned onto X (R_y(90) maps Z to X)."""
    return S.bm_cylinder(bm, r, x0, x1, n=n, xform=Matrix.Translation((0, y, z)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))


def arc_band(half_w, rise, z_eave, t, n=10):
    """Closed (y, z) profile of a shallow arch band: outer arc then inner arc back."""
    R = (half_w ** 2 + rise ** 2) / (2 * rise)
    zc = z_eave + rise - R
    a0 = math.asin(half_w / R)
    outer, inner = [], []
    for i in range(n + 1):
        a = -a0 + 2 * a0 * i / n
        outer.append((R * math.sin(a), zc + R * math.cos(a)))
        inner.append(((R - t) * math.sin(a), zc + (R - t) * math.cos(a)))
    return outer + inner[::-1], (R, zc, a0)


def arc_point(R, zc, a0, f):
    a = -a0 + 2 * a0 * f
    return R * math.sin(a), zc + R * math.cos(a)


# ─────────────────────────────────────────────────────────────────────────────
def walkway(group, x0, x1, half_w, post_step, rib_xs, open_front=(), seamless=False):
    """Deck, balustrades and canopy between x0 and x1. open_front: (xa, xb) gaps in the -Y balustrade."""
    bev = 0 if seamless else S.BEVEL
    trim = 0 if seamless else 0.025
    hw = half_w
    # steel box girder: trapezoid section, flat pale soffit
    S.solid(f'{group}_girder', 'haze', lambda bm: solid_x(bm, [(-hw + 0.35, GIRDER_BOT), (hw - 0.35, GIRDER_BOT), (hw - 0.05, GIRDER_TOP), (-hw + 0.05, GIRDER_TOP)], x0, x1), bevel=bev, group=group)
    # cladding fascia band along each edge, with a light strip set into it
    for s in (-1, 1):
        S.solid(f'{group}_fascia{s}', 'bone', lambda bm, s=s: solid_x(bm, [(s * hw - 0.06, GIRDER_TOP - 0.3), (s * hw + 0.04, GIRDER_TOP - 0.3), (s * hw + 0.04, DECK_TOP + 0.16), (s * hw - 0.06, DECK_TOP + 0.16)], x0, x1), bevel=trim, group=group)
        S.solid(f'{group}_lightstrip{s}', 'lamp', lambda bm, s=s: S.bm_box(bm, (x1 - x0, 0.03, 0.05), ((x0 + x1) / 2, s * (hw + 0.05), GIRDER_TOP - 0.17)), bevel=0, group=group)
    # granite paving
    S.solid(f'{group}_paving', 'walk', lambda bm: S.bm_box(bm, (x1 - x0, 2 * hw - 0.12, 0.1), ((x0 + x1) / 2, 0, DECK_TOP - 0.05)), bevel=0, group=group)

    # balustrades: glass panes between cream posts, two stainless rails
    def spans(s):
        if s > 0 or not open_front:
            return [(x0, x1)]
        out, a = [], x0
        for ga, gb in sorted(open_front):
            if ga > a:
                out.append((a, ga))
            a = max(a, gb)
        if a < x1:
            out.append((a, x1))
        return out

    for s in (-1, 1):
        y = s * (hw - 0.1)
        for k, (a, b) in enumerate(spans(s)):
            S.solid(f'{group}_glass{s}_{k}', 'glass', lambda bm, a=a, b=b, y=y: S.bm_box(bm, (b - a, 0.03, BAL_H - 0.2), ((a + b) / 2, y, DECK_TOP + 0.1 + (BAL_H - 0.2) / 2)), bevel=0, group=group)
            S.solid(f'{group}_rail{s}_{k}', 'bone', lambda bm, a=a, b=b, y=y: rod_x(bm, a, b, y, DECK_TOP + BAL_H, 0.035), bevel=0, group=group)
            S.solid(f'{group}_rail2{s}_{k}', 'bone', lambda bm, a=a, b=b, y=y: rod_x(bm, a, b, y - s * 0.06, DECK_TOP + 0.62, 0.025, n=6), bevel=0, group=group)
            # base kerb under the glass
            S.solid(f'{group}_kerb{s}_{k}', 'bone', lambda bm, a=a, b=b, y=y: S.bm_box(bm, (b - a, 0.14, 0.12), ((a + b) / 2, y, DECK_TOP + 0.06)), bevel=0, group=group)
            # flat posts
            n = max(1, int(round((b - a) / post_step)))
            for i in range(n + (0 if seamless else 1)):
                px = a + (b - a) * (i + (0.5 if seamless else 0)) / n
                S.solid(f'{group}_bpost{s}_{k}_{i}', 'bone', lambda bm, px=px, y=y: S.bm_box(bm, (0.07, 0.05, BAL_H), (px, y + s * 0.03, DECK_TOP + BAL_H / 2)), bevel=0, group=group)

    # canopy: round posts at each rib, arched rib frames, glass skin, purlins, lamp strip on the crown
    band, (R, zc, a0) = arc_band(hw + 0.15, CANOPY_RISE, CANOPY_EAVE, 0.06, n=10)
    S.solid(f'{group}_canopy', 'sky', lambda bm: solid_x(bm, band, x0, x1), bevel=0, group=group)
    rib, _ = arc_band(hw + 0.2, CANOPY_RISE + 0.02, CANOPY_EAVE - 0.14, 0.16, n=10)
    for i, rx in enumerate(rib_xs):
        S.solid(f'{group}_rib{i}', 'bone', lambda bm, rx=rx: solid_x(bm, rib, rx - 0.05, rx + 0.05), bevel=0, group=group)
        for s in (-1, 1):
            S.solid(f'{group}_cpost{s}_{i}', 'bone', lambda bm, rx=rx, s=s: S.bm_cylinder(bm, 0.06, DECK_TOP, CANOPY_EAVE - 0.05, n=8, center=(rx, s * (hw - 0.02))), bevel=0, group=group)
    for f in (0.0, 0.25, 0.75, 1.0):
        py, pz = arc_point(R - 0.08, zc, a0, f)
        S.solid(f'{group}_purlin{f}', 'bone', lambda bm, py=py, pz=pz: S.bm_box(bm, (x1 - x0, 0.08, 0.08), ((x0 + x1) / 2, py, pz)), bevel=0, group=group)
    S.solid(f'{group}_crownlamp', 'lamp', lambda bm: S.bm_box(bm, (x1 - x0, 0.12, 0.04), ((x0 + x1) / 2, 0, CANOPY_EAVE + CANOPY_RISE - 0.1)), bevel=0, group=group)


def pier(name, x, y):
    """Round pier with a base plinth and a flared capital."""
    prof = [(0.0, 0.0), (0.5, 0.0), (0.5, 0.25), (0.34, 0.32), (0.3, 0.45), (0.3, 5.15), (0.36, 5.4), (0.5, 5.62), (0.56, 5.68), (0.56, 5.78), (0.0, 5.78)]
    S.solid(name, 'haze', lambda bm: S.bm_lathe(bm, prof, n=16, xform=Matrix.Translation((x, y, 0))), bevel=0.03, group='crossing')


def stair(name, xc, w=1.6):
    """A straight open stair from the deck's -Y edge down to the sidewalk, with stainless cheek walls."""
    rise_total = DECK_TOP
    nsteps = 26
    r = rise_total / nsteps
    t = 0.27
    y_top = -1.8
    run = nsteps * t
    # step profile in (y, z): deck edge, sloped soffit to the foot, then the sawtooth back up
    pts = [(y_top, DECK_TOP), (y_top, DECK_TOP - 0.5), (y_top - run + 0.4, 0.0), (y_top - run, 0.0)]
    for i in range(nsteps):
        yy = y_top - run + i * t
        pts.append((yy, r * (i + 1)))
        pts.append((yy + t, r * (i + 1)))
    pts = pts[:-1]   # the last tread ends on the deck edge, already the first point
    S.solid(f'{name}_steps', 'walk', lambda bm: solid_x(bm, pts, xc - w / 2, xc + w / 2), bevel=0, group='crossing')
    # cheek walls: parallelograms following the slope, 1.0 above the nosing line
    for s in (-1, 1):
        xw = xc + s * (w / 2 + 0.06)
        cheek = [(y_top - run - 0.3, -0.0), (y_top - run - 0.3, 1.0), (y_top, DECK_TOP + 1.0), (y_top, DECK_TOP - 0.55)]
        S.solid(f'{name}_cheek{s}', 'haze', lambda bm, xw=xw, cheek=cheek: solid_x(bm, cheek, xw - 0.06, xw + 0.06), bevel=0.03, group='crossing')
        # handrail on the cheek
        p0 = Vector((xw - s * 0.1, y_top - run - 0.2, 0.95))
        p1 = Vector((xw - s * 0.1, y_top, DECK_TOP + 0.95))
        S.solid(f'{name}_hrail{s}', 'bone', lambda bm, p0=p0, p1=p1: S.bm_bar(bm, p0, p1, 0.06), bevel=0, group='crossing')
    # landing pad at the foot
    S.solid(f'{name}_landing', 'walk', lambda bm: S.bm_box(bm, (w + 0.4, 0.9, 0.08), (xc, y_top - run - 0.4, 0.04)), bevel=0.025, group='crossing')


def build():
    # ── crossing ──
    ribs = [i * 1.5 - 7.5 for i in range(11)]
    walkway('crossing', -9.0, 9.0, 1.8, 1.5, ribs, open_front=((-9.0, -7.35), (7.35, 9.0)))
    for sx in (-1, 1):
        for sy in (-1, 1):
            pier(f'pier{sx}{sy}', sx * 8.0, sy * 1.2)
        # crosshead tying the pier pair under the girder
        S.solid(f'crosshead{sx}', 'haze', lambda bm, sx=sx: S.bm_box(bm, (0.9, 3.2, 0.26), (sx * 8.0, 0, GIRDER_BOT - 0.12)), group='crossing')
        stair(f'stair{sx}', sx * 8.2)
    # ── segment ──
    walkway('segment', -0.5, 0.5, 1.5, 1.0, [0.0], seamless=True)


# preview: after the export, push the segment node out and repeat it six times beside the crossing
_orig_preview = S.preview


def _preview(path, obs, camera=None):
    import bpy
    seg = next((o for o in obs if o.name == 'segment'), None)
    extra = []
    if seg is not None:
        seg.location = (14.0, 6.0, 0.0)
        seg.rotation_euler = (0, 0, math.pi / 2)
        for k in range(1, 6):
            c = seg.copy()
            c.location = (14.0, 6.0 + k, 0.0)
            bpy.context.scene.collection.objects.link(c)
            extra.append(c)
    # context only, never exported: the road between the piers and the two sidewalks
    for nm, col, sx, cx in (('road', 'road', 14.0, 0.0), ('walkL', 'walk', 6.0, -10.0), ('walkR', 'walk', 6.0, 10.0)):
        me = bpy.data.meshes.new(nm)
        me.from_pydata([(cx - sx / 2, -60, 0.0 if nm == 'road' else 0.15), (cx + sx / 2, -60, 0.0 if nm == 'road' else 0.15), (cx + sx / 2, 60, 0.0 if nm == 'road' else 0.15), (cx - sx / 2, 60, 0.0 if nm == 'road' else 0.15)], [], [(0, 1, 2, 3)])
        me.materials.append(S.mat(col))
        ob = bpy.data.objects.new(nm, me)
        bpy.context.scene.collection.objects.link(ob)
    return _orig_preview(path, obs + extra, camera)


S.preview = _preview

if __name__ == '__main__':
    # roughly the angle of skywalk-span-IMG3190.jpg: standing on the road, the span across the view
    S.run(build, camera=((-6.0, -34.0, 1.7), (0.5, 0.0, 6.4), 34))
