# build_girl.py — builds the bowl-cut girl as a rigged, animated character and exports a .glb.
# CJ, 2026-11-21: 「張君雅小妹妹也要重制喔變成一個專業可動的角色」, then "Yes, use Blender".
#
# Run headless (does not touch an open Blender window):
#   /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
#       --python tools/character/build_girl.py -- <out.glb> <preview_dir>
#
# What it makes: a body with real fingers (Skin modifier + subdivision), a head, bowl-cut hair, a
# blouse with a collar, a pleated skirt, socks, strapped shoes, a backpack; a 29-bone skeleton with
# automatic skin weights; four baked animations (Idle, Walk, Run, Wave); a "blink" shape key.
# Facing: -Y in Blender, which the glTF exporter turns into +Z forward, Y up.
import bpy, bmesh, sys, math, os
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if len(argv) > 0 else '/tmp/girl.glb'
PREVIEW = argv[1] if len(argv) > 1 else None
STAGE = argv[2] if len(argv) > 2 else 'all'

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = bpy.data.collections.new('Girl'); scene.collection.children.link(col)

def ss(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t
def lin(c): return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
def mat(name, hexc, rough=0.7, alpha=1.0, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF'); h = hexc.lstrip('#')
    rgb = [lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if alpha < 1: b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else m.blend_method
    m.diffuse_color = (*rgb, alpha); return m
M = dict(skin=mat('skin', '#f2c9a5', 0.62), hair=mat('hair', '#1c1512', 0.38), shirt=mat('shirt', '#f1ece0', 0.8), skirt=mat('skirt', '#1f2a44', 0.75),
         sock=mat('sock', '#f1ece0', 0.9), shoe=mat('shoe', '#5a1f1a', 0.28), sole=mat('sole', '#231614', 0.6), pack=mat('pack', '#c23a2a', 0.42),
         eye=mat('eye', '#0e0b0a', 0.12), white=mat('white', '#ffffff', 0.3), blush=mat('blush', '#f08a7a', 0.9, 0.45), mouth=mat('mouth', '#8a3a30', 0.5), buckle=mat('buckle', '#c9b27a', 0.3, 1, 0.8))

def new_obj(name, verts, edges=(), faces=(), material=None, smooth=True):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], list(edges), list(faces)); me.update()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    if material: me.materials.append(material)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    return ob
def activate(ob):
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
def bake_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); old = ob.data
    ob.modifiers.clear(); ob.data = me; bpy.data.meshes.remove(old)
    for p in me.polygons: p.use_smooth = True
def subsurf(ob, levels=1):
    m = ob.modifiers.new('sub', 'SUBSURF'); m.levels = levels; m.render_levels = levels
def uv_sphere(name, center, radii, seg=24, rings=14, material=None, shape=None):
    verts, faces = [], []
    for i in range(rings + 1):
        v = i / rings * math.pi
        for s in range(seg):
            u = s / seg * 2 * math.pi
            p = [math.sin(v) * math.cos(u) * radii[0], math.sin(v) * math.sin(u) * radii[1], math.cos(v) * radii[2]]
            if shape: p = shape(p, u, v)
            verts.append((center[0] + p[0], center[1] + p[1], center[2] + p[2]))
    for i in range(rings):
        for s in range(seg):
            a = i * seg + s; b = i * seg + (s + 1) % seg; c = a + seg; d = b + seg
            if i == 0: faces.append((a, c, d))
            elif i == rings - 1: faces.append((a, c, b))
            else: faces.append((a, c, d, b))
    ob = new_obj(name, verts, (), faces, material)
    bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(ob.data); bm.free()
    return ob

# ══ 1. body: a stick figure that the Skin modifier wraps in flesh ════════════════════════════════
ARM = Vector((0.64, 0, -0.77)).normalized()                      # the arm's direction in the rest pose (an A-pose)
SH, EL, WR = Vector((0.098, 0, 0.928)), Vector((0.21, 0, 0.795)), Vector((0.30, 0, 0.685))
PALM = WR + ARM * 0.04
sk = [((0, 0, 0.56), 0.100), ((0, 0, 0.68), 0.085), ((0, 0, 0.80), 0.098), ((0, 0, 0.90), 0.092), ((0, 0, 0.975), 0.042), ((0, 0, 1.04), 0.042),
      (SH, 0.046), (EL, 0.034), (WR, 0.026), (PALM, 0.027),
      ((0.068, 0, 0.535), 0.064), ((0.07, 0, 0.30), 0.046), ((0.07, 0, 0.085), 0.034), ((0.07, -0.06, 0.035), 0.03)]
