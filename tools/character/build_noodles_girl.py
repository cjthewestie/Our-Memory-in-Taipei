# build_noodles_girl.py — CJ's own character, the Noodles brand girl, as a rigged, animated .glb.
# CJ, 2026-11-21: 「角色沒做好很creepy 給我這個角色」 with his sheet
# ~/Documents/Reference.library/images/MOFKT5JXGSWY4.info/illustration-noodles-girl-three-views-warm-tones.png
#
# From the sheet: a charcoal knit beanie with a knob on top, a black bob that flicks out at the ends
# with blue underneath, thick oval brows, big blue half-lidded eyes, freckles, a warm orange neck,
# an oversized cream sweater. Her face is a painted texture (make_textures.py), not modelled eyeballs:
# that is what keeps her an illustration and not a doll.
# NOT from the sheet: the chest mark (the sheet's three-circle mouse head is Disney's; a noodle bowl
# stands in), and everything below the sweater, which the sheet does not show (rust-red loose
# trousers and dark shoes, taken from the sheet's palette) — (unknown — needs CJ).
#
#   python3 tools/character/make_textures.py tools/character
#   /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
#       --python tools/character/build_noodles_girl.py -- <out.glb> [preview_dir]
import bpy, bmesh, sys, math, os
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if len(argv) > 0 else '/tmp/noodles-girl.glb'
PREVIEW = argv[1] if len(argv) > 1 and argv[1] else None
HERE = os.path.dirname(os.path.abspath(__file__))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = bpy.data.collections.new('NoodlesGirl'); scene.collection.children.link(col)

def ss(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t
def lin(c): return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
def mat(name, hexc, rough=1.0, image=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF'); h = hexc.lstrip('#')
    rgb = [lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    for nm in ('Specular IOR Level', 'Specular'):
        if nm in b.inputs: b.inputs[nm].default_value = 0.15
    if image:
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(HERE, image)); m.node_tree.links.new(t.outputs['Color'], b.inputs['Base Color'])
    m.diffuse_color = (*rgb, 1); return m
M = dict(skin=mat('skin', '#f6b896'), neck=mat('neck', '#dd7654'), face=mat('face', '#f6b896', 1.0, 'face.png'), hair=mat('hair', '#16110f', 0.85),
         blue=mat('hairblue', '#27348b', 0.9), beanie=mat('beanie', '#3a3532'), sweater=mat('sweater', '#eee0c4', 1.0, 'sweater.png'), rim=mat('rim', '#3a3532'),
         pants=mat('pants', '#9a3f2a'), shoe=mat('shoe', '#3b2a22', 0.8), sole=mat('sole', '#e9dcc0'), ink=mat('ink', '#16110f'))

def new_obj(name, verts, edges=(), faces=(), material=None):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], list(edges), list(faces)); me.update()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    if material: me.materials.append(material)
    for p in me.polygons: p.use_smooth = True
    return ob
def activate(ob):
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
def join(obs, name):
    activate(obs[0])
    for o in obs[1:]: o.select_set(True)
    if len(obs) > 1: bpy.ops.object.join()
    obs[0].name = name; return obs[0]
def bake_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); old = ob.data
    ob.modifiers.clear(); ob.data = me; bpy.data.meshes.remove(old)
    for p in me.polygons: p.use_smooth = True
def subsurf(ob, levels=1):
    m = ob.modifiers.new('sub', 'SUBSURF'); m.levels = levels; m.render_levels = levels
def uv_sphere(name, center, radii, seg=24, rings=14, material=None, shape=None, v0=0.0, v1=math.pi):
    verts, faces = [], []
    for i in range(rings + 1):
        v = lerp(v0, v1, i / rings)
        for s in range(seg):
            u = s / seg * 2 * math.pi
            p = [math.sin(v) * math.cos(u) * radii[0], math.sin(v) * math.sin(u) * radii[1], math.cos(v) * radii[2]]
            if shape: p = shape(p, u, v)
            verts.append((center[0] + p[0], center[1] + p[1], center[2] + p[2]))
    for i in range(rings):
        for s in range(seg):
            a = i * seg + s; b = i * seg + (s + 1) % seg; c = a + seg; d = b + seg; faces.append((a, c, d, b))
    ob = new_obj(name, verts, (), faces, material)
    bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(ob.data); bm.free()
    for p in ob.data.polygons: p.use_smooth = True
    return ob
