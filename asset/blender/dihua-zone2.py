"""Dihua reference bays: deep arcades, fanlights, pierced parapets and open shops.
Detail pass blender-detail 2026-11-01 (research/reference/dadao/img dihua-01, -02, -06):
curved stone brackets and keystones on the arcade, sill consoles and keystones on the upper
windows, end pedestals with ball finials and a pedimented name plaque on the 洋樓 parapet, urns,
a finial, a medallion ring and a sunk field on the 巴洛克 gable, a ridge roll and eave board on
the 閩南 roof. Node names (arcade, min, yang, baroque, yang_crest, baroque_crest) and every
dimension unchanged; scene-dadao.js lines ~185-358 look them up.
Blender --background --python asset/blender/dihua-zone2.py -- --out asset/models/dihua-zone2.glb
Dimensions are an interpretation of refs/1,2,5,6, not an address survey.
"""
import math
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_solid, solid
from mathutils import Matrix

W, TOP = 4.6, 8.35
DEPTH = 11.8  # FACE 6.2 to the existing rear building line at world |x| 18

def boxes(name, color, entries, group):
    solid(name, color, lambda bm: [bm_box(bm, size, pos) for size, pos in entries], bevel=0, group=group, smooth=False)


def arch(bm, cx, base, rx, rz, thick, y=-.28, depth=.42, steps=16):
    # Radial voussoirs with tiny mortar gaps; a true opening through the wall.
    for i in range(steps):
        a, b = i*math.pi/steps+.012, (i+1)*math.pi/steps-.012
        p=[(cx+rx*math.cos(a),base+rz*math.sin(a)),
           (cx+(rx+thick)*math.cos(a),base+(rz+thick)*math.sin(a)),
           (cx+(rx+thick)*math.cos(b),base+(rz+thick)*math.sin(b)),
           (cx+rx*math.cos(b),base+rz*math.sin(b))]
        bm_solid(bm,p,y,y+depth)


def arcade(style):
    col='brick' if style!='baroque' else 'walk'
    entries=[]
    # Two ground arches and a continuous 3.2 m covered pedestrian passage.
    for x in (-2.18,0,2.18):
        entries += [((.28,.62,2.9),(x,-.16,1.67)),((.44,.8,.18),(x,-.16,.31)),((.45,.78,.16),(x,-.16,3.02))]
    entries += [((W,3.9,.22),(0,1.48,3.98)),((W,.38,.35),(0,0,3.69)),((W,5.6,.12),(0,2.5,.24)),((W,.15,3.5),(0,5,1.99))]
    # Close the shop behind the arcade, leaving the covered pedestrian passage open.
    entries += [((.18,DEPTH-3.2,3.58),(x,(DEPTH+3.2)/2,2.01)) for x in (-2.21,2.21)]
    entries += [((W,DEPTH+.5,.18),(0,(DEPTH-.5)/2,3.91))]
    boxes(style+'_arcade',col,entries,style)
    solid(style+'_arches',col,lambda bm:[arch(bm,x,2.75,.93,.84,.18) for x in (-1.09,1.09)],bevel=0,group=style,smooth=False)
    # Open interior, partition piers and folded shutters, not a lattice over a solid door.
    entries=[]
    for x in (-2.08,2.08):
        entries.append(((.28,2.3,3.5),(x,4.1,1.99)))
        for k in range(4): entries.append(((.09,.13,2.6),(x+(k-1.5)*.09,2.78,1.65)))
    for z in (1.0,2.1): entries.append(((3.9,.2,.09),(0,4.72,z)))
    boxes(style+'_timber','ink',entries,style)
    entries=[((3.8,.2,.42),(0,2.82,3.28))]
    # Two tiers of display bins, lifted off the footpath behind the arches.
    for z in (.65,1.18):
        entries.append(((3.75,.82,.09),(0,3.06,z)))
        for j in range(9): entries.append(((.045,.82,.5),(-1.84+j*.46,3.06,z+.25)))
    boxes(style+'_bins','bone',entries,style)
    for k,color in enumerate(('lamp','brick','haze')):
        entries=[]
        for j in range(8):
            if j%3!=k: continue
            for z in (.91,1.44):
                entries.append(((.38,.68,.27),(-1.61+j*.46,3.06,z)))
                entries.append(((.23,.04,.13),(-1.61+j*.46,2.62,z+.17)))
        boxes(style+'_goods_'+color,color,entries,style)


