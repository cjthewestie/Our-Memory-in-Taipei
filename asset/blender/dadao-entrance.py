"""年貨大街 entrance portal and parked scooter for zone 1 (blender-detail pass, 2026-11-01).

Reference: research/blender-detail/models/ref-dadao-entrance/nianhuo-archway-real.png, CJ's own
photograph of the real 台北年貨大街 gate on 迪化街 (filed 2026-09-24 as 「年貨大街那個拱門」).
What the photo shows, and what this file builds from it:
  · a temporary box-section portal over the whole road — two square piers about as deep as they
    are wide and a headline band about a quarter of the total height, all skinned in printed
    vinyl panels whose vertical seams read across the band (7 panels) and up the piers;
  · the pier wrap: the lower part of each pier carries a darker plate cut on a diagonal that
    rises toward the road, with a chain of 斗方 diamonds (red with a gold rim) down the front;
  · a gold ring medallion left of the headline (the zodiac art inside it is undated, so the
    ring stays plain); the headline itself is a canvas print in scene-dadao.js;
  · on each pier's inner face a framed dark notice board low down and illustrated shophouse
    artwork above it (here: low-relief blocks, bone facades and gold roofs);
  · a dark soffit line under the band, and red and white lanterns on wires just behind it
    (here: one lantern rail with hooks under the band);
  · the temporary structure is braced from behind: steel outriggers to water-ballast blocks.
Omitted: the inflatable zodiac mascot and the isometric shophouse cut-out on top (both change
every year); the violet wrap colour, outside the page palette — the darker plate uses ink.

Scene contract (scene-dadao.js ~L516-527 and the prints at ~L533-534): node `portal` at x 0,
z -150; footprint x ±7.03, depth ±0.58 plus the rear outriggers; top 8.27. The band front face
stays at y -0.575, behind the 台北年貨大街 print (three z -149.39 = Blender y -0.61); the pier
diamonds stop at y -0.675, behind the 迎春納福 prints (y -0.72). Node `scooter` is unchanged.
Budget: portal 8,000 triangles.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_solid, bm_lathe, solid, circle_pts
from mathutils import Matrix

PX, PW, PD = 6.35, 1.35, 1.15          # pier centre x, width, depth
XI, XO = PX - PW / 2, PX + PW / 2      # inner / outer face x (5.675, 7.025)
Y0 = PD / 2                            # 0.575
ZB, ZT = 6.4, 8.2                      # band bottom / top
LX = [-5.0 + i * 1.0 for i in range(11)]   # lantern hooks along the rail


def boxes(name, col, items, group, bevel=.025):
    # an unbevelled box is shaded flat; smooth shading on its six faces would grade like a sphere
    solid(name, col, lambda bm: [bm_box(bm, size, pos) for size, pos in items], bevel=bevel, group=group, smooth=bevel > 0)


def side_plate(bm, pts, x0, x1):
    """A plate on a pier's side face: pts are (y, z) on the face, the plate spans world x0..x1.
    Rotating +90° about Z sends local (u, v) to world (-v, u), so local y runs -x1..-x0."""
    bm_solid(bm, pts, -x1, -x0, Matrix.Rotation(math.pi / 2, 4, 'Z'))


def build_portal():
    G = 'portal'
    # structure core: piers and band; the band core sits 3 cm back so its vinyl panels stand proud
    boxes('portal', 'verm', [((PW, PD, ZB), (s * PX, 0, ZB / 2)) for s in (-1, 1)]
          + [((2 * XO, PD - .06, ZT - ZB), (0, 0, (ZB + ZT) / 2))], G, bevel=S.BEVEL)
    # band vinyl panels, 7 across front and back with 4 cm seams, and a coping on top
    n, gap = 7, .04
    w = (2 * XO - (n - 1) * gap) / n
    panels = []
    for i in range(n):
        x = -XO + w / 2 + i * (w + gap)
        for sy in (-1, 1):
            panels.append(((w, .03, ZT - ZB - .04), (x, sy * (Y0 - .015), (ZB + ZT) / 2)))
    panels.append(((2 * XO + .06, PD + .06, .07), (0, 0, ZT + .035)))
    # pier vinyl panels: three tiers up the front, back and outer face, seams at z 2.2 and 4.3
    for s in (-1, 1):
        for z0, z1 in [(.2, 2.18), (2.22, 4.28), (4.32, 6.36)]:
            for sy in (-1, 1):
                panels.append(((PW - .04, .025, z1 - z0), (s * PX, sy * (Y0 + .0125), (z0 + z1) / 2)))
            panels.append(((.025, PD - .04, z1 - z0), (s * (XO + .0125), 0, (z0 + z1) / 2)))
    boxes('vinyl', 'verm', panels, G)

    # the lower wrap: darker plate cut on a diagonal rising toward the road, front and outer face
    def wrap(bm):
        for s in (-1, 1):
            zi, zo = 3.1, 3.9            # top edge at the inner / outer corner: higher outside, as in the photo
            front = [(s * XI, .2), (s * XO, .2), (s * XO, zo), (s * XI, zi)]
            bm_solid(bm, front if s > 0 else front[::-1], -Y0 - .05, -Y0 - .025)
            side_plate(bm, [(-Y0, .2), (Y0, .2), (Y0, zo - .6), (-Y0, zo)], *sorted((s * (XO + .025), s * (XO + .05))))
    solid('wrap', 'ink', wrap, bevel=.025, group=G)
    # 斗方 diamonds down each pier front: gold rim, red field (they sit behind the 迎春納福 print)
    def diamonds(r, y0, y1):
        return lambda bm: [bm_solid(bm, [(s * PX, z - r), (s * PX + r, z), (s * PX, z + r), (s * PX - r, z)], y0, y1)
                           for s in (-1, 1) for z in (1.15, 2.05, 2.95, 3.85, 4.75)]
    solid('diamond_rims', 'lamp', diamonds(.42, -Y0 - .08, -Y0 - .05), bevel=.025, group=G)
    solid('diamonds', 'verm', diamonds(.34, -Y0 - .1, -Y0 - .08), bevel=0, group=G, smooth=False)
    # base kick round each pier
    boxes('kick', 'ink', [((PW + .12, PD + .12, .2), (s * PX, 0, .1)) for s in (-1, 1)], G)

    # gold ring medallion left of the headline (plain: the zodiac art in it changes every year)
    mx, mz = -4.55, 7.3
    solid('medallion_ring', 'lamp', lambda bm: bm_solid(bm, [(mx + x, mz + z) for x, z in circle_pts(.62, 20)][::-1], -Y0 - .04, -Y0 - .005), bevel=0, group=G, smooth=False)
    solid('medallion', 'verm', lambda bm: bm_solid(bm, [(mx + x, mz + z) for x, z in circle_pts(.5, 20)][::-1], -Y0 - .055, -Y0 - .035), bevel=0, group=G, smooth=False)

    # inner faces: framed dark notice board low, illustrated shophouse relief above
    frames, boards, facades, roofs, wins = [], [], [], [], []
    for s in (-1, 1):
        frames.append(((.04, .82, 1.9), (s * (XI - .02), -.05, 1.35)))
        boards.append(((.03, .7, 1.78), (s * (XI - .045), -.05, 1.35)))
        for y, z, h in [(-.12, 2.7, 1.0), (.1, 3.95, .9), (-.08, 5.1, .8)]:   # staggered like the artwork, filling the face
            facades.append(((.06, .8, h), (s * (XI - .03), y, z + h / 2)))
            roofs.append((s, y, z + h, .92))
            for j in (-1, 0, 1):
                wins.append(((.03, .14, .3), (s * (XI - .065), y + j * .24, z + h * .55)))
    boxes('notice_frame', 'bone', frames, G)
    boxes('notice_board', 'ink', boards, G, bevel=0)
    boxes('art_facades', 'bone', facades, G)
    boxes('art_windows', 'ink', wins, G, bevel=0)
    solid('art_roofs', 'lamp', lambda bm: [side_plate(bm, [(y - w / 2, z), (y + w / 2, z), (y, z + .3)], *sorted((s * (XI - .1), s * XI)))
                                           for s, y, z, w in roofs], bevel=0, group=G, smooth=False)

    # soffit: the dark line under the band's front edge, a lantern rail with hooks and hangers
    solid('soffit', 'ink', lambda bm: [bm_box(bm, (2 * XI, .1, .06), (0, -Y0 + .06, ZB - .03)),
                                       bm_box(bm, (2 * XI, .06, .06), (0, .2, ZB - .12))]
          + [bm_bar(bm, (x, .2, ZB - .15), (x, .2, ZB - .33), .025) for x in LX]
          + [bm_bar(bm, (x, .2, ZB - .15), (x, .2, ZB), .04) for x in (-5.45, 0, 5.45)], bevel=0, group=G, smooth=False)
    # lanterns: red and white in turn, as in the photo
    prof = [(0, -.26), (.09, -.255), (.2, -.19), (.25, -.06), (.25, .06), (.2, .19), (.09, .255), (0, .26)]
    for col, xs in (('verm', LX[0::2]), ('bone', LX[1::2])):
        solid('lanterns_' + col, col, lambda bm, xs=xs: [bm_lathe(bm, prof, 10, Matrix.Translation((x, .2, ZB - .6))) for x in xs], bevel=0, group=G)
    solid('lantern_caps', 'lamp', lambda bm: [bm_box(bm, (.17, .17, .05), (x, .2, ZB - .6 + z)) for x in LX for z in (.27, -.27)], bevel=0, group=G, smooth=False)

    # behind: steel outriggers from each pier back to water-ballast blocks on the road; kept within
    # Blender y 1.85 (three z -151.85) so the kerb bikes/scooters seeded from z -153 stay clear
    def kickers(bm):
        for s in (-1, 1):
            for x in (s * (PX - .45), s * (PX + .45)):
                bm_bar(bm, (x, Y0, 4.6), (x, 1.5, .45), .08)
                bm_bar(bm, (x, Y0, 1.6), (x, 1.3, .45), .06)
    solid('outriggers', 'haze', kickers, bevel=0, group=G, smooth=False)
    boxes('ballast', 'walk', [((1.4, .6, .45), (s * PX, 1.55, .225)) for s in (-1, 1)], G, bevel=S.BEVEL)


def build_scooter():
    # Scooter front toward -Y, two wheels on the centreline. Unchanged from the previous script.
    solid('tyres','ink',lambda bm:[bm_lathe(bm,[(.17,-.055),(.25,-.055),(.27,0),(.25,.055),(.17,.055)],12,Matrix.Translation((0,y,.28))@Matrix.Rotation(math.pi/2,4,'Y')) for y in (-.61,.61)],bevel=0,group='scooter')
    boxes('body','haze',[((.44,.65,.42),(0,.38,.57)),((.45,.7,.1),(0,-.03,.3)),((.4,.15,.7),(0,-.52,.73))],'scooter')
    boxes('saddle','ink',[((.45,.78,.12),(0,.27,.85))],'scooter')
    boxes('lights','bone',[((.25,.1,.15),(0,-.64,1.13)),((.17,.04,.12),(0,.76,.44))],'scooter')
    solid('handlebars','ink',lambda bm:[bm_bar(bm,(-.32,-.53,1.16),(.32,-.53,1.16),.06)]+[bm_bar(bm,(x,-.53,1.16),(x*1.2,-.49,1.4),.025) for x in (-.24,.24)],bevel=0,group='scooter')
    boxes('mirrors','bone',[((.15,.06,.09),(x,-.49,1.43)) for x in (-.29,.29)],'scooter')
    solid('forks','haze',lambda bm:[bm_bar(bm,(x,-.6,.27),(x,-.5,.96),.04) for x in (-.075,.075)],bevel=0,group='scooter')


def build():
    build_portal()
    build_scooter()


if __name__ == '__main__':
    # camera close to the photo's: standing left of the road axis, looking up so the right pier's inner face shows
    S.run(build, camera=((-7.5, -25, 1.7), (.8, 0, 4.0), 36))
