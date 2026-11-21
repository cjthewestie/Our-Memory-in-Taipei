# temple.py — 霞海城隍廟 (Xiahai City God Temple, Dadaocheng, 1859) as a stylized glb.
#
# Build headless:
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python asset/blender/temple.py -- --out asset/models/src/temple.glb [--preview x.png] [--stats]
#
# Rebuilt 2026-11-01 (blender-detail) from the Commons photos in research/reference/dadao/img/
# (temple-01 front elevation, temple-02 forecourt, temple-04 roof oblique). What the photos show,
# and this script now builds:
#   - a single hall squeezed between shophouses, about 8 m of frontage, one floor;
#   - the 三川 front: two brick corner piers on a ~1 m granite base, each with a framed carved
#     panel (blank) on top and a stone-framed 堵 relief below it; between them one wide opening
#     split by two round red columns on granite drum bases into three doors (三川門). The centre
#     door stands open onto the dark hall and a gilt altar; the two side doors are closed red
#     leaves with the door-god panels (blank — painted art stays out of the geometry);
#   - the dark carved wooden front: the gilt 雀替 frieze beam over the doors, a dark band of
#     painted cloud brackets above it, the hanging vertical name plaque (blank), and the eave
#     fascia with five round medallions (the 霞海城隍廟 characters, blank — canvas text);
#   - one terracotta roof: a concave front slope of barrel tiles with round 瓦當 ends and
#     triangular 滴水 drip tiles, the ridge only ~4 m behind the eave edge, and a long hidden back
#     slope;
#   - the high swallowtail 燕尾脊: an ink ridge with a blue 剪黏 panel full of little figures,
#     sagging deep in the middle and sweeping up into forked tips past the gables; the red sun
#     disc on a lotus at the centre, two green rearing dragons, and on the front corners the
#     垂脊 ends carrying small pavilion-and-phoenix 剪黏 groups;
#   - two red lanterns under the eave and the 朝天爐 incense burner on a stone pedestal.
# The kerb porch columns of the old model are gone: the real red columns stand in the doorway.
#
# Frame: metres, Blender Z up. scene-dadao.js places the glb at (-8.8, 0, -240) with
# rotation.y = +π/2, so Blender -Y (glTF +Z) → world +x (the road) and Blender +X → world -z.
# The facade plane is y = 0, the hall runs into +Y to y 9, the width (8 m) along X. Origin on
# the ground at the facade's centre. Walls 5 m, as the scene states. The front eave edge is at
# y -1.35 (it was -3.1): the scene's name board should move to world x -7.45 (note in
# .scratch/blender-detail/notes/temple.md). Top of the swallowtail tips z ≈ 10.6 (under the
# scene's G.top 12.5).
#
# Look: primitives, boolean-cut openings, a bevel on every edge, flat palette materials
# (stylized.py owns the mechanics). Budget 25,000 triangles.

import math
import os
import sys

import bmesh
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_solid, bm_cylinder, bm_prism, bm_lathe, bm_sphere, quad, cubic, solid, cutter

# ── dimensions (metres) ──────────────────────────────────────────────────────
HW = 4.0            # half width of the hall (x ±4)
DEPTH = 9.0         # hall depth (y 0..9)
WH = 5.0            # wall height
WALK = 0.22         # top of the sidewalk slab
PIER_IN = 2.95      # inner face of the brick corner piers (opening x ±2.95)
PLINTH = 1.1        # granite base height
COL_X = 0.95        # the two red columns in the doorway
COL_R = 0.18
OPEN_TOP = 3.55     # top of the door openings, foot of the gilt frieze
FRIEZE_TOP = 3.95
SOFFIT = 4.45       # underside of the eave / roof block
EAVE_Y, EAVE_Z = -1.35, 4.75      # the front eave edge (top of the drip line)
RIDGE_Y, RIDGE_Z = 3.0, 7.15      # roof apex line
BACK_Y, BACK_Z = 9.45, 5.4        # back eave
ROOF_X = 4.45       # gable ends, a little past the walls
WOOD_Y = 0.55       # face of the dark wooden front wall (the doors stand in it)