def skin_figure(name, sticks, edges, material, levels=2):          # a stick figure wrapped in flesh (or cloth) by the Skin modifier
    ob = new_obj(name, [Vector(p) for p, _ in sticks], edges, (), material)
    mir = ob.modifiers.new('mirror', 'MIRROR'); mir.use_axis[0] = True; mir.use_clip = True; mir.merge_threshold = 0.002
    ob.modifiers.new('skin', 'SKIN')
    for i, (_, r) in enumerate(sticks):
        d = ob.data.skin_vertices[0].data[i]; d.radius = (r, r); d.use_root = (i == 0)
    subsurf(ob, levels); bake_modifiers(ob)
    for v in ob.data.vertices:
        if v.co.z > 0.5: v.co.y *= lerp(0.84, 1.0, ss(0.085, 0.15, abs(v.co.x)))
    bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(ob.data); bm.free()
    return ob
def drop_faces(ob, test):
    bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(test(v.co) for v in f.verts)], context='FACES'); bm.to_mesh(ob.data); bm.free()
def planar_uv(ob, fn):                                              # fn(co, normal) → (u, v)
    me = ob.data; uv = me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index]; uv.data[li].uv = fn(v.co, poly.normal)

# ══ 1. body ══════════════════════════════════════════════════════════════════════════════════════
ARM = Vector((0.64, 0, -0.77)).normalized()
SH, EL, WR = Vector((0.098, 0, 0.928)), Vector((0.21, 0, 0.795)), Vector((0.30, 0, 0.685))
PALM = WR + ARM * 0.04
sk = [((0, 0, 0.56), 0.100), ((0, 0, 0.68), 0.085), ((0, 0, 0.80), 0.098), ((0, 0, 0.90), 0.092), ((0, 0, 0.975), 0.04), ((0, 0, 1.04), 0.04),
      (SH, 0.046), (EL, 0.036), (WR, 0.029), (PALM, 0.03),
      ((0.068, 0, 0.535), 0.066), ((0.07, 0, 0.30), 0.05), ((0.07, 0, 0.085), 0.038), ((0.07, -0.06, 0.035), 0.03)]
ed = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (3, 6), (6, 7), (7, 8), (8, 9), (0, 10), (10, 11), (11, 12), (12, 13)]
for dy, ln in [(-0.021, 0.034), (-0.007, 0.039), (0.007, 0.037), (0.021, 0.029)]:
    base = PALM + ARM * 0.022 + Vector((0, dy, 0)); tip = base + ARM * ln + Vector((0, dy * 0.25, 0))
    n = len(sk); sk += [(base, 0.0102), (tip, 0.0092)]; ed += [(9, n), (n, n + 1)]
n = len(sk); sk += [(WR + ARM * 0.012 + Vector((0, -0.022, 0)), 0.012), (WR + ARM * 0.032 + Vector((0, -0.046, -0.004)), 0.01)]; ed += [(8, n), (n, n + 1)]
body = skin_figure('Body', sk, ed, M['skin'])
body.data.materials.append(M['neck'])
for p in body.data.polygons:                                        # the warm orange neck from the sheet
    if all(body.data.vertices[i].co.z > 0.948 for i in p.vertices): p.material_index = 1

# the oversized sweater and the loose trousers are their own cloth figures, fatter than the body inside them
CUFF = WR + ARM * 0.028
sweater = skin_figure('Sweater', [((0, 0, 0.585), 0.150), ((0, 0, 0.68), 0.142), ((0, 0, 0.80), 0.140), ((0, 0, 0.895), 0.128), ((0, 0, 0.962), 0.062),
                                  (SH + Vector((0.012, 0, -0.004)), 0.074), (EL, 0.066), (CUFF, 0.060)], [(0, 1), (1, 2), (2, 3), (3, 4), (3, 5), (5, 6), (6, 7)], M['sweater'])
pants = skin_figure('Trousers', [((0, 0, 0.60), 0.125), ((0.072, 0, 0.50), 0.092), ((0.074, 0, 0.30), 0.080), ((0.074, 0, 0.125), 0.076)], [(0, 1), (1, 2), (2, 3)], M['pants'])

# ══ 2. skeleton ══════════════════════════════════════════════════════════════════════════════════
arm_data = bpy.data.armatures.new('Rig'); rig = bpy.data.objects.new('Rig', arm_data); col.objects.link(rig)
activate(rig); bpy.ops.object.mode_set(mode='EDIT')
HEAD_BONES = set()
def bone(name, head, tail, parent=None, connect=False, deform=True, on_head=False):
    b = arm_data.edit_bones.new(name); b.head = Vector(head); b.tail = Vector(tail); b.use_deform = deform
    if parent: b.parent = arm_data.edit_bones[parent]; b.use_connect = connect
    if on_head: HEAD_BONES.add(name)
