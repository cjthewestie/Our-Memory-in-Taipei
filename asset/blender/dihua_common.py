# dihua_common.py — the shared shophouse bay for the three Dihua Street styles (issue #5 step 3,
# detail pass blender-detail 2026-11-01). dihua-min.py, dihua-yang.py and dihua-baroque.py import
# this and call build_bay(crest_parts, **style).
#
# One bay = 4.6 m of frontage (Blender X ±2.3), from scene-dadao.js bay(): Blender y = 0 is the
# FACE line (the upper facade, world |x| 6.2), the arcade pier stands 0.4 in front of it at the
# kerb, the shop wall at the arcade's back is at y 3.2..3.6, the arcade ceiling at z 3.8, upper
# floors of 3.4 from z 4.2. Front toward -Y. Instanced by the engine, so the origin is the base
# centre and the model keeps its real height. One pier and one pilaster per bay, at +X; the next
# bay supplies the other side, so the windows and the shop door are centred on x = -0.2 (the clear
# span between our -X edge and our own +X pilaster), and the arcade arch on x = 0 (pier to pier).
#
# Three glb groups (issue #15 step 3), node names the scene looks up — keep them:
#   main     the 亭仔腳 arcade, the shop front, and ONE upper floor   (z 0 .. 7.6)
#   storey   one more upper floor, built where the second sits     (z 7.6 .. 11.0)
#   crest    the roof slab and the style's own parapet             (z 11.0 up)
# scene-dadao.js instances main once per bay, storey (floors - 1) times at y = (k - 1) * FH, and
# crest once at y = (floors - 2) * FH.
#
# What the photos put here (research/reference/dadao/img, dihua-01..07): a square brick pier on a
# granite plinth with a curved stone bracket each side carrying a segmental arch across the
# arcade (dihua-06); a shop front of timber panel doors under a lattice transom and a stone name
# plaque (dihua-07); three tall windows per bay with moulded surrounds and a balustraded balcony
# on the 洋樓 / 巴洛克 fronts (dihua-01, -05), two shuttered windows on the plain brick 閩南 fronts
# (dihua-03, yongle-05); a moulded string course at each floor line.
#
# Triangle budget: 5,000 per bay (main + storey + crest), the bay is instanced ~40 times. The
# rule that buys the detail: big pieces (pier, cornices, plaques, surrounds) carry a bevel; small
# repeated pieces (balusters, mullions, door panels, louvres) and walls whose edges are hidden by
# neighbours are flat-shaded with no bevel, which at street distance reads the same and costs a
# quarter of the triangles.

import math
import os
import sys

from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_prism, bm_solid, arch_pts, rect_pts, solid, cutter

W = 4.6                 # frontage
HW = W / 2
DEPTH = 11.8            # close the shell to scene-dadao.js DEEP - FACE
WALK = 0.22             # sidewalk top
CEIL = 3.8              # arcade ceiling
F0 = 4.2                # first upper floor
FH = 3.4                # storey height
STOREY_Z = F0 + FH      # 7.6, where the second floor (the 'storey' module) starts
TOP = F0 + 2 * FH       # 11.0, the crest line of a standard two-floor bay
CX = -0.2               # centre of the clear span (our own pilaster is at +X only)
PIER_Y = -0.4           # arcade pier line, at the kerb
FRONT = S.face_frame(0, 0)               # the facade plane: local x along X, y into the wall, z up


def flat(name, col, builder, group):
    """Small repeated pieces: no bevel, flat shading (a square bar stays square)."""
    return solid(name, col, builder, bevel=0.0, smooth=False, group=group)


def trim(name, col, builder, group, bevel=0.025):
    return solid(name, col, builder, bevel=bevel, group=group)


def ring(bm, cx, zs, r_in, r_out, y0, y1, n=6, a0=0.0, a1=math.pi):
    """An arch ring of n voussoir blocks from angle a0 to a1 around (cx, zs)."""
    for i in range(n):
        a = a0 + (a1 - a0) * i / n
        b = a0 + (a1 - a0) * (i + 1) / n
        p = [(cx + r_in * math.cos(a), zs + r_in * math.sin(a)),
             (cx + r_out * math.cos(a), zs + r_out * math.sin(a)),
             (cx + r_out * math.cos(b), zs + r_out * math.sin(b)),
             (cx + r_in * math.cos(b), zs + r_in * math.sin(b))]
        bm_solid(bm, p, y0, y1)


