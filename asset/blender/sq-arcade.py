# sq-arcade.py — one 騎樓 (qilou) shophouse bay for the walk-mode square's four walls.
#
# Reference (research/reference/square/sources.md): the arcades round the 西門紅樓 plaza and on
# 成都路 / 漢中街 (img/fongda-arcade.jpg, the 蜂大咖啡 arcade: square columns with a dark tiled
# skirt, a flat arcade ceiling, a signboard on the slab edge, a lit shop window behind); the
# colonnades in img/qilou-guide.jpg and img/qilou-liaoning.jpg (column rhythm about 4 m, arcade
# about 3 m deep, floor tiles one step up from the pavement); the upper floors of the 1970s walk-ups
# in img/ximending-street.jpg and the Eagle "subject/arcade" and "subject/ac-units" photos
# (鐵窗 iron window cages that stand out from the wall, a split-AC unit hung under each window,
# a slab-edge band per floor, a parapet and a stainless water tank on the roof).
#
# Four groups, each a glb node, stacked by square.js:
#   'ground' z 0 .. 4.4  arcade columns, ceiling, floor, slab edge with a blank sign board (canvas
#                        text is laid on it in JS: board front at Blender y = -0.16, z 3.72 .. 4.32,
#                        x ±1.9), the lit shop window (palette 'lamp', so MODELS.instance's emissive
#                        option makes it glow like a 7-Eleven front) and its rolling-shutter box
#   'storey' z 0 .. 3.2  one upper floor: tiled front ('walk', the colour prim square.js tints per
#                        bay), window, 鐵窗 cage, AC unit, floor band
#   'roof'   z 0 .. 2.3  parapet, coping, water tank on its stand
#   'vsign'  z 0 .. 3.0  a vertical shop sign (直式招牌) standing out from the wall; blank, text in JS
# Bay: 4.4 wide (x ±2.2), front (column face / wall face) at y = 0 facing -Y (three.js +Z), the
# body runs back to y = 8. Each bay owns its left column, so bays tile at 4.4.
#
#   Blender --background --python asset/blender/sq-arcade.py -- --out asset/models/src/sq-arcade.glb --stats
#
# Budget (square total ≤ 40k in the files; this bay is instanced ~36×, so it is kept lean):
# ground ≈ 1.1k, storey ≈ 1.1k, roof ≈ 0.4k, vsign ≈ 0.1k triangles.

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_cylinder, bm_lathe


def solid(*a, **k):
    """S.solid with flat shading unless asked: an unbevelled box with smooth normals shades like a
    pillow (the first preview's sign boards and AC fans read as tubes and balls)."""
    k.setdefault('smooth', k.get('bevel', S.BEVEL) > 0)
    return S.solid(*a, **k)

W, DEPTH = 4.4, 8.0
ARC_H, ARC_D = 3.6, 3.0          # arcade clear height and depth
G_H, ST_H = 4.4, 3.2             # ground group height (arcade + slab edge), one storey
COL = 0.62                       # column section
CX = -W / 2 + COL / 2            # the bay's own column, at its left edge