def slab(bm, p0, p1, w, h, side=(0, 1, 0)):
    """A box bar from p0 to p1, w across `side` (a world direction) and h across both: an explicit
    roll, so a bar along any direction (vertical included) never twists (the bm_bar roll trap)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = (p1 - p0)
    L = d.length
    d.normalize()
    a = Vector(side)
    a = (a - d * a.dot(d)).normalized()
    b = d.cross(a)
    m = Matrix((
        (a.x, b.x, d.x, p0.x),
        (a.y, b.y, d.y, p0.y),
        (a.z, b.z, d.z, p0.z),
        (0, 0, 0, 1)))
    bm_box(bm, (w, h, L), (0, 0, L / 2), m)


def _bm(fn):
    bm = bmesh.new()
    fn(bm)
    return bm


def tube(bm, path, r, n=6, axis=Vector((1, 0, 0))):
    """A closed tube of n sides along a 3D polyline. Rings sit square to the local tangent; `axis`
    is a direction never parallel to the path (X for paths in the Y-Z plane)."""
    rings = []
    P = [Vector(p) for p in path]
    for i, p in enumerate(P):
        d = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized()
        a = (axis - d * axis.dot(d)).normalized()
        b = d.cross(a)
        rings.append([bm.verts.new(p + r * (math.cos(k * 2 * math.pi / n) * a + math.sin(k * 2 * math.pi / n) * b)) for k in range(n)])
    for A, B in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((A[k], A[(k + 1) % n], B[(k + 1) % n], B[k]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])


# ── the roof surface: concave front and back slopes as (y, z) curves ─────────
def front_slope(n):
    return quad((EAVE_Y, EAVE_Z), (0.9, 5.15), (RIDGE_Y, RIDGE_Z), n, include_start=True)


def back_slope(n):
    return quad((RIDGE_Y, RIDGE_Z), (6.4, 5.75), (BACK_Y, BACK_Z), n, include_start=True)


# ─────────────────────────────────────────────────────────────────────────────
# the hall body and the front
# ─────────────────────────────────────────────────────────────────────────────
def hall():
    """Brick side and back walls on a granite base band. The front block is the dark wooden wall:
    the three door openings are cut through it into the hall."""
    doors = cutter('door_cut', 'ink', lambda bm: [
        bm_box(bm, (1.5, 3.4, OPEN_TOP), (0, 1.9, OPEN_TOP / 2)),
        bm_box(bm, (1.25, 0.5, 3.15), (-1.95, WOOD_Y + 0.12, 3.15 / 2)),
        bm_box(bm, (1.25, 0.5, 3.15), (1.95, WOOD_Y + 0.12, 3.15 / 2))])
    solid('hall_walls', 'brick', lambda bm: bm_box(bm, (2 * HW, DEPTH - 0.8, WH), (0, 0.8 + (DEPTH - 0.8) / 2, WH / 2)), cutters=(doors,))
    solid('front_wood', 'ink', lambda bm: bm_box(bm, (2 * PIER_IN + 0.1, 0.35, SOFFIT), (0, WOOD_Y + 0.175, SOFFIT / 2)), cutters=(doors,))
    # granite base band along the side and back walls
    solid('hall_base', 'walk', lambda bm: [
        bm_box(bm, (0.08, DEPTH - 0.8, PLINTH), (sx * (HW + 0.03), 0.8 + (DEPTH - 0.8) / 2, PLINTH / 2)) for sx in (-1, 1)]
        + [bm_box(bm, (2 * HW + 0.14, 0.08, PLINTH), (0, DEPTH + 0.03, PLINTH / 2))], bevel=0.03)

    def altar(bm):      # the gilt shrine glimpsed through the open centre door
        bm_box(bm, (1.3, 0.5, 1.0), (0, 3.3, 0.5))
        bm_box(bm, (0.9, 0.35, 1.0), (0, 3.4, 1.5))
        bm_box(bm, (1.5, 0.15, 0.25), (0, 3.25, 2.6))
    solid('altar', 'lamp', altar, bevel=0.03)
    solid('altar_cloth', 'verm', lambda bm: bm_box(bm, (1.36, 0.06, 0.7), (0, 3.03, 0.55)), bevel=0.0)


def piers():
    """The two brick corner piers: granite base with a moulded top course, brick shaft, a stone
    堵 panel with a carved roundel, and a tilted framed picture panel at the top (blank)."""
    PW = HW - PIER_IN               # 1.05
    xs = [sx * (PIER_IN + PW / 2) for sx in (-1, 1)]
    solid('pier_brick', 'brick', lambda bm: [bm_box(bm, (PW, 0.8, SOFFIT), (x, 0.4, SOFFIT / 2)) for x in xs])

    def base(bm):
        for x in xs:
            bm_box(bm, (PW + 0.08, 0.88, PLINTH), (x, 0.4, PLINTH / 2))
            bm_box(bm, (PW + 0.14, 0.94, 0.14), (x, 0.4, PLINTH + 0.07))      # the capping course
    solid('pier_base', 'walk', base)

    def joints(bm):                 # stone joints on the granite face: two courses, staggered heads
        for x in xs:
            for z in (0.37, 0.74):
                bm_box(bm, (PW + 0.02, 0.03, 0.035), (x, -0.045, z))
            for z, dx in ((0.18, -0.15), (0.55, 0.22), (0.92, -0.05)):
                bm_box(bm, (0.035, 0.03, 0.33), (x + dx, -0.045, z))
    solid('pier_joints', 'haze', joints, bevel=0.0)

    PZ, PH, PWW = 2.35, 1.5, 0.78   # the 堵 panel

    def panel(bm):
        for x in xs:
            for dz in (-PH / 2, PH / 2):
                bm_box(bm, (PWW, 0.12, 0.12), (x, -0.04, PZ + dz))
            for dx in (-PWW / 2 + 0.06, PWW / 2 - 0.06):
                bm_box(bm, (0.12, 0.12, PH), (x + dx, -0.04, PZ))
            bm_box(bm, (PWW - 0.12, 0.05, PH - 0.12), (x, -0.01, PZ))           # the field
    solid('pier_panel', 'walk', panel, bevel=0.025)

    def carving(bm):
        for x in xs:
            cz = PZ + 0.18
            for R, k, t in ((0.24, 12, 0.07), (0.12, 8, 0.06)):
                ring = [(x + R * math.cos(i * 2 * math.pi / k), cz + R * math.sin(i * 2 * math.pi / k)) for i in range(k)]
                for p, q in zip(ring, ring[1:] + ring[:1]):
                    bm_bar(bm, (p[0], -0.065, p[1]), (q[0], -0.065, q[1]), t)
            for dz in (-0.35, -0.52):
                bm_box(bm, (PWW - 0.34, 0.06, 0.06), (x, -0.06, PZ + dz))
    solid('pier_carving', 'haze', carving, bevel=0.0)

    def picture(bm):                # the glazed relief cases at the pier tops, tilted forward
        for x in xs:
            T = Matrix.Translation((x, -0.05, 3.95)) @ Matrix.Rotation(math.radians(-12), 4, 'X')
            bm_box(bm, (0.9, 0.14, 0.82), (0, 0, 0), T)
    solid('pier_picture_frame', 'verm', picture, bevel=0.03)

    def picture_field(bm):
        for x in xs:
            T = Matrix.Translation((x, -0.05, 3.95)) @ Matrix.Rotation(math.radians(-12), 4, 'X')
            bm_box(bm, (0.72, 0.04, 0.64), (0, -0.07, 0), T)
    solid('pier_picture', 'glass', picture_field, bevel=0.0)


def doors():
    """三川門: the open centre door with folded leaves, two closed side doors with door-god panels
    (blank), stone thresholds, and the two red couplet columns on granite drums."""
    def leaves(bm):
        for sx in (-1, 1):
            x = sx * 1.95
            for dx in (-0.31, 0.31):
                bm_box(bm, (0.6, 0.1, 3.05), (x + dx, WOOD_Y + 0.25, 1.6))
            # the centre door's leaves, folded back against the reveal
            bm_box(bm, (0.1, 0.72, 3.4), (sx * 0.68, WOOD_Y + 0.75, 1.75))
    solid('door_leaves', 'verm', leaves, bevel=0.025)

    def gods(bm):                   # the door gods, blank: an armoured silhouette on each leaf
        for sx in (-1, 1):
            for dx in (-0.31, 0.31):
                x, y = sx * 1.95 + dx, WOOD_Y + 0.18
                bm_solid(bm, [(x - 0.17, 1.0), (x + 0.17, 1.0), (x + 0.2, 2.15), (x + 0.12, 2.35), (x - 0.12, 2.35), (x - 0.2, 2.15)], y - 0.02, y + 0.02)
                bm_box(bm, (0.14, 0.04, 0.16), (x, y, 2.47))             # face
                bm_box(bm, (0.22, 0.04, 0.12), (x, y, 2.62))             # helmet
                bm_box(bm, (0.08, 0.04, 0.55), (x - 0.13, y, 0.75))      # legs
                bm_box(bm, (0.08, 0.04, 0.55), (x + 0.13, y, 0.75))
    solid('door_gods', 'ink', gods, bevel=0.0)

    def gods_frame(bm):
        for sx in (-1, 1):
            for dx in (-0.31, 0.31):
                x = sx * 1.95 + dx
                for dz in (-1.3, 1.0):
                    bm_box(bm, (0.5, 0.05, 0.06), (x, WOOD_Y + 0.165, 1.75 + dz))
                for ddx in (-0.25, 0.25):
                    bm_box(bm, (0.06, 0.05, 2.36), (x + ddx, WOOD_Y + 0.165, 1.6))
                bm_box(bm, (0.3, 0.05, 0.36), (x, WOOD_Y + 0.165, 1.55))       # gilt armour plate
            bm_box(bm, (0.12, 0.06, 0.12), (sx * 1.95 - 0.08, WOOD_Y + 0.17, 1.6))   # rings
            bm_box(bm, (0.12, 0.06, 0.12), (sx * 1.95 + 0.08, WOOD_Y + 0.17, 1.6))
    solid('door_gods_frame', 'lamp', gods_frame, bevel=0.0)

    def thresholds(bm):
        bm_box(bm, (1.6, 0.4, 0.22), (0, WOOD_Y + 0.05, 0.11))
        for sx in (-1, 1):
            bm_box(bm, (1.35, 0.4, 0.3), (sx * 1.95, WOOD_Y + 0.05, 0.15))
        bm_box(bm, (2 * PIER_IN, 0.9, 0.12), (0, 0.0, 0.06))        # the stone step
    solid('thresholds', 'walk', thresholds, bevel=0.03)

    def columns(bm):
        for sx in (-1, 1):
            bm_cylinder(bm, COL_R, 0.62, OPEN_TOP, 16, (sx * COL_X, 0.12))
    solid('columns', 'verm', columns, bevel=0.0)

    def couplets(bm):               # the dark couplet boards on the columns' fronts (text = blank)
        for sx in (-1, 1):
            bm_box(bm, (0.26, 0.05, 2.5), (sx * COL_X, 0.12 - COL_R - 0.01, 2.1))
    solid('couplets', 'ink', couplets, bevel=0.0)

    def bases(bm):
        for sx in (-1, 1):
            c = (sx * COL_X, 0.12)
            bm_prism(bm, 8, 0.3, 0.3, 0.12, 0.3, center=c)                          # square-ish plinth
            bm_lathe(bm, [(0.3, 0.3), (0.31, 0.36), (0.3, 0.48), (0.25, 0.58), (0.2, 0.62)], 12,
                     Matrix.Translation((c[0], c[1], 0)))                           # the drum
    solid('column_bases', 'walk', bases, bevel=0.0)


def frieze():
    """Over the doors: the gilt carved 雀替 beam, a dark band of painted cloud brackets, the
    vertical name plaque, and the eave fascia with five round medallions."""
    def gilt(bm):
        bm_box(bm, (2 * PIER_IN + 0.1, 0.28, FRIEZE_TOP - OPEN_TOP), (0, 0.32, (OPEN_TOP + FRIEZE_TOP) / 2))
        for sx in (-1, 1):          # the carved 雀替 brackets dropping into the side doors' corners
            for x in (sx * PIER_IN, sx * COL_X):
                d = -sx if abs(x) > 2 else sx
                bm_solid(bm, [(x, OPEN_TOP), (x + d * 0.5, OPEN_TOP), (x, OPEN_TOP - 0.42)], 0.22, 0.42)
    solid('frieze_gilt', 'lamp', gilt, bevel=0.0)

    def relief(bm):                 # carved figures standing off the gilt beam
        for i in range(13):
            x = -2.7 + i * 0.45
            if abs(x) < 0.3:
                continue
            bm_box(bm, (0.2, 0.06, 0.22), (x, 0.16, (OPEN_TOP + FRIEZE_TOP) / 2))
    solid('frieze_relief', 'verm', relief, bevel=0.0)

    def band(bm):                   # the dark band between the frieze and the soffit
        bm_box(bm, (2 * PIER_IN + 0.1, 0.3, SOFFIT - FRIEZE_TOP), (0, 0.32, (FRIEZE_TOP + SOFFIT) / 2))
    solid('frieze_band', 'ink', band, bevel=0.03)

    def clouds(bm):                 # painted cloud bracket blocks (the colourful 吊筒 row)
        for x in (-2.2, -1.1, 1.1, 2.2):
            T = Matrix.Translation((x, 0.15, (FRIEZE_TOP + SOFFIT) / 2)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
            bm_cylinder(bm, 0.17, -0.05, 0.05, 10, (0, 0), T)
            bm_cylinder(bm, 0.11, -0.05, 0.05, 8, (-0.22, 0.04), T)
            bm_cylinder(bm, 0.11, -0.05, 0.05, 8, (0.22, 0.04), T)
    solid('frieze_clouds', 'glass', clouds, bevel=0.0)

    def plaque(bm):                 # the vertical name plaque hanging at the centre
        bm_box(bm, (0.5, 0.12, 0.95), (0, 0.06, 3.85))
    solid('plaque', 'ink', plaque, bevel=0.03)
    solid('plaque_frame', 'lamp', lambda bm: [bm_box(bm, (0.6, 0.08, 0.08), (0, 0.04, z)) for z in (3.36, 4.34)]
          + [bm_box(bm, (0.08, 0.08, 1.06), (x, 0.04, 3.85)) for x in (-0.29, 0.29)], bevel=0.0)

    # the eave fascia across the full width, on the wing beams out to the eave edge
    solid('fascia', 'verm', lambda bm: bm_box(bm, (2 * HW + 0.5, 0.18, 0.42), (0, EAVE_Y + 0.12, SOFFIT - 0.05)), bevel=0.03)

    def wing_beams(bm):
        for sx in (-1, 1):
            bm_box(bm, (0.3, -EAVE_Y + 0.2, 0.32), (sx * (HW - 0.2), (EAVE_Y + 0.2) / 2, SOFFIT - 0.1))
    solid('wing_beams', 'verm', wing_beams, bevel=0.03)

    def medallions(bm):
        for i in range(5):
            x = -2.4 + i * 1.2
            T = Matrix.Translation((x, EAVE_Y + 0.02, SOFFIT - 0.05)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
            bm_cylinder(bm, 0.16, -0.02, 0.04, 14, (0, 0), T)
    solid('medallions', 'lamp', medallions, bevel=0.0)

    def scrolls(bm):                # painted scroll band between the medallions
        for i in range(4):
            x = -1.8 + i * 1.2
            bm_box(bm, (0.8, 0.04, 0.12), (x, EAVE_Y + 0.02, SOFFIT - 0.05))
    solid('fascia_scrolls', 'leaf', scrolls, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# the roof
# ─────────────────────────────────────────────────────────────────────────────
def roof():
    """The roof block (soffit flat at 4.45, the concave slopes on top), barrel-tile rows with 瓦當
    end discs and 滴水 drip tiles down the front, cheaper rows on the back, ink verges."""
    top = front_slope(8) + back_slope(8)[1:]
    prof = [(-EAVE_Y, SOFFIT)] + [(-y, z) for y, z in top] + [(-BACK_Y, SOFFIT)]
    T = Matrix.Rotation(-math.pi / 2, 4, 'Z')        # profile x (= -y) → world y
    # the block fills the gable between the walls (flush with them, so the gable reads as the
    # brick wall rising), and a 0.3 m tiled slab on top overhangs the gables as the verge
    solid('roof', 'brick', lambda bm: bm_solid(bm, prof, -HW, HW, T), bevel=0.05)
    slab_prof = [(-y, z) for y, z in top] + [(-y, z - 0.32) for y, z in reversed(top)]
    solid('roof_slab', 'brick', lambda bm: bm_solid(bm, slab_prof, -ROOF_X, ROOF_X, T), bevel=0.05)

    STEP = 0.33
    xs = [-ROOF_X + 0.2 + i * STEP for i in range(int((2 * ROOF_X - 0.4) / STEP) + 1)]

    def tiles(bm):
        fs = front_slope(6)
        bs = back_slope(4)
        for x in xs:
            tube(bm, [(x, y, z + 0.08) for y, z in fs[:-1]] + [(x, fs[-1][0] - 0.25, fs[-1][1] - 0.05)], 0.105, 6)
            tube(bm, [(x, y, z + 0.06) for y, z in bs[1:]], 0.075, 4)
    solid('roof_tiles', 'brick', tiles, bevel=0.0)

    def ends(bm):                   # 瓦當: round end discs on the front tile rows
        y0, z0 = front_slope(6)[0]
        for x in xs:
            T = Matrix.Translation((x, y0 - 0.02, z0 + 0.08)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
            bm_cylinder(bm, 0.13, -0.03, 0.03, 10, (0, 0), T)
    solid('tile_ends', 'brick', ends, bevel=0.0)

    def drips(bm):                  # 滴水: pointed drip tiles hanging between the rows
        y0, z0 = front_slope(6)[0]
        for x0, x1 in zip(xs, xs[1:]):
            x = (x0 + x1) / 2
            bm_solid(bm, [(x - 0.14, z0 + 0.02), (x + 0.14, z0 + 0.02), (x, z0 - 0.22)], y0 - 0.04, y0 + 0.06)
    solid('drip_tiles', 'brick', drips, bevel=0.0)

    def eave_rim(bm):               # the white mortar line under the tile ends
        y0, z0 = front_slope(6)[0]
        bm_bar(bm, (-ROOF_X, y0 + 0.05, z0 - 0.06), (ROOF_X, y0 + 0.05, z0 - 0.06), 0.1)
    solid('eave_rim', 'bone', eave_rim, bevel=0.0)


def gable_vents():
    """A round stone vent high in each brick gable, the one opening the side walls show."""
    def vent(bm):
        for sx in (-1, 1):
            T = Matrix.Translation((sx * HW, 4.2, 5.75)) @ Matrix.Rotation(math.pi / 2, 4, 'Y')
            bm_lathe(bm, [(0.3, -0.05), (0.42, -0.05), (0.42, 0.05), (0.3, 0.05)], 14, T)
    solid('gable_vent_ring', 'walk', vent, bevel=0.0)
    solid('gable_vent', 'ink', lambda bm: [bm_cylinder(bm, 0.31, -0.02, 0.02, 14, (0, 0),
                                                       Matrix.Translation((sx * HW, 4.2, 5.75)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
                                           for sx in (-1, 1)], bevel=0.0)

    def bars(bm):
        for sx in (-1, 1):
            for dy in (-0.15, 0.0, 0.15):
                bm_cylinder(bm, 0.035, 5.75 - 0.3, 5.75 + 0.3, 6, (sx * (HW + 0.03), 4.2 + dy))
    solid('gable_vent_bars', 'walk', bars, bevel=0.0)


def gable_ridges():
    """垂脊: the dark gable ridges down each verge, blue-faced, ending at the front corners under a
    pavilion-and-phoenix 剪黏 group on a green rock."""
    fs = front_slope(6)

    def ridges(bm):
        for sx in (-1, 1):
            x = sx * (ROOF_X - 0.05)
            path = [(x, y, z + 0.28) for y, z in reversed(fs)]
            tube(bm, path, 0.2, 4)
            bs = back_slope(4)
            tube(bm, [(x, y, z + 0.22) for y, z in bs], 0.15, 4)
    solid('gable_ridge', 'ink', ridges, bevel=0.0)

    def faces(bm):                  # the blue 剪黏 strip on each gable ridge's outer face
        for sx in (-1, 1):
            x = sx * (ROOF_X + 0.17)
            pts = list(reversed(fs))
            for (y0, z0), (y1, z1) in zip(pts, pts[1:]):
                slab(bm, (x, y0, z0 + 0.28), (x, y1, z1 + 0.28), 0.04, 0.22, (1, 0, 0))
    solid('gable_ridge_face', 'glass', faces, bevel=0.0)

    # pavilion groups standing on the corner ends of the gable ridges (x ±4.35, y about -0.6)
    y0, z0 = fs[1]
    BZ = z0 + 0.35
    PY = y0

    def rock(bm):                   # the green-blue rock / cloud platform
        for sx in (-1, 1):
            x = sx * (ROOF_X - 0.15)
            bm_box(bm, (0.95, 0.75, 0.3), (x, PY, BZ + 0.15))
            bm_box(bm, (0.7, 0.55, 0.2), (x, PY, BZ - 0.08))
    solid('pavilion_rock', 'leaf', rock, bevel=0.03)

    def pav(bm):
        for sx in (-1, 1):
            x = sx * (ROOF_X - 0.15)
            bm_box(bm, (0.42, 0.36, 0.42), (x, PY + 0.05, BZ + 0.51))
            bm_box(bm, (0.3, 0.26, 0.28), (x, PY + 0.05, BZ + 0.98))
    solid('pavilion_body', 'verm', pav, bevel=0.025)

    def pav_roof(bm):
        for sx in (-1, 1):
            x = sx * (ROOF_X - 0.15)
            bm_prism(bm, 4, 0.42, 0.1, BZ + 0.72, BZ + 0.86, rot=math.pi / 4, center=(x, PY + 0.05))
            bm_prism(bm, 4, 0.32, 0.04, BZ + 1.12, BZ + 1.3, rot=math.pi / 4, center=(x, PY + 0.05))
    solid('pavilion_roof', 'ink', pav_roof, bevel=0.0)

    def figures(bm):                # little warriors on the rock in front of the pavilion
        for sx in (-1, 1):
            x = sx * (ROOF_X - 0.15)
            for dx in (-0.3, 0.0, 0.3):
                bm_box(bm, (0.12, 0.1, 0.24), (x + dx, PY - 0.28, BZ + 0.42))
                bm_sphere(bm, 0.06, (x + dx, PY - 0.28, BZ + 0.6), 6, 4)
    solid('pavilion_figures', 'bone', figures, bevel=0.0)

    def phoenix(bm):                # a phoenix on top: body and a fan of tail feathers
        for sx in (-1, 1):
            x = sx * (ROOF_X - 0.15)
            c = (x, PY + 0.05, BZ + 1.5)
            bm_sphere(bm, 0.14, c, 8, 6, scale_z=1.2)
            bm_bar(bm, c, (x - sx * 0.12, c[1] - 0.18, c[2] + 0.3), 0.07)                      # neck
            for a in (0.35, 0.65, 0.95, 1.25):
                slab(bm, c, (x + sx * 0.75 * math.cos(a), c[1] + 0.15, c[2] + 0.85 * math.sin(a)), 0.04, 0.1)
    solid('phoenix', 'glass', phoenix, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# the swallowtail ridge
# ─────────────────────────────────────────────────────────────────────────────
RB = RIDGE_Z - 0.05          # ridge body bottom
INNER = 4.3                  # where the sag meets the tail


def ridge_top(x):
    """The top of the ridge's sag: low in the middle, rising to the tails."""
    return 7.95 + 1.0 * (abs(x) / INNER) ** 2


