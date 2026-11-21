# red-house.py — 西門紅樓 (Ximen Red House, Kondo Juro, 1908) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/red-house.py -- --out asset/models/src/red-house.glb --stats --preview x.png
# RH_CAM=front|three|scene picks the preview camera (default front, the angle of reference
# photo redhouse-03; three = redhouse-04's raised 3/4 view; scene = the page's keyframe).
#
# Reference photos (research/reference/ximen/img/redhouse-0*.jpg, Wikimedia Commons), read
# 2026-11-01 for the blender-detail pass:
#   - the octagon is two storeys of red brick. Every face carries three upper windows, rect -
#     round-arched - rect, each in a pale stone surround, under a frieze of flat-arch voussoirs.
#   - the upper storey is banded: a pale stone course every ~0.6 m wraps the whole octagon and
#     stops at the window surrounds, which is what makes the jambs read as quoined.
#   - the ground floor is plain brick: a segmental-arched double door on the front under a
#     standing-seam metal canopy and the 西門紅樓 board (a blank board here; text stays canvas in
#     JS), blind segmental arches with stone sills, real windows under lean-to canopies on the
#     faces either side of the front. A thick floor course with short pale drops between storeys.
#   - a dentil cornice on corner consoles, then a low brick parapet (the drum under the roof)
#     with stone coping and corner pedestals, and a gabled brick dormer (arched window, stepped
#     stone coping) over the middle window of every facet (the back one is hidden by the long arm).
#   - a steep eight-sided standing-seam metal roof behind the parapet with a small lantern/vent.
#   - behind, the one-storey cross-shaped hall (十字樓): arched windows between pilasters, gable
#     ends with stone coping, kneelers and an oculus, a clerestory monitor along each ridge.
#
# Scene contract (scene-red.js §1): octagon circumradius 7.2, eave 8.8, the long arm 30 x 8.4
# centred 21 m behind the octagon, the cross arm 8.4 x 30 centred 23 m behind. Placed at
# (16.6, 0, RH.z), rotation -π/2. One node, 'main'.
#
# Frame: metres, Blender Z up. The front (the face toward 成都路 / the road) faces -Y, which the
# glTF exporter turns into +Z. Origin at the octagon's centre on the ground. Shared mechanics
# (builders, materials, bevel rules, join, export, preview) live in stylized.py.

import math
import os
import sys

import bmesh
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_prism, bm_solid, bm_bar, arch_pts, rect_pts, circle_pts, face_frame, solid

# ── dimensions (metres), from scene-red.js ───────────────────────────────────
R = 7.2                 # octagon circumradius
APO = R * math.cos(math.pi / 8)          # apothem (6.65)
HS = R * math.sin(math.pi / 8)           # half of one side (2.76)
EAVE = 8.8              # cornice top
FLOOR = 4.55            # floor course between the storeys
ARM_H = 4.6             # cross-wing wall height
ARM_W = 8.4             # cross-wing arm width
ARM_L = 30.0            # cross-wing arm length
LONG_ARM_Y = 21.0       # long arm centre, behind the octagon
CROSS_ARM_Y = 23.0      # cross arm centre

# upper storey: three windows per face, rect - arched - rect
WX = 1.75                         # outer windows at ±WX
WIN_W, GLASS_W = 1.12, 0.80       # stone surround / glass width
SILL = 5.25                       # window bottom
RECT_H = 2.3                      # rect window height (top 7.55)
ARCH_STRAIGHT = 1.72              # arched window: straight part, then a semicircle (top 7.53)
BANDS = (5.79, 6.39, 6.99, 7.59)  # pale courses above the sill course (centres)
BAND_H = 0.17
SILL_BAND = 5.16

# k 0 = front (-Y), counter-clockwise seen from above: k 2 = +X side, k 4 = back (inside the
# long arm), k 6 = -X side.
DORMER_FACES = (0, 1, 2, 3, 5, 6, 7)   # every facet but the back one, which the long arm hides
CANOPY_FACES = (1, 7)

DOOR_W, DOOR_S, DOOR_RISE = 2.1, 2.75, 0.45     # door: from -0.2, straight to 2.55, crown 3.0
GWIN_W, GWIN_Z, GWIN_S, GWIN_RISE = 1.12, 1.0, 1.95, 0.32
BLIND_W, BLIND_Z, BLIND_S, BLIND_RISE = 1.0, 0.95, 2.05, 0.3
CANOPY_0 = (3.0, 1.6, 3.85, 0.45)               # front canopy: width, depth, height at wall, drop
CANOPY_D = (3.2, 1.3, 3.55, 0.5)                # the diagonal faces' lean-tos


def F(k, center=(0, 0, 0)):
    return face_frame(k * math.pi / 4, APO, center)


def front_sign(k):
    """+1 when local +x on face k runs toward the front (smaller world Y), else -1."""
    p = F(k) @ Vector((1, 0, 0))
    m = F(k) @ Vector((-1, 0, 0))
    return 1 if p.y < m.y else -1


