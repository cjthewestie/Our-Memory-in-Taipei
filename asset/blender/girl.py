# girl.py — 張君雅小妹妹, the girl who runs down the middle of the street, as a stylized glb
# with a two-frame run (issue #5 step 4).
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/girl.py -- --out asset/models/girl.glb
#
# Reference: the engine's primitive girl in app.js — bowl-cut black hair with a straight fringe,
# white shirt, dark pinafore skirt on two straps with a bib, red cheeks, a bowl of noodles carried
# in both hands in front of her, bare legs, dark shoes. Suggested by the 張君雅 character, not
# copied. Same size as the primitive: 2.73 tall to the top of the head (the scene scales by 1.15).
#
# Frame: metres, Blender Z up. She faces -Y (glTF +Z, the library convention). Origin on the
# ground between her feet.
#
# Two glb nodes, `runA` and `runB`, share every static part (head, hair, torso, skirt) and differ
# only in the legs, the arms and the bowl height: runA has the left leg forward, runB the right.
# The engine shows one or the other by stride phase. Both are built from the same helper so they
# line up exactly. Shared mechanics live in stylized.py in this folder.
#
# Smooth pass (CJ, 2026-10-31: "make character samler and smoother"; 2026-09-23: 「dont like low
# poly」): she is on screen the whole walk, so nothing on her may read as a facet. Every round part
# has enough segments that its silhouette is a curve at the walk-mode camera distance; the boxy
# parts (shirt, sleeves, straps, bib, shoes, bag straps) get a small bevel and then one level of
# Catmull-Clark subdivision, which turns a box into a soft rounded block; limbs and chopsticks are
# tapered capsules, not boxes; the bag, its flap and the buckle keep their flat faces with a two-segment
# hardened bevel. Smooth shading everywhere. Budget: under 8,000 triangles per frame, so both
# frames stay under the 16,000 the page's 120,000 cap leaves her. stylized.py's bevel rules are
# for buildings and are not changed; the girl's helpers below are local to this file.

import math
import os
import sys

from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_solid, bm_lathe, bm_sphere, quad, solid, cutter

SWING = math.radians(25)        # leg swing, forward and back
HIP_Z = 0.85
LEG_L = 0.8
SHOULDER = (0.3, 0.0, 2.1)      # x mirrored for the other arm
BOWL = (0.0, -0.5, 1.78)        # bowl centre; runA carries it a little higher, runB lower


# ─────────────────────────────────────────────────────────────────────────────
# smoothing helpers (local to the girl: stylized.py's bevel rules are for buildings)
# ─────────────────────────────────────────────────────────────────────────────
def soften(ob, bevel=0.0, segments=1, subsurf=0, harden=False, angle=30):
    """Append a bevel and/or a Catmull-Clark subdivision after whatever booleans the object has."""
    if bevel > 0:
        bv = ob.modifiers.new('soft_bevel', 'BEVEL')
        bv.width = bevel
        bv.segments = segments
        bv.limit_method = 'ANGLE'
        bv.angle_limit = math.radians(angle)
        bv.use_clamp_overlap = True
        bv.harden_normals = harden
    if subsurf:
        ss = ob.modifiers.new('soft_subsurf', 'SUBSURF')
        ss.levels = ss.render_levels = subsurf
    return ob


def soft(name, material, builder, group, bevel=0.0, segments=1, subsurf=0, harden=False, cutters=()):
    """S.solid with no stylized bevel, then soften(); every face smooth-shaded."""
    ob = solid(name, material, builder, bevel=0, cutters=cutters, group=group)
    return soften(ob, bevel, segments, subsurf, harden)


def capsule_profile(r0, r1, L, n=4):
    """(r, z) profile of a tapered capsule from z = 0 down to z = -L: a hemisphere of r0 on top,
    one of r1 at the bottom, a straight taper between. For bm_lathe."""
    pts = [(0.0, r0)]
    for i in range(1, n + 1):
        a = math.pi / 2 * i / n
        pts.append((r0 * math.sin(a), r0 * math.cos(a)))
    for i in range(0, n):
        a = math.pi / 2 * i / n
        pts.append((r1 * math.cos(a), -L - r1 * math.sin(a)))
    pts.append((0.0, -L - r1))
    return pts