def ridge():
    """燕尾脊: an ink body, its top sagging deep in the middle and sweeping up and out into forked
    tips past the gables; a blue 剪黏 panel on both faces with a row of small figures."""
    right = [(0, RB), (3.7, RB)]
    right += quad((3.7, RB), (4.95, RB + 0.4), (5.5, 10.25), 6)                    # under the tail
    right += [(5.62, 10.6), (5.35, 10.3), (5.28, 10.55)]                              # the fork
    right += quad((5.28, 10.55), (4.7, 9.45), (INNER, ridge_top(INNER)), 4)           # back down
    right += [(x, ridge_top(x)) for x in (3.6, 2.8, 2.0, 1.2, 0.5)]
    left = [(-x, z) for x, z in reversed(right[1:])]
    prof = right + left
    solid('ridge', 'ink', lambda bm: bm_solid(bm, prof, RIDGE_Y - 0.26, RIDGE_Y + 0.26, None), bevel=0.04)

    def panel(bm):                  # the blue band on both faces, following the sag
        xs = [-4.1 + i * 0.41 for i in range(21)]
        top = [(x, ridge_top(x) - 0.1) for x in xs]
        bot = [(x, RB + 0.1 + 0.35 * (abs(x) / INNER) ** 2) for x in reversed(xs)]
        bm_solid(bm, top + bot, RIDGE_Y - 0.3, RIDGE_Y + 0.3, None)
    solid('ridge_panel', 'glass', panel, bevel=0.0)

    def cap(bm):                    # the light cap line on the top edge
        xs = [-4.2 + i * 0.6 for i in range(15)]
        for a, b in zip(xs, xs[1:]):
            slab(bm, (a, RIDGE_Y, ridge_top(a) + 0.02), (b, RIDGE_Y, ridge_top(b) + 0.02), 0.58, 0.1)
    solid('ridge_cap', 'haze', cap, bevel=0.0)

    COLS = ('verm', 'lamp', 'leaf', 'bone')
    for ci, col in enumerate(COLS):
        def figs(bm, ci=ci):        # 剪黏 warriors and horses along both faces
            for i in range(-6, 7):
                if i == 0 or (i + 6) % 4 != ci:
                    continue
                x = i * 0.6
                z = (ridge_top(x) + RB + 0.35 * (abs(x) / INNER) ** 2) / 2 + 0.08
                for sy in (-1, 1):
                    y = RIDGE_Y + sy * 0.33
                    bm_box(bm, (0.4, 0.09, 0.17), (x, y, z - 0.1))             # horse
                    bm_box(bm, (0.08, 0.09, 0.16), (x - 0.17, y, z - 0.24))    # legs
                    bm_box(bm, (0.08, 0.09, 0.16), (x + 0.15, y, z - 0.24))
                    bm_box(bm, (0.1, 0.09, 0.14), (x + 0.22, y, z + 0.0))      # horse head
                    bm_box(bm, (0.13, 0.09, 0.24), (x, y, z + 0.1))            # rider
                    bm_sphere(bm, 0.07, (x, y, z + 0.29), 6, 4)
        solid('ridge_figures_' + col, col, figs, bevel=0.0)