bone('hips', (0, 0, 0.56), (0, 0, 0.67)); bone('spine', (0, 0, 0.67), (0, 0, 0.79), 'hips', True); bone('chest', (0, 0, 0.79), (0, 0, 0.95), 'spine', True)
bone('neck', (0, 0, 0.95), (0, 0, 1.02), 'chest', True); bone('head', (0, 0, 1.02), (0, 0, 1.30), 'neck', True)
FING = PALM + ARM * 0.022
for s, sx in (('L', 1), ('R', -1)):
    f = lambda v: (v[0] * sx, v[1], v[2])
    bone('shoulder.' + s, f((0.02, 0, 0.925)), f(SH), 'chest'); bone('upperarm.' + s, f(SH), f(EL), 'shoulder.' + s, True)
    bone('forearm.' + s, f(EL), f(WR), 'upperarm.' + s, True); bone('hand.' + s, f(WR), f(FING), 'forearm.' + s, True)
    bone('fingers.' + s, f(FING), f(FING + ARM * 0.04), 'hand.' + s, True)
    bone('thumb.' + s, f(WR + ARM * 0.012 + Vector((0, -0.022, 0))), f(WR + ARM * 0.032 + Vector((0, -0.046, -0.004))), 'hand.' + s)
    bone('thigh.' + s, f((0.068, 0, 0.535)), f((0.07, 0, 0.30)), 'hips'); bone('shin.' + s, f((0.07, 0, 0.30)), f((0.07, 0, 0.085)), 'thigh.' + s, True)
    bone('foot.' + s, f((0.07, 0, 0.085)), f((0.07, -0.085, 0.022)), 'shin.' + s, True); bone('toe.' + s, f((0.07, -0.085, 0.022)), f((0.07, -0.135, 0.022)), 'foot.' + s, True)
    bone('hair.' + s, f((0.15, 0.02, 1.13)), f((0.2, 0.02, 1.02)), 'head', False, False, True)     # the bob's ends swing on these
bone('hair.B', (0, 0.17, 1.12), (0, 0.2, 1.01), 'head', False, False, True)
bpy.ops.armature.calculate_roll(type='GLOBAL_POS_Y'); bpy.ops.object.mode_set(mode='OBJECT')

# ══ 3. skin weights ══════════════════════════════════════════════════════════════════════════════
BODY_PARTS, HEAD_PARTS = [], []
def attach(ob): ob.parent = rig; m = ob.modifiers.new('rig', 'ARMATURE'); m.object = rig
def auto_weight(ob):
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_AUTO'); BODY_PARTS.append(ob); return sum(1 for v in ob.data.vertices if len(v.groups) > 0)
def rigid(ob, bone_name, part):
    g = ob.vertex_groups.new(name=bone_name); g.add(range(len(ob.data.vertices)), 1.0, 'REPLACE'); attach(ob); part.append(ob)
weighted = [auto_weight(body), auto_weight(sweater), auto_weight(pants)]
for b in arm_data.bones:
    if b.name.startswith('hair'): b.use_deform = True
def along_arm(co): return (Vector((abs(co.x), co.y, co.z)) - SH).dot(ARM)
ARM_LEN = (CUFF - SH).length
# open the cloth where a body comes out of it, and remove the skin that the cloth hides
drop_faces(sweater, lambda co: co.z > 0.985 or (abs(co.x) > 0.16 and along_arm(co) > ARM_LEN + 0.02))
drop_faces(pants, lambda co: co.z < 0.095)
drop_faces(body, lambda co: (0.14 < co.z < 0.945 and abs(co.x) < 0.135) or (abs(co.x) >= 0.09 and co.z > 0.70 and along_arm(co) < ARM_LEN - 0.02))
planar_uv(sweater, lambda co, n: (0.5 + co.x / 0.6, (co.z - 0.50) / 0.6) if n.y < -0.25 else (0.03, 0.03))   # the mark is only on the front