def ground():
    g = 'ground'
    # the column: a dark tiled skirt, the shaft, a thin capital band
    solid('g_col', 'bone', lambda bm: bm_box(bm, (COL, COL, ARC_H), (CX, COL / 2, ARC_H / 2)), bevel=0.03, group=g)
    solid('g_skirt', 'haze', lambda bm: bm_box(bm, (COL + 0.06, COL + 0.06, 1.1), (CX, COL / 2, 0.55)), bevel=0.0, group=g)
    # the slab over the arcade, its front edge (the sign band) and the ceiling
    solid('g_slab', 'bone', lambda bm: bm_box(bm, (W, 0.34, G_H - ARC_H), (0, 0.17, (ARC_H + G_H) / 2)), bevel=0.03, group=g)
    solid('g_ceiling', 'walk', lambda bm: bm_box(bm, (W, ARC_D, 0.12), (0, ARC_D / 2, ARC_H + 0.06)), bevel=0.0, group=g)
    solid('g_board', 'bone', lambda bm: bm_box(bm, (3.8, 0.12, 0.6), (0.3, -0.1, 4.02)), bevel=0.0, group=g)
    solid('g_board_frame', 'ink', lambda bm: bm_box(bm, (3.9, 0.08, 0.7), (0.3, -0.02, 4.02)), bevel=0.0, group=g)
    # the arcade floor: one tile step up from the square
    solid('g_floor', 'walk', lambda bm: bm_box(bm, (W, ARC_D, 0.14), (0, ARC_D / 2, 0.07)), bevel=0.0, group=g)
    # the shop front at the back of the arcade: piers, a header with the shutter box, the lit window
    back = ARC_D

    def front(bm):
        bm_box(bm, (0.5, 0.3, ARC_H), (-W / 2 + 0.25, back + 0.15, ARC_H / 2))
        bm_box(bm, (0.4, 0.3, ARC_H), (W / 2 - 0.2, back + 0.15, ARC_H / 2))
        bm_box(bm, (W, 0.3, 0.75), (0, back + 0.15, ARC_H - 0.375))
        bm_box(bm, (W, 0.3, 0.25), (0, back + 0.15, 0.125))
    solid('g_front', 'bone', front, bevel=0.0, group=g)
    solid('g_shutter', 'haze', lambda bm: bm_box(bm, (3.5, 0.32, 0.36), (0.05, back - 0.1, ARC_H - 0.95)), bevel=0.0, group=g)
    # two ceiling lights in the arcade and the shutter's guide rails
    def lights(bm):
        for x in (-0.8, 1.0):
            bm_box(bm, (0.9, 0.18, 0.04), (x, ARC_D / 2, ARC_H - 0.02))
    solid('g_lights', 'lamp', lights, bevel=0.0, group=g)
    def rails(bm):
        for x in (-1.72, 1.82):
            bm_box(bm, (0.06, 0.1, ARC_H - 1.1), (x, back - 0.02, (ARC_H - 1.1) / 2))
    solid('g_rails', 'haze', rails, bevel=0.0, group=g)
    solid('g_window', 'lamp', lambda bm: bm_box(bm, (3.5, 0.08, 2.6), (0.05, back + 0.2, 1.55)), bevel=0.0, group=g)

    def mullions(bm):
        for x in (-1.2, 0.05, 0.75, 1.75):                       # door at 0.05 .. 0.75
            bm_box(bm, (0.07, 0.07, 2.6), (x, back + 0.12, 1.55))
        bm_box(bm, (3.5, 0.07, 0.07), (0.05, back + 0.12, 2.25))
        bm_box(bm, (3.5, 0.07, 0.09), (0.05, back + 0.12, 0.3))
    solid('g_mullions', 'ink', mullions, bevel=0.0, group=g)
    # the body behind, so the bay closes from above and from the side
    solid('g_body', 'bone', lambda bm: bm_box(bm, (W, DEPTH - back - 0.3, G_H), (0, (DEPTH + back + 0.3) / 2, G_H / 2)), bevel=0.0, group=g)