def ridge_clouds():
    """White cloud curls on the blue 剪黏 panel between the riders."""
    def clouds(bm):
        for i in range(-6, 6):
            x = i * 0.6 + 0.3
            zb = RB + 0.1 + 0.35 * (abs(x) / INNER) ** 2
            for sy in (-1, 1):
                y = RIDGE_Y + sy * 0.31
                T = Matrix.Translation((x, y, zb + 0.16)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
                for dx, r in ((-0.12, 0.08), (0.0, 0.11), (0.12, 0.08)):
                    bm_cylinder(bm, r, -0.02, 0.02, 8, (dx, 0), T)
    solid('ridge_clouds', 'bone', clouds, bevel=0.0)


def sun_disc():
    """The red sun disc at the ridge centre: a blue-green lotus seat, a red ball, a ring of
    flame rays."""
    zc = ridge_top(0) + 0.95
    solid('sun_seat', 'leaf', lambda bm: bm_lathe(bm, [(0, ridge_top(0) - 0.05), (0.42, ridge_top(0) - 0.05), (0.5, ridge_top(0) + 0.15),
                                                       (0.3, ridge_top(0) + 0.32), (0.12, zc - 0.3), (0, zc - 0.3)], 12,
                                                      Matrix.Translation((0, RIDGE_Y, 0))), bevel=0.0)
    solid('sun_ball', 'verm', lambda bm: bm_sphere(bm, 0.3, (0, RIDGE_Y, zc), 14, 10), bevel=0.0)

    def rays(bm):
        for k in range(13):
            a = math.pi * (-0.15 + 1.3 * k / 12)
            p0 = (0.36 * math.cos(a), RIDGE_Y, zc + 0.36 * math.sin(a))
            mid = (0.62 * math.cos(a + 0.12), RIDGE_Y, zc + 0.62 * math.sin(a + 0.12))
            p1 = (0.86 * math.cos(a - 0.05), RIDGE_Y, zc + 0.86 * math.sin(a - 0.05))
            slab(bm, p0, mid, 0.07, 0.13)
            slab(bm, mid, p1, 0.05, 0.08)
    solid('sun_rays', 'verm', rays, bevel=0.0)
    solid('sun_ring', 'lamp', lambda bm: bm_lathe(bm, [(0.29, -0.04), (0.38, -0.04), (0.38, 0.04), (0.29, 0.04)], 16,
                                                  Matrix.Translation((0, RIDGE_Y, zc)) @ Matrix.Rotation(math.pi / 2, 4, 'X')), bevel=0.0)


def ridge_dragons():
    """雙龍搶珠: two green dragons standing on the ridge, bodies coiling up, heads reared in toward
    the sun disc. Spine a cubic S; bars tapering from the tail to the neck."""
    y0 = RIDGE_Y
    base = ridge_top(3.7)
    spine = cubic((3.75, base), (3.1, base + 1.6), (3.4, base + 0.2), (2.35, base + 1.45), 12, include_start=True)
    N = len(spine)
    wave = [0.12 * math.sin(i * math.pi / 3.5) for i in range(N)]

    def pt(sgn, i):
        return (sgn * spine[i][0], y0 + wave[i], spine[i][1])

    def axes(i):
        a, b = spine[max(i - 1, 0)], spine[min(i + 1, N - 1)]
        d = Vector((b[0] - a[0], 0.0, b[1] - a[1])).normalized()
        n = Vector((-d.z, 0.0, d.x))
        return d, n

    def body(bm):
        for sgn in (-1, 1):
            tube(bm, [pt(sgn, i) for i in range(N)], 0.12, 6, axis=Vector((0, 1, 0)))
            bm_sphere(bm, 0.13, pt(sgn, N - 1), 8, 6)
    solid('dragon_body', 'leaf', body, bevel=0.0)

    def comb(bm):
        for sgn in (-1, 1):
            for i in range(1, N - 1):
                d, n = axes(i)
                if n.x * sgn > 0:
                    n = -n
                v = (n * 0.8 - d * 0.5).normalized() * 0.2
                p = pt(sgn, i)
                slab(bm, p, (p[0] + sgn * v.x, p[1], p[2] + v.z), 0.04, 0.14)
    solid('dragon_comb', 'lamp', comb, bevel=0.0)

    def head(bm):
        for sgn in (-1, 1):
            hx, hz = sgn * spine[-1][0], spine[-1][1]
            y = y0 + wave[-1]
            bm_box(bm, (0.42, 0.34, 0.34), (hx - sgn * 0.12, y, hz + 0.1))        # skull
            bm_box(bm, (0.36, 0.26, 0.18), (hx - sgn * 0.45, y, hz + 0.02))       # snout, down and in
            bm_box(bm, (0.16, 0.22, 0.14), (hx - sgn * 0.62, y, hz + 0.12))       # upturned nose
            bm_box(bm, (0.32, 0.26, 0.08), (hx - sgn * 0.42, y, hz - 0.15))       # open jaw
            for dy in (-0.14, 0.14):
                bm_bar(bm, (hx, y + dy, hz + 0.24), (hx + sgn * 0.32, y + dy, hz + 0.55), 0.06)    # horns
    solid('dragon_head', 'leaf', head, bevel=0.025)

    def details(bm):                # eyes, mane and whiskers
        for sgn in (-1, 1):
            hx, hz = sgn * spine[-1][0], spine[-1][1]
            y = y0 + wave[-1]
            for dy in (-0.17, 0.17):
                bm_sphere(bm, 0.06, (hx - sgn * 0.25, y + dy, hz + 0.2), 6, 4)
                bm_bar(bm, (hx - sgn * 0.58, y + dy * 0.6, hz + 0.08),
                       (hx - sgn * 0.75, y + dy * 2.5, hz + 0.7), 0.025)          # whiskers, up
    solid('dragon_eyes', 'ink', details, bevel=0.0)

    def mane(bm):
        for sgn in (-1, 1):
            hx, hz = sgn * spine[-1][0], spine[-1][1]
            for a in (0.4, 0.9, 1.4):
                slab(bm, (hx + sgn * 0.05, y0, hz + 0.05),
                       (hx + sgn * (0.05 + 0.4 * math.cos(a)), y0, hz + 0.05 + 0.3 * math.sin(a) - 0.15), 0.05, 0.16)
    solid('dragon_mane', 'lamp', mane, bevel=0.0)

    def legs(bm):
        for sgn in (-1, 1):
            for i in (3, 8):
                c, y = pt(sgn, i), y0 + wave[i]
                for dy in (-0.14, 0.14):
                    knee = (c[0] - sgn * 0.18, y + dy * 1.4, c[2] - 0.2)
                    bm_bar(bm, (c[0], y + dy * 0.6, c[2]), knee, 0.07)
                    bm_bar(bm, knee, (knee[0] - sgn * 0.12, knee[1], knee[2] - 0.12), 0.06)
    solid('dragon_legs', 'leaf', legs, bevel=0.0)

    def tail(bm):
        for sgn in (-1, 1):
            tx, tz = spine[0]
            for a, L in ((0.2, 0.45), (0.65, 0.55), (1.1, 0.4)):
                slab(bm, (sgn * tx, y0 + wave[0], tz),
                     (sgn * (tx + L * math.cos(a)), y0 + wave[0], tz + L * math.sin(a)), 0.05, 0.16)
    solid('dragon_tail', 'lamp', tail, bevel=0.0)


# ─────────────────────────────────────────────────────────────────────────────
# lanterns and the incense burner
# ─────────────────────────────────────────────────────────────────────────────
LAN_Y, LAN_Z = -0.85, 3.55


def lanterns():
    xs = (-2.0, 2.0)
    solid('lanterns', 'verm', lambda bm: [bm_sphere(bm, 0.36, (x, LAN_Y, LAN_Z), 14, 10, scale_z=1.15) for x in xs], bevel=0.0)

    def caps(bm):
        for x in xs:
            bm_cylinder(bm, 0.16, LAN_Z + 0.36, LAN_Z + 0.48, 10, (x, LAN_Y))
            bm_cylinder(bm, 0.16, LAN_Z - 0.48, LAN_Z - 0.36, 10, (x, LAN_Y))
            bm_cylinder(bm, 0.025, LAN_Z + 0.46, SOFFIT + 0.02, 6, (x, LAN_Y))
    solid('lantern_caps', 'ink', caps, bevel=0.0)
    solid('lantern_tassels', 'lamp', lambda bm: [bm_lathe(bm, [(0, LAN_Z - 0.48), (0.08, LAN_Z - 0.52), (0.06, LAN_Z - 0.8), (0, LAN_Z - 0.84)], 8,
                                                          Matrix.Translation((x, LAN_Y, 0))) for x in xs], bevel=0.0)


def burner():
    """朝天爐 on the forecourt: a granite pedestal, a bronze tripod pot with ear handles and a
    flared rim (the scene's smoke rises from its mouth)."""
    x, y = 0.0, -1.9
    T = Matrix.Translation((x, y, 0))
    solid('burner_pedestal', 'walk', lambda bm: [bm_prism(bm, 8, 0.62, 0.58, WALK, WALK + 0.22, center=(x, y)),
                                                  bm_prism(bm, 8, 0.5, 0.5, WALK + 0.22, WALK + 0.3, center=(x, y))], bevel=0.03)
    b = WALK + 0.3

    def pot(bm):
        bm_lathe(bm, [(0, b + 0.35), (0.3, b + 0.35), (0.5, b + 0.5), (0.56, b + 0.78), (0.5, b + 1.0),
                      (0.44, b + 1.1), (0, b + 1.1)], 16, T)
        for i in range(3):
            a = math.pi / 2 + i * 2 * math.pi / 3
            bm_lathe(bm, [(0.07, b), (0.1, b + 0.05), (0.07, b + 0.2), (0.06, b + 0.42)], 8,
                     Matrix.Translation((x + 0.36 * math.cos(a), y + 0.36 * math.sin(a), 0)))
        for sx in (-1, 1):
            slab(bm, (x + sx * 0.42, y, b + 1.05), (x + sx * 0.58, y, b + 1.38), 0.2, 0.08)
            slab(bm, (x + sx * 0.58, y, b + 1.38), (x + sx * 0.7, y, b + 1.24), 0.2, 0.08)
    solid('burner', 'ink', pot, bevel=0.0)
    solid('burner_rim', 'lamp', lambda bm: bm_lathe(bm, [(0.38, b + 1.1), (0.56, b + 1.16), (0.56, b + 1.24), (0.38, b + 1.2)], 16, T), bevel=0.0)
    solid('burner_band', 'lamp', lambda bm: bm_lathe(bm, [(0.555, b + 0.72), (0.575, b + 0.74), (0.575, b + 0.84), (0.555, b + 0.86)], 16, T), bevel=0.0)


def build():
    hall()
    piers()
    doors()
    frieze()
    roof()
    gable_vents()
    gable_ridges()
    ridge()
    ridge_clouds()
    sun_disc()
    ridge_dragons()
    lanterns()
    burner()


if __name__ == '__main__':
    # preview: straight-on from the forecourt, a little left of centre, like temple-01
    S.run(build, camera=((0.6, -15.5, 2.2), (0.0, 1.0, 5.0), 42))
