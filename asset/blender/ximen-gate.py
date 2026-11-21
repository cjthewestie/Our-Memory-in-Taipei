"""ximen-gate.py — the 西門町 pedestrian-zone gateway (行人徒步區, 1999), scene-red.js §5.

Reference: research/blender-detail/models/ref-ximen-gate/ref-01-gate-hanzhong.jpg (the 漢中街
entrance, Commons "Ximending gate 01.JPG", CC BY-SA 3.0). The real gate is not an arch: two
square pillars wrapped in poster panels and lightbox cases stand on plinths at the kerbs; a
deep steel sign frame spans between them (a big sign face front and back, open lattice
underneath with downlights and loudspeakers); a planting trough runs along the top and two
floodlight masts rise from it.

Scene contract (scene-red.js §5): pillar centres at x ±6.4, the gate at z -96, the sign board
around y 6.3–8.0. Origin on the ground at the gate centre, front (-Y here) = +Z in three.js,
toward the camera arriving from +z. The sign panel is a blank bone board — text stays canvas.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_cylinder, bm_lathe, bm_sphere, solid
from mathutils import Matrix

PX = 6.4            # pillar centre |x|
PW = 1.3            # pillar shaft width / depth
SHAFT_TOP = 5.2
BEAM_Z0, BEAM_Z1 = 5.4, 8.6
BEAM_HALF = 7.05    # beam ends at x ±7.0, flush with the pillars' outer faces
FY = 0.45           # sign faces at y ±FY (front -FY)
SIDES = (-PX, PX)


def boxes(name, col, items, group='gate', bevel=0.025):
    solid(name, col, lambda bm: [bm_box(bm, size, pos) for size, pos in items], bevel=bevel, group=group)


def build():
    # ── pillars: stepped plinth, shaft, cap ──────────────────────────────────
    boxes('plinth', 'walk', [((1.8, 1.8, 0.3), (x, 0, 0.15)) for x in SIDES]
          + [((1.55, 1.55, 0.15), (x, 0, 0.375)) for x in SIDES], bevel=0.04)
    boxes('shafts', 'verm', [((PW, PW, SHAFT_TOP - 0.45), (x, 0, (SHAFT_TOP + 0.45) / 2)) for x in SIDES], bevel=0.05)
    boxes('caps', 'haze', [((1.52, 1.52, 0.2), (x, 0, SHAFT_TOP + 0.1)) for x in SIDES]
          + [((1.4, 1.4, 0.08), (x, 0, 0.49)) for x in SIDES], bevel=0.03)

    # poster panels on the street faces (front -Y, back +Y): a bone poster in a thin ink frame,
    # and below it the dark lightbox case with its pale face, as in the photo
    frames, posters, cases, faces = [], [], [], []
    for x in SIDES:
        for s in (-1, 1):
            y = s * (PW / 2)
            frames.append(((1.06, 0.08, 2.5), (x, y + s * 0.03, 3.65)))
            posters.append(((0.94, 0.04, 2.36), (x, y + s * 0.08, 3.65)))
            cases.append(((1.0, 0.16, 1.35), (x, y + s * 0.07, 1.6)))
            faces.append(((0.84, 0.04, 1.15), (x, y + s * 0.16, 1.6)))
        # the inner face (toward the street centre) carries a tall poster too
        xi = x - math.copysign(PW / 2, x)
        si = -math.copysign(1, x)
        frames.append(((0.08, 1.06, 3.9), (xi + si * 0.03, 0, 2.95)))
        posters.append(((0.04, 0.94, 3.76), (xi + si * 0.08, 0, 2.95)))
    boxes('poster_frames', 'ink', frames)
    boxes('posters', 'bone', posters, bevel=0)
    boxes('lightbox_cases', 'ink', cases)
    boxes('lightbox_faces', 'lamp', faces, bevel=0)

    # ── the sign frame: two deep faces joined by an open lattice ─────────────
    BH = BEAM_Z1 - BEAM_Z0
    zc = (BEAM_Z0 + BEAM_Z1) / 2
    # the two face boxes (front and back) and the closed ends
    boxes('beam_faces', 'verm', [((2 * BEAM_HALF, 0.22, BH), (0, s * (FY - 0.11), zc)) for s in (-1, 1)]
          + [((0.14, 2 * FY, BH), (s * (BEAM_HALF - 0.07), 0, zc)) for s in (-1, 1)], bevel=0.04)
    # the blank sign panels, a raised board inside an ink border, front and back
    boxes('sign_border', 'ink', [((13.4, 0.05, 2.86), (0, s * (FY + 0.025), 7.0)) for s in (-1, 1)], bevel=0)
    boxes('sign_panel', 'bone', [((13.1, 0.05, 2.66), (0, s * (FY + 0.05), 7.0)) for s in (-1, 1)], bevel=0)
    # the bottom chords and the lacing between them, seen from below
    def lattice(bm):
        z = BEAM_Z0 + 0.06
        for s in (-1, 1):
            bm_bar(bm, (-BEAM_HALF + 0.14, s * (FY - 0.28), z), (BEAM_HALF - 0.14, s * (FY - 0.28), z), 0.1)
        n = 12
        xs = [-BEAM_HALF + 0.3 + i * (2 * BEAM_HALF - 0.6) / n for i in range(n + 1)]
        for i, x in enumerate(xs):
            bm_bar(bm, (x, -(FY - 0.28), z), (x, FY - 0.28, z), 0.07)
            if i < n:
                a, b = (-1, 1) if i % 2 == 0 else (1, -1)
                bm_bar(bm, (x, a * (FY - 0.28), z), (xs[i + 1], b * (FY - 0.28), z), 0.06)
    solid('lattice', 'haze', lattice, bevel=0, group='gate')
    # the top cover and its drip edge
    boxes('top_cover', 'haze', [((2 * BEAM_HALF + 0.24, 2 * FY + 0.3, 0.14), (0, 0, BEAM_Z1 + 0.07))], bevel=0.03)

    # ── planting trough on top and its shrubs ────────────────────────────────
    boxes('trough', 'walk', [((10.4, 0.7, 0.36), (0, 0.05, BEAM_Z1 + 0.32))], bevel=0.03)
    def shrubs(bm):
        for i, x in enumerate([-4.7, -2.4, -1.2, 0.1, 1.3, 2.5, 4.8]):
            r = 0.42 + 0.08 * ((i * 37) % 3)
            bm_sphere(bm, r, (x + 0.15 * ((i % 2) * 2 - 1), 0.05, BEAM_Z1 + 0.55), u=10, v=6, scale_z=0.8)
    solid('shrubs', 'leaf', shrubs, bevel=0, group='gate')

    # ── floodlight masts: pole, bracket, square flood heads aimed down at the street ──
    MZ0 = BEAM_Z1 + 0.14
    def poles(bm):
        for x in (-3.6, 3.6):
            bm_cylinder(bm, 0.075, MZ0, 10.6, n=10, center=(x, 0.35))
            bm_cylinder(bm, 0.16, MZ0, MZ0 + 0.12, n=10, center=(x, 0.35))
            bm_bar(bm, (x - 0.32, 0.35, 10.5), (x + 0.32, 0.35, 10.5), 0.07)
    solid('mast_poles', 'haze', poles, bevel=0, group='gate')
    tilt = Matrix.Rotation(math.radians(-35), 4, 'X')
    def heads(bm, lens):
        for x in (-3.6, 3.6):
            for dx in (-0.3, 0.3):
                m = Matrix.Translation((x + dx, 0.3, 10.35)) @ tilt
                if lens:
                    bm_box(bm, (0.32, 0.04, 0.24), (0, -0.155, 0), m)
                else:
                    bm_box(bm, (0.4, 0.28, 0.32), (0, 0, 0), m)
    solid('flood_heads', 'bone', lambda bm: heads(bm, False), bevel=0.025, group='gate')
    solid('flood_lenses', 'lamp', lambda bm: heads(bm, True), bevel=0, group='gate')

    # ── under the beam: downlights and a loudspeaker horn on each pillar ─────
    solid('downlight_cans', 'ink', lambda bm: [bm_cylinder(bm, 0.14, BEAM_Z0 - 0.12, BEAM_Z0, n=10, center=(x, 0))
                                               for x in (-4.5, -2.7, -0.9, 0.9, 2.7, 4.5)], bevel=0, group='gate')
    solid('downlights', 'lamp', lambda bm: [bm_cylinder(bm, 0.1, BEAM_Z0 - 0.14, BEAM_Z0 - 0.11, n=10, center=(x, 0))
                                            for x in (-4.5, -2.7, -0.9, 0.9, 2.7, 4.5)], bevel=0, group='gate')
    horn = [(0.0, 0.0), (0.07, 0.0), (0.09, 0.12), (0.2, 0.42), (0.17, 0.42)]
    def horns(bm):
        for x in SIDES:
            si = -math.copysign(1, x)          # pointing toward the street centre
            m = (Matrix.Translation((x + si * (PW / 2 + 0.05), -0.25, SHAFT_TOP - 0.35))
                 @ Matrix.Rotation(si * math.radians(110), 4, 'Y'))
            bm_lathe(bm, horn, n=10, xform=m)
    solid('speakers', 'bone', horns, bevel=0, group='gate')
    solid('speaker_brackets', 'ink', lambda bm: [bm_box(bm, (0.08, 0.08, 0.3), (x - math.copysign(PW / 2 + 0.04, x), -0.25, SHAFT_TOP - 0.25)) for x in SIDES], bevel=0, group='gate')


if __name__ == '__main__':
    # roughly the photo's view: standing in the street a block out, sign high in frame
    S.run(build, camera=((-1.2, -17, 1.7), (0, 0, 5.4), 50))
