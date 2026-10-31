# tower101.py — 台北101 (C.Y. Lee, 2004) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/tower101.py -- --out asset/models/src/tower101.glb --stats --preview x.png
# The default preview camera is CAM[4] in data.js (the base shot looking up the tower from the
# street), converted to this file's frame.
#
# Reference photos (research/reference/xinyi/img, blender-detail pass 2026-11-01):
#   101-ground-level-lookup.jpg, 101-exterior-2017.jpg — the corner look-ups: notched corners,
#     coin drums sitting on the pedestal roof, the big 如意 on each pedestal corner at a ledge line,
#     dark louvre panels in the pedestal glass, an ornament at every segment-joint corner.
#   101-lookup-glass-curtainwall.jpg — the face head-on: a pale line at every floor, dense vertical
#     mullions, the ornament stack at the centre of every joint, a pale louvre band under the coin.
#   101-mall-podium-2012.jpg, 101-mall-exit-e-2024.jpg — the mall: green glass grid over granite
#     piers, a pale cornice, a scalloped 如意 frieze under a louvred hip roof; the entrance canopy
#     with its fan of drooping ribs between two granite piers carrying coin and 如意 emblems.
#
# Profile (unchanged): a mall podium; a tapering pedestal for floors 1–25; four 古錢 coin drums
# on the pedestal roof, one per face; eight 斗-shaped segments of eight floors, each flaring
# outward as it rises so its top overhangs the next one's base (節節高升); 如意 at every
# segment's corners and face centres; a tiered crown for floors 91–101; mechanical box, mast,
# spire with its rings.
#
# Frame: metres, Blender Z up, origin at the tower's centre on the ground. Placed at world
# (0, 0, -420) with no rotation, so Blender +X → world +x and Blender -Y → world +z, the side the
# camera comes from. The podium's front and its canopy face -Y. Face k of a frustum is the one
# whose outward normal is -Y rotated k quarter turns about Z: k=0 front (-Y), 1 east (+X),
# 2 back (+Y), 3 west (-X) — the face the climbing man is on (scene-tower.js TOWER.faceX).
#
# The profile constants below are the ones scene-tower.js uses for TOWER.faceX(y), which keeps
# the climbing man on the west face. Change them together or not at all. On the west face nothing
# stands more than 0.5 proud of the face at its height (or of the ledge just under it, at a
# joint): check_west() prints the worst case at build time. The man climbs at Blender y = -1.5.

import math
import os
import sys

from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_prism, bm_bar, bm_solid, bm_cylinder, solid, cutter

SQ2 = math.sqrt(2)
WEST = 3

# ── profile (scene-tower.js) ─────────────────────────────────────────────────
PODIUM_H = 7.0
PED_Y0, PED_Y1, PED_HB, PED_HT = 7.0, 30.0, 8.5, 6.0        # pedestal: base/top height, half-widths
SEG_Y0, SEG_H, SEG_N, SEG_HB, SEG_HT = 30.0, 8.5, 8, 5.2, 6.6   # the eight flared segments
CROWN_Y0 = SEG_Y0 + SEG_N * SEG_H                          # 98
CROWN_H, CROWN_HB, CROWN_HT = 8.0, 5.5, 3.2
CROWN_Y1 = CROWN_Y0 + CROWN_H                              # 106
MECH_H, MAST_H, SPIRE_H = 3.0, 2.0, 18.0
SPIRE_TOP = CROWN_Y1 + MECH_H + MAST_H + SPIRE_H           # 129

# ── corner notches: every corner of the real tower is stepped in twice (the sawtooth corner);
# the main face keeps the profile half-width, the notch faces sit `n` further in
PED_N, SEG_N_NOTCH, CROWN_N = 0.6, 0.45, 0.3

# ── podium (the mall block, centred 2 m toward the camera) ───────────────────
POD_W, POD_D, POD_CY = 30.0, 22.0, -2.0
POD_Y0, POD_Y1 = POD_CY - POD_D / 2, POD_CY + POD_D / 2    # -13 (front, under the TAIPEI 101 letters) .. 9
BASE_H = 2.6                                               # granite piers and shop glass
CORNICE_Z = 5.8


def R(k):
    return Matrix.Rotation(k * math.pi / 2, 4, 'Z')