# ══ 4. head ══════════════════════════════════════════════════════════════════════════════════════
HC = Vector((0, 0, 1.165)); HR = (0.158, 0.165, 0.152)
def head_shape(p, u, v):
    x, y, z = p
    if z < -0.03:
        k = ss(-0.03, -0.15, z); x *= lerp(1, 0.86, k)
        if y < 0: y *= lerp(1, 0.93, k)
    if z < 0 and y < 0: x *= 1 + 0.06 * ss(0.0, -0.07, z) * (1 - ss(-0.07, -0.145, z))
    return [x, y, z]
head = uv_sphere('Head', HC, HR, 56, 34, M['face'], head_shape)
planar_uv(head, lambda co, n: (0.5 + co.x / 0.36, 0.5 + (co.z - HC.z) / 0.36) if co.y < 0.02 else (0.03, 0.97))   # the painted face, seen straight on
rigid(head, 'head', HEAD_PARTS)
def face_y(x, z, lift=0.0):                                         # the head's front surface at (x, z), pushed out by `lift`
    p = head_shape([x, -HR[1] * math.sqrt(max(0.0, 1 - (x / HR[0]) ** 2 - ((z - HC.z) / HR[2]) ** 2)), z - HC.z], 0, 0)
    return p[1] - lift
ears = join([uv_sphere('Ear', (sx * 0.156, 0.01, 1.14), (0.02, 0.024, 0.038), 12, 10, M['skin']) for sx in (1, -1)] +
            [uv_sphere('EarIn', (sx * 0.166, 0.004, 1.14), (0.012, 0.013, 0.024), 10, 8, M['neck']) for sx in (1, -1)], 'Ears')
rigid(ears, 'head', HEAD_PARTS)

# eyelids for blinking: a patch of skin that waits folded at the top of each eye and slides down
EX, EZ, EW, EH = 0.066, 1.165 - 0.028, 0.044, 0.037
lid_v, lid_f, lid_open, lid_shut, lid_mat = [], [], [], [], []
for sx in (1, -1):
    base = len(lid_v); cols_, rows_ = 8, 5; top = EZ + EH * 0.52; bot = EZ - EH * 1.02
    for r in range(rows_ + 1):
        for c in range(cols_ + 1):
            x = sx * (EX + (c / cols_ - 0.5) * 2 * EW); z_open = top + 0.004 * (1 - r / rows_); z_shut = lerp(top + 0.004, bot, r / rows_)
            lid_v.append((x, face_y(x, z_open, 0.004), z_open)); lid_open.append((x, face_y(x, z_open, 0.004), z_open)); lid_shut.append((x, face_y(x, z_shut, 0.0045), z_shut))
    for r in range(rows_):
        for c in range(cols_):
            a = base + r * (cols_ + 1) + c; lid_f.append((a, a + 1, a + cols_ + 2, a + cols_ + 1)); lid_mat.append(1 if r == rows_ - 1 else 0)