def upper(style,group,z0=4.1):
    col='brick' if style=='yang' else 'walk'
    # Wall assembled around three tall windows: narrow, wide, narrow as refs/2.
    entries=[((W,.42,.85),(0,.17,z0+.425)),((W,.42,.68),(0,.17,z0+3.81))]
    for x,w in ((-2.15,.3),(-.91,.25),(.91,.25),(2.15,.3)):
        entries.append(((w,.42,2.62),(x,.17,z0+2.16)))
    # Continuous floor/soffit, both party walls and rear wall. Unequal neighbours
    # expose these faces all along the camera path, not just at the entrance.
    entries += [((W,DEPTH+.44,.18),(0,(DEPTH-.44)/2,z0+.09)),
                ((W,.18,4.25),(0,DEPTH-.09,z0+2.125))]
    entries += [((.18,DEPTH,4.25),(x,DEPTH/2,z0+2.125)) for x in (-2.21,2.21)]
    boxes(group+'_wall',col,entries,group)
    windows=[(-1.52,.88),(0,1.5),(1.52,.88)]
    entries=[]
    for x,w in windows:
        entries.append(((w,.08,2.42),(x,.22,z0+2.07)))
    boxes(group+'_glass','ink',entries,group)
    entries=[]
    for x,w in windows:
        for dx in (-w/2,0,w/2): entries.append(((.055,.13,2.5),(x+dx,-.05,z0+2.08)))
        for j in range(5): entries.append(((w+.1,.13,.045),(x,-.05,z0+.85+j*.6)))
        entries += [((w+.2,.3,.12),(x,-.15,z0+.8)),((w+.24,.14,.07),(x,-.15,z0+.1))]
        # Recessed stone plaques below the windows, bordered on all four sides.
        for dx in (-w/2,w/2): entries.append(((.06,.14,.46),(x+dx,-.17,z0+.46)))
        for z in (.24,.67): entries.append(((w,.14,.06),(x,-.17,z0+z)))
    boxes(group+'_sash','bone',entries,group)
    solid(group+'_fanlights',col,lambda bm:[arch(bm,x,z0+3.05,w/2,.38,.13,y=-.15,depth=.25,steps=12) for x,w in windows],bevel=0,group=group,smooth=False)
    solid(group+'_spokes','bone',lambda bm:[bm_bar(bm,(x,.02,z0+3.05),(x+w/2*math.cos(a),.02,z0+3.05+.34*math.sin(a)),.025) for x,w in windows for a in (.4,.85,1.3,1.85,2.3,2.75)],bevel=0,group=group)
    entries=[]
    for x in (-2.18,2.18):
        entries += [((.25,.24,3.7),(x,-.18,z0+2.0)),((.4,.34,.14),(x,-.2,z0+3.8))]
        for i in range(3): entries.append(((.026,.04,2.8),(x+(i-1)*.065,-.315,z0+2)))
    for z,dep,h in ((z0,.42,.16),(z0+3.88,.46,.1),(z0+4.1,.6,.18)):
        entries.append(((W,dep,h),(0,-.14,z)))
    for i in range(21): entries.append(((.09,.18,.12),(-2.2+i*.22,-.36,z0+3.97)))
    # The front string courses turn the corner; shallow piers break up plaster
    # flanks without inventing windows through a shared party wall.
    for x in (-2.22,2.22):
        for z,h in ((z0,.16),(z0+3.88,.1),(z0+4.1,.18)):
            entries.append(((.16,DEPTH+.44,h),(x,(DEPTH-.44)/2,z)))
        for y in (.24,3.2,7.4,DEPTH-.2):
            entries.append(((.18,.24,3.7),(x,y,z0+2)))
    boxes(group+'_trim','bone',entries,group)
    boxes(group+'_drain','haze',[((.065,.065,4.15),(2.01,-.42,z0+2.075))],group)