def seg_arch_pts(w, straight, rise, n=8):
    """A segmental arch: a rectangle w wide and `straight` tall under a flat circular arc."""
    hw = w / 2
    r = (hw * hw + rise * rise) / (2 * rise)
    zc = straight + rise - r
    a0 = math.atan2(straight - zc, hw)
    pts = [(-hw, 0), (hw, 0)]
    for i in range(n + 1):
        a = a0 + (math.pi - 2 * a0) * i / n
        pts.append((r * math.cos(a), zc + r * math.sin(a)))
    return pts


def ground_openings(k):
    """[(x, kind)] on face k at street level: 'door', 'win' (glazed) or 'blind' (brick recess)."""
    if k == 0:
        return [(-1.85, 'blind'), (0, 'door'), (1.85, 'blind')]
    if k == 4:
        return []
    if k in CANOPY_FACES:
        s = front_sign(k)                       # the blind arch on the side nearest the front
        return [(s * WX, 'blind'), (0, 'win'), (-s * WX, 'win')]
    if k in (2, 6):
        return [(-WX, 'blind'), (0, 'win'), (WX, 'blind')]
    return [(-WX, 'win'), (0, 'blind'), (WX, 'win')]


def upper_windows(k):
    return [] if k == 4 else [(-WX, 'rect'), (0, 'arch'), (WX, 'rect')]


def canopy_specs():
    """(face, x centre, (width, depth, z at wall, drop)) for every canopy."""
    out = [(0, 0.0, CANOPY_0)]
    for k in CANOPY_FACES:
        out.append((k, -front_sign(k) * WX / 2, CANOPY_D))
    return out


# ─────────────────────────────────────────────────────────────────────────────
# the octagon walls, with every opening cut in
# ─────────────────────────────────────────────────────────────────────────────
def octagon_walls():
    surround, recess, blind = bmesh.new(), bmesh.new(), bmesh.new()
    for k in range(8):
        Fk = F(k)
        for x, kind in upper_windows(k):
            T = Fk @ Matrix.Translation((x, 0, SILL))
            if kind == 'rect':
                bm_solid(surround, rect_pts(WIN_W, RECT_H), -0.6, 0.1, T)
                bm_solid(recess, rect_pts(GLASS_W, RECT_H - 0.16, 0.1), -0.6, 0.34, T)
            else:
                bm_solid(surround, arch_pts(WIN_W, ARCH_STRAIGHT, 8), -0.6, 0.1, T)
                bm_solid(recess, arch_pts(GLASS_W, ARCH_STRAIGHT, 8), -0.6, 0.34, Fk @ Matrix.Translation((x, 0, SILL + 0.1)))
        for x, kind in ground_openings(k):
            if kind == 'door':
                bm_solid(recess, seg_arch_pts(DOOR_W, DOOR_S, DOOR_RISE, 10), -0.8, 0.45, Fk @ Matrix.Translation((x, 0, -0.2)))
            elif kind == 'win':
                bm_solid(recess, seg_arch_pts(GWIN_W, GWIN_S, GWIN_RISE), -0.6, 0.36, Fk @ Matrix.Translation((x, 0, GWIN_Z)))
            else:
                bm_solid(blind, seg_arch_pts(BLIND_W, BLIND_S, BLIND_RISE), -0.6, 0.11, Fk @ Matrix.Translation((x, 0, BLIND_Z)))
    c_sur = S.new_cutter('oct_surround', surround, 'bone')
    c_rec = S.new_cutter('oct_recess', recess, 'ink')
    c_bl = S.new_cutter('oct_blind', blind, 'brick')
    solid('oct_walls', 'brick', lambda bm: bm_prism(bm, 8, R, R, 0.0, EAVE - 0.2), cutters=(c_sur, c_rec, c_bl))
    return c_rec


def octagon_bands():
    """The pale courses of the upper storey. The sill course runs unbroken; the others stop at the
    window surrounds, so the surround and the courses read as one quoined stone frame."""
    ext = 0.07                                     # past the corner so neighbouring faces meet

    def build(bm):
        for k in range(8):
            Fk = F(k)
            bm_box(bm, (2 * HS + 2 * ext, 0.14, BAND_H + 0.03), (0, -0.03, SILL_BAND), Fk)
            wins = upper_windows(k)
            for z in BANDS:
                cuts = sorted((x - WIN_W / 2, x + WIN_W / 2) for x, kind in wins
                              if z - BAND_H / 2 < SILL + (RECT_H if kind == 'rect' else ARCH_STRAIGHT + WIN_W / 2))
                x0 = -HS - ext
                for a, b in cuts + [(HS + ext, HS + ext)]:
                    if a - x0 > 0.05:
                        bm_box(bm, (a - x0, 0.1, BAND_H), ((a + x0) / 2, -0.02, z), Fk)
                    x0 = b
    solid('oct_bands', 'bone', build, bevel=0.0, smooth=False)     # thin trim: no bevel, the budget