lids = new_obj('Lids', lid_v, (), lid_f, M['skin']); lids.data.materials.append(M['ink'])
for p, mi in zip(lids.data.polygons, lid_mat): p.material_index = mi
bm = bmesh.new(); bm.from_mesh(lids.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(lids.data); bm.free()
lids.shape_key_add(name='Basis'); bk = lids.shape_key_add(name='blink')
for i, co in enumerate(lid_shut): bk.data[i].co = Vector(co)
bk.value = 0.0
rigid(lids, 'head', HEAD_PARTS)

# hair: a black bob that flicks out at the ends, open over the face, with a blue layer showing underneath
def hair_shape(inner):
    def fn(p, u, v):
        x, y, z = p; r = math.hypot(x, y) + 1e-6; front = max(0.0, -y / r)
        flare = 1 + 0.34 * ss(-0.03, -0.19, z) ** 1.4 + 0.02 * math.sin(u * 7) * ss(-0.02, -0.17, z)     # the ends kick outward, a little unevenly
        x *= flare; y *= flare
        cut = lerp(-0.192 - (0.014 if inner else 0), 0.105, ss(0.3, 0.66, front))                   # the hair parts round the face; elsewhere it falls to the jaw
        if z < cut:
            k = 0.95 - ss(0, 0.05, cut - z) * 0.1; return [x * k, y * k, cut - min(0.012, (cut - z) * 0.12)]
        return [x, y, z]
    return fn
hair = uv_sphere('Hair', (0, 0.012, 1.18), (0.19, 0.196, 0.2), 80, 28, M['hair'], hair_shape(False))
hair_in = uv_sphere('HairBlue', (0, 0.012, 1.176), (0.182, 0.188, 0.196), 64, 24, M['blue'], hair_shape(True))
# the strands across the forehead: one long lock from the parting down past the nose, one shorter the other way
def lock(pts, width, name):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for bp, (x, z, rad) in zip(sp.bezier_points, pts): bp.co = (x, face_y(x, z, 0.007), z); bp.radius = rad; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    cu.bevel_depth = 0.004; cu.bevel_resolution = 2; cu.extrude = width; cu.resolution_u = 10
    ob = bpy.data.objects.new(name, cu); col.objects.link(ob); cu.materials.append(M['hair']); activate(ob); bpy.ops.object.convert(target='MESH')
    for p in ob.data.polygons: p.use_smooth = True
    return ob
locks = [lock([(-0.03, 1.262, 1.0), (0.004, 1.222, 1.0), (0.024, 1.172, 0.95), (0.022, 1.128, 0.75), (0.04, 1.096, 0.25)], 0.02, 'LockA'),
         lock([(-0.05, 1.262, 1.0), (-0.1, 1.228, 1.0), (-0.132, 1.18, 0.8), (-0.14, 1.13, 0.35)], 0.024, 'LockB'),
         lock([(0.06, 1.262, 1.0), (0.108, 1.23, 1.0), (0.136, 1.185, 0.8), (0.142, 1.135, 0.35)], 0.024, 'LockC')]
hair = join([hair, hair_in] + locks, 'Hair')
for nm in ('head', 'hair.L', 'hair.R', 'hair.B'): hair.vertex_groups.new(name=nm)
for v in hair.data.vertices:                                        # the lower the hair, the more it follows the swinging bones
    w = ss(1.13, 0.99, v.co.z) * 0.75 if v.co.y > -0.1 else 0.0
    a = math.atan2(v.co.y, v.co.x); wl = max(0.0, math.cos(a)) ** 2; wr = max(0.0, -math.cos(a)) ** 2; wb = max(0.0, math.sin(a)) ** 2; t = wl + wr + wb + 1e-6
    hair.vertex_groups['head'].add([v.index], 1 - w, 'REPLACE')
    for nm, x in (('hair.L', wl), ('hair.R', wr), ('hair.B', wb)): hair.vertex_groups[nm].add([v.index], w * x / t, 'REPLACE')
attach(hair); HEAD_PARTS.append(hair)

# the beanie: knitted ribs, a soft slouch to the back, and the knob on top
def beanie_shape(p, u, v):
    x, y, z = p; rib = 1 + 0.012 * math.sin(u * 44) * ss(0.0, 0.5, v)
    return [x * rib, y * rib + 0.012 * (1 - math.cos(v)), z + 0.02 * (-y / 0.21) * ss(0.9, 1.57, v)]    # the rim sits a little higher over the brow than at the back
cap = uv_sphere('Beanie', (0, 0.014, 1.27), (0.2, 0.207, 0.165), 88, 14, M['beanie'], beanie_shape, 0.0, math.pi / 2 + 0.06)
rimb = uv_sphere('Rim', (0, 0.014, 1.27), (0.204, 0.211, 0.03), 88, 6, M['beanie'], lambda p, u, v: [p[0] * (1 + 0.014 * math.sin(u * 44)), p[1] * (1 + 0.014 * math.sin(u * 44)), p[2] + 0.02 * (-p[1] / 0.21)], 0.9, 2.24)
knob = uv_sphere('Knob', (0, 0.02, 1.45), (0.058, 0.058, 0.046), 20, 12, M['beanie'], lambda p, u, v: [p[0] * (1 + 0.03 * math.sin(u * 14)), p[1] * (1 + 0.03 * math.sin(u * 14)), p[2]])
beanie = join([cap, rimb, knob], 'Beanie'); rigid(beanie, 'head', HEAD_PARTS)

# ══ 5. the neckline and the shoes ════════════════════════════════════════════════════════════════
nv, nf, seg = [], [], 32
for r_, z_ in ((0.058, 0.972), (0.068, 0.966), (0.068, 0.955), (0.06, 0.95)):
    for s in range(seg): a = s / seg * 2 * math.pi; nv.append((math.cos(a) * r_, math.sin(a) * r_ * 0.9, z_ - 0.01 * max(0.0, -math.sin(a))))
for i in range(3):
    for s in range(seg): a = i * seg + s; b = i * seg + (s + 1) % seg; nf.append((a, b, b + seg, a + seg))
neckline = new_obj('Neckline', nv, (), nf, M['rim']); rigid(neckline, 'chest', BODY_PARTS)
def shoe_shape(p, u, v):
    x, y, z = p
    if y < 0: x *= 1 + 0.18 * ss(0, -0.09, y)
    z = max(z, -0.03)
    if y > 0.05: z *= 1.2
    return [x, y, z]
for s, sx in (('L', 1), ('R', -1)):
    up = uv_sphere('Shoe.' + s, (sx * 0.072, -0.03, 0.046), (0.054, 0.102, 0.046), 20, 14, M['shoe'], shoe_shape)
    so = uv_sphere('Sole.' + s, (sx * 0.072, -0.03, 0.01), (0.058, 0.107, 0.014), 20, 8, M['sole'], lambda p, u, v: [p[0], p[1], max(min(p[2], 0.008), -0.01)])
    rigid(join([up, so], 'Shoe.' + s), 'foot.' + s, BODY_PARTS)

# ══ 6. chibify: squash the body, enlarge the head, shorten the arms, keep the feet ═══════════════
NECK, BODY_K, HEAD_K = 0.975, 0.68, 1.2
NECK2 = 0.09 + (NECK - 0.09) * BODY_K
def body_z(z): return z if z < 0.09 else (0.09 + (z - 0.09) * BODY_K if z < NECK else NECK2 + (z - NECK) * HEAD_K)
def arm_x(x, z):
    ax = abs(x)
    if ax > 0.098 and z > 0.928 - (ax - 0.098) * 1.2 - 0.1: return math.copysign(0.098 + (ax - 0.098) * 0.76, x)
    return x
def as_body(co): return Vector((arm_x(co.x, co.z), co.y, body_z(co.z)))
def as_head(co): return Vector((co.x * HEAD_K, co.y * HEAD_K, NECK2 + (co.z - NECK) * HEAD_K))
def remap(ob, fn):
    keys = ob.data.shape_keys
    if keys:
        for kb in keys.key_blocks:
            for d in kb.data: d.co = fn(d.co)
    else:
        for v in ob.data.vertices: v.co = fn(v.co)
    ob.data.update()
for ob in BODY_PARTS: remap(ob, as_body)
for ob in HEAD_PARTS: remap(ob, as_head)
activate(rig); bpy.ops.object.mode_set(mode='EDIT')
for b in arm_data.edit_bones:
    if b.name in HEAD_BONES: b.head = as_head(b.head); b.tail = as_head(b.tail)
    elif b.name == 'head': b.head = as_body(b.head); b.tail = as_head(b.tail)
    else: b.head = as_body(b.head); b.tail = as_body(b.tail)
bpy.ops.armature.calculate_roll(type='GLOBAL_POS_Y'); bpy.ops.object.mode_set(mode='OBJECT')

MESHES = [o for o in col.objects if o.type == 'MESH']
tris = sum(len(p.vertices) - 2 for o in MESHES for p in o.data.polygons)
print('BUILD', dict(meshes=len(MESHES), tris=tris, weighted=weighted, bones=len(arm_data.bones), height=round(max(v.co.z for o in MESHES for v in o.data.vertices), 3)))

# ══ 7. animation ═════════════════════════════════════════════════════════════════════════════════
RX = lambda a: Matrix.Rotation(a, 3, 'X'); RY = lambda a: Matrix.Rotation(a, 3, 'Y'); RZ = lambda a: Matrix.Rotation(a, 3, 'Z')
def euler(x=0, y=0, z=0): return RX(x) @ RZ(y) @ RY(-z)             # pitch about the side axis, yaw about up, roll about forward
ub = arm_data.bones['upperarm.L']; av = (ub.tail_local - ub.head_local).normalized(); A_ANG = math.atan2(av.x, -av.z)
A_POSE = {'L': RY(-A_ANG), 'R': RY(A_ANG)}
def pose(frame, rots, hips_off=(0, 0, 0)):
    for name, R in rots.items():
        pb = rig.pose.bones.get(name)
        if pb is None: continue
        B = pb.bone.matrix_local.to_3x3(); q = (B.inverted() @ R @ B).to_quaternion(); prev = pb.get('_q')
        if prev is not None: q.make_compatible(Quaternion(prev))
        pb['_q'] = list(q); pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = q; pb.keyframe_insert('rotation_quaternion', frame=frame)
    pb = rig.pose.bones['hips']; B = pb.bone.matrix_local.to_3x3(); pb.location = B.inverted() @ Vector(hips_off); pb.keyframe_insert('location', frame=frame)
W1, W2, W3 = math.pi / 6, math.pi / 3, math.pi / 2                  # idle rhythms that close on the 12-second loop
def frame_pose(ph, t, m, r, wave=0.0):
    idle = 1 - m; R = {}; sin, cos = math.sin, math.cos
    A = lerp(0.50, 0.92, r) * m; K = lerp(0.95, 1.85, r) * m; arm = lerp(0.50, 0.95, r) * m; elbow = lerp(0.25, 1.4, r); bob = lerp(0.012, 0.03, r) * m
    sway = sin(t * W1)
    off = (sin(ph) * 0.01 * m + sway * 0.012 * idle, 0, cos(ph * 2 + 0.25) * bob - bob * 0.5 - idle * 0.003 * (1 + sin(t * W3)))
    R['hips'] = euler(lerp(0.03, 0.18, r) * m, sin(ph) * 0.13 * m, sin(ph + 0.3) * 0.06 * m + sway * 0.03 * idle)
    R['spine'] = euler(lerp(0.02, 0.09, r) * m + sin(t * W3) * 0.014 * idle, -sin(ph) * 0.09 * m, -sin(ph + 0.3) * 0.045 * m - sway * 0.022 * idle)
    R['chest'] = euler(sin(t * W3 + 0.5) * 0.022 * idle, -sin(ph) * 0.12 * m, -sin(ph + 0.3) * 0.035 * m)
    R['neck'] = euler(-lerp(0.02, 0.09, r) * m, sin(ph) * 0.06 * m, sin(ph + 0.6) * 0.025 * m)
    R['head'] = euler(-0.02 + cos(ph * 2 + 0.9) * 0.03 * m + sin(t * W2) * 0.022 * idle, sin(ph) * 0.05 * m + (sin(t * W1) * 0.24 + sin(t * W2 + 1.0) * 0.08) * idle, sin(ph + 0.9) * 0.045 * m + sin(t * W1 + 1.2) * 0.05 * idle)
    for s, sx, p in (('L', 1, ph), ('R', -1, ph + math.pi)):
        ps = p + 0.22 * sin(p + 0.5)
        swing = -sin(ps) * A - lerp(0.02, 0.16, r) * m
        knee = max(0.0, cos(ps)) ** 1.25 * K + 0.07 * m + max(0.0, -sin(ps)) * 0.14 * m
        R['thigh.' + s] = euler(swing, 0, sx * 0.02 - 0.03 * idle * sway); R['shin.' + s] = euler(knee)
        R['foot.' + s] = euler(-(swing + knee) * 0.72 + max(0.0, sin(ps)) * 0.3 * m - max(0.0, -cos(ps + 0.9)) * 0.36 * m)
        R['toe.' + s] = euler(-max(0.0, -sin(ps - 0.5)) * 0.5 * m)
        Ap = A_POSE[s]; Ai = Ap.inverted()
        up = euler(sin(p) * arm + sin(t * W2 + sx) * 0.03 * idle, 0, sx * (0.24 + 0.06 * m) + sx * sin(t * W3) * 0.014 * idle)   # the big sleeves hold the arms a little off the body
        fo = euler(-(elbow * m + 0.2) - max(0.0, -sin(p - 0.45)) * 0.4 * m); ha = euler(sin(p - 0.9) * 0.2 * m, 0, -sx * 0.08); curl = 0.55 + 0.5 * r * m
        if wave > 0 and s == 'R':
            up = euler(0.45 * wave, 0, sx * lerp(0.24, 2.4, wave)); fo = euler(0, 0, sx * (0.7 + sin(t * 9.0) * 0.45) * wave); ha = euler(0, 0, sx * sin(t * 9.0 + 0.6) * 0.3 * wave); curl = lerp(0.55, 0.05, wave)
        R['upperarm.' + s] = up @ Ai; R['forearm.' + s] = Ap @ fo @ Ai; R['hand.' + s] = Ap @ ha @ Ai
        R['fingers.' + s] = RY(sx * curl); R['thumb.' + s] = RZ(-sx * 0.25)
        R['hair.' + s] = euler(sin(ph * 2 - 1.2) * 0.07 * m + 0.1 * r * m + sin(t * W2 + sx) * 0.012 * idle, 0, sin(ph - 0.9) * 0.07 * m + sin(t * W1 - 0.8) * 0.02 * idle)
    R['hair.B'] = euler(sin(ph * 2 - 1.4) * 0.08 * m + 0.12 * r * m + sin(t * W2) * 0.012 * idle, 0, sin(ph - 1.1) * 0.05 * m)
    return R, off
rig.animation_data_create(); ad = rig.animation_data
def make_action(name, frames, fn):
    for pb in rig.pose.bones:
        if '_q' in pb: del pb['_q']
    act = bpy.data.actions.new(name); ad.action = act
    for f in range(1, frames + 2): R, off = fn(f - 1); pose(f, R, off)
    tr = ad.nla_tracks.new(); tr.name = name; st = tr.strips.new(name, 1, act); st.name = name; ad.action = None; tr.mute = True
TAU = 2 * math.pi; scene.render.fps = 24
make_action('Idle', 288, lambda f: frame_pose(0, f / 24.0, 0, 0))
make_action('Walk', 24, lambda f: frame_pose(f / 24 * TAU, 0, 1, 0))
make_action('Run', 16, lambda f: frame_pose(f / 16 * TAU, 0, 1, 1))
make_action('Wave', 60, lambda f: frame_pose(0, f / 24.0, 0, 0, wave=ss(0, 9, f) * (1 - ss(48, 60, f))))
for tr in ad.nla_tracks: tr.mute = False
for pb in rig.pose.bones:
    if '_q' in pb: del pb['_q']
    pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)