# ─────────────────────────────────────────────────────────────────────────────
# the 亭仔腳 arcade
# ─────────────────────────────────────────────────────────────────────────────
ARCH_SPRING = 3.05      # where the arcade arch leaves the pier brackets
ARCH_RISE = 0.42        # segmental rise to the crown (crown z 3.47)
PIER = 0.56


def pier(col, stone):
    """The arcade pier at the bay's +X edge (dihua-06): a granite plinth with a cap, a square
    brick shaft, a stepped stone capital and a curved stone bracket each side, under the arch
    spring."""
    x, y = HW, PIER_Y

    def stone_parts(bm):
        bm_box(bm, (0.72, 0.72, 0.62), (x, y, WALK + 0.31))                       # granite plinth
        bm_box(bm, (0.8, 0.8, 0.1), (x, y, WALK + 0.67))                          # its cap
        bm_box(bm, (0.66, 0.66, 0.12), (x, y, ARCH_SPRING - 0.3))                 # capital, lower
        bm_box(bm, (0.76, 0.76, 0.14), (x, y, ARCH_SPRING - 0.17))                # capital, upper
    trim('pier_stone', stone, stone_parts, 'main', bevel=0.03)
    z0, z1 = WALK + 0.72, ARCH_SPRING - 0.36
    solid('pier', col, lambda bm: bm_box(bm, (PIER, PIER, z1 - z0), (x, y, (z0 + z1) / 2)), bevel=0.03, group='main')

    def brackets(bm):
        # a quarter-round scroll on each X face of the pier, curving out under the arch spring
        for s in (-1, 1):
            fx = x + s * PIER / 2
            pts = [(fx, ARCH_SPRING - 0.08), (fx, ARCH_SPRING - 0.8)]
            for t in (0.3, 0.6, 1.0):
                pts.append((fx + s * 0.44 * (1 - math.cos(t * math.pi / 2)) ** 0.7,
                            ARCH_SPRING - 0.8 + 0.62 * math.sin(t * math.pi / 2)))
            pts.append((fx + s * 0.46, ARCH_SPRING - 0.08))
            if s > 0:
                pts = pts[::-1]
            bm_solid(bm, pts, y - 0.17, y + 0.17)
    trim('pier_brackets', stone, brackets, 'main')


def _seg(span):
    r = (span ** 2 + ARCH_RISE ** 2) / (2 * ARCH_RISE)
    return r, ARCH_SPRING + ARCH_RISE - r, math.asin(span / r)


def arcade(col, stone):
    """The arcade front between this pier and the neighbour's: a wall band from the arch up to the
    first floor with a segmental arch in its underside, a stone archivolt following it with a
    keystone, the slab whose underside is the arcade ceiling, and a moulded string course."""
    span = HW - PIER / 2 - 0.4                 # the brackets take 0.4 off each side
    r, zc, a0 = _seg(span)
    n = 8

    def band(bm):
        pts = [(-HW, F0), (-HW, ARCH_SPRING - 0.12), (-span, ARCH_SPRING - 0.12)]
        for i in range(n + 1):
            a = -a0 + 2 * a0 * i / n
            pts.append((r * math.sin(a), zc + r * math.cos(a)))
        pts += [(span, ARCH_SPRING - 0.12), (HW, ARCH_SPRING - 0.12), (HW, F0)]
        bm_solid(bm, pts, PIER_Y - 0.2, 0.1)
    flat('arcade_band', col, band, 'main')

    def archivolt(bm):
        for i in range(n):
            a = -a0 + 2 * a0 * i / n
            b = -a0 + 2 * a0 * (i + 1) / n
            p = [(r * math.sin(a), zc + r * math.cos(a)), (r * math.sin(b), zc + r * math.cos(b)),
                 ((r + 0.2) * math.sin(b), zc + (r + 0.2) * math.cos(b)), ((r + 0.2) * math.sin(a), zc + (r + 0.2) * math.cos(a))]
            bm_solid(bm, p, PIER_Y - 0.27, PIER_Y - 0.19)
        bm_box(bm, (0.3, 0.12, 0.44), (0, PIER_Y - 0.27, ARCH_SPRING + ARCH_RISE + 0.12))   # keystone
    flat('arcade_archivolt', stone, archivolt, 'main')

    flat('arcade_slab', col, lambda bm: bm_box(bm, (W, 3.7, F0 - CEIL), (0, 1.45, CEIL + (F0 - CEIL) / 2)), 'main')

    def course(bm):
        bm_box(bm, (W, 0.34, 0.1), (0, PIER_Y - 0.25, F0 - 0.24))
        bm_box(bm, (W, 0.44, 0.16), (0, PIER_Y - 0.22, F0 - 0.1))
    trim('arcade_course', stone, course, 'main')