def bm_capsule(bm, p0, p1, r0, r1, n=14, caps=4):
    """A tapered capsule whose cap centres sit at p0 (radius r0) and p1 (radius r1)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    M = Matrix.Translation(p0) @ (-d.normalized()).to_track_quat('Z', 'Y').to_matrix().to_4x4()
    return bm_lathe(bm, capsule_profile(r0, r1, d.length, caps), n=n, xform=M)


def bm_ribbon(bm, x, path, w, t):
    """A flat band of width w (along X) and thickness t swept along a (y, z) path at x."""
    loops = []
    for i, (y, z) in enumerate(path):
        a = Vector(path[max(i - 1, 0)])
        b = Vector(path[min(i + 1, len(path) - 1)])
        tg = (b - a).normalized()
        ny, nz = -tg.y * t / 2, tg.x * t / 2          # in-plane normal, half the thickness
        loops.append([bm.verts.new((x + sx * w / 2, y + sn * ny, z + sn * nz))
                      for sx, sn in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for l0, l1 in zip(loops, loops[1:]):
        for k in range(4):
            bm.faces.new((l0[k], l0[(k + 1) % 4], l1[(k + 1) % 4], l1[k]))
    bm.faces.new(loops[0][::-1])
    bm.faces.new(loops[-1])


def smooth_profile(prof, k=2):
    """Insert k points per span on a Catmull-Rom through the profile (its points kept), so a lathe
    of a few hand-placed points becomes a smooth curve."""
    P = [Vector(p) for p in prof]
    out = [tuple(P[0])]
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        for j in range(1, k + 1):
            t = j / (k + 1)
            v = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                       + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
            out.append((max(v.x, 1e-3), v.y))
        out.append(tuple(P[i + 1]))
    return out


# ─────────────────────────────────────────────────────────────────────────────
# static parts
# ─────────────────────────────────────────────────────────────────────────────
def head(g):
    solid('head', 'bone', lambda bm: bm_sphere(bm, 0.27, (0, 0, 2.46), 24, 13), bevel=0, group=g)
    # cheeks: two red dots on the front of the face
    def cheeks(bm):
        for x in (-0.17, 0.17):
            bm_sphere(bm, 0.06, (x, -0.22, 2.33), 10, 6)
    solid('cheeks', 'verm', cheeks, bevel=0, group=g)


def rrect(w, h, r, cz, n=6):
    """A rounded rectangle in the X-Z plane, centred at (0, cz): four quarter-circle corners."""
    hw, hh = w / 2 - r, h / 2 - r
    pts = []
    for cx, cy, a0 in ((hw, -hh, -90), (hw, hh, 0), (-hw, hh, 90), (-hw, -hh, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cz + cy + r * math.sin(a)))
    return pts


def hair(g):
    """The bowl cut as ONE solid of revolution with the face cut out of it, not a cap plus a back
    block plus two side flaps plus a fringe bar. HANDOFF: "the girl's bowl cut is a cap, a back
    block, side flaps and a fringe (seams up close)" — four parts meeting at four hard seams, and
    the fringe bar read like a visor. The lathe runs from the crown down past the ears to a rolled
    hem; the boolean takes out a rounded face window whose straight top edge is the fringe line."""
    # max radius 0.298 against the head's 0.27: a thicker shell leaves a black rim all round the
    # face and the whole head reads as a helmet whatever the window does
    prof = [(0.00, 2.775), (0.095, 2.770), (0.172, 2.745), (0.234, 2.690), (0.276, 2.606),
            (0.294, 2.500), (0.298, 2.410), (0.292, 2.345), (0.272, 2.308), (0.235, 2.296),
            (0.00, 2.296)]

    def face_window(bm):
        # the window widens toward the chin: a straight-sided one leaves flaps 0.22 deep at the
        # cheeks and the whole thing reads as a crash helmet
        pts = [(-0.285, 2.02), (0.285, 2.02), (0.252, 2.40)]
        pts += quad((0.252, 2.40), (0.252, 2.464), (0.182, 2.464), 6)
        pts.append((-0.182, 2.464))
        pts += quad((-0.182, 2.464), (-0.252, 2.464), (-0.252, 2.40), 6)
        bm_solid(bm, pts, -0.45, -0.04)

    def ear_notches(bm):
        # lift the hair above the ears on both sides while the back stays long down to the nape.
        # A lathe alone is the same height all round, which is what read as a crash helmet. Its
        # own cutter object, not merged into the face window: two overlapping solids in one cutter
        # mesh make it self-intersecting and the EXACT solver then removes the whole hair.
        for sx in (-1, 1):
            bm_box(bm, (0.30, 0.34, 0.3), (sx * 0.31, -0.02, 2.17))
    c1 = cutter('face_window', 'ink', face_window)
    c2 = cutter('ear_notches', 'ink', ear_notches)
    # the profile resampled on a curve and revolved in 28 steps; the window rim rounded in 2
    soft('hair', 'ink', lambda bm: bm_lathe(bm, smooth_profile(prof, 1), n=28), g, bevel=0.025, segments=2,
         cutters=(c1, c2))


def torso(g):
    """White shirt: a rounded box, the pinafore straps over its shoulders and the bib in front."""
    soft('shirt', 'bone', lambda bm: bm_box(bm, (0.52, 0.32, 0.6), (0, 0, 1.92)), g, bevel=0.07, segments=2, subsurf=1)
    # short sleeves: a little wider than the shirt at the shoulders
    def sleeves(bm):
        for x in (-0.31, 0.31):
            bm_box(bm, (0.13, 0.27, 0.21), (x, 0, 2.1))
    soft('sleeves', 'bone', sleeves, g, bevel=0.035, subsurf=1)
    def straps(bm):
        for x in (-0.13, 0.13):
            bm_box(bm, (0.09, 0.35, 0.6), (x, 0, 1.92))
    soft('straps', 'ink', straps, g, bevel=0.02, subsurf=1)
    soft('bib', 'ink', lambda bm: bm_box(bm, (0.36, 0.36, 0.22), (0, 0, 1.73)), g, bevel=0.03, subsurf=1)


def skirt(g):
    """Dark pinafore skirt: a flared lathe from the hem up under the shirt."""
    prof = [(0.0, 0.8), (0.5, 0.8), (0.47, 0.86), (0.36, 1.2), (0.28, 1.5), (0.25, 1.7), (0.0, 1.7)]
    soft('skirt', 'ink', lambda bm: bm_lathe(bm, prof, n=28), g, bevel=0.03, segments=2)


# ─────────────────────────────────────────────────────────────────────────────
# the moving parts: legs, arms, the bowl
# ─────────────────────────────────────────────────────────────────────────────
def leg_matrix(x, forward):
    """Hip at (x, 0, HIP_Z); the leg runs down local -Z. A rotation about X by -SWING swings the
    foot toward -Y (forward), +SWING toward +Y (back)."""
    return Matrix.Translation((x, 0, HIP_Z)) @ Matrix.Rotation(-SWING if forward else SWING, 4, 'X')


def legs(g, left_forward):
    def skin(bm):
        for x, fwd in ((-0.15, left_forward), (0.15, not left_forward)):
            M = leg_matrix(x, fwd)
            # a tapered capsule, thigh 0.085 to ankle 0.065, its foot end inside the shoe
            bm_capsule(bm, M @ Vector((0, 0, 0)), M @ Vector((0, 0, -LEG_L + 0.07)), 0.085, 0.065, n=12)
    soft('legs', 'bone', skin, g)
    def shoes(bm):
        for x, fwd in ((-0.15, left_forward), (0.15, not left_forward)):
            M = leg_matrix(x, fwd)
            bm_box(bm, (0.2, 0.3, 0.12), (0, -0.05, -LEG_L + 0.025), M)      # the shoe, toe forward
    soft('shoes', 'ink', shoes, g, bevel=0.035, subsurf=1)


def arms_and_bowl(g, dz):
    bowl_c = Vector(BOWL) + Vector((0, 0, dz))
    def arms(bm):
        for s in (-1, 1):
            sh = Vector((s * SHOULDER[0], SHOULDER[1], SHOULDER[2]))
            hand = bowl_c + Vector((s * 0.27, 0.02, 0.1))
            bm_capsule(bm, sh, hand, 0.068, 0.055, n=12, caps=3)
            bm_sphere(bm, 0.08, hand, 12, 8)                                     # the hand on the rim
    soft('arms', 'bone', arms, g)
    T = Matrix.Translation(bowl_c)
    # a curved wall on a foot ring with a rolled rim, instead of a straight-sided cone
    prof = [(0.0, 0.015), (0.115, 0.015), (0.125, 0.0), (0.155, 0.0), (0.178, 0.035),
            (0.228, 0.105), (0.276, 0.185), (0.300, 0.245), (0.310, 0.276),
            (0.294, 0.296), (0.252, 0.290), (0.0, 0.290)]
    soft('bowl', 'bone', lambda bm: bm_lathe(bm, prof, n=24, xform=T), g)
    soft('noodles', 'lamp', lambda bm: bm_sphere(bm, 0.25, bowl_c + Vector((0, 0, 0.23)), 20, 8, scale_z=0.42), g)
    soft('egg', 'verm', lambda bm: bm_sphere(bm, 0.07, bowl_c + Vector((0.09, -0.06, 0.38)), 12, 8), g)
    def chopsticks(bm):
        for i, x in enumerate((-0.05, 0.03)):
            p0 = bowl_c + Vector((x, 0.02 + i * 0.03, 0.24))
            p1 = p0 + Vector((0.24 + i * 0.03, 0.06, 0.26))                   # leaning out to her left
            bm_capsule(bm, p0, p1, 0.013, 0.011, n=8, caps=2)
    soft('chopsticks', 'ink', chopsticks, g)


# ─────────────────────────────────────────────────────────────────────────────
def backpack(g):
    """書包, the school backpack (CJ, 2026-09-23: 「後面背個書包好了」): a soft red bag on her back
    with a flap over its top and a mustard buckle, and two straps curving over the shoulders down
    to the chest. Body and flap are extruded rounded rectangles rather than boxes, so the vertical
    corners are actually round instead of chamfered, and the straps follow a curve instead of
    turning a hard corner at the shoulder. The shirt's back face is at y +0.16."""
    soft('pack', 'verm', lambda bm: bm_solid(bm, rrect(0.44, 0.5, 0.13, 1.86), 0.17, 0.38), g,
         bevel=0.06, segments=2, harden=True)
    soft('pack_flap', 'verm', lambda bm: bm_solid(bm, rrect(0.47, 0.2, 0.08, 2.05), 0.15, 0.41), g,
         bevel=0.05, segments=2, harden=True)
    soft('pack_buckle', 'lamp', lambda bm: bm_box(bm, (0.11, 0.05, 0.09), (0, 0.40, 1.97)), g, bevel=0.015, segments=2, harden=True)

    def straps(bm):
        for x in (-0.15, 0.15):
            path = quad((0.22, 2.02), (0.20, 2.24), (0.0, 2.21), 3, include_start=True)      # over the shoulder
            path += quad((0.0, 2.21), (-0.20, 2.18), (-0.19, 2.00), 3)                       # down the chest
            path += [(-0.185, 1.70)]
            # one swept band, not a chain of bars, so there is no kink where two bars met
            bm_ribbon(bm, x, path, 0.075, 0.045)
    soft('pack_straps', 'verm', straps, g, subsurf=1)


def frame(g, left_forward, bowl_dz):
    head(g)
    hair(g)
    torso(g)
    backpack(g)
    skirt(g)
    legs(g, left_forward)
    arms_and_bowl(g, bowl_dz)


def build():
    frame('runA', left_forward=True, bowl_dz=0.03)
    frame('runB', left_forward=False, bowl_dz=-0.03)


if __name__ == '__main__':
    S.run(build, camera=((3.0, -4.0, 2.2), (0.0, 0.0, 1.4), 40))