# ══ 8. preview pictures ══════════════════════════════════════════════════════════════════════════
def render_previews():
    os.makedirs(PREVIEW, exist_ok=True)
    w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.86, 0.76, 0.62, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 2.4; sun.rotation_euler = (math.radians(50), 0, math.radians(30)); scene.collection.objects.link(sun)
    gm = bpy.data.meshes.new('g'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=6); bm.to_mesh(gm); bm.free(); g = bpy.data.objects.new('ground', gm); scene.collection.objects.link(g); gm.materials.append(mat('ground', '#d9c3a0'))
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam; cam.data.lens = 60
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT', 'BLENDER_WORKBENCH'):
        try: scene.render.engine = eng; break
        except Exception: pass
    try: scene.view_settings.view_transform = 'Standard'
    except Exception: pass
    scene.render.resolution_x = 520; scene.render.resolution_y = 640; scene.render.image_settings.file_format = 'PNG'
    def shot(name, pos, look, frame=None, track=None, blink=0.0):
        for tr in ad.nla_tracks: tr.mute = (tr.name != track)
        if track is None:
            for pb in rig.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        bk.value = blink; scene.frame_set(frame or 1); cam.location = pos; d = Vector(look) - Vector(pos); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = os.path.join(PREVIEW, name + '.png'); bpy.ops.render.render(write_still=True)
    c = 0.58
    shot('01-front', (0, -2.9, 0.62), (0, 0, c)); shot('02-threeq', (1.9, -2.3, 0.78), (0, 0, c)); shot('03-side', (2.9, 0, 0.62), (0, 0, c)); shot('04-back', (-1.3, 2.6, 0.82), (0, 0, c))
    shot('05-face', (0.22, -1.25, 0.96), (0, 0, 0.93)); shot('06-face-threeq', (0.85, -0.95, 1.0), (0, 0, 0.93)); shot('07-blink', (0.22, -1.25, 0.96), (0, 0, 0.93), None, None, 1.0)
    shot('08-idle', (0.9, -2.7, 0.66), (0, 0, c), 60, 'Idle'); shot('09-walk-a', (2.2, -1.9, 0.66), (0, 0, c), 1, 'Walk'); shot('10-walk-b', (2.2, -1.9, 0.66), (0, 0, c), 7, 'Walk')
    shot('11-run', (2.6, -1.0, 0.66), (0, 0, c), 3, 'Run'); shot('12-wave', (0.5, -2.8, 0.72), (0, 0, c + 0.05), 30, 'Wave')
    bk.value = 0.0
    for o in (sun, g, cam): bpy.data.objects.remove(o)
    for tr in ad.nla_tracks: tr.mute = False
    scene.frame_set(1)
if PREVIEW: render_previews()

# ══ 9. export ════════════════════════════════════════════════════════════════════════════════════
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects: o.select_set(True)
bpy.context.view_layer.objects.active = rig
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_skins=True, export_morph=True, export_force_sampling=True, export_yup=True, export_apply=False, export_image_format='AUTO')
print('EXPORTED', OUT, os.path.getsize(OUT))