def shop_front(col, stone, wood, side_col):
    """The shop front at the arcade's back (dihua-07): a stone door frame with a moulded lintel, a
    blank name plaque above it (text stays canvas in JS), a lattice transom, and six timber panel
    doors — the outer two pairs closed, the middle two folded back so the shop stands open."""
    F = S.face_frame(0, 3.2)
    ow, oh = 3.2, 2.75                        # door opening
    c = cutter('shop_open', 'ink', lambda bm: bm_solid(bm, rect_pts(ow, oh, WALK + 0.02), -0.5, 0.36, F @ Matrix.Translation((CX, 0, 0))))
    solid('shop_wall', col, lambda bm: bm_box(bm, (W, 0.4, CEIL - WALK), (0, 3.4, WALK + (CEIL - WALK) / 2)),
          cutters=(c,), group='main', bevel=0.0, smooth=False)

    def sides(bm):
        for x in (-HW + .09, HW - .09):
            bm_box(bm, (.18, DEPTH - 3.4, CEIL - WALK), (x, (DEPTH + 3.4) / 2, WALK + (CEIL - WALK) / 2))
    flat('shop_sides', side_col, sides, 'main')

    def frame(bm):
        z1 = WALK + oh
        for s in (-1, 1):
            bm_box(bm, (0.22, 0.12, oh), (CX + s * (ow / 2 + 0.11), 3.16, WALK + oh / 2))       # jambs
            bm_box(bm, (0.3, 0.16, 0.24), (CX + s * (ow / 2 + 0.11), 3.15, WALK + 0.12))       # bases
        bm_box(bm, (ow + 0.5, 0.16, 0.2), (CX, 3.15, z1 + 0.1))                             # lintel
        bm_box(bm, (ow + 0.66, 0.24, 0.1), (CX, 3.12, z1 + 0.25))                           # its cornice
        bm_box(bm, (2.3, 0.1, 0.42), (CX, 3.14, z1 + 0.58))                                 # name plaque
        bm_box(bm, (2.5, 0.14, 0.07), (CX, 3.13, z1 + 0.82))
    flat('shop_frame', stone, frame, 'main')

    def doors(bm):
        lw = ow / 6
        zb = WALK + 0.02
        dh = oh - 0.5                          # leaves stop under the transom
        for i in (0, 1, 4, 5):                 # closed leaves
            x = CX - ow / 2 + lw * (i + 0.5)
            bm_box(bm, (lw - 0.03, 0.06, dh), (x, 3.27, zb + dh / 2))
            for zz, hh in ((0.18, 0.42), (0.8, 1.15)):
                bm_box(bm, (lw - 0.2, 0.05, hh), (x, 3.22, zb + zz + hh / 2))            # raised panels
        for s in (-1, 1):                      # the middle leaves folded back into the shop
            x = CX + s * (lw - 0.06)
            bm_box(bm, (0.06, lw - 0.03, dh), (x, 3.32 + lw / 2, zb + dh / 2))
    flat('shop_doors', wood, doors, 'main')

    def transom(bm):
        z0, z1 = WALK + oh - 0.46, WALK + oh - 0.02
        bm_box(bm, (ow, 0.07, 0.06), (CX, 3.28, z0))
        for i in range(1, 9):
            bm_box(bm, (0.04, 0.05, z1 - z0), (CX - ow / 2 + i * ow / 9, 3.29, (z0 + z1) / 2))
        bm_box(bm, (ow, 0.05, 0.04), (CX, 3.29, (z0 + z1) / 2))
    flat('shop_transom', wood, transom, 'main')