def storey():
    g = 'storey'
    win_w, sill, head = 3.0, 0.95, 2.55
    # the tiled front, built round the window opening (no booleans: cheaper and as clean)
    def wall(bm):
        bm_box(bm, (W, 0.2, sill), (0, 0.1, sill / 2))
        bm_box(bm, (W, 0.2, ST_H - head), (0, 0.1, (head + ST_H) / 2))
        side = (W - win_w) / 2
        bm_box(bm, (side, 0.2, head - sill), (-W / 2 + side / 2, 0.1, (sill + head) / 2))
        bm_box(bm, (side, 0.2, head - sill), (W / 2 - side / 2, 0.1, (sill + head) / 2))
    solid('s_wall', 'walk', wall, bevel=0.0, group=g)
    solid('s_body', 'bone', lambda bm: bm_box(bm, (W - 0.02, DEPTH - 0.2, ST_H), (0, DEPTH / 2 + 0.1, ST_H / 2)), bevel=0.0, group=g)
    solid('s_glass', 'ink', lambda bm: bm_box(bm, (win_w, 0.06, head - sill), (0, 0.3, (sill + head) / 2)), bevel=0.0, group=g)
    # aluminium sliding frames
    def frames(bm):
        for x in (-win_w / 2 + 0.04, 0, win_w / 2 - 0.04):
            bm_box(bm, (0.06, 0.06, head - sill), (x, 0.24, (sill + head) / 2))
    solid('s_frames', 'haze', frames, bevel=0.0, group=g)
    # floor band (the slab edge) and the window sill
    solid('s_band', 'bone', lambda bm: bm_box(bm, (W, 0.3, 0.18), (0, 0.05, ST_H - 0.09)), bevel=0.0, group=g)
    # 鐵窗: an iron cage standing 0.42 out from the wall, a sloped rain plate on top
    cw, cd = win_w + 0.2, 0.42
    z0, z1 = sill - 0.12, head + 0.12

    def cage(bm):
        n = 14
        for i in range(n + 1):
            x = -cw / 2 + i * cw / n
            bm_box(bm, (0.035, 0.035, z1 - z0), (x, -cd, (z0 + z1) / 2))
        for z in (z0, z0 + 0.5, (z0 + z1) / 2 + 0.25, z1):
            bm_box(bm, (cw, 0.04, 0.04), (0, -cd, z))
        for s in (-1, 1):
            for z in (z0, z1):
                bm_box(bm, (0.04, cd, 0.04), (s * cw / 2, -cd / 2, z))
            bm_box(bm, (0.035, 0.035, z1 - z0), (s * cw / 2, -cd / 2, (z0 + z1) / 2))
    solid('s_cage', 'bone', cage, bevel=0.0, group=g)
    solid('s_cage_floor', 'haze', lambda bm: bm_box(bm, (cw, cd, 0.04), (0, -cd / 2, z0 - 0.02)), bevel=0.0, group=g)
    rain = Matrix.Translation((0, -cd / 2, z1 + 0.08)) @ Matrix.Rotation(math.radians(-12), 4, 'X')
    solid('s_rain', 'haze', lambda bm: bm_box(bm, (cw + 0.1, cd + 0.15, 0.03), (0, 0, 0), rain), bevel=0.0, group=g)
    # the split-AC outdoor unit on its bracket, under the window to the right
    ax, ay, az = 1.35, -0.2, 0.15
    solid('s_ac', 'bone', lambda bm: bm_box(bm, (0.82, 0.3, 0.56), (ax, ay, az + 0.28)), bevel=0.025, group=g)

    def ac_face(bm):
        bm_cylinder(bm, 0.2, -0.01, 0.02, n=12, xform=Matrix.Translation((ax + 0.12, ay - 0.16, az + 0.28)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        bm_box(bm, (0.04, 0.3, 0.04), (ax - 0.35, ay + 0.0, az - 0.02))
        bm_box(bm, (0.04, 0.3, 0.04), (ax + 0.35, ay + 0.0, az - 0.02))
    solid('s_ac_face', 'ink', ac_face, bevel=0.0, group=g)


def roof():
    g = 'roof'
    def parapet(bm):
        bm_box(bm, (W, 0.22, 1.0), (0, 0.11, 0.5))
        bm_box(bm, (W - 0.02, DEPTH - 0.3, 0.12), (0, DEPTH / 2 + 0.1, 0.06))
    solid('r_parapet', 'walk', parapet, bevel=0.0, group=g)
    solid('r_coping', 'bone', lambda bm: bm_box(bm, (W, 0.34, 0.08), (0, 0.11, 1.04)), bevel=0.0, group=g)
    # stainless water tank on a steel stand, set back from the front
    T = Matrix.Translation((0.9, 4.0, 0))

    def stand(bm):
        for sx in (-1, 1):
            for sy in (-1, 1):
                bm_box(bm, (0.07, 0.07, 0.8), (0.9 + sx * 0.45, 4.0 + sy * 0.45, 0.4))
        bm_box(bm, (1.05, 1.05, 0.06), (0.9, 4.0, 0.82))
    solid('r_stand', 'ink', stand, bevel=0.0, group=g)
    solid('r_tank', 'haze', lambda bm: bm_lathe(bm, [(0, 0.85), (0.5, 0.85), (0.52, 0.95), (0.52, 2.05), (0.42, 2.25), (0, 2.3)], n=14, xform=T), bevel=0.0, smooth=True, group=g)


def vsign():
    g = 'vsign'
    # a vertical sign board standing out from the wall on two brackets; front face +X/-X both read
    solid('v_board', 'bone', lambda bm: bm_box(bm, (0.12, 0.9, 3.0), (0, -0.75, 1.5)), bevel=0.0, group=g)
    solid('v_frame', 'verm', lambda bm: bm_box(bm, (0.16, 0.98, 0.1), (0, -0.75, 3.0)), bevel=0.0, group=g)
    def brackets(bm):
        for z in (0.4, 2.6):
            bm_box(bm, (0.05, 0.4, 0.05), (0, -0.15, z))
    solid('v_brackets', 'ink', brackets, bevel=0.0, group=g)


def build():
    ground()
    storey()
    roof()
    vsign()


def stacked_preview(joined):
    """Re-render the preview with the groups stacked as square.js stacks them (three bays wide,
    two storeys), so the picture shows a building, not four groups on top of each other."""
    if '--preview' not in sys.argv:
        return
    path = sys.argv[sys.argv.index('--preview') + 1]
    by = {o.name: o for o in joined}
    obs = []
    for i, dx in enumerate((-W, 0, W)):
        for name, z in (('ground', 0), ('storey', G_H), ('storey', G_H + ST_H), ('roof', G_H + 2 * ST_H)):
            o = by[name].copy()
            bpy.context.scene.collection.objects.link(o)
            o.location = (dx, 0, z)
            obs.append(o)
        v = by['vsign'].copy()
        bpy.context.scene.collection.objects.link(v)
        v.location = (dx + 1.9, 0, G_H + 0.3)
        obs.append(v)
    for o in joined:
        o.hide_render = True
    S.preview(path, obs, camera=((9, -16, 6), (0, 2, 6), 45))


if __name__ == '__main__':
    import bpy
    stacked_preview(S.run(build))