ed = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (3, 6), (6, 7), (7, 8), (8, 9), (0, 10), (10, 11), (11, 12), (12, 13)]
for k, (dy, ln) in enumerate([(-0.021, 0.040), (-0.007, 0.046), (0.007, 0.043), (0.021, 0.034)]):   # index … little finger
    base = PALM + ARM * 0.022 + Vector((0, dy, 0)); tip = base + ARM * ln + Vector((0, dy * 0.25, 0))
    n = len(sk); sk += [(base, 0.0092), (tip, 0.0078)]; ed += [(9, n), (n, n + 1)]
n = len(sk); sk += [(WR + ARM * 0.012 + Vector((0, -0.022, 0)), 0.011), (WR + ARM * 0.034 + Vector((0, -0.05, -0.004)), 0.0088)]; ed += [(8, n), (n, n + 1)]   # thumb, pointing forward
body = new_obj('Body', [Vector(p) for p, _ in sk], ed, (), M['skin'])
mir = body.modifiers.new('mirror', 'MIRROR'); mir.use_axis[0] = True; mir.use_clip = True; mir.merge_threshold = 0.002
skm = body.modifiers.new('skin', 'SKIN')
for i, (_, r) in enumerate(sk):
    d = body.data.skin_vertices[0].data[i]; d.radius = (r, r); d.use_root = (i == 0)
subsurf(body, 2); bake_modifiers(body)
for v in body.data.vertices:                                      # a torso is wider than it is deep
    x, y, z = v.co
    if z > 0.5: v.co.y = y * lerp(0.82, 1.0, ss(0.085, 0.14, abs(x)))
bm = bmesh.new(); bm.from_mesh(body.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(body.data); bm.free()

# ══ 2. skeleton ══════════════════════════════════════════════════════════════════════════════════
arm_data = bpy.data.armatures.new('GirlRig'); rig = bpy.data.objects.new('GirlRig', arm_data); col.objects.link(rig)
activate(rig); bpy.ops.object.mode_set(mode='EDIT')
def bone(name, head, tail, parent=None, connect=False, deform=True):
    b = arm_data.edit_bones.new(name); b.head = Vector(head); b.tail = Vector(tail); b.use_deform = deform
    if parent: b.parent = arm_data.edit_bones[parent]; b.use_connect = connect
    return b
bone('hips', (0, 0, 0.56), (0, 0, 0.67)); bone('spine', (0, 0, 0.67), (0, 0, 0.79), 'hips', True); bone('chest', (0, 0, 0.79), (0, 0, 0.95), 'spine', True)
bone('neck', (0, 0, 0.95), (0, 0, 1.02), 'chest', True); bone('head', (0, 0, 1.02), (0, 0, 1.30), 'neck', True)
FING = PALM + ARM * 0.022
for s, sx in (('L', 1), ('R', -1)):
    f = lambda v: (v[0] * sx, v[1], v[2])
    bone('shoulder.' + s, f((0.02, 0, 0.925)), f(SH), 'chest'); bone('upperarm.' + s, f(SH), f(EL), 'shoulder.' + s, True)
    bone('forearm.' + s, f(EL), f(WR), 'upperarm.' + s, True); bone('hand.' + s, f(WR), f(FING), 'forearm.' + s, True)
    bone('fingers.' + s, f(FING), f(FING + ARM * 0.045), 'hand.' + s, True)
    bone('thumb.' + s, f(WR + ARM * 0.012 + Vector((0, -0.022, 0))), f(WR + ARM * 0.034 + Vector((0, -0.05, -0.004))), 'hand.' + s)
    bone('thigh.' + s, f((0.068, 0, 0.535)), f((0.07, 0, 0.30)), 'hips'); bone('shin.' + s, f((0.07, 0, 0.30)), f((0.07, 0, 0.085)), 'thigh.' + s, True)
    bone('foot.' + s, f((0.07, 0, 0.085)), f((0.07, -0.085, 0.022)), 'shin.' + s, True); bone('toe.' + s, f((0.07, -0.085, 0.022)), f((0.07, -0.135, 0.022)), 'foot.' + s, True)
for nm, dx, dy in (('skirt.F', 0, -1), ('skirt.B', 0, 1), ('skirt.L', 1, 0), ('skirt.R', -1, 0)):
    bone(nm, (dx * 0.085, dy * 0.07, 0.66), (dx * 0.2, dy * 0.19, 0.39), 'hips', False, False)
bpy.ops.armature.calculate_roll(type='GLOBAL_POS_Y'); bpy.ops.object.mode_set(mode='OBJECT')

# ══ 3. skin weights, worked out by Blender from the bones' positions ═════════════════════════════
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
weighted = sum(1 for v in body.data.vertices if len(v.groups) > 0)
for b in arm_data.bones:
    if b.name.startswith('skirt'): b.use_deform = True

def rigid(ob, bone_name):                                         # a part that rides one bone
    g = ob.vertex_groups.new(name=bone_name); g.add(range(len(ob.data.vertices)), 1.0, 'REPLACE')
    ob.parent = rig; m = ob.modifiers.new('rig', 'ARMATURE'); m.object = rig
def split_off(src, name, test, inflate, material):                # copy the faces that pass `test` into a new, slightly larger garment
    bm = bmesh.new(); bm.from_mesh(src.data); bm.verts.ensure_lookup_table()
    keep = [f for f in bm.faces if all(test(v.co) for v in f.verts)]
    drop = [f for f in bm.faces if f not in set(keep)]
    bmesh.ops.delete(bm, geom=drop, context='FACES')
    for v in bm.verts: v.co += v.normal * inflate
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob); me.materials.append(material)
    for g in src.vertex_groups: ob.vertex_groups.new(name=g.name)
    for p in me.polygons: p.use_smooth = True
    ob.parent = rig; m = ob.modifiers.new('rig', 'ARMATURE'); m.object = rig
    return ob