# ─────────────────────────────────────────────────────────────────────────────
# the upper floors
# ─────────────────────────────────────────────────────────────────────────────
def window_xs(n):
    """Window centres across the clear span: two (閩南) or three (洋樓 / 巴洛克)."""
    if n == 2:
        return (CX - 1.0, CX + 1.0)
    return (CX - 1.38, CX, CX + 1.38)


def upper_floor(st, z0, group):
    """One upper storey, built at its real z so main and storey read the same when stacked.
    st is the style dict (see build_bay)."""
    sfx = '' if group == 'main' else '_s'
    col, tc = st['wall'], st['trim']
    xs = window_xs(st['windows'])
    ww, wh, sill = st['win_w'], st['win_h'], z0 + st['sill']
    kind = st['kind']

    def open_pts():
        if kind == 'arch':
            return arch_pts(ww, wh - ww / 2, n=6)
        if kind == 'seg':          # a shallow segmental head
            pts = [(-ww / 2, 0), (ww / 2, 0)]
            for i in range(5):
                a = i / 4
                pts.append((ww / 2 - a * ww, wh - 0.14 + 0.14 * math.sin(a * math.pi)))
            return pts
        return rect_pts(ww, wh)

    def cut(bm):
        for x in xs:
            bm_solid(bm, open_pts(), -0.3, 0.3, FRONT @ Matrix.Translation((x, 0, sill)))
    c = cutter('win_open' + sfx, 'ink', cut)
    solid('facade' + sfx, col, lambda bm: bm_box(bm, (W, 0.45, FH), (0, 0.225, z0 + FH / 2)),
          cutters=(c,), group=group, bevel=0.0, smooth=False)

    def shell(bm):
        # closed upper volume: the floor is also the visible overhang's soffit, the party walls
        # and the back wall close it for the gaps between unequal neighbours
        bm_box(bm, (W, DEPTH + .4, .25), (0, (DEPTH - .4) / 2, z0 + .125))
        bm_box(bm, (W, .2, FH), (0, DEPTH - .1, z0 + FH / 2))
        for x in (-HW + .09, HW - .09):
            bm_box(bm, (.18, DEPTH, FH), (x, DEPTH / 2, z0 + FH / 2))
    flat('floors' + sfx, col, shell, group)

    # the surrounds: jambs, the head (lintel / arch ring / segmental hood) and the sill
    def surround(bm):
        for x in xs:
            jh = (wh - ww / 2) if kind == 'arch' else wh
            for s in (-1, 1):
                bm_box(bm, (0.14, 0.1, jh), (x + s * (ww / 2 + 0.07), -0.05, sill + jh / 2))
            if kind == 'arch':
                ring(bm, x, sill + jh, ww / 2, ww / 2 + 0.14, -0.1, 0.0, n=6)
            elif kind == 'seg':
                bm_box(bm, (ww + 0.4, 0.14, 0.14), (x, -0.07, sill + wh + 0.07))
            else:
                bm_box(bm, (ww + 0.36, 0.12, 0.24), (x, -0.06, sill + wh + 0.12))     # stone lintel
            bm_box(bm, (ww + 0.34, 0.2, 0.1), (x, -0.08, sill - 0.05))               # sill
    flat('win_surround' + sfx, tc, surround, group)

    def sash(bm):
        for x in xs:
            top = wh - (ww / 2 if kind == 'arch' else 0.14)
            bm_box(bm, (0.05, 0.06, top), (x, 0.24, sill + top / 2))                   # mullion
            for f in (0.36, 0.7, 1.0):
                bm_box(bm, (ww, 0.06, 0.05), (x, 0.24, sill + top * f - (0.025 if f == 1.0 else 0)))
            if kind == 'arch':                                                       # fanlight spokes
                zc = sill + top
                for a in (0.6, 2.54):
                    S.bm_bar(bm, (x, 0.24, zc), (x + ww / 2 * math.cos(a), 0.24, zc + ww / 2 * math.sin(a)), 0.04)
    flat('win_sash' + sfx, st['sash'], sash, group)

    if st.get('shutters'):
        def shutters(bm):
            for x in xs:
                for s in (-1, 1):
                    cx = x + s * (ww / 2 + 0.14 + 0.21)
                    bm_box(bm, (0.4, 0.06, wh - 0.06), (cx, -0.08, sill + wh / 2))
                    for k in range(6):                                                 # louvres
                        bm_box(bm, (0.3, 0.04, 0.05), (cx, -0.12, sill + 0.25 + k * 0.3))
        flat('shutters' + sfx, st['wood'], shutters, group)

    if st.get('balcony'):
        balcony(st, z0, group, sfx)

    # the string course at the head of the storey and the pilaster
    def band(bm):
        bm_box(bm, (W, 0.18, 0.14), (0, -0.07, z0 + FH - 0.32))
        bm_box(bm, (W, 0.3, 0.18), (0, -0.13, z0 + FH - 0.09))
    trim('floor_band' + sfx, tc, band, group, bevel=0.03)
    pilaster(st, z0, group, sfx)
    if st.get('floor_extra'):
        st['floor_extra'](z0, group, sfx, xs)