def octagon_trim():
    """Plinth, the floor course with its drops, the window frieze, cornice, dentils, consoles."""
    def plinth(bm):
        """A stone plinth per face, broken on the front for the door (a boolean through the ring
        prism emptied it)."""
        for k in range(8):
            Fk = F(k)
            spans = [(-HS - 0.05, -DOOR_W / 2 - 0.02), (DOOR_W / 2 + 0.02, HS + 0.05)] if k == 0 else [(-HS - 0.05, HS + 0.05)]
            for a, b in spans:
                bm_box(bm, (b - a, 0.24, 0.6), ((a + b) / 2, -0.02, 0.3), Fk)
    solid('oct_plinth', 'walk', plinth, bevel=0.03)

    def course(bm):
        bm_prism(bm, 8, R + 0.08, R + 0.08, FLOOR - 0.34, FLOOR - 0.16)
        bm_prism(bm, 8, R + 0.2, R + 0.2, FLOOR - 0.16, FLOOR + 0.12)
        bm_prism(bm, 8, R + 0.1, R + 0.1, FLOOR + 0.12, FLOOR + 0.26)
    solid('oct_course', 'bone', course, bevel=0.03)

    def drops(bm):
        """Short pale drops under the floor course: at both ends of every face and under the
        outer upper windows."""
        for k in range(8):
            Fk = F(k)
            for x in (-HS + 0.28, -WX, WX, HS - 0.28):
                bm_box(bm, (0.3, 0.12, 0.5), (x, -0.02, FLOOR - 0.55), Fk)
                bm_box(bm, (0.5, 0.12, 0.14), (x, -0.02, FLOOR - 0.38), Fk)
    solid('oct_drops', 'bone', drops, bevel=0.0, smooth=False)

    def frieze(bm):
        """Flat-arch voussoirs over the rect windows and a keystone over each arched one."""
        for k in range(8):
            Fk = F(k)
            for x, kind in upper_windows(k):
                if kind == 'rect':
                    top = SILL + RECT_H
                    for i, dx in enumerate((-0.5, -0.25, 0.0, 0.25, 0.5)):
                        w = 0.2 if i == 2 else 0.16
                        bm_bar(bm, (x + dx, -0.03, top - 0.02), (x + dx * 1.45, -0.03, top + 0.5), w, xform=Fk, t2=0.12)
                else:
                    top = SILL + ARCH_STRAIGHT + WIN_W / 2
                    bm_box(bm, (0.3, 0.14, 0.52), (x, -0.03, top + 0.1), Fk)
    solid('oct_frieze', 'bone', frieze, bevel=0.0, smooth=False)

    def sills(bm):
        for k in range(8):
            Fk = F(k)
            for x, _ in upper_windows(k):
                bm_box(bm, (WIN_W + 0.3, 0.26, 0.14), (x, -0.06, SILL - 0.02), Fk)
            for x, kind in ground_openings(k):
                if kind == 'win':
                    bm_box(bm, (GWIN_W + 0.3, 0.26, 0.14), (x, -0.06, GWIN_Z - 0.07), Fk)
                elif kind == 'blind':
                    bm_box(bm, (BLIND_W + 0.3, 0.24, 0.16), (x, -0.06, BLIND_Z - 0.08), Fk)
    solid('oct_sills', 'bone', sills, bevel=0.0, smooth=False)

    # cornice: a frieze band, the dentil row, the corona in two steps
    solid('oct_cornice_a', 'bone', lambda bm: bm_prism(bm, 8, R + 0.1, R + 0.1, EAVE - 0.86, EAVE - 0.66), bevel=0.03)
    solid('oct_cornice_b', 'bone', lambda bm: bm_prism(bm, 8, R + 0.26, R + 0.26, EAVE - 0.4, EAVE - 0.18), bevel=0.03)
    solid('oct_cornice_c', 'bone', lambda bm: bm_prism(bm, 8, R + 0.44, R + 0.44, EAVE - 0.18, EAVE), bevel=0.03)

    def dentils(bm):
        for k in range(8):
            Fk = F(k)
            for i in range(13):
                bm_box(bm, (0.17, 0.22, 0.24), (-2.4 + i * 0.4, -0.05, EAVE - 0.53), Fk)
    solid('oct_dentils', 'bone', dentils, bevel=0.0, smooth=False)

    def consoles(bm):
        """The paired consoles under the cornice at every corner."""
        for k in range(8):
            Fk = F(k)
            for s in (-1, 1):
                bm_box(bm, (0.34, 0.42, 0.58), (s * (HS - 0.3), -0.12, EAVE - 0.63), Fk)
                bm_box(bm, (0.34, 0.24, 0.3), (s * (HS - 0.3), -0.04, EAVE - 1.06), Fk)
    solid('oct_consoles', 'bone', consoles, bevel=0.0, smooth=False)

    def pipes(bm):
        """Downpipes at the corners, from the cornice to the plinth."""
        for i in range(8):
            a = math.pi / 8 + i * math.pi / 4
            x, y = (R + 0.14) * math.cos(a), (R + 0.14) * math.sin(a)
            if y > 5.5:
                continue                                   # the corners inside the long arm
            bm_bar(bm, (x, y, 0.45), (x, y, EAVE - 0.9), 0.11)
    solid('oct_pipes', 'ink', pipes, bevel=0.0)