def along_arm(co):                                                # distance down the arm from the shoulder
    return (Vector((abs(co.x), co.y, co.z)) - SH).dot(ARM)
in_shirt = lambda co: (0.655 < co.z < 0.962 and abs(co.x) < 0.125) or (abs(co.x) >= 0.085 and co.z > 0.70 and along_arm(co) < 0.105)
in_sock = lambda co: 0.06 < co.z < 0.205 and abs(co.x) > 0.02
shirt = split_off(body, 'Shirt', in_shirt, 0.0055, M['shirt'])
socks = split_off(body, 'Socks', in_sock, 0.004, M['sock'])
bm = bmesh.new(); bm.from_mesh(body.data)                          # the skin under the cloth goes, so it can never poke through
hide = lambda co: (0.69 < co.z < 0.945 and abs(co.x) < 0.118) or (abs(co.x) >= 0.09 and co.z > 0.72 and along_arm(co) < 0.085) or (0.075 < co.z < 0.19 and abs(co.x) > 0.02)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(hide(v.co) for v in f.verts)], context='FACES'); bm.to_mesh(body.data); bm.free()

# ══ 4. head, face, hair ══════════════════════════════════════════════════════════════════════════
HC = (0, 0, 1.165)
def head_shape(p, u, v):
    x, y, z = p
    if z < -0.03: k = ss(-0.03, -0.15, z); x *= lerp(1, 0.80, k); y *= lerp(1, 0.9, k) if y < 0 else 1
    if z < 0 and y < 0: x *= 1 + 0.05 * ss(0.0, -0.07, z) * (1 - ss(-0.07, -0.14, z))      # cheeks
    return [x, y, z]
head = uv_sphere('Head', HC, (0.156, 0.165, 0.152), 44, 28, M['skin'], head_shape)
for sx in (1, -1):
    e = uv_sphere('Ear', (sx * 0.152, 0.005, 1.145), (0.016, 0.022, 0.03), 10, 8, M['skin'])
    activate(head); e.select_set(True); bpy.ops.object.join()