def sq(bm, hw0, hw1, z0, z1, center=(0, 0)):
    """An axis-aligned square prism / frustum: half-width hw0 at z0, hw1 at z1."""
    return bm_prism(bm, 4, hw0 * SQ2, hw1 * SQ2, z0, z1, rot=math.pi / 4, center=center)


def rect_frustum(bm, ax0, ay0, ax1, ay1, z0, z1, cx=0.0, cy=0.0):
    """A rectangular frustum: half-extents (ax0, ay0) at z0, (ax1, ay1) at z1."""
    b = [bm.verts.new((cx + sx * ax0, cy + sy * ay0, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    t = [bm.verts.new((cx + sx * ax1, cy + sy * ay1, z1)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    bm.faces.new(b[::-1])
    bm.faces.new(t)
    for i in range(4):
        bm.faces.new((b[i], b[(i + 1) % 4], t[(i + 1) % 4], t[i]))


def notched(bm, hb, ht, z0, z1, n):
    """The tower's cross-shaped section: two overlapping rectangular frusta, so each corner shows
    the double step the photos show. The main faces keep the full half-width (TOWER.faceX)."""
    rect_frustum(bm, hb, hb - n, ht, ht - n, z0, z1)
    rect_frustum(bm, hb - n, hb, ht - n, ht, z0, z1)


def hw_at(z, z0, z1, hb, ht):
    """Half-width of a frustum face at height z."""
    return hb + (ht - hb) * (z - z0) / (z1 - z0)


def tilt(hb, ht, z0, z1):
    """The face's lean: positive when it flares outward as it rises."""
    return math.atan2(ht - hb, z1 - z0)


def ruyi_pts(r_side=0.34, r_mid=0.40):
    """如意 head as a closed outline: three lobes in a fan over a short neck."""
    def arc(cx, cz, r, a0, a1, n=5):
        return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / (n - 1))),
                 cz + r * math.sin(math.radians(a0 + (a1 - a0) * i / (n - 1)))) for i in range(n)]
    pts = [(-0.17, 0.0), (0.17, 0.0)]
    pts += arc(0.5, 0.34, r_side, -72, 118)
    pts += arc(0.0, 0.68, r_mid, 22, 158)
    pts += arc(-0.5, 0.34, r_side, 62, 252)
    return pts


# ─────────────────────────────────────────────────────────────────────────────
# the podium
# ─────────────────────────────────────────────────────────────────────────────
def podium():
    """The mall (101-mall-podium-2012.jpg): green glass grid over a storey of granite piers, a pale
    cornice, a dark frieze hung with scalloped 如意 lobes, a louvred hip roof; on the front a pale
    portal (the TAIPEI 101 letters, canvas, sit on it at y 5.85) over the entrance and its canopy."""
    hx, hy = POD_W / 2, POD_D / 2
    cy = POD_CY
    solid('podium_glass', 'glass', lambda bm: bm_box(bm, (POD_W - 0.3, POD_D - 0.3, CORNICE_Z), (0, cy, CORNICE_Z / 2)))
    solid('podium_plinth', 'road', lambda bm: bm_box(bm, (POD_W + 0.1, POD_D + 0.1, 0.5), (0, cy, 0.25)), bevel=0.03)

    def perimeter(step, skip_front=None):
        """(face k, along-face offset u, apothem) for points spaced `step` along all four sides."""
        out = []
        for k, half, apo in ((0, hx, hy), (1, hy, hx), (2, hx, hy), (3, hy, hx)):
            n = int(2 * half / step)
            for i in range(n + 1):
                u = -half + i * 2 * half / n
                if k == 0 and skip_front and abs(u) < skip_front:
                    continue
                out.append((k, u, apo, half))
        return out

    def pod_frame(k, apo):
        return Matrix.Translation((0, cy, 0)) @ R(k) @ Matrix.Translation((0, -apo, 0))

    def piers(bm):
        for k, u, apo, half in perimeter(2.5, skip_front=8.4):
            if abs(abs(u) - half) < 0.1:
                continue
            bm_box(bm, (0.7, 0.35, BASE_H), (u, -0.05, BASE_H / 2), pod_frame(k, apo))
        for sx in (-1, 1):                                     # the four corner piers, full height
            for sy in (-1, 1):
                bm_box(bm, (1.2, 1.2, CORNICE_Z), (sx * (hx - 0.4), cy + sy * (hy - 0.4), CORNICE_Z / 2))
    solid('podium_piers', 'haze', piers, bevel=0.03)

    def grid(bm):
        # verticals every metre and a transom every 0.8 m on the glass above the piers
        for k, u, apo, half in perimeter(1.0, skip_front=7.1):
            bm_box(bm, (0.09, 0.14, CORNICE_Z - BASE_H), (u, 0.08, (BASE_H + CORNICE_Z) / 2), pod_frame(k, apo))
        for z in (BASE_H, BASE_H + 0.8, BASE_H + 1.6, BASE_H + 2.4):
            for k, half, apo in ((0, hx, hy), (1, hy, hx), (2, hx, hy), (3, hy, hx)):
                if k == 0:
                    for s in (-1, 1):
                        bm_box(bm, (hx - 7.1, 0.16, 0.1), (s * (7.1 + hx) / 2, 0.08, z), pod_frame(k, apo))
                else:
                    bm_box(bm, (2 * half, 0.16, 0.1), (0, 0.08, z), pod_frame(k, apo))
    solid('podium_grid', 'bone', grid, bevel=0, smooth=False)

    solid('podium_cornice', 'bone', lambda bm: bm_box(bm, (POD_W + 0.3, POD_D + 0.3, 0.5), (0, cy, CORNICE_Z + 0.25)), bevel=0.03)
    solid('podium_frieze', 'road', lambda bm: bm_box(bm, (POD_W - 0.1, POD_D - 0.1, PODIUM_H - CORNICE_Z - 0.5), (0, cy, (CORNICE_Z + 0.5 + PODIUM_H) / 2)), bevel=0)

    def scallops(bm):
        lobe = [(0.42 * math.cos(math.pi + i * math.pi / 4), 0.42 * math.sin(math.pi + i * math.pi / 4)) for i in range(5)]
        for k, u, apo, half in perimeter(1.0, skip_front=7.1):
            M = pod_frame(k, apo) @ Matrix.Translation((u, 0, PODIUM_H - 0.08))
            bm_solid(bm, lobe, -0.12, 0.0, M)
    solid('podium_scallops', 'haze', scallops, bevel=0)
    solid('podium_eave', 'haze', lambda bm: bm_box(bm, (POD_W + 0.4, POD_D + 0.4, 0.22), (0, cy, PODIUM_H - 0.02)), bevel=0.03)
    solid('podium_roof', 'haze', lambda bm: rect_frustum(bm, hx + 0.1, hy + 0.1, hx - 1.4, hy - 1.4, PODIUM_H + 0.09, PODIUM_H + 1.0, cy=cy), bevel=0.03)

    def louvres(bm):
        # slats on the hip roof's long slopes
        for j in range(4):
            t = (j + 0.5) / 4
            z = PODIUM_H + 0.09 + 0.91 * t
            d = 0.1 + 1.5 * t
            for sy in (-1, 1):
                bm_box(bm, (POD_W - 2 * d, 0.12, 0.08), (0, cy + sy * (hy + 0.1 - d), z + 0.04))
    solid('podium_louvres', 'bone', louvres, bevel=0)

    # the front: pale portal, dark doors, granite piers with emblems, the fan canopy
    yf = POD_Y0
    solid('podium_portal', 'bone', lambda bm: bm_box(bm, (14.2, 0.3, PODIUM_H - BASE_H - 0.6), (0, yf + 0.15, (BASE_H + PODIUM_H - 0.6) / 2)), bevel=0.03)
    solid('podium_doors', 'ink', lambda bm: bm_box(bm, (11.0, 0.3, BASE_H + 0.3), (0, yf + 0.25, (BASE_H + 0.3) / 2)), bevel=0)

    def door_frames(bm):
        for i in range(12):
            bm_box(bm, (0.08, 0.1, BASE_H + 0.3), (-5.5 + i * 1.0, yf + 0.06, (BASE_H + 0.3) / 2))
        bm_box(bm, (11.0, 0.1, 0.1), (0, yf + 0.06, 2.3))
    solid('podium_door_frames', 'haze', door_frames, bevel=0)
    solid('podium_door_head', 'road', lambda bm: bm_box(bm, (11.6, 0.4, 0.6), (0, yf, BASE_H + 0.3)), bevel=0.03)

    def gate_piers(bm):
        for sx in (-1, 1):
            bm_box(bm, (1.3, 1.0, PODIUM_H - 0.6), (sx * 6.25, yf - 0.3, (PODIUM_H - 0.6) / 2))
            bm_box(bm, (1.5, 1.2, 0.3), (sx * 6.25, yf - 0.3, PODIUM_H - 0.45))
    solid('podium_gate_piers', 'road', gate_piers, bevel=0.03)

    def emblems(bm):
        # 101-mall-exit-e-2024.jpg: a coin disc over a 如意 on each pier, a slim rod below
        for sx in (-1, 1):
            M = Matrix.Translation((sx * 6.25, yf - 0.8, 4.6)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
            bm_cylinder(bm, 0.36, 0.0, 0.08, n=16, xform=M)
            bm_box(bm, (0.06, 0.06, 1.6), (sx * 6.25, yf - 0.83, 2.2))
            bm_solid(bm, [(x * 0.55, z * 0.55) for x, z in ruyi_pts()], -0.06, 0.0, Matrix.Translation((sx * 6.25, yf - 0.8, 3.4)))
    solid('podium_emblems', 'bone', emblems, bevel=0)

    solid('podium_canopy', 'haze', lambda bm: bm_box(bm, (12.6, 4.0, 0.22), (0, yf - 2.0, 3.35)), bevel=0.03)
    solid('podium_canopy_edge', 'bone', lambda bm: bm_bar(bm, (-6.5, yf - 4.0, 3.4), (6.5, yf - 4.0, 3.4), 0.42), bevel=0)

    def ribs(bm):
        # the fan of drooping ribs under the canopy: a V plate per bay, deepest toward the front
        for i in range(9):
            x = -5.6 + i * 1.4
            M = Matrix.Translation((x, 0, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'Z')
            prof = [(yf - 0.1, 3.24), (yf - 3.9, 3.24), (yf - 3.6, 2.45), (yf - 2.4, 2.6), (yf - 0.6, 3.0)]   # x here is world y (the quarter turn)
            bm_solid(bm, prof, -0.05, 0.05, M)
    solid('podium_canopy_ribs', 'bone', ribs, bevel=0)

    def rib_tips(bm):
        # the round boss at each rib's tip (101-mall-exit-e-2024.jpg)
        for i in range(9):
            bm_cylinder(bm, 0.14, 2.3, 2.5, n=8, center=(-5.6 + i * 1.4, yf - 3.6))
    solid('podium_canopy_tips', 'haze', rib_tips, bevel=0)


# ─────────────────────────────────────────────────────────────────────────────
# curtain-wall detail, shared by pedestal, segments and crown
# ─────────────────────────────────────────────────────────────────────────────
def floor_lines(bm, z0, z1, hb, ht, n, floors, proud=0.1, thick=0.09):
    """A pale floor line across each main face at every floor (the curtain-wall photo's bright
    horizontal bands), a box per face per floor, standing `proud` of the glass."""
    for i in range(1, floors):
        z = z0 + (z1 - z0) * i / floors
        hw = hw_at(z, z0, z1, hb, ht)
        for k in range(4):
            bm_box(bm, (2 * (hw - n) + 0.05, proud * 2, thick), (0, -hw, z), R(k))


def mullion_bars(bm, z0, z1, hb, ht, n, per_face, proud=0.14, t=0.075):
    """Vertical mullions on the main faces, following the face's slope. Square section on purpose:
    bm_bar tracks the axis but not the roll, so a flat fin lands at a random angle."""
    for k in range(4):
        for i in range(per_face):
            f = -0.94 + i * 1.88 / (per_face - 1)
            p0 = R(k) @ Vector((f * (hb - n), -(hb + proud - t / 2), z0))
            p1 = R(k) @ Vector((f * (ht - n), -(ht + proud - t / 2), z1))
            bm_bar(bm, p0, p1, t)


def corner_bars(bm, z0, z1, hb, ht, n, t=0.18):
    """A pale bar down each of the eight outer edges of the notched corners: the double step of
    each corner reads as two bright lines in every photo."""
    for sx in (-1, 1):
        for sy in (-1, 1):
            for ax, ay in ((0, n), (n, 0)):
                bm_bar(bm, (sx * (hb - ax), sy * (hb - ay), z0), (sx * (ht - ax), sy * (ht - ay), z1), t)


def frustum_skin(name, z0, z1, hb, ht, n, floors, per_face):
    """Glass, floor lines, mullions and corner bars for one notched frustum."""
    solid(name, 'glass', lambda bm: notched(bm, hb, ht, z0, z1, n))
    solid(name + '_floors', 'bone', lambda bm: floor_lines(bm, z0, z1, hb, ht, n, floors), bevel=0, smooth=False)
    solid(name + '_mullions', 'haze', lambda bm: mullion_bars(bm, z0, z1, hb, ht, n, per_face), bevel=0)
    solid(name + '_corners', 'bone', lambda bm: corner_bars(bm, z0, z1, hb, ht, n), bevel=0)


# ─────────────────────────────────────────────────────────────────────────────
# pedestal, coins
# ─────────────────────────────────────────────────────────────────────────────
PED_LEDGE_Z = 20.5          # the ledge line at the pedestal corners' 如意 (101-exterior-2017.jpg)


def pedestal():
    frustum_skin('pedestal', PED_Y0, PED_Y1, PED_HB, PED_HT, PED_N, 25, 23)
    a = tilt(PED_HB, PED_HT, PED_Y0, PED_Y1)

    def on_face(k, u, z, proud):
        """Frame on face k at offset u, height z, `proud` out, tilted with the face."""
        hw = hw_at(z, PED_Y0, PED_Y1, PED_HB, PED_HT)
        return R(k) @ Matrix.Translation((u, -(hw + proud), z)) @ Matrix.Rotation(a, 4, 'X')

    def louvres(bm):
        # the dark louvre panels in the glass: a wide band under the coin, two tall strips, a short
        # band (101-ground-level-lookup.jpg, 101-exterior-2017.jpg)
        for k in range(4):
            bm_box(bm, (6.4, 0.1, 1.4), (1.2, 0, 0), on_face(k, 0, 26.6, 0.05))
            for u in (-4.2, 4.6):
                bm_box(bm, (0.7, 0.1, 6.0), (0, 0, 0), on_face(k, u, 14.0, 0.05))
    solid('pedestal_louvres', 'road', louvres, bevel=0, smooth=False)

    def slats(bm):
        for k in range(4):
            for j in range(4):
                bm_box(bm, (6.4, 0.14, 0.08), (1.2, 0, -0.5 + j * 0.33), on_face(k, 0, 26.6, 0.1))
    solid('pedestal_slats', 'haze', slats, bevel=0, smooth=False)

    def ledge(bm):
        hw = hw_at(PED_LEDGE_Z, PED_Y0, PED_Y1, PED_HB, PED_HT)
        for k in range(4):
            bm_box(bm, (2 * (hw - PED_N), 0.36, 0.22), (0, -hw, PED_LEDGE_Z), R(k))
    solid('pedestal_ledge', 'bone', ledge, bevel=0.03)
    solid('pedestal_roof', 'haze', lambda bm: notched(bm, PED_HT + 0.05, PED_HT + 0.05, PED_Y1 - 0.05, PED_Y1 + 0.25, PED_N), bevel=0.03)
    solid('pedestal_rim', 'bone', lambda bm: notched(bm, PED_HT + 0.2, PED_HT + 0.2, PED_Y1 - 0.75, PED_Y1 - 0.05, PED_N), bevel=0.03)

    def corner_ruyi(bm):
        # the big 如意 on each pedestal corner, facing out along the diagonal, sitting in the notch
        hw = hw_at(PED_LEDGE_Z, PED_Y0, PED_Y1, PED_HB, PED_HT) - PED_N
        for sx in (-1, 1):
            for sy in (-1, 1):
                M = (Matrix.Translation((sx * hw, sy * hw, PED_LEDGE_Z + 0.1))
                     @ Matrix.Rotation(math.atan2(-sx, sy), 4, 'Z') @ Matrix.Diagonal((1.45, 1, 1.45, 1)))
                bm_solid(bm, ruyi_pts(), 0.0, 0.32, M)                  # local +Y is outward here
                bm_box(bm, (0.5, 0.3, 0.3), (0, 0.15, -0.1), M)
    solid('pedestal_ruyi', 'bone', corner_ruyi, bevel=0.03)


COIN_R = 1.8


def coin_frame(k):
    """A coin drum on face k of the first segment, sitting on the pedestal roof, tilted with the
    segment's flare. Local z runs out of the face."""
    zc = SEG_Y0 + 0.35 + COIN_R
    hw = hw_at(zc, SEG_Y0, SEG_Y0 + SEG_H, SEG_HB, SEG_HT)
    a = tilt(SEG_HB, SEG_HT, SEG_Y0, SEG_Y0 + SEG_H)
    return R(k) @ Matrix.Translation((0, -hw, zc)) @ Matrix.Rotation(math.pi / 2 + a, 4, 'X')


def coin_depth(k):
    """How far the drum stands out of the face. The real drums stand well out (1.2 here); on the
    west face the man climbs through it, so it stays inside the 0.5 rule."""
    return 0.42 if k == WEST else 1.2


def coins():
    """古錢 (101-ground-level-lookup.jpg): a thick drum on each face where the first segment meets
    the pedestal roof, its face a raised rim round a recessed disc with a square hole."""
    def drums(bm):
        for k in range(4):
            bm_cylinder(bm, COIN_R, -0.6, coin_depth(k), n=28, xform=coin_frame(k))
    def recess(bm):
        for k in range(4):
            bm_cylinder(bm, COIN_R - 0.24, coin_depth(k) - 0.1, coin_depth(k) + 0.3, n=28, xform=coin_frame(k))
    def holes(bm):
        for k in range(4):
            bm_box(bm, (0.9, 0.9, 0.6), (0, 0, coin_depth(k) - 0.25), coin_frame(k))
    c1 = cutter('coin_recess', 'haze', recess)
    c2 = cutter('coin_holes', 'ink', holes)
    solid('coins', 'bone', drums, bevel=0.03, cutters=(c1, c2))

    def frames(bm):
        # the raised square frame round each hole
        for k in range(4):
            d = coin_depth(k) - 0.1
            for (sx, sy, ox, oy) in ((1.2, 0.15, 0, 0.525), (1.2, 0.15, 0, -0.525), (0.15, 0.9, 0.525, 0), (0.15, 0.9, -0.525, 0)):
                bm_box(bm, (sx, sy, 0.12), (ox, oy, d + 0.05), coin_frame(k))
    solid('coin_frames', 'bone', frames, bevel=0)


# ─────────────────────────────────────────────────────────────────────────────
# the eight segments and the 如意
# ─────────────────────────────────────────────────────────────────────────────
def segments():
    def glass(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            notched(bm, SEG_HB, SEG_HT, z0, z0 + SEG_H, SEG_N_NOTCH)
    solid('segments', 'glass', glass)

    def floors(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            floor_lines(bm, z0, z0 + SEG_H, SEG_HB, SEG_HT, SEG_N_NOTCH, 8)
    solid('segment_floors', 'bone', floors, bevel=0, smooth=False)

    def mull(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            mullion_bars(bm, z0, z0 + SEG_H, SEG_HB, SEG_HT, SEG_N_NOTCH, 15)
    solid('segment_mullions', 'haze', mull, bevel=0)

    def corners(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            corner_bars(bm, z0, z0 + SEG_H, SEG_HB, SEG_HT, SEG_N_NOTCH)
    solid('segment_corners', 'bone', corners, bevel=0)

    # the joint: a pale ledge on every segment's top that overhangs the next base, and a dark band
    # at each base that reads as the overhang's shadow line from the street
    def rims(bm):
        for i in range(SEG_N):
            z1 = SEG_Y0 + (i + 1) * SEG_H
            notched(bm, SEG_HT + 0.22, SEG_HT + 0.22, z1 - 0.45, z1 + 0.05, SEG_N_NOTCH)
    solid('segment_rims', 'bone', rims, bevel=0.03)

    def shadows(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            hw = SEG_HB + 0.06
            notched(bm, hw, hw + 0.11, z0 + 0.05, z0 + 0.75, SEG_N_NOTCH)
    solid('segment_shadow', 'ink', shadows, bevel=0)


def ruyi():
    """如意 at every segment's four bottom corners (32), each facing out along its diagonal and
    sitting on the ledge of the segment below; and the face-centre stack at every joint
    (101-lookup-glass-curtainwall.jpg): a wide flat cloud over a small boss under
    every segment's top rim, on all four faces."""
    CORNERS = [(sx, sy) for sx in (-1, 1) for sy in (-1, 1)]

    def placement(sx, sy, z):
        return Matrix.Translation((sx * 5.45, sy * 5.45, z)) @ Matrix.Rotation(math.atan2(-sx, sy), 4, 'Z')

    def build(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H + 0.15
            for sx, sy in CORNERS:
                M = placement(sx, sy, z0)
                bm_box(bm, (0.72, 0.62, 0.22), (0, 0, 0.11), M)                      # base plate
                bm_box(bm, (0.2, 0.26, 0.3), (0, 0, 0.35), M)                        # stem
                bm_solid(bm, [(x, z + 0.46) for x, z in ruyi_pts()], -0.13, 0.13, M)  # the cloud head
    solid('ruyi', 'bone', build, bevel=0)

    def eyes(bm):
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H + 0.15
            for sx, sy in CORNERS:
                bm_box(bm, (0.24, 0.3, 0.24), (0, 0, 1.14), placement(sx, sy, z0))
    solid('ruyi_eyes', 'lamp', eyes, bevel=0, smooth=False)

    a = tilt(SEG_HB, SEG_HT, SEG_Y0, SEG_Y0 + SEG_H)

    def centre(bm):
        # hung just under each segment's top rim, so the street sees it under the overhang
        for i in range(SEG_N):
            z0 = SEG_Y0 + i * SEG_H
            for k in range(4):
                z = z0 + SEG_H - 1.45
                hw = hw_at(z, z0, z0 + SEG_H, SEG_HB, SEG_HT)
                M = R(k) @ Matrix.Translation((0, -hw, z)) @ Matrix.Rotation(a, 4, 'X')
                bm_solid(bm, [(x * 1.25, zz * 0.8) for x, zz in ruyi_pts()], -0.34, 0.1, M)
                bm_cylinder(bm, 0.26, 0.0, 0.32, n=8, xform=M @ Matrix.Translation((0, 0.1, -0.32)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    solid('ruyi_centre', 'bone', centre, bevel=0)


# ─────────────────────────────────────────────────────────────────────────────
# crown, mechanical box, mast, spire
# ─────────────────────────────────────────────────────────────────────────────
CROWN_TIERS = ((CROWN_Y0, CROWN_Y0 + 3.0), (CROWN_Y0 + 3.0, CROWN_Y0 + 5.7), (CROWN_Y0 + 5.7, CROWN_Y1 - 0.35))


def crown_line(z):
    return hw_at(z, CROWN_Y0, CROWN_Y1, CROWN_HB, CROWN_HT)


def crown():
    """Floors 91–101 as three short flared tiers stepping in (the scheme diagram, 101-tower-2013.jpg),
    each hugging the straight crown line within -0.3..+0.2 so TOWER.faceX still fits; a ledge on each."""
    for j, (z0, z1) in enumerate(CROWN_TIERS):
        hb, ht = crown_line(z0) - 0.3, crown_line(z1) + 0.2
        frustum_skin('crown_t%d' % j, z0, z1, hb, ht, CROWN_N, 3, 9)
        if j < 2:
            solid('crown_ledge_t%d' % j, 'bone', lambda bm, ht=ht, z1=z1: notched(bm, ht + 0.15, ht + 0.15, z1 - 0.25, z1 + 0.05, CROWN_N), bevel=0.03)
    solid('crown_base', 'bone', lambda bm: notched(bm, CROWN_HB + 0.25, CROWN_HB + 0.25, CROWN_Y0 - 0.05, CROWN_Y0 + 0.35, CROWN_N), bevel=0.03)
    # the rim the man pulls himself over (app.js RIM_Y = TOWER.h + 0.05, STAND between hw 3.4 and 2.1)
    solid('crown_rim', 'bone', lambda bm: sq(bm, CROWN_HT + 0.2, CROWN_HT + 0.2, CROWN_Y1 - 0.35, CROWN_Y1 + 0.05), bevel=0.03)
    solid('mech', 'haze', lambda bm: sq(bm, 2.1, 2.1, CROWN_Y1, CROWN_Y1 + MECH_H))
    solid('mech_cap', 'bone', lambda bm: sq(bm, 2.3, 2.3, CROWN_Y1 + MECH_H - 0.25, CROWN_Y1 + MECH_H + 0.05), bevel=0.03)

    def louvres(bm):
        for k in range(4):
            for j in range(4):
                bm_box(bm, (3.4, 0.16, 0.14), (0, -2.15, CROWN_Y1 + 0.55 + j * 0.6), R(k))
    solid('mech_louvres', 'bone', louvres, bevel=0)

    y0 = CROWN_Y1 + MECH_H

    def mast(bm):
        """The mast as a lattice: four corner posts, rungs and diagonals."""
        for sx in (-1, 1):
            for sy in (-1, 1):
                bm_bar(bm, (sx * 0.62, sy * 0.62, y0), (sx * 0.62, sy * 0.62, y0 + MAST_H), 0.12)
        for j in range(3):
            z = y0 + j * MAST_H / 2
            for k in range(4):
                bm_bar(bm, R(k) @ Vector((-0.62, -0.62, z)), R(k) @ Vector((0.62, -0.62, z)), 0.09)
                if j < 2:
                    bm_bar(bm, R(k) @ Vector((-0.62, -0.62, z)), R(k) @ Vector((0.62, -0.62, z + MAST_H / 2)), 0.07)
    solid('mast', 'bone', mast, bevel=0)

    y1 = y0 + MAST_H

    def sleeves(bm):
        # stepped sleeves at the spire's foot
        for r, za, zb in ((0.95, 0.0, 0.7), (0.82, 0.7, 1.6), (0.72, 1.6, 2.8)):
            bm_prism(bm, 12, r, r, y1 + za, y1 + zb, rot=0)
    solid('spire_sleeves', 'haze', sleeves, bevel=0.03)
    solid('spire', 'bone', lambda bm: bm_prism(bm, 12, 0.6, 0.1, y1 + 2.8, y1 + SPIRE_H, rot=0), bevel=0)

    def rings(bm):
        L = SPIRE_H - 2.8
        for t in (0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8):
            r = 0.6 + (0.1 - 0.6) * t
            z = y1 + 2.8 + L * t
            bm_prism(bm, 12, r + 0.16, r + 0.16, z - 0.09, z + 0.09, rot=0)
        bm_prism(bm, 12, 0.88, 0.88, y1 + 0.65, y1 + 0.78, rot=0)
        bm_prism(bm, 12, 0.76, 0.76, y1 + 1.55, y1 + 1.68, rot=0)
    solid('spire_rings', 'haze', rings, bevel=0)


def build():
    podium()
    pedestal()
    coins()
    segments()
    ruyi()
    crown()


def check_west():
    """Nothing on the west face (x < 0, |y| inside the face) more than 0.5 proud of TOWER.faceX's
    half-width at its height or at the ledge just under it (a joint ornament sits on that ledge)."""
    def hw(y):
        if y < PED_Y0:
            return 15.0
        if y < PED_Y1:
            return PED_HB + (PED_HT - PED_HB) * (y - PED_Y0) / (PED_Y1 - PED_Y0)
        if y < CROWN_Y0:
            t = ((y - SEG_Y0) % SEG_H) / SEG_H
            return SEG_HB + (SEG_HT - SEG_HB) * t
        if y < CROWN_Y1:
            return CROWN_HB + (CROWN_HT - CROWN_HB) * (y - CROWN_Y0) / CROWN_H
        return 2.1
    worst = (0.0, None)
    for ob, _ in S.OBJECTS:
        mw = ob.matrix_world
        for v in ob.data.vertices:
            x, y, z = mw @ v.co
            if x >= 0 or abs(y) > abs(x) or z < PODIUM_H + 0.5:
                continue
            allowed = max(hw(z), hw(z - 1.3)) + 0.5
            over = -x - allowed
            if over > worst[0]:
                worst = (over, (ob.name, round(x, 2), round(y, 2), round(z, 2)))
    print(f'[model] west-face check: worst overshoot {worst[0]:.3f} at {worst[1]}')
    return worst


if __name__ == '__main__':
    _orig_join = S.join

    def _join(objs, name):
        check_west()
        S.join = _orig_join
        return _orig_join(objs, name)
    S.join = _join
    # preview camera: CAM[4] in data.js, the base shot looking up the tower from the street
    S.run(build, camera=((-3.0, -48.0, 3.0), (-4.0, 0.0, 50.0), 62))