def parapet_and_dormers():
    """The low brick parapet with stone coping and corner pedestals, and the gabled dormers."""
    PZ0, PZ1 = EAVE, EAVE + 0.75
    solid('parapet', 'brick', lambda bm: bm_prism(bm, 8, R + 0.12, R + 0.12, PZ0, PZ1), bevel=0.03)
    solid('parapet_coping', 'bone', lambda bm: bm_prism(bm, 8, R + 0.24, R + 0.24, PZ1, PZ1 + 0.14), bevel=0.03)

    def pedestals(bm):
        for i in range(8):
            a = math.pi / 8 + i * math.pi / 4
            M = Matrix.Translation((R * math.cos(a), R * math.sin(a), 0)) @ Matrix.Rotation(a, 4, 'Z')
            bm_box(bm, (0.62, 0.62, 0.95), (0.05, 0, PZ0 + 0.47), M)
            bm_box(bm, (0.78, 0.78, 0.16), (0.05, 0, PZ0 + 1.0), M)
    solid('parapet_pedestals', 'bone', pedestals, bevel=0.03)

    def dims(k):
        return (2.7, 11.0, 11.85) if k == 0 else (2.3, 10.85, 11.6)     # width, shoulder, apex

    WZ = PZ1 + 0.18                               # dormer window bottom, on the coping
    sur, rec = bmesh.new(), bmesh.new()
    for k in DORMER_FACES:
        w, sh, ap = dims(k)
        aw = w - 1.0
        bm_solid(sur, arch_pts(aw + 0.24, 0.62, 8), -0.6, 0.1, F(k) @ Matrix.Translation((0, 0, WZ)))
        bm_solid(rec, arch_pts(aw, 0.62, 8), -0.6, 0.3, F(k) @ Matrix.Translation((0, 0, WZ + 0.06)))
    c_sur = S.new_cutter('dormer_surround', sur, 'bone')
    c_rec = S.new_cutter('dormer_recess', rec, 'ink')

    def body(bm):
        for k in DORMER_FACES:
            w, sh, ap = dims(k)
            prof = [(-w / 2, PZ0 - 0.1), (w / 2, PZ0 - 0.1), (w / 2, sh), (0, ap), (-w / 2, sh)]
            bm_solid(bm, prof, -0.05, 3.2, F(k))
    solid('dormers', 'brick', body, cutters=(c_sur, c_rec))

    def roofs(bm):
        for k in DORMER_FACES:
            w, sh, ap = dims(k)
            prof = [(-w / 2 - 0.12, sh - 0.12), (w / 2 + 0.12, sh - 0.12), (0, ap + 0.04)]
            bm_solid(bm, prof, 0.25, 3.6, F(k))
    solid('dormer_roofs', 'ink', roofs, bevel=0.04)

    def coping(bm):
        for k in DORMER_FACES:
            w, sh, ap = dims(k)
            Fk = F(k)
            for s in (-1, 1):
                bm_box(bm, (0.5, 0.36, 0.16), (s * (w / 2 - 0.05), -0.08, sh), Fk)                 # shoulder
                bm_bar(bm, (s * (w / 2 + 0.1), -0.08, sh + 0.06), (0, -0.08, ap + 0.12), 0.2, xform=Fk, t2=0.34)
                bm_box(bm, (0.26, 0.14, sh - PZ1 - 0.3), (s * (w / 2 - 0.13), -0.03, (sh + PZ1) / 2 + 0.05), Fk)   # jamb
            bm_box(bm, (0.36, 0.3, 0.36), (0, -0.08, ap + 0.08), Fk)                                # apex block
            top = WZ + 0.62 + (w - 1.0 + 0.24) / 2
            bm_box(bm, (0.26, 0.16, 0.42), (0, -0.04, top + 0.05), Fk)                              # keystone
    solid('dormer_coping', 'bone', coping, bevel=0.0, smooth=False)

    def bars(bm):
        for k in DORMER_FACES:
            w, sh, ap = dims(k)
            aw = w - 1.0
            z0 = WZ + 0.06
            Fk = F(k)
            for dx in (-aw / 4, 0.0, aw / 4):
                h = 0.62 + (aw / 2) * (0.95 if dx == 0 else 0.8)
                bm_box(bm, (0.06, 0.07, h), (dx, 0.24, z0 + h / 2), Fk)
            bm_box(bm, (aw, 0.07, 0.06), (0, 0.24, z0 + 0.62), Fk)
    solid('dormer_bars', 'bone', bars, bevel=0.0, smooth=False)