nose = uv_sphere('Nose', (0, -0.160, 1.122), (0.010, 0.009, 0.008), 10, 8, M['skin']); activate(head); nose.select_set(True); bpy.ops.object.join()
rigid(head, 'head')

eyes_parts = []
for sx in (1, -1):
    eyes_parts.append(uv_sphere('Eye', (sx * 0.058, -0.1475, 1.150), (0.0205, 0.012, 0.0265), 16, 12, M['eye']))
    eyes_parts.append(uv_sphere('Glint', (sx * 0.058 + 0.007, -0.1585, 1.161), (0.0058, 0.003, 0.0058), 8, 6, M['white']))
activate(eyes_parts[0])
for e in eyes_parts[1:]: e.select_set(True)
bpy.ops.object.join(); eyes = eyes_parts[0]; eyes.name = 'Eyes'
eyes.shape_key_add(name='Basis'); bk = eyes.shape_key_add(name='blink')
for i, v in enumerate(eyes.data.vertices): bk.data[i].co = Vector((v.co.x, v.co.y + 0.002, 1.150 + (v.co.z - 1.150) * 0.08))
rigid(eyes, 'head')
bk.value = 0.0                                                      # a new shape key starts fully on; open her eyes

def arc_tube(name, center, radius, a0, a1, thick, material, n=14, plane='xz', tilt=0.0):
    verts, faces, seg = [], [], 6
    for i in range(n + 1):
        a = lerp(a0, a1, i / n); cx = center[0] + math.cos(a) * radius; cz = center[2] + math.sin(a) * radius
        t = thick * (0.35 + 0.65 * math.sin(math.pi * i / n))
        for s in range(seg):
            b = s / seg * 2 * math.pi; verts.append((cx + math.cos(b) * t * math.cos(a), center[1] + math.sin(b) * t - abs(cx - center[0]) * tilt, cz + math.cos(b) * t * math.sin(a)))
    for i in range(n):
        for s in range(seg): a = i * seg + s; b = i * seg + (s + 1) % seg; faces.append((a, b, b + seg, a + seg))
    return new_obj(name, verts, (), faces, material)
face_bits = [arc_tube('Mouth', (0, -0.1555, 1.102), 0.017, math.radians(205), math.radians(335), 0.0034, M['mouth'], tilt=0.35)]
for sx in (1, -1):
    face_bits.append(arc_tube('Brow', (sx * 0.058, -0.158, 1.168), 0.026, math.radians(55), math.radians(125), 0.0032, M['eye'], tilt=0.3))
    ca, sa = math.cos(sx * 0.62), math.sin(sx * 0.62)
    face_bits.append(uv_sphere('Blush', (sx * 0.094, -0.1365, 1.106), (0.023, 0.003, 0.017), 12, 6, M['blush'], lambda p, u, v, ca=ca, sa=sa: [p[0] * ca - p[1] * sa, p[0] * sa + p[1] * ca, p[2]]))
activate(face_bits[0])
for f in face_bits[1:]: f.select_set(True)
bpy.ops.object.join(); face = face_bits[0]; face.name = 'Face'; rigid(face, 'head')

# hair: a bowl. The lower edge is folded up to a cut line: straight across the brow, lower round the sides and back.
def hair_shape(p, u, v):
    x, y, z = p; r = math.hypot(x, y) + 1e-6; front = max(0.0, -y / r)
    cut = lerp(-0.118, 0.026, front ** 2.4)
    ridge = 1 + 0.010 * math.sin(u * 26) * ss(0.02, 0.14, r)                                  # strands, fading to nothing at the crown
    x *= ridge; y *= ridge
    if z < cut:
        k = 0.95 - ss(0, 0.05, cut - z) * 0.08; return [x * k, y * k, cut - min(0.014, (cut - z) * 0.14)]
    return [x, y, z]
hair = uv_sphere('Hair', (0, 0.006, 1.18), (0.180, 0.188, 0.176), 78, 22, M['hair'], hair_shape)
rigid(hair, 'head')

# ══ 5. clothes ═══════════════════════════════════════════════════════════════════════════════════
# collar: two rounded flaps round the neck
verts, faces, seg = [], [], 40
for i in range(4):
    t = i / 3
    for s in range(seg):
        a = s / seg * 2 * math.pi; front = max(0.0, -math.sin(a)) ** 6
        r = lerp(0.046, 0.094, t) * (1 - 0.42 * front * t)
        verts.append((math.cos(a) * r, math.sin(a) * r * 0.9, lerp(0.985, 0.938, t ** 0.8) - 0.012 * front * t))