def balcony(st, z0, group, sfx):
    """The balcony in front of the windows (dihua-01, -05): a moulded slab and a balustrade from
    the bay's edge to the pilaster — turned balusters on the 洋樓 front, an iron grille with a
    lozenge band on the 巴洛克 front."""
    tc = st['trim']
    x0, x1 = -HW + 0.02, HW - 0.42
    yb = -0.48

    def slab(bm):
        bm_box(bm, (x1 - x0, 0.62, 0.14), ((x0 + x1) / 2, -0.29, z0 + 0.07))
        bm_box(bm, (x1 - x0 - 0.1, 0.5, 0.08), ((x0 + x1) / 2, -0.23, z0 - 0.04))
        bm_box(bm, (x1 - x0, 0.14, 0.1), ((x0 + x1) / 2, yb, z0 + 0.95))             # hand rail
        bm_box(bm, (0.16, 0.16, 0.85), (x0 + 0.08, yb, z0 + 0.55))                   # end post
    flat('balcony' + sfx, tc, slab, group)

    def rails(bm):
        n = 11 if st['rail'] == 'baluster' else 9
        for i in range(n):
            x = x0 + 0.3 + i * (x1 - x0 - 0.42) / (n - 1)
            if st['rail'] == 'baluster':
                bm_prism(bm, 4, 0.04, 0.07, z0 + 0.14, z0 + 0.42, rot=math.pi / 4, center=(x, yb))
                bm_prism(bm, 4, 0.07, 0.035, z0 + 0.42, z0 + 0.9, rot=math.pi / 4, center=(x, yb))
            else:
                bm_box(bm, (0.03, 0.03, 0.76), (x, yb, z0 + 0.52))
        if st['rail'] != 'baluster':
            for z in (0.26, 0.8):
                bm_box(bm, (x1 - x0, 0.04, 0.04), ((x0 + x1) / 2, yb, z0 + z))
            for i in range(3):                                                         # lozenges
                cx = x0 + 0.75 + i * (x1 - x0 - 1.3) / 2
                pts = ((-0.24, 0), (0, 0.2), (0.24, 0), (0, -0.2))
                for k in range(4):
                    (ax, az), (bx, bz) = pts[k], pts[(k + 1) % 4]
                    S.bm_bar(bm, (cx + ax, yb, z0 + 0.53 + az), (cx + bx, yb, z0 + 0.53 + bz), 0.03)
    flat('balusters' + sfx, st['rail_col'], rails, group)