def glazing():
    """Glazing bars: a 4 x 6 grid in the rect windows, a mullion and transoms plus a radiating head
    in the arched ones, bars in the ground-floor windows, the door's fanlight and panels."""
    def build(bm):
        Y = 0.27
        for k in range(8):
            Fk = F(k)
            for x, kind in upper_windows(k):
                z0 = SILL + 0.1
                if kind == 'rect':
                    h = RECT_H - 0.16
                    for dx in (-0.2, 0.0, 0.2):
                        bm_box(bm, (0.045, 0.06, h), (x + dx, Y, z0 + h / 2), Fk)
                    for i in range(1, 6):
                        bm_box(bm, (GLASS_W, 0.06, 0.045), (x, Y, z0 + h * i / 6), Fk)
                else:
                    h = ARCH_STRAIGHT + GLASS_W / 2
                    bm_box(bm, (0.06, 0.06, h), (x, Y, z0 + h / 2), Fk)
                    for i in range(1, 5):
                        bm_box(bm, (GLASS_W, 0.06, 0.045), (x, Y, z0 + ARCH_STRAIGHT * i / 4), Fk)
                    rr = GLASS_W / 2
                    for a in (math.pi / 4, 3 * math.pi / 4):
                        bm_bar(bm, (x, Y, z0 + ARCH_STRAIGHT), (x + rr * math.cos(a), Y, z0 + ARCH_STRAIGHT + rr * math.sin(a)), 0.045, xform=Fk)
            for x, kind in ground_openings(k):
                if kind == 'win':
                    h = GWIN_S + GWIN_RISE
                    bm_box(bm, (0.06, 0.06, h), (x, Y + 0.02, GWIN_Z + h / 2), Fk)
                    for f in (0.33, 0.66, 1.0):
                        bm_box(bm, (GWIN_W, 0.06, 0.05), (x, Y + 0.02, GWIN_Z + GWIN_S * f), Fk)
                elif kind == 'door':
                    zt = -0.2 + DOOR_S
                    bm_box(bm, (DOOR_W, 0.1, 0.1), (x, 0.4, zt), Fk)                       # transom
                    bm_box(bm, (0.08, 0.1, zt), (x, 0.38, zt / 2), Fk)                     # the meeting stiles
                    for dx in (-0.5, 0.0, 0.5):
                        bm_box(bm, (0.05, 0.08, DOOR_RISE * 0.9), (x + dx, 0.4, zt + DOOR_RISE * 0.45), Fk)
                    for s in (-1, 1):                                                       # door panels
                        for zz in (0.9, 2.0):
                            bm_box(bm, (0.72, 0.08, 0.06), (x + s * 0.52, 0.38, zz), Fk)
    solid('glazing', 'bone', build, bevel=0.0, smooth=False)


def front_entrance():
    """The board and the standing-seam canopy over the door (facing 成都路), and the lean-to
    canopies on struts over the ground windows of the two front diagonals."""
    def board(bm):
        Fk = F(0)
        bm_box(bm, (3.0, 0.16, 1.0), (0, -0.28, FLOOR + 0.1), Fk)
        bm_box(bm, (1.0, 0.16, 0.18), (0, -0.28, FLOOR + 0.66), Fk)       # the raised crest
    solid('sign_board', 'bone', board, bevel=0.03)

    def board_frame(bm):
        Fk = F(0)
        bm_box(bm, (3.2, 0.12, 1.2), (0, -0.16, FLOOR + 0.1), Fk)
        bm_box(bm, (1.2, 0.12, 0.28), (0, -0.16, FLOOR + 0.68), Fk)
    solid('sign_frame', 'ink', board_frame, bevel=0.03)

    def sheets(bm):
        for k, x, (w, depth, zw, drop) in canopy_specs():
            verts = bm_solid(bm, rect_pts(w, 0.08, zw), -depth, 0.02)
            for v in verts:
                v.co.x += x
                if v.co.y < 0:
                    v.co.z -= drop * (-v.co.y / depth)
            bmesh.ops.transform(bm, matrix=F(k), verts=verts)
    solid('canopy_sheets', 'ink', sheets, bevel=0.0, smooth=False)

    def seams(bm):
        for k, x, (w, depth, zw, drop) in canopy_specs():
            Fk = F(k)
            n = int(w / 0.32)
            for i in range(n + 1):
                xx = x - w / 2 + 0.05 + i * (w - 0.1) / n
                bm_bar(bm, (xx, 0.0, zw + 0.11), (xx, -depth, zw + 0.11 - drop), 0.05, xform=Fk)
            bm_box(bm, (w + 0.04, 0.06, 0.2), (x, -depth - 0.02, zw - drop - 0.02), Fk)      # fascia
    solid('canopy_seams', 'haze', seams, bevel=0.0, smooth=False)

    def struts(bm):
        for k, x, (w, depth, zw, drop) in canopy_specs():
            Fk = F(k)
            for s in (-1, 1):
                xx = x + s * (w / 2 - 0.25)
                bm_bar(bm, (xx, 0.0, zw - 1.05), (xx, -depth + 0.15, zw - drop - 0.02), 0.09, xform=Fk)
                bm_box(bm, (0.14, 0.12, 1.2), (xx, -0.04, zw - 0.55), Fk)                        # wall plate
    solid('canopy_struts', 'ink', struts, bevel=0.0, smooth=False)

    solid('entrance_step', 'walk', lambda bm: bm_box(bm, (DOOR_W + 0.8, 0.7, 0.12), (0, -0.35, 0.06), F(0)), bevel=0.03)


# ─────────────────────────────────────────────────────────────────────────────
# the roof (steep, standing-seam metal) and the small lantern on the apex
# ─────────────────────────────────────────────────────────────────────────────
ROOF_R = R - 0.1
ROOF_Z0 = EAVE + 0.55
ROOF_TOP_R = 0.75
ROOF_Z1 = EAVE + 4.7