for i in range(3):
    for s in range(seg): a = i * seg + s; b = i * seg + (s + 1) % seg; faces.append((a, b, b + seg, a + seg))
collar = new_obj('Collar', verts, (), faces, M['shirt']); sol = collar.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.005; subsurf(collar, 1); bake_modifiers(collar); rigid(collar, 'chest')

# skirt: pleated, with a waistband
verts, faces, seg, rows = [], [], 96, 9
tri = lambda a: abs(((a / (2 * math.pi) * 16) % 1) * 2 - 1) * 2 - 1                           # 16 pleats, creased rather than wavy
for i in range(rows):
    t = i / (rows - 1); z = lerp(0.70, 0.375, t)
    for s in range(seg):
        a = s / seg * 2 * math.pi; r = lerp(0.094, 0.218, t ** 0.82) * (1 + t * 0.07 * tri(a))
        verts.append((math.cos(a) * r, math.sin(a) * r * 0.9, z))
for i in range(rows - 1):
    for s in range(seg): a = i * seg + s; b = i * seg + (s + 1) % seg; faces.append((a, b, b + seg, a + seg))
skirt = new_obj('Skirt', verts, (), faces, M['skirt']); sol = skirt.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.004; bake_modifiers(skirt)
for nm in ('hips', 'thigh.L', 'thigh.R', 'skirt.F', 'skirt.B', 'skirt.L', 'skirt.R'): skirt.vertex_groups.new(name=nm)
for v in skirt.data.vertices:
    t = ss(0.70, 0.375, v.co.z); k = t * 0.78; a = math.atan2(v.co.y, v.co.x); cx, cy = math.cos(a), math.sin(a)
    w = {'skirt.F': max(0, -cy) ** 2, 'skirt.B': max(0, cy) ** 2, 'skirt.L': max(0, cx) ** 2, 'skirt.R': max(0, -cx) ** 2}
    th = {'thigh.L': max(0, cx * 0.8 + 0.2) * max(0, -cy + 0.4), 'thigh.R': max(0, -cx * 0.8 + 0.2) * max(0, -cy + 0.4)}
    tot = sum(w.values()); tot2 = sum(th.values()) + 1e-6
    skirt.vertex_groups['hips'].add([v.index], 1 - k, 'REPLACE')
    for n_, x in w.items(): skirt.vertex_groups[n_].add([v.index], k * 0.6 * x / tot, 'REPLACE')
    for n_, x in th.items(): skirt.vertex_groups[n_].add([v.index], k * 0.4 * x / tot2, 'REPLACE')
skirt.parent = rig; m = skirt.modifiers.new('rig', 'ARMATURE'); m.object = rig
verts, faces = [], []
for i, (z, r) in enumerate(((0.715, 0.094), (0.71, 0.099), (0.69, 0.099), (0.685, 0.094))):
    for s in range(48): a = s / 48 * 2 * math.pi; verts.append((math.cos(a) * r, math.sin(a) * r * 0.9, z))
for i in range(3):
    for s in range(48): a = i * 48 + s; b = i * 48 + (s + 1) % 48; faces.append((a, b, b + 48, a + 48))
band = new_obj('Waistband', verts, (), faces, M['skirt']); rigid(band, 'hips')

# shoes: a rounded upper on a flat sole, with a strap and buckle
for s, sx in (('L', 1), ('R', -1)):
    def shoe_shape(p, u, v):
        x, y, z = p
        if y < 0: x *= 1 + 0.12 * ss(0, -0.09, y)                                              # a rounder toe
        z = max(z, -0.03);
        if y > 0.05: z *= 1.25                                                                 # the heel cup stands a little higher
        return [x, y, z]
    up = uv_sphere('Shoe.' + s, (sx * 0.07, -0.028, 0.042), (0.047, 0.095, 0.04), 20, 14, M['shoe'], shoe_shape)
    so = uv_sphere('Sole.' + s, (sx * 0.07, -0.028, 0.008), (0.05, 0.099, 0.012), 20, 8, M['sole'], lambda p, u, v: [p[0], p[1], max(min(p[2], 0.006), -0.008)])
    st = arc_tube('Strap.' + s, (sx * 0.07, -0.012, 0.045), 0.047, math.radians(15), math.radians(165), 0.0075, M['shoe'], n=12)
    bu = uv_sphere('Buckle.' + s, (sx * 0.07 + sx * 0.043, -0.012, 0.07), (0.006, 0.008, 0.008), 8, 6, M['buckle'])
    activate(up)
    for o in (so, st, bu): o.select_set(True)
    bpy.ops.object.join(); rigid(up, 'foot.' + s)