def pilaster(st, z0, group, sfx):
    """The pilaster at the bay's +X edge over one storey (the next bay supplies -X): a plinth, the
    shaft with a sunk panel, a necking and a capital that steps out under the string course."""
    x = HW - 0.2

    def b(bm):
        bm_box(bm, (0.5, 0.42, 0.24), (x, -0.16, z0 + 0.12))                              # plinth
        bm_box(bm, (0.4, 0.34, FH - 0.84), (x, -0.12, z0 + 0.24 + (FH - 0.84) / 2))        # shaft
        bm_box(bm, (0.48, 0.4, 0.12), (x, -0.15, z0 + FH - 0.54))                          # necking
        bm_box(bm, (0.56, 0.46, 0.14), (x, -0.18, z0 + FH - 0.42))                         # capital
    trim('pilaster' + sfx, st['pil'], b, group, bevel=0.03)
    flat('pilaster_panel' + sfx, st['wall'] if st['pil'] != st['wall'] else st['trim'],
         lambda bm: bm_box(bm, (0.2, 0.04, FH - 1.4), (x, -0.3, z0 + 0.5 + (FH - 1.4) / 2)), group)


# ─────────────────────────────────────────────────────────────────────────────
# the roof line
# ─────────────────────────────────────────────────────────────────────────────
def roof_slab(col):
    flat('roof', 'ink', lambda bm: bm_box(bm, (W, DEPTH + .4, .3), (0, (DEPTH - .4) / 2, TOP + .15)), 'crest')

    def returns(bm):
        for x in (-HW + .11, HW - .11):
            bm_box(bm, (.22, DEPTH, .64), (x, DEPTH / 2, TOP + .32))
            bm_box(bm, (.34, DEPTH + .1, .12), (x, DEPTH / 2, TOP + .69))
        bm_box(bm, (W, .22, .64), (0, DEPTH - .11, TOP + .32))
        bm_box(bm, (W, .34, .12), (0, DEPTH - .11, TOP + .69))
    flat('parapet_returns', col, returns, 'crest')


def cornice(col, z, depth=0.5):
    """A three-step moulded cornice whose top is at z."""
    def b(bm):
        bm_box(bm, (W, depth * 0.55, 0.1), (0, -depth * 0.2, z - 0.42))
        bm_box(bm, (W, depth * 0.75, 0.12), (0, -depth * 0.32, z - 0.3))
        bm_box(bm, (W, depth, 0.18), (0, -depth * 0.45, z - 0.09))
    trim('cornice', col, b, 'crest', bevel=0.03)


def dentils(col, z, n=14, size=0.12, proud=0.12, y=-0.1):
    """A row of small teeth under a cornice, flat-shaded."""
    def b(bm):
        step = (W - 0.3) / (n - 1)
        for i in range(n):
            bm_box(bm, (size, proud, size), (-HW + 0.15 + i * step, y - proud / 2, z))
    flat('dentils', col, b, 'crest')


def build_bay(crest_parts, **st):
    """Assemble one bay. Style keys: wall, trim, pil, sash, wood (shutters), door_wood, stone, shop_wall, shop_frame,
    pier_col, windows (2|3), kind ('rect'|'arch'|'seg'), win_w, win_h, sill, shutters, balcony,
    rail ('baluster'|'iron'), rail_col, floor_extra(z0, group, sfx, xs). crest_parts() adds the
    style's parapet in 'crest'."""
    st.setdefault('trim', 'bone')
    st.setdefault('pil', st['trim'])
    st.setdefault('sash', 'bone')
    st.setdefault('wood', 'ink')
    st.setdefault('door_wood', 'brick')
    st.setdefault('stone', 'walk')
    st.setdefault('pier_col', st['wall'])
    st.setdefault('shop_wall', 'walk')        # the ground floor shop front is stone-faced (dihua-07)
    st.setdefault('shop_frame', st['trim'])
    st.setdefault('rail_col', st['trim'])
    pier(st['pier_col'], st['stone'])
    arcade(st['wall'], st['stone'])
    shop_front(st['shop_wall'], st['shop_frame'], st['door_wood'], st['wall'])
    upper_floor(st, F0, 'main')
    upper_floor(st, STOREY_Z, 'storey')
    roof_slab(st['wall'])
    crest_parts()


PREVIEW_CAM = ((7.5, -12.5, 6.2), (0, 0.5, 6.0), 50)   # whole bay in frame, from the street side