def roof():
    solid('roof', 'ink', lambda bm: bm_prism(bm, 8, ROOF_R, ROOF_TOP_R, ROOF_Z0, ROOF_Z1))

    def seams(bm):
        """Standing seams down every roof face, the metal roof of redhouse-04."""
        c8, s8 = math.cos(math.pi / 8), math.sin(math.pi / 8)
        for i in range(8):
            a = math.pi / 4 + i * math.pi / 4          # face normal directions of the prism
            c, s = math.cos(a), math.sin(a)
            tx, ty = -s, c
            for j in range(-3, 4):
                f = j / 3.6
                b0 = Vector(((ROOF_R * c8 + 0.04) * c + f * ROOF_R * s8 * tx, (ROOF_R * c8 + 0.04) * s + f * ROOF_R * s8 * ty, ROOF_Z0 + 0.03))
                b1 = Vector(((ROOF_TOP_R * c8 + 0.04) * c + f * ROOF_TOP_R * s8 * tx, (ROOF_TOP_R * c8 + 0.04) * s + f * ROOF_TOP_R * s8 * ty, ROOF_Z1 + 0.02))
                bm_bar(bm, b0, b1, 0.06)
    solid('roof_seams', 'haze', seams, bevel=0.0)

    def hips(bm):
        for i in range(8):
            a = math.pi / 8 + i * math.pi / 4
            p0 = (ROOF_TOP_R * math.cos(a), ROOF_TOP_R * math.sin(a), ROOF_Z1 + 0.04)
            p1 = ((ROOF_R + 0.08) * math.cos(a), (ROOF_R + 0.08) * math.sin(a), ROOF_Z0 + 0.02)
            bm_bar(bm, p0, p1, 0.16)
        bm_prism(bm, 8, ROOF_TOP_R + 0.1, ROOF_TOP_R + 0.1, ROOF_Z1 - 0.06, ROOF_Z1 + 0.1)
    solid('roof_hips', 'haze', hips, bevel=0.03)