# backpack with a flap, straps over the shoulders
pk = bpy.data.meshes.new('Pack'); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0);
for v in bm.verts: v.co = Vector((v.co.x * 0.19, v.co.y * 0.085 + 0.142, v.co.z * 0.23 + 0.80))
bm.to_mesh(pk); bm.free(); pack = bpy.data.objects.new('Pack', pk); col.objects.link(pack); pk.materials.append(M['pack'])
bv = pack.modifiers.new('bev', 'BEVEL'); bv.width = 0.03; bv.segments = 3; bake_modifiers(pack)
flap = uv_sphere('Flap', (0, 0.15, 0.845), (0.099, 0.05, 0.085), 16, 10, M['pack'], lambda p, u, v: [p[0], max(p[1], -0.01), p[2]])
lock = uv_sphere('Lock', (0, 0.198, 0.775), (0.012, 0.006, 0.016), 8, 6, M['buckle'])
activate(pack); flap.select_set(True); lock.select_set(True); bpy.ops.object.join()
for sx in (1, -1):
    cu = bpy.data.curves.new('strap', 'CURVE'); cu.dimensions = '3D'; sp = cu.splines.new('BEZIER')
    pts = [(0.072, 0.10, 0.905), (0.078, 0.02, 0.972), (0.084, -0.062, 0.928), (0.09, -0.096, 0.83), (0.092, -0.075, 0.735), (0.088, 0.02, 0.705), (0.08, 0.105, 0.715)]
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts): bp.co = (p[0] * sx, p[1], p[2]); bp.handle_left_type = bp.handle_right_type = 'AUTO'
    cu.bevel_depth = 0.006; cu.bevel_resolution = 1; cu.extrude = 0.011; cu.resolution_u = 5
    so = bpy.data.objects.new('Strap', cu); col.objects.link(so); cu.materials.append(M['pack'])
    activate(so); bpy.ops.object.convert(target='MESH'); activate(pack); so.select_set(True); bpy.ops.object.join()
for p in pack.data.polygons: p.use_smooth = True
rigid(pack, 'chest')

MESHES = [o for o in col.objects if o.type == 'MESH']
tris = sum(len(p.vertices) - 2 for o in MESHES for p in o.data.polygons)
print('BUILD', dict(meshes=[o.name for o in MESHES], tris=tris, body_verts=len(body.data.vertices), weighted=weighted, bones=len(arm_data.bones)))

# ══ 6. animation: the bone angles are computed per frame and baked as keyframes ══════════════════
RX = lambda a: Matrix.Rotation(a, 3, 'X'); RY = lambda a: Matrix.Rotation(a, 3, 'Y'); RZ = lambda a: Matrix.Rotation(a, 3, 'Z')
def euler(x=0, y=0, z=0):          # (pitch about the side axis, yaw about up, roll about forward) → a rotation in the rig's axes
    return RX(x) @ RZ(y) @ RY(-z)
A_POSE = {'L': RY(-math.atan2(ARM.x, -ARM.z)), 'R': RY(math.atan2(ARM.x, -ARM.z))}   # turns "arm hanging down" into the rest pose
def pose(frame, rots, hips_off=(0, 0, 0)):
    for name, R in rots.items():
        pb = rig.pose.bones[name]; B = pb.bone.matrix_local.to_3x3()
        q = (B.inverted() @ R @ B).to_quaternion()
        prev = pb.get('_q');
        if prev is not None: q.make_compatible(Quaternion(prev))
        pb['_q'] = list(q); pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = q; pb.keyframe_insert('rotation_quaternion', frame=frame)
    pb = rig.pose.bones['hips']; B = pb.bone.matrix_local.to_3x3()
    pb.location = B.inverted() @ Vector(hips_off); pb.keyframe_insert('location', frame=frame)