def crest(style):
    group=style+'_crest'
    if style=='yang':
        # Pierced brick parapet with lozenge vents, reference 2. No solid backing.
        boxes('vent_rails','brick',[((W,.42,.18),(0,0,TOP+.12)),((W,.5,.16),(0,0,TOP+.94))]+[((.24,.42,.7),(x,0,TOP+.55)) for x in (-2.15,-.8,.8,2.15)],group)
        solid('ceramic_vents','glass',lambda bm:[bm_bar(bm,(x+dx,-.23,TOP+.54+dz),(x+dx1,-.23,TOP+.54+dz1),.055) for x in (-1.78,-1.28,-.5,0,.5,1.28,1.78) for (dx,dz),(dx1,dz1) in zip([(0,-.28),(.23,0),(0,.28),(-.23,0)],[(.23,0),(0,.28),(-.23,0),(0,-.28)])],bevel=0,group=group)
    else:
        profile=[(-2.3,TOP),(2.3,TOP),(2.3,TOP+.45),(1.4,TOP+.45),(1.15,TOP+.72),(.85,TOP+.8),(.65,TOP+1.25),(0,TOP+1.55),(-.65,TOP+1.25),(-.85,TOP+.8),(-1.15,TOP+.72),(-1.4,TOP+.45),(-2.3,TOP+.45)]
        solid('gable','walk',lambda bm:bm_solid(bm,profile,0,.4),bevel=.025,group=group)
        solid('gable_coping','bone',lambda bm:[bm_bar(bm,(a[0],-.12,a[1]),(b[0],-.12,b[1]),.09) for a,b in zip(profile[2:],profile[3:])],bevel=0,group=group)
        boxes('tablet','ink',[((.7,.04,.4),(0,-.03,TOP+.7))],group)
        solid('scrolls','bone',lambda bm:[bm_bar(bm,(s*(1.12+.22*math.cos(a)),-.12,TOP+.75+.22*math.sin(a)),(s*(1.12+.22*math.cos(a+.4)),-.12,TOP+.75+.22*math.sin(a+.4)),.065) for s in (-1,1) for a in [i*.4 for i in range(15)]],bevel=0,group=group)
    boxes(group+'_roof','ink',[((W,DEPTH+.44,.14),(0,(DEPTH-.44)/2,TOP))],group)
    col = 'brick' if style == 'yang' else 'walk'
    boxes(group+'_parapet_returns',col,
          [((.22,DEPTH,.48),(x,DEPTH/2,TOP+.24)) for x in (-2.19,2.19)] +
          [((W,.22,.48),(0,DEPTH-.11,TOP+.24))],group)
    # Match materials already present in each crest so this costs no new draw call.
    cap = 'brick' if style == 'yang' else 'bone'
    boxes(group+'_coping_returns',cap,
          [((.34,DEPTH+.1,.12),(x,DEPTH/2,TOP+.5)) for x in (-2.19,2.19)] +
          [((W,.34,.12),(0,DEPTH-.11,TOP+.5))],group)


def minnan():
    def roof(bm):
        for y0,y1,z0,z1 in ((-.6,2.2,4.0,5.25),(2.2,5,5.25,4.0)):
            bm_solid(bm,[(y0,z0),(y1,z1),(y1,z1-.13),(y0,z0-.13)],-2.3,2.3,Matrix.Rotation(math.pi/2,4,'Z'))
    solid('min_roof','brick',roof,bevel=0,group='min')
    def gable_ends(bm):
        for x0,x1 in ((-2.3,-2.12),(2.12,2.3)):
            bm_solid(bm,[(-.6,3.87),(5,3.87),(2.2,5.25)],x0,x1,Matrix.Rotation(math.pi/2,4,'Z'))
    solid('min_gable_ends','brick',gable_ends,bevel=0,group='min',smooth=False)
    boxes('min_soffit','haze',[((W,DEPTH+.6,.16),(0,(DEPTH-.6)/2,3.91))], 'min')
    boxes('min_rear_coping','brick',
          [((.22,DEPTH-5,.3),(x,(DEPTH+5)/2,4.13)) for x in (-2.19,2.19)] +
          [((W,.22,.3),(0,DEPTH-.11,4.13))], 'min')
    solid('min_tile_rolls','haze',lambda bm:[bm_bar(bm,(x,-.6,4.04),(x,2.2,5.29),.06) for x in [-2.25+i*.15 for i in range(31)]],bevel=0,group='min')
    boxes('min_purlins','ink',[((W,.16,.16),(0,2.2,5.32)),((W,.15,.18),(0,-.55,3.94))], 'min')