def lantern():
    """The small octagonal lantern/vent on the apex: louvred faces, cap and finial."""
    z0 = ROOF_Z1 + 0.1
    LR = 0.6
    louvres = bmesh.new()
    for k in range(8):
        Fl = face_frame(k * math.pi / 4, LR * math.cos(math.pi / 8), (0, 0, z0))
        bm_solid(louvres, rect_pts(0.26, 0.55, 0.2), -0.4, 0.08, Fl)
    cut = S.new_cutter('lantern_louvres', louvres, 'ink')
    solid('lantern', 'bone', lambda bm: bm_prism(bm, 8, LR, LR, z0, z0 + 0.95), bevel=0.03, cutters=(cut,))

    def louvre_bars(bm):
        for k in range(8):
            Fl = face_frame(k * math.pi / 4, LR * math.cos(math.pi / 8), (0, 0, z0))
            for z in (0.33, 0.47, 0.61):
                bm_box(bm, (0.26, 0.06, 0.04), (0, 0.04, z), Fl)
    solid('lantern_bars', 'bone', louvre_bars, bevel=0.0, smooth=False)
    solid('lantern_cornice', 'bone', lambda bm: bm_prism(bm, 8, LR + 0.12, LR + 0.12, z0 + 0.95, z0 + 1.07), bevel=0.03)
    solid('lantern_cap', 'ink', lambda bm: bm_prism(bm, 8, LR + 0.16, 0.06, z0 + 1.07, z0 + 1.75), bevel=0.03)

    def finial(bm):
        bm_prism(bm, 8, 0.045, 0.045, z0 + 1.7, z0 + 2.9, rot=0)
        S.bm_sphere(bm, 0.15, (0, 0, z0 + 1.95), 10, 6)
    solid('finial', 'bone', finial, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# the cross wing (十字樓): two gabled arms crossing behind the octagon
# ─────────────────────────────────────────────────────────────────────────────
AW_W, AW_STRAIGHT, AW_Z = 1.1, 1.45, 1.0     # arm window surround (arched), sill at 1.0
AG_W, AG_STRAIGHT = 0.82, 1.35               # the glass inside it
RISE, OVER = 2.6, 0.35                       # gable rise and overhang


def arm(name, center, along_x):
    """One arm: a brick box with arched windows between pilasters on its long sides, a pale plinth
    and cornice, a gable roof with a clerestory monitor along the ridge, stone-coped gable ends
    with kneelers, an oculus and an arched door."""
    cx, cy = center
    L, W = ARM_L, ARM_W
    size = (L, W, ARM_H) if along_x else (W, L, ARM_H)

    def window_positions():
        out = []
        n = int(L // 2.5)
        for i in range(n):
            u = -L / 2 + 1.25 + i * 2.5 + (L - n * 2.5) / 2
            if along_x and abs(u) < W / 2 + 0.9:
                continue
            if not along_x:
                yw = cy + u
                if abs(yw - CROSS_ARM_Y) < W / 2 + 0.9:
                    continue
                if yw < APO + 0.9:
                    continue
            out.append(u)
        return out
    us = window_positions()
    thetas = (0, math.pi) if along_x else (math.pi / 2, 3 * math.pi / 2)
    faces = [(th, [u if th in (0, math.pi / 2) else -u for u in us]) for th in thetas]
    surround, recess = bmesh.new(), bmesh.new()
    for th, xs in faces:
        Fa = face_frame(th, W / 2, (cx, cy, 0))
        for x in xs:
            bm_solid(surround, arch_pts(AW_W, AW_STRAIGHT), -0.6, 0.1, Fa @ Matrix.Translation((x, 0, AW_Z)))
            bm_solid(recess, arch_pts(AG_W, AG_STRAIGHT), -0.6, 0.3, Fa @ Matrix.Translation((x, 0, AW_Z + 0.12)))
    end_thetas = (math.pi / 2, 3 * math.pi / 2) if along_x else (0, math.pi)
    ends = []
    for th in end_thetas:
        if not along_x and th == 0:
            continue
        ends.append(th)
        Fa = face_frame(th, L / 2, (cx, cy, 0))
        bm_solid(surround, arch_pts(1.9, 2.2), -0.6, 0.1, Fa @ Matrix.Translation((0, 0, 0.3)))
        bm_solid(recess, arch_pts(1.5, 2.05), -0.6, 0.45, Fa @ Matrix.Translation((0, 0, 0.3)))
    c1 = S.new_cutter(name + '_surround', surround, 'bone')
    c2 = S.new_cutter(name + '_recess', recess, 'ink')
    solid(name + '_walls', 'brick', lambda bm: bm_box(bm, size, (cx, cy, ARM_H / 2)), cutters=(c1, c2))

    def detail(bm):
        for th, xs in faces:
            Fa = face_frame(th, W / 2, (cx, cy, 0))
            for x in xs:
                bm_box(bm, (AW_W + 0.3, 0.22, 0.14), (x, 0.02, AW_Z - 0.07), Fa)
                bm_box(bm, (0.07, 0.08, AG_STRAIGHT + AG_W / 2), (x, 0.22, AW_Z + 0.12 + (AG_STRAIGHT + AG_W / 2) / 2), Fa)
                bm_box(bm, (AG_W, 0.08, 0.07), (x, 0.22, AW_Z + 0.12 + AG_STRAIGHT), Fa)
                bm_box(bm, (0.3, 0.16, 0.36), (x, 0.0, AW_Z + AW_STRAIGHT + AW_W / 2 + 0.04), Fa)   # keystone
    solid(name + '_sills', 'bone', detail, bevel=0.0, smooth=False)

    def pilasters(bm):
        for th, xs in faces:
            Fa = face_frame(th, W / 2, (cx, cy, 0))
            for i in range(len(xs) - 1):
                if abs(xs[i + 1] - xs[i]) < 3:
                    bm_box(bm, (0.42, 0.2, ARM_H - 0.9), ((xs[i] + xs[i + 1]) / 2, 0.0, 0.5 + (ARM_H - 0.9) / 2), Fa)
    solid(name + '_pilasters', 'brick', pilasters, bevel=0.03)

    def bands(bm):
        """Pale blocks on the pilasters at the springing line and the base, as on the octagon."""
        for th, xs in faces:
            Fa = face_frame(th, W / 2, (cx, cy, 0))
            for i in range(len(xs) - 1):
                if abs(xs[i + 1] - xs[i]) < 3:
                    bm_box(bm, (0.5, 0.26, 0.16), ((xs[i] + xs[i + 1]) / 2, -0.02, AW_Z + AW_STRAIGHT), Fa)
                    bm_box(bm, (0.5, 0.26, 0.14), ((xs[i] + xs[i + 1]) / 2, -0.02, 0.62), Fa)
    solid(name + '_pilaster_bands', 'bone', bands, bevel=0.0, smooth=False)

    solid(name + '_plinth', 'walk', lambda bm: bm_box(bm, (size[0] + 0.24, size[1] + 0.24, 0.45), (cx, cy, 0.225)), bevel=0.03)
    solid(name + '_cornice', 'bone', lambda bm: bm_box(bm, (size[0] + 0.3, size[1] + 0.3, 0.32), (cx, cy, ARM_H - 0.36)), bevel=0.03)

    half = W / 2 + OVER
    prof = [(-half, ARM_H - 0.05), (half, ARM_H - 0.05), (0, ARM_H - 0.05 + RISE)]
    T = Matrix.Translation((cx, cy, 0)) @ (Matrix.Rotation(-math.pi / 2, 4, 'Z') if along_x else Matrix.Identity(4))
    solid(name + '_roof', 'ink', lambda bm: bm_solid(bm, prof, -L / 2 - OVER, L / 2 + OVER, T), bevel=0.06)

    ridge_z = ARM_H - 0.05 + RISE
    axis = Vector((1, 0, 0)) if along_x else Vector((0, 1, 0))
    side = Vector((0, 1, 0)) if along_x else Vector((1, 0, 0))
    c = Vector((cx, cy, 0))

    solid(name + '_ridge', 'haze', lambda bm: bm_bar(bm, c + axis * (-L / 2 - OVER - 0.05) + Vector((0, 0, ridge_z + 0.02)),
                                                     c + axis * (L / 2 + OVER + 0.05) + Vector((0, 0, ridge_z + 0.02)), 0.18), bevel=0.03)

    def coping(bm):
        """Stone coping up both rakes of each gable end, kneeler blocks at the feet, an apex block."""
        for e in (-1, 1):
            end = c + axis * e * (L / 2 + 0.1)
            for s in (-1, 1):
                bm_bar(bm, end + side * s * (half + 0.05) + Vector((0, 0, ARM_H - 0.02)), end + Vector((0, 0, ridge_z + 0.12)), 0.28)
                bm_box(bm, (0.6, 0.6, 0.5), tuple(end + side * s * (W / 2 + 0.1) + Vector((0, 0, ARM_H - 0.2))))
            bm_box(bm, (0.45, 0.45, 0.45), tuple(end + Vector((0, 0, ridge_z + 0.15))))
    solid(name + '_coping', 'bone', coping, bevel=0.03)

    def oculus(bm):
        for th in ends:
            Fa = face_frame(th, L / 2, (cx, cy, 0))
            bm_solid(bm, circle_pts(0.62, 14), -0.12, 0.1, Fa @ Matrix.Translation((0, 0, ARM_H + 1.0)))
    solid(name + '_oculus_ring', 'bone', oculus, bevel=0.03)

    def oculus_glass(bm):
        for th in ends:
            Fa = face_frame(th, L / 2, (cx, cy, 0))
            bm_solid(bm, circle_pts(0.44, 14), -0.05, 0.12, Fa @ Matrix.Translation((0, 0, ARM_H + 1.0)))
    solid(name + '_oculus', 'ink', oculus_glass, bevel=0.0)

    # the clerestory monitor along the ridge: a glazed strip under its own small gable roof
    ML = L - 9.0
    MW, MZ0, MZ1 = 2.2, ridge_z - 0.8, ridge_z + 0.55
    mc = c + axis * (2.0 if not along_x else 0.0)          # the long arm's monitor sits clear of the octagon roof

    def monitor(bm):
        sz = (ML, MW, MZ1 - MZ0) if along_x else (MW, ML, MZ1 - MZ0)
        bm_box(bm, sz, tuple(mc + Vector((0, 0, (MZ0 + MZ1) / 2))))
    solid(name + '_monitor', 'ink', monitor, bevel=0.04)
    mprof = [(-MW / 2 - 0.3, MZ1 - 0.04), (MW / 2 + 0.3, MZ1 - 0.04), (0, MZ1 + 0.7)]
    TM = Matrix.Translation(tuple(mc)) @ (Matrix.Rotation(-math.pi / 2, 4, 'Z') if along_x else Matrix.Identity(4))
    solid(name + '_monitor_roof', 'ink', lambda bm: bm_solid(bm, mprof, -ML / 2 - 0.3, ML / 2 + 0.3, TM), bevel=0.04)

    def monitor_frames(bm):
        n = int(ML / 1.1)
        for s in (-1, 1):
            for i in range(n + 1):
                p = mc + axis * (-ML / 2 + i * ML / n) + side * s * (MW / 2 + 0.03)
                bm_bar(bm, p + Vector((0, 0, ridge_z - 0.55)), p + Vector((0, 0, MZ1 - 0.02)), 0.09)
            p0 = mc + side * s * (MW / 2 + 0.04)
            bm_bar(bm, p0 - axis * (ML / 2 + 0.05) + Vector((0, 0, MZ1 - 0.06)), p0 + axis * (ML / 2 + 0.05) + Vector((0, 0, MZ1 - 0.06)), 0.1)
        bm_bar(bm, mc - axis * (ML / 2 + 0.35) + Vector((0, 0, MZ1 + 0.72)), mc + axis * (ML / 2 + 0.35) + Vector((0, 0, MZ1 + 0.72)), 0.12)
    solid(name + '_monitor_frames', 'bone', monitor_frames, bevel=0.0)


def cross_wing():
    arm('long_arm', (0, LONG_ARM_Y), along_x=False)
    arm('cross_arm', (0, CROSS_ARM_Y), along_x=True)


def build():
    c_rec = octagon_walls()
    octagon_bands()
    octagon_trim()
    glazing()
    front_entrance()
    parapet_and_dormers()
    roof()
    lantern()
    cross_wing()


CAMERAS = {
    # the angle of redhouse-03: straight on to the front face from the plaza, eye height
    'front': ((0.0, -24.0, 1.7), (0.0, 0.0, 7.0), 46),
    # redhouse-04: raised, from the front-right, the cross wing showing behind on the right
    'three': ((17.0, -21.0, 7.5), (-1.0, 2.0, 5.2), 46),
    # the page's Red House keyframe (camera at world (-3, 3.5, -34), building at (16.6, -70))
    'scene': ((36.0, -19.6, 3.5), (-2.0, -7.6, 4.0), 50),
}

if __name__ == '__main__':
    S.run(build, camera=CAMERAS[os.environ.get('RH_CAM', 'front')])