def frame_pose(ph, t, m, r, wave=0.0):
    idle = 1 - m; R = {}
    A = lerp(0.50, 0.95, r) * m; K = lerp(1.0, 1.9, r) * m; arm = lerp(0.55, 1.0, r) * m; elbow = lerp(0.28, 1.45, r); bob = lerp(0.016, 0.042, r) * m
    off = (math.sin(ph) * 0.012 * m + math.sin(t * 0.5) * 0.01 * idle, 0, math.cos(ph * 2) * bob - bob * 0.6 - idle * 0.004 * (1 + math.sin(t * 1.7)))
    R['hips'] = euler(lerp(0.03, 0.2, r) * m, math.sin(ph) * 0.13 * m, math.sin(ph) * 0.05 * m + math.sin(t * 0.5) * 0.025 * idle)
    R['spine'] = euler(lerp(0.02, 0.1, r) * m + math.sin(t * 1.7) * 0.012 * idle, -math.sin(ph) * 0.09 * m, -math.sin(ph) * 0.03 * m - math.sin(t * 0.5) * 0.02 * idle)
    R['chest'] = euler(math.sin(t * 1.7 + 0.5) * 0.02 * idle, -math.sin(ph) * 0.12 * m, 0)
    R['neck'] = euler(-lerp(0.02, 0.1, r) * m, math.sin(ph) * 0.06 * m, 0)
    R['head'] = euler(-0.03 + math.cos(ph * 2 + 0.6) * 0.025 * m + math.sin(t * 1.05) * 0.02 * idle, math.sin(ph) * 0.05 * m + math.sin(t * 0.5236) * 0.28 * idle, math.sin(t * 0.5236 + 1) * 0.04 * idle)
    for s, sx, p in (('L', 1, ph), ('R', -1, ph + math.pi)):
        swing = -math.sin(p) * A - lerp(0.02, 0.18, r) * m
        knee = max(0.0, math.cos(p)) ** 1.3 * K + 0.06 * m + max(0.0, -math.sin(p)) * 0.12 * m
        R['thigh.' + s] = euler(swing, 0, sx * 0.012); R['shin.' + s] = euler(knee)
        R['foot.' + s] = euler(-(swing + knee) * 0.7 + max(0.0, math.sin(p)) * 0.25 * m - max(0.0, -math.cos(p + 0.9)) * 0.3 * m)
        R['toe.' + s] = euler(-max(0.0, -math.sin(p - 0.5)) * 0.5 * m)
        Ap = A_POSE[s]; Ai = Ap.inverted()
        up = euler(math.sin(p) * arm + math.sin(t * 1.05 + sx) * 0.03 * idle, 0, sx * (0.10 + 0.06 * r * m) + sx * math.sin(t * 1.7) * 0.012 * idle)
        fo = euler(-(elbow * m + 0.14) - max(0.0, -math.sin(p)) * 0.35 * m); ha = euler(0, 0, -sx * 0.08); curl = 0.55 + 0.5 * r * m
        if wave > 0 and s == 'R':                                                      # the right arm goes up and waves
            up = euler(-0.2 * wave, 0, sx * lerp(0.10, 2.15, wave)); fo = euler(0, 0, sx * (0.15 + math.sin(t * 9.0) * 0.4) * wave); ha = euler(0, 0, sx * math.sin(t * 9.0 + 0.6) * 0.25 * wave); curl = lerp(0.55, 0.05, wave)
        R['upperarm.' + s] = up @ Ai; R['forearm.' + s] = Ap @ fo @ Ai; R['hand.' + s] = Ap @ ha @ Ai
        R['fingers.' + s] = RY(sx * curl); R['thumb.' + s] = RZ(-sx * 0.25)
    sw = 0.10 * m + 0.05 * r * m                                                       # the skirt swings a beat behind the legs
    R['skirt.F'] = euler(math.sin(ph * 2 - 1.0) * sw + 0.04 * m); R['skirt.B'] = euler(math.sin(ph * 2 - 1.0) * sw + 0.10 * m * (1 + r))
    R['skirt.L'] = euler(0, 0, math.sin(ph - 0.9) * sw); R['skirt.R'] = euler(0, 0, math.sin(ph - 0.9) * sw)
    return R, off