def arcade_detail(group='arcade'):
    # Curved stone brackets under each arch spring (dihua-06) and a keystone on each arch.
    def brackets(bm):
        for px, s in ((-2.18, 1), (0, -1), (0, 1), (2.18, -1)):
            fx = px + s * .14
            pts = [(fx, 2.75), (fx, 2.2)]
            for t in (.35, .7, 1.0):
                pts.append((fx + s * .3 * (1 - math.cos(t * math.pi / 2)) ** .7, 2.2 + .5 * math.sin(t * math.pi / 2)))
            pts.append((fx + s * .32, 2.75))
            if s > 0:
                pts = pts[::-1]
            bm_solid(bm, pts, -.36, .04)
    solid('arcade_brackets', 'walk', brackets, bevel=.025, group=group)
    boxes('arcade_keys', 'walk', [((.22, .5, .34), (x, -.08, 3.72)) for x in (-1.09, 1.09)], group)


def upper_detail(style, group, z0=4.1):
    # Keystones over the fanlights and a pair of consoles under each sill.
    entries = []
    for x, w in ((-1.52, .88), (0, 1.5), (1.52, .88)):
        entries.append(((.2, .2, .3), (x, -.2, z0 + 3.05 + .44)))
        for dx in (-w / 2 + .05, w / 2 - .05):
            entries.append(((.1, .2, .2), (x + dx, -.18, z0 + .64)))
    boxes(group + '_keys', 'bone', entries, group)


def crest_detail(style):
    group = style + '_crest'
    if style == 'yang':
        # end pedestals with ball finials, and a pedimented blank name plaque in the middle
        boxes('yang_pedestals', 'brick', [((.4, .5, 1.0), (x, 0, TOP + .5)) for x in (-2.1, 2.1)], group)
        boxes('yang_pedestal_caps', 'bone', [((.5, .58, .12), (x, 0, TOP + 1.06)) for x in (-2.1, 2.1)], group)
        solid('yang_balls', 'bone', lambda bm: [S.bm_sphere(bm, .15, (x, 0, TOP + 1.27), 8, 6) for x in (-2.1, 2.1)], bevel=0, group=group)
        boxes('yang_plaque', 'bone', [((1.0, .5, .5), (0, 0, TOP + 1.25)), ((1.2, .56, .08), (0, 0, TOP + 1.03))], group)
        solid('yang_plaque_pediment', 'bone', lambda bm: bm_solid(bm, [(-.62, TOP + 1.5), (.62, TOP + 1.5), (0, TOP + 1.82)], -.24, .24), bevel=.025, group=group)
    else:
        # sunk field inside the gable, a medallion ring round the tablet, urns on the
        # shoulders and a finial on the apex (dihua-01, -02)
        field = [(-1.35, TOP + .5), (1.35, TOP + .5), (1.1, TOP + .68), (.82, TOP + .76), (.6, TOP + 1.18), (0, TOP + 1.45), (-.6, TOP + 1.18), (-.82, TOP + .76), (-1.1, TOP + .68)]
        solid('gable_field', 'bone', lambda bm: bm_solid(bm, field, -.06, 0), bevel=0, group=group, smooth=False)
        solid('tablet_ring', 'walk', lambda bm: S.bm_prism(bm, 12, .5, .5, 0, .08, rot=0,
              xform=Matrix.Translation((0, -.06, TOP + .9)) @ Matrix.Rotation(math.pi / 2, 4, 'X')), bevel=0, group=group)
        prof = [(0, 0), (.1, 0), (.07, .05), (.14, .18), (.1, .32), (.05, .35), (.08, .4), (0, .44)]
        def urns(bm):
            for x in (-1.85, 1.85):
                S.bm_lathe(bm, prof, n=6, xform=Matrix.Translation((x, .1, TOP + .45)))
            S.bm_lathe(bm, [(0, 0), (.13, 0), (.08, .1), (.12, .22), (.04, .34), (0, .44)], n=6, xform=Matrix.Translation((0, .1, TOP + 1.53)))
        solid('urns', 'bone', urns, bevel=0, group=group)


def minnan_detail():
    # ridge roll along the top of the tile slope and a fascia board at the eave
    solid('min_ridge', 'haze', lambda bm: bm_bar(bm, (-2.3, 2.2, 5.33), (2.3, 2.2, 5.33), .14), bevel=0, group='min')
    boxes('min_eave_board', 'ink', [((W, .06, .18), (0, -.66, 3.96))], 'min')


def build():
    arcade('arcade')
    arcade_detail()
    minnan()
    minnan_detail()
    for style in ('yang','baroque'):
        upper(style,style)
        upper_detail(style, style)
        crest(style)
        crest_detail(style)

if __name__=='__main__':
    S.run(build,camera=((9,-13,7),(0,1,4.3),50))