rig.animation_data_create(); ad = rig.animation_data
def make_action(name, frames, fn):
    for pb in rig.pose.bones:
        if '_q' in pb: del pb['_q']
    act = bpy.data.actions.new(name); ad.action = act
    for f in range(1, frames + 2): R, off = fn(f - 1); pose(f, R, off)
    tr = ad.nla_tracks.new(); tr.name = name; st = tr.strips.new(name, 1, act); st.name = name; ad.action = None; tr.mute = True
    return act
TAU = 2 * math.pi
make_action('Idle', 144, lambda f: frame_pose(0, f / 144 * 12.0, 0, 0))                # 12 s of time so every slow sine closes its loop
make_action('Walk', 24, lambda f: frame_pose(f / 24 * TAU, 0, 1, 0))
make_action('Run', 16, lambda f: frame_pose(f / 16 * TAU, 0, 1, 1))
make_action('Wave', 60, lambda f: frame_pose(0, f / 60 * TAU / 0.5236 * 0.1667, 0, 0, wave=ss(0, 10, f) * (1 - ss(48, 60, f))))
for tr in ad.nla_tracks: tr.mute = False
for pb in rig.pose.bones:
    if '_q' in pb: del pb['_q']
    pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)

# ══ 7. preview pictures ══════════════════════════════════════════════════════════════════════════
def render_previews():
    os.makedirs(PREVIEW, exist_ok=True)
    w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.78, 0.80, 0.84, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.9
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.2; sun.rotation_euler = (math.radians(55), 0, math.radians(35)); scene.collection.objects.link(sun)
    gm = bpy.data.meshes.new('g'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=6); bm.to_mesh(gm); bm.free(); g = bpy.data.objects.new('ground', gm); scene.collection.objects.link(g); gm.materials.append(mat('ground', '#b9b4aa', 0.9))
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam; cam.data.lens = 60
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT', 'BLENDER_WORKBENCH'):
        try: scene.render.engine = eng; break
        except Exception: pass
    scene.render.resolution_x = 560; scene.render.resolution_y = 760; scene.render.image_settings.file_format = 'PNG'
    def shot(name, pos, look, frame=None, track=None):
        for tr in ad.nla_tracks: tr.mute = (tr.name != track)
        if track is None:
            for pb in rig.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        scene.frame_set(frame or 1)
        cam.location = pos; d = Vector(look) - Vector(pos); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = os.path.join(PREVIEW, name + '.png'); bpy.ops.render.render(write_still=True)
    shot('1-front', (0, -3.3, 0.72), (0, 0, 0.68)); shot('2-threeq', (2.1, -2.6, 0.9), (0, 0, 0.68)); shot('3-side', (3.3, 0, 0.72), (0, 0, 0.68)); shot('4-back', (-1.4, 3.0, 0.9), (0, 0, 0.68))
    shot('5-face', (0.35, -1.25, 1.2), (0, 0, 1.13)); shot('6-hand', (0.75, -0.75, 0.75), (0.32, 0, 0.64))
    shot('7-walk', (2.6, -2.2, 0.8), (0, 0, 0.66), 4, 'Walk'); shot('8-walk2', (2.6, -2.2, 0.8), (0, 0, 0.66), 13, 'Walk'); shot('9-run', (3.0, -1.2, 0.8), (0, 0, 0.66), 5, 'Run'); shot('10-wave', (0.6, -3.1, 0.8), (0, 0, 0.72), 30, 'Wave')
    for o in (sun, g, cam): bpy.data.objects.remove(o)
    for tr in ad.nla_tracks: tr.mute = False
    scene.frame_set(1)
if PREVIEW and STAGE != 'export': render_previews()

# ══ 8. export ════════════════════════════════════════════════════════════════════════════════════
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects: o.select_set(True)
bpy.context.view_layer.objects.active = rig
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_skins=True, export_morph=True, export_force_sampling=True, export_yup=True, export_apply=False)
print('EXPORTED', OUT, os.path.getsize(OUT))
