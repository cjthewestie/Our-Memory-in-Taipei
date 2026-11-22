# build_girl.py — builds the project's own schoolgirl as a rigged, animated character and exports a .glb.
# CJ, 2026-11-21: 「張君雅小妹妹也要重制喔變成一個專業可動的角色」, "Yes, use Blender", then
# 「做Q版一點然後運動自然就可以給我了 1」 — option 1 being an ORIGINAL girl of the same era, not the
# snack-pack character (that design belongs to 維力). Her look is her own: a yellow school hat, twin
# braids with red ribbons, a sailor-collar uniform, canvas shoes, a khaki school satchel.
#
# Run headless (does not touch an open Blender window):
#   /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
#       --python tools/character/build_girl.py -- <out.glb> [preview_dir]
#
# She is modelled at ordinary child proportions and then "chibified" in one step (section 6): the body
# is squashed to two thirds of its height and the head enlarged, so every part stays in register.
# Facing: -Y in Blender, which the glTF exporter turns into +Z forward, Y up.
import bpy, bmesh, sys, math, os
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if len(argv) > 0 else '/tmp/girl.glb'
PREVIEW = argv[1] if len(argv) > 1 and argv[1] else None

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
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        if hasattr(m, 'blend_method'): m.blend_method = 'BLEND'
    m.diffuse_color = (*rgb, alpha); return m
M = dict(skin=mat('skin', '#f4cba8', 0.62), hair=mat('hair', '#1e1613', 0.4), shirt=mat('shirt', '#f3eee2', 0.8), navy=mat('navy', '#1f2a44', 0.75),
         sock=mat('sock', '#f3eee2', 0.9), shoe=mat('canvas', '#efe9da', 0.85), sole=mat('sole', '#b9402f', 0.6), hat=mat('hat', '#f2c21a', 0.7),
         bag=mat('bag', '#8c7c4c', 0.85), red=mat('red', '#c8392b', 0.55), eye=mat('eye', '#0e0b0a', 0.1), white=mat('white', '#ffffff', 0.3),
         blush=mat('blush', '#f08a7a', 0.9, 0.5), mouth=mat('mouth', '#8a3a30', 0.5), buckle=mat('buckle', '#c9b27a', 0.3, 1, 0.8))

def new_obj(name, verts, edges=(), faces=(), material=None, smooth=True):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], list(edges), list(faces)); me.update()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    if material: me.materials.append(material)
    if smooth:
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
def ring_strip(name, rows, seg, material, closed=True):           # rows: list of functions angle → (x, y, z)
    verts, faces = [], []
    for fn in rows:
        for s in range(seg): verts.append(fn(s / seg * 2 * math.pi))
    for i in range(len(rows) - 1):
        for s in range(seg if closed else seg - 1): a = i * seg + s; b = i * seg + (s + 1) % seg; faces.append((a, b, b + seg, a + seg))
    return new_obj(name, verts, (), faces, material)

# ══ 1. body: a stick figure that the Skin modifier wraps in flesh ════════════════════════════════
ARM = Vector((0.64, 0, -0.77)).normalized()
SH, EL, WR = Vector((0.098, 0, 0.928)), Vector((0.21, 0, 0.795)), Vector((0.30, 0, 0.685))
PALM = WR + ARM * 0.04
sk = [((0, 0, 0.56), 0.100), ((0, 0, 0.68), 0.085), ((0, 0, 0.80), 0.098), ((0, 0, 0.90), 0.092), ((0, 0, 0.975), 0.042), ((0, 0, 1.04), 0.042),
      (SH, 0.046), (EL, 0.036), (WR, 0.029), (PALM, 0.03),
      ((0.068, 0, 0.535), 0.066), ((0.07, 0, 0.30), 0.05), ((0.07, 0, 0.085), 0.038), ((0.07, -0.06, 0.035), 0.03)]
ed = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (3, 6), (6, 7), (7, 8), (8, 9), (0, 10), (10, 11), (11, 12), (12, 13)]
for k, (dy, ln) in enumerate([(-0.021, 0.034), (-0.007, 0.039), (0.007, 0.037), (0.021, 0.029)]):   # short, round fingers
    base = PALM + ARM * 0.022 + Vector((0, dy, 0)); tip = base + ARM * ln + Vector((0, dy * 0.25, 0))
    n = len(sk); sk += [(base, 0.0102), (tip, 0.0092)]; ed += [(9, n), (n, n + 1)]
n = len(sk); sk += [(WR + ARM * 0.012 + Vector((0, -0.022, 0)), 0.012), (WR + ARM * 0.032 + Vector((0, -0.046, -0.004)), 0.01)]; ed += [(8, n), (n, n + 1)]
body = new_obj('Body', [Vector(p) for p, _ in sk], ed, (), M['skin'])
mir = body.modifiers.new('mirror', 'MIRROR'); mir.use_axis[0] = True; mir.use_clip = True; mir.merge_threshold = 0.002
body.modifiers.new('skin', 'SKIN')
for i, (_, r) in enumerate(sk):
    d = body.data.skin_vertices[0].data[i]; d.radius = (r, r); d.use_root = (i == 0)
subsurf(body, 2); bake_modifiers(body)
for v in body.data.vertices:
    x, y, z = v.co
    if z > 0.5: v.co.y = y * lerp(0.82, 1.0, ss(0.085, 0.14, abs(x)))
bm = bmesh.new(); bm.from_mesh(body.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(body.data); bm.free()

# ══ 2. skeleton ══════════════════════════════════════════════════════════════════════════════════
arm_data = bpy.data.armatures.new('GirlRig'); rig = bpy.data.objects.new('GirlRig', arm_data); col.objects.link(rig)
activate(rig); bpy.ops.object.mode_set(mode='EDIT')
HEAD_BONES = set()
def bone(name, head, tail, parent=None, connect=False, deform=True, on_head=False):
    b = arm_data.edit_bones.new(name); b.head = Vector(head); b.tail = Vector(tail); b.use_deform = deform
    if parent: b.parent = arm_data.edit_bones[parent]; b.use_connect = connect
    if on_head: HEAD_BONES.add(name)
    return b
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
    bone('braid.' + s + '.1', f((0.132, 0.035, 1.105)), f((0.148, 0.035, 1.01)), 'head', False, False, True)
    bone('braid.' + s + '.2', f((0.148, 0.035, 1.01)), f((0.152, 0.035, 0.90)), 'braid.' + s + '.1', True, False, True)
for nm, dx, dy in (('skirt.F', 0, -1), ('skirt.B', 0, 1), ('skirt.L', 1, 0), ('skirt.R', -1, 0)):
    bone(nm, (dx * 0.085, dy * 0.07, 0.66), (dx * 0.2, dy * 0.19, 0.39), 'hips', False, False)
bone('bag', (0.13, 0.0, 0.67), (0.145, 0.0, 0.54), 'hips', False, False)
bpy.ops.armature.calculate_roll(type='GLOBAL_POS_Y'); bpy.ops.object.mode_set(mode='OBJECT')

# ══ 3. skin weights, worked out by Blender from the bones' positions ═════════════════════════════
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
weighted = sum(1 for v in body.data.vertices if len(v.groups) > 0)
for b in arm_data.bones:
    if b.name.startswith(('skirt', 'braid', 'bag')): b.use_deform = True

BODY_PARTS, HEAD_PARTS = [body], []
def attach(ob): ob.parent = rig; m = ob.modifiers.new('rig', 'ARMATURE'); m.object = rig
def rigid(ob, bone_name, part):
    g = ob.vertex_groups.new(name=bone_name); g.add(range(len(ob.data.vertices)), 1.0, 'REPLACE'); attach(ob); part.append(ob)
def torso_weights(ob, part):                                       # for things that lie on the trunk: follow hips, spine and chest by height
    for nm in ('hips', 'spine', 'chest'): ob.vertex_groups.new(name=nm)
    for v in ob.data.vertices:
        z = v.co.z; c = ss(0.74, 0.86, z); h = 1 - ss(0.60, 0.74, z)
        ob.vertex_groups['chest'].add([v.index], c, 'REPLACE'); ob.vertex_groups['hips'].add([v.index], h, 'REPLACE'); ob.vertex_groups['spine'].add([v.index], max(0.0, 1 - c - h), 'REPLACE')
    attach(ob); part.append(ob)
def split_off(src, name, test, inflate, material):
    bm = bmesh.new(); bm.from_mesh(src.data); keep = set(f for f in bm.faces if all(test(v.co) for v in f.verts))
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f not in keep], context='FACES')
    for v in bm.verts: v.co += v.normal * inflate
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob); me.materials.append(material)
    for g in src.vertex_groups: ob.vertex_groups.new(name=g.name)
    for p in me.polygons: p.use_smooth = True
    attach(ob); BODY_PARTS.append(ob); return ob
def along_arm(co): return (Vector((abs(co.x), co.y, co.z)) - SH).dot(ARM)
shirt = split_off(body, 'Shirt', lambda co: (0.655 < co.z < 0.962 and abs(co.x) < 0.125) or (abs(co.x) >= 0.085 and co.z > 0.70 and along_arm(co) < 0.105), 0.0055, M['shirt'])
socks = split_off(body, 'Socks', lambda co: 0.06 < co.z < 0.175 and abs(co.x) > 0.02, 0.0045, M['sock'])
bm = bmesh.new(); bm.from_mesh(body.data)
hide = lambda co: (0.69 < co.z < 0.945 and abs(co.x) < 0.118) or (abs(co.x) >= 0.09 and co.z > 0.72 and along_arm(co) < 0.085) or (0.075 < co.z < 0.16 and abs(co.x) > 0.02)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(hide(v.co) for v in f.verts)], context='FACES'); bm.to_mesh(body.data); bm.free()

# ══ 4. head, face, hair, hat ═════════════════════════════════════════════════════════════════════
HC = (0, 0, 1.165)
def head_shape(p, u, v):
    x, y, z = p
    if z < -0.03:
        k = ss(-0.03, -0.15, z); x *= lerp(1, 0.84, k)
        if y < 0: y *= lerp(1, 0.92, k)
    if z < 0 and y < 0: x *= 1 + 0.07 * ss(0.0, -0.07, z) * (1 - ss(-0.07, -0.145, z))      # round cheeks
    return [x, y, z]
head_bits = [uv_sphere('Head', HC, (0.158, 0.165, 0.152), 44, 28, M['skin'], head_shape)]
for sx in (1, -1): head_bits.append(uv_sphere('Ear', (sx * 0.154, 0.005, 1.145), (0.016, 0.022, 0.03), 10, 8, M['skin']))
head_bits.append(uv_sphere('Nose', (0, -0.161, 1.118), (0.009, 0.008, 0.007), 10, 8, M['skin']))
head = join(head_bits, 'Head'); rigid(head, 'head', HEAD_PARTS)

eyes_parts = []
for sx in (1, -1):                                                 # big dark eyes, two highlights each
    eyes_parts.append(uv_sphere('Eye', (sx * 0.064, -0.146, 1.146), (0.026, 0.013, 0.034), 18, 12, M['eye']))
    eyes_parts.append(uv_sphere('Glint', (sx * 0.064 + 0.009, -0.1585, 1.160), (0.0078, 0.003, 0.0078), 8, 6, M['white']))
    eyes_parts.append(uv_sphere('Glint2', (sx * 0.064 - 0.008, -0.158, 1.134), (0.004, 0.002, 0.004), 6, 5, M['white']))
eyes = join(eyes_parts, 'Eyes')
eyes.shape_key_add(name='Basis'); bk = eyes.shape_key_add(name='blink')
for i, v in enumerate(eyes.data.vertices): bk.data[i].co = Vector((v.co.x, v.co.y + 0.003, 1.146 + (v.co.z - 1.146) * 0.07))
bk.value = 0.0                                                      # a new shape key starts fully on; open her eyes
rigid(eyes, 'head', HEAD_PARTS)

def arc_tube(name, center, radius, a0, a1, thick, material, n=14, tilt=0.0):
    verts, faces, seg = [], [], 6
    for i in range(n + 1):
        a = lerp(a0, a1, i / n); cx = center[0] + math.cos(a) * radius; cz = center[2] + math.sin(a) * radius
        t = thick * (0.35 + 0.65 * math.sin(math.pi * i / n))
        for s in range(seg):
            b = s / seg * 2 * math.pi; verts.append((cx + math.cos(b) * t * math.cos(a), center[1] + math.sin(b) * t + abs(cx - center[0]) * tilt, cz + math.cos(b) * t * math.sin(a)))
    for i in range(n):
        for s in range(seg): a = i * seg + s; b = i * seg + (s + 1) % seg; faces.append((a, b, b + seg, a + seg))
    return new_obj(name, verts, (), faces, material)
face_bits = [arc_tube('Mouth', (0, -0.156, 1.098), 0.019, math.radians(205), math.radians(335), 0.0038, M['mouth'], tilt=0.3)]
for sx in (1, -1):
    face_bits.append(arc_tube('Brow', (sx * 0.064, -0.154, 1.172), 0.03, math.radians(60), math.radians(120), 0.003, M['eye'], tilt=0.35))
    ca, sa = math.cos(sx * 0.62), math.sin(sx * 0.62)
    face_bits.append(uv_sphere('Blush', (sx * 0.1, -0.132, 1.098), (0.026, 0.003, 0.018), 12, 6, M['blush'], lambda p, u, v, ca=ca, sa=sa: [p[0] * ca - p[1] * sa, p[0] * sa + p[1] * ca, p[2]]))
face = join(face_bits, 'Face'); rigid(face, 'head', HEAD_PARTS)

def hair_shape(p, u, v):                                           # a short fringe across the brow, longer at the sides and back
    x, y, z = p; r = math.hypot(x, y) + 1e-6; front = max(0.0, -y / r)
    cut = lerp(-0.095, 0.036, front ** 1.3)
    ridge = 1 + 0.010 * math.sin(u * 26) * ss(0.02, 0.14, r); x *= ridge; y *= ridge
    if z < cut:
        k = 0.95 - ss(0, 0.05, cut - z) * 0.08; return [x * k, y * k, cut - min(0.014, (cut - z) * 0.14)]
    return [x, y, z]
hair = uv_sphere('Hair', (0, 0.006, 1.18), (0.180, 0.188, 0.176), 78, 22, M['hair'], hair_shape)
rigid(hair, 'head', HEAD_PARTS)

# twin braids: a string of plump segments, a red ribbon and a tuft at the end; two bones each so they can swing
for s, sx in (('L', 1), ('R', -1)):
    bits = []
    for i in range(6):
        t = i / 5; z = lerp(1.10, 0.905, t); x = sx * lerp(0.136, 0.153, t); r = lerp(0.034, 0.024, t)
        bits.append(uv_sphere('seg', (x + sx * 0.004 * (1 if i % 2 else -1), 0.035 + 0.006 * (1 if i % 2 else -1), z), (r, r, r * 0.95), 12, 8, M['hair']))
    bits.append(uv_sphere('tuft', (sx * 0.154, 0.035, 0.86), (0.02, 0.02, 0.032), 10, 8, M['hair']))
    for k in (1, -1): bits.append(uv_sphere('bow', (sx * 0.154 + k * 0.022, 0.03, 0.885), (0.022, 0.009, 0.015), 10, 6, M['red']))
    bits.append(uv_sphere('knot', (sx * 0.154, 0.026, 0.885), (0.009, 0.009, 0.009), 8, 6, M['red']))
    br = join(bits, 'Braid.' + s)
    g1 = br.vertex_groups.new(name='braid.' + s + '.1'); g2 = br.vertex_groups.new(name='braid.' + s + '.2')
    for v in br.data.vertices:
        w = ss(1.04, 0.97, v.co.z); g2.add([v.index], w, 'REPLACE'); g1.add([v.index], 1 - w, 'REPLACE')
    attach(br); HEAD_PARTS.append(br)

# the yellow school hat: a round crown and a brim that lifts a little at the front
HZ = 1.238
crown = uv_sphere('Crown', (0, 0.006, HZ), (0.19, 0.198, 0.138), 48, 10, M['hat'], None, 0.0, math.pi / 2)
def brim_row(t):
    def fn(a):
        front = max(0.0, -math.sin(a)); r = lerp(0.188, 0.275, t)
        return (math.cos(a) * r, 0.006 + math.sin(a) * r * 1.03, HZ - 0.028 * t + 0.03 * t * front ** 2 + 0.004 * t * math.sin(a * 6))
    return fn
brim = ring_strip('Brim', [brim_row(0), brim_row(0.5), brim_row(1)], 48, M['hat'])
hband = ring_strip('Band', [lambda a, z=z, r=r: (math.cos(a) * r, 0.006 + math.sin(a) * r * 1.04, z) for z, r in ((HZ + 0.03, 0.189), (HZ + 0.002, 0.1925))], 48, M['navy'])
hat = join([crown, brim, hband], 'Hat'); sol = hat.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.006; bake_modifiers(hat); rigid(hat, 'head', HEAD_PARTS)

# ══ 5. clothes ═══════════════════════════════════════════════════════════════════════════════════
def trunk_y(x, z):                                                 # how far the chest stands out from the spine at (x, z)
    return 0.081 * math.sqrt(max(0.0, 1 - (x / 0.128) ** 2)) + 0.012
def collar_row(t):                                                 # the sailor collar: square on the back, a V on the chest
    def fn(a):
        s_, c_ = math.sin(a), math.cos(a)
        if s_ >= 0: xo = 0.108 * max(-1.0, min(1.0, c_ * 1.7)); zo = 0.935 - 0.085 * ss(0.0, 0.4, s_); yo = trunk_y(xo, zo) * (0.25 + 0.75 * ss(0.0, 0.35, s_))
        else: k = -s_; xo = 0.114 * c_ * (1 - 0.3 * k); zo = 0.935 - 0.105 * k ** 1.25; yo = -trunk_y(xo, zo) * (0.25 + 0.75 * ss(0.0, 0.35, k))
        xi, yi, zi = c_ * 0.05, s_ * 0.046, 0.975
        return (lerp(xi, xo, t), lerp(yi, yo, t), lerp(zi, zo, t) + 0.012 * math.sin(math.pi * t))
    return fn
collar = ring_strip('Collar', [collar_row(0), collar_row(0.35), collar_row(0.7), collar_row(1)], 56, M['navy'])
sol = collar.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.006; sol.offset = 1; bake_modifiers(collar); rigid(collar, 'chest', BODY_PARTS)
tie = join([uv_sphere('Knot', (0, -0.099, 0.826), (0.015, 0.011, 0.013), 10, 8, M['red'])] +
           [uv_sphere('Tail', (k * 0.014, -0.099, 0.793), (0.012, 0.006, 0.03), 10, 8, M['red'], lambda p, u, v, k=k: [p[0] + k * 0.25 * (-p[2]), p[1], p[2]]) for k in (1, -1)], 'Tie')
rigid(tie, 'chest', BODY_PARTS)

seg, rows = 96, 9                                                  # the pleated skirt
tri = lambda a: abs(((a / (2 * math.pi) * 16) % 1) * 2 - 1) * 2 - 1
def skirt_row(t):
    def fn(a):
        r = lerp(0.094, 0.225, t ** 0.8) * (1 + t * 0.07 * tri(a)); return (math.cos(a) * r, math.sin(a) * r * 0.92, lerp(0.70, 0.40, t))
    return fn
skirt = ring_strip('Skirt', [skirt_row(i / (rows - 1)) for i in range(rows)], seg, M['navy'])
sol = skirt.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.004; bake_modifiers(skirt)
for nm in ('hips', 'thigh.L', 'thigh.R', 'skirt.F', 'skirt.B', 'skirt.L', 'skirt.R'): skirt.vertex_groups.new(name=nm)
for v in skirt.data.vertices:
    t = ss(0.70, 0.40, v.co.z); k = t * 0.78; a = math.atan2(v.co.y, v.co.x); cx, cy = math.cos(a), math.sin(a)
    w = {'skirt.F': max(0, -cy) ** 2, 'skirt.B': max(0, cy) ** 2, 'skirt.L': max(0, cx) ** 2, 'skirt.R': max(0, -cx) ** 2}
    th = {'thigh.L': max(0, cx * 0.8 + 0.2) * max(0, -cy + 0.4), 'thigh.R': max(0, -cx * 0.8 + 0.2) * max(0, -cy + 0.4)}
    tot = sum(w.values()); tot2 = sum(th.values()) + 1e-6
    skirt.vertex_groups['hips'].add([v.index], 1 - k, 'REPLACE')
    for n_, x in w.items(): skirt.vertex_groups[n_].add([v.index], k * 0.6 * x / tot, 'REPLACE')
    for n_, x in th.items(): skirt.vertex_groups[n_].add([v.index], k * 0.4 * x / tot2, 'REPLACE')
attach(skirt); BODY_PARTS.append(skirt)
wband = ring_strip('Waistband', [lambda a, z=z, r=r: (math.cos(a) * r, math.sin(a) * r * 0.9, z) for z, r in ((0.715, 0.094), (0.71, 0.099), (0.69, 0.099), (0.685, 0.094))], 48, M['navy'])
rigid(wband, 'hips', BODY_PARTS)

def shoe_shape(p, u, v):
    x, y, z = p
    if y < 0: x *= 1 + 0.16 * ss(0, -0.09, y)
    z = max(z, -0.03)
    if y > 0.05: z *= 1.25
    return [x, y, z]
for s, sx in (('L', 1), ('R', -1)):                                 # canvas shoes: round toe, red rubber sole, a strap
    up = uv_sphere('Shoe.' + s, (sx * 0.07, -0.03, 0.044), (0.05, 0.098, 0.043), 20, 14, M['shoe'], shoe_shape)
    so = uv_sphere('Sole.' + s, (sx * 0.07, -0.03, 0.009), (0.054, 0.103, 0.013), 20, 8, M['sole'], lambda p, u, v: [p[0], p[1], max(min(p[2], 0.007), -0.009)])
    cap = uv_sphere('Cap.' + s, (sx * 0.07, -0.098, 0.034), (0.04, 0.03, 0.026), 12, 8, M['white'])
    st = arc_tube('Strap.' + s, (sx * 0.07, -0.012, 0.047), 0.05, math.radians(15), math.radians(165), 0.0075, M['shoe'], n=12)
    shoe = join([up, so, cap, st], 'Shoe.' + s); rigid(shoe, 'foot.' + s, BODY_PARTS)

# the school satchel: worn across the body, resting on the left hip
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
for v in bm.verts: v.co = Vector((v.co.x * 0.05 + 0.158, v.co.y * 0.17, v.co.z * 0.125 + 0.605))
pk = bpy.data.meshes.new('Bag'); bm.to_mesh(pk); bm.free(); bag = bpy.data.objects.new('Bag', pk); col.objects.link(bag); pk.materials.append(M['bag'])
bv = bag.modifiers.new('bev', 'BEVEL'); bv.width = 0.018; bv.segments = 3; bake_modifiers(bag)
flap = uv_sphere('Flap', (0.186, 0, 0.635), (0.012, 0.088, 0.062), 12, 8, M['bag'], lambda p, u, v: [max(p[0], -0.002), p[1], p[2]])
lock = uv_sphere('Lock', (0.199, 0, 0.6), (0.004, 0.011, 0.011), 8, 6, M['buckle'])
bag = join([bag, flap, lock], 'Bag'); rigid(bag, 'bag', BODY_PARTS)
cu = bpy.data.curves.new('strap', 'CURVE'); cu.dimensions = '3D'; sp = cu.splines.new('BEZIER'); sp.use_cyclic_u = True
pts = [(0.15, -0.03, 0.665), (0.085, -0.091, 0.745), (-0.02, -0.101, 0.86), (-0.085, -0.05, 0.955), (-0.08, 0.045, 0.952), (-0.01, 0.098, 0.86), (0.09, 0.09, 0.745), (0.152, 0.035, 0.665)]
sp.bezier_points.add(len(pts) - 1)
for bp, p in zip(sp.bezier_points, pts): bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
cu.bevel_depth = 0.004; cu.bevel_resolution = 1; cu.extrude = 0.012; cu.resolution_u = 6
strap = bpy.data.objects.new('BagStrap', cu); col.objects.link(strap); cu.materials.append(M['bag']); activate(strap); bpy.ops.object.convert(target='MESH')
for p in strap.data.polygons: p.use_smooth = True
torso_weights(strap, BODY_PARTS)

# ══ 6. chibify: squash the body, enlarge the head, keep the feet ═════════════════════════════════
NECK, BODY_K, HEAD_K = 0.975, 0.66, 1.22
NECK2 = 0.09 + (NECK - 0.09) * BODY_K
def body_z(z): return z if z < 0.09 else (0.09 + (z - 0.09) * BODY_K if z < NECK else NECK2 + (z - NECK) * HEAD_K)
def arm_x(x, z):                                                  # arms run sideways, so squashing height alone leaves them too long: shorten them too
    ax = abs(x)
    if ax > 0.098 and z > 0.928 - (ax - 0.098) * 1.2 - 0.075: return math.copysign(0.098 + (ax - 0.098) * 0.74, x)
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
height = max(v.co.z for o in MESHES for v in o.data.vertices)
print('BUILD', dict(meshes=len(MESHES), tris=tris, weighted=weighted, bones=len(arm_data.bones), height=round(height, 3)))

# ══ 7. animation: the bone angles are computed per frame and baked as keyframes ══════════════════
RX = lambda a: Matrix.Rotation(a, 3, 'X'); RY = lambda a: Matrix.Rotation(a, 3, 'Y'); RZ = lambda a: Matrix.Rotation(a, 3, 'Z')
def euler(x=0, y=0, z=0):          # (pitch about the side axis, yaw about up, roll about forward) → a rotation in the rig's axes
    return RX(x) @ RZ(y) @ RY(-z)
ub = arm_data.bones['upperarm.L']; av = (ub.tail_local - ub.head_local).normalized(); A_ANG = math.atan2(av.x, -av.z)
A_POSE = {'L': RY(-A_ANG), 'R': RY(A_ANG)}                          # turns "arm hanging down" into the rest pose
def pose(frame, rots, hips_off=(0, 0, 0)):
    for name, R in rots.items():
        pb = rig.pose.bones[name]; B = pb.bone.matrix_local.to_3x3(); q = (B.inverted() @ R @ B).to_quaternion()
        prev = pb.get('_q')
        if prev is not None: q.make_compatible(Quaternion(prev))
        pb['_q'] = list(q); pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = q; pb.keyframe_insert('rotation_quaternion', frame=frame)
    pb = rig.pose.bones['hips']; B = pb.bone.matrix_local.to_3x3(); pb.location = B.inverted() @ Vector(hips_off); pb.keyframe_insert('location', frame=frame)
W1, W2, W3 = math.pi / 6, math.pi / 3, math.pi / 2                  # idle rhythms: 1, 2 and 3 turns in the 12-second loop, so it closes cleanly
def frame_pose(ph, t, m, r, wave=0.0):
    idle = 1 - m; R = {}; sin, cos = math.sin, math.cos
    A = lerp(0.56, 0.98, r) * m; K = lerp(1.05, 1.95, r) * m; arm = lerp(0.62, 1.05, r) * m; elbow = lerp(0.30, 1.5, r); bob = lerp(0.014, 0.034, r) * m
    sway = sin(t * W1)                                               # the slow shift of weight from foot to foot when she stands
    off = (sin(ph) * 0.012 * m + sway * 0.012 * idle, 0, cos(ph * 2 + 0.25) * bob - bob * 0.5 - idle * 0.003 * (1 + sin(t * W3)))
    R['hips'] = euler(lerp(0.03, 0.2, r) * m, sin(ph) * 0.15 * m, sin(ph + 0.3) * 0.07 * m + sway * 0.03 * idle)
    R['spine'] = euler(lerp(0.02, 0.1, r) * m + sin(t * W3) * 0.014 * idle, -sin(ph) * 0.10 * m, -sin(ph + 0.3) * 0.05 * m - sway * 0.022 * idle)
    R['chest'] = euler(sin(t * W3 + 0.5) * 0.022 * idle, -sin(ph) * 0.14 * m, -sin(ph + 0.3) * 0.04 * m)
    R['neck'] = euler(-lerp(0.02, 0.1, r) * m, sin(ph) * 0.07 * m, sin(ph + 0.6) * 0.03 * m)
    R['head'] = euler(-0.03 + cos(ph * 2 + 0.9) * 0.035 * m + sin(t * W2) * 0.022 * idle, sin(ph) * 0.06 * m + (sin(t * W1) * 0.26 + sin(t * W2 + 1.0) * 0.08) * idle, sin(ph + 0.9) * 0.06 * m + sin(t * W1 + 1.2) * 0.05 * idle)
    for s, sx, p in (('L', 1, ph), ('R', -1, ph + math.pi)):
        ps = p + 0.22 * sin(p + 0.5)                                 # a foot spends longer on the ground than in the air
        swing = -sin(ps) * A - lerp(0.02, 0.18, r) * m
        knee = max(0.0, cos(ps)) ** 1.25 * K + 0.07 * m + max(0.0, -sin(ps)) * 0.14 * m
        R['thigh.' + s] = euler(swing, 0, sx * 0.015 - 0.03 * idle * sway); R['shin.' + s] = euler(knee)
        R['foot.' + s] = euler(-(swing + knee) * 0.72 + max(0.0, sin(ps)) * 0.32 * m - max(0.0, -cos(ps + 0.9)) * 0.38 * m)   # heel down first, toe off last
        R['toe.' + s] = euler(-max(0.0, -sin(ps - 0.5)) * 0.55 * m)
        Ap = A_POSE[s]; Ai = Ap.inverted()
        up = euler(sin(p) * arm + sin(t * W2 + sx) * 0.035 * idle, 0, sx * (0.16 + 0.10 * m * (1 - r) + 0.06 * r * m) + sx * sin(t * W3) * 0.014 * idle)
        fo = euler(-(elbow * m + 0.16) - max(0.0, -sin(p - 0.45)) * 0.42 * m)       # the forearm follows the upper arm a beat late
        ha = euler(sin(p - 0.9) * 0.22 * m, 0, -sx * 0.08); curl = 0.5 + 0.55 * r * m
        if wave > 0 and s == 'R':
            up = euler(0.45 * wave, 0, sx * lerp(0.16, 2.4, wave));   # a raised arm leans forward with a positive pitch (the opposite of a hanging one) fo = euler(0, 0, sx * (0.7 + sin(t * 9.0) * 0.45) * wave); ha = euler(0, 0, sx * sin(t * 9.0 + 0.6) * 0.3 * wave); curl = lerp(0.5, 0.05, wave)
        R['upperarm.' + s] = up @ Ai; R['forearm.' + s] = Ap @ fo @ Ai; R['hand.' + s] = Ap @ ha @ Ai
        R['fingers.' + s] = RY(sx * curl); R['thumb.' + s] = RZ(-sx * 0.25)
        fly = 0.32 * r * m                                           # braids trail behind in a run and swing a beat after the head
        R['braid.' + s + '.1'] = euler(sin(ph * 2 - 1.1) * 0.16 * m + fly + sin(t * W2 + sx) * 0.02 * idle, 0, sin(ph - 0.9) * 0.13 * m + sx * 0.03 + sin(t * W1 - 0.8) * 0.03 * idle)
        R['braid.' + s + '.2'] = euler(sin(ph * 2 - 1.9) * 0.22 * m + fly * 0.8 + sin(t * W2 + sx - 0.7) * 0.03 * idle, 0, sin(ph - 1.6) * 0.18 * m + sin(t * W1 - 1.5) * 0.04 * idle)
    sw = 0.11 * m + 0.05 * r * m
    R['skirt.F'] = euler(sin(ph * 2 - 1.0) * sw + 0.04 * m); R['skirt.B'] = euler(sin(ph * 2 - 1.0) * sw + 0.10 * m * (1 + r))
    R['skirt.L'] = euler(0, 0, sin(ph - 0.9) * sw + sway * 0.03 * idle); R['skirt.R'] = euler(0, 0, sin(ph - 0.9) * sw + sway * 0.03 * idle)
    R['bag'] = euler(sin(ph * 2 - 0.8) * 0.14 * m + 0.06 * r * m, 0, sin(ph - 0.6) * 0.07 * m + 0.05 + sway * 0.02 * idle)
    return R, off
rig.animation_data_create(); ad = rig.animation_data
def make_action(name, frames, fn):
    for pb in rig.pose.bones:
        if '_q' in pb: del pb['_q']
    act = bpy.data.actions.new(name); ad.action = act
    for f in range(1, frames + 2): R, off = fn(f - 1); pose(f, R, off)
    tr = ad.nla_tracks.new(); tr.name = name; st = tr.strips.new(name, 1, act); st.name = name; ad.action = None; tr.mute = True
TAU = 2 * math.pi
scene.render.fps = 24
make_action('Idle', 288, lambda f: frame_pose(0, f / 24.0, 0, 0))                      # 12 seconds at 24 fps
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
    w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.78, 0.80, 0.84, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.9
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.2; sun.rotation_euler = (math.radians(55), 0, math.radians(35)); scene.collection.objects.link(sun)
    gm = bpy.data.meshes.new('g'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=6); bm.to_mesh(gm); bm.free(); g = bpy.data.objects.new('ground', gm); scene.collection.objects.link(g); gm.materials.append(mat('ground', '#b9b4aa', 0.9))
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam; cam.data.lens = 60
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT', 'BLENDER_WORKBENCH'):
        try: scene.render.engine = eng; break
        except Exception: pass
    scene.render.resolution_x = 520; scene.render.resolution_y = 640; scene.render.image_settings.file_format = 'PNG'
    def shot(name, pos, look, frame=None, track=None):
        for tr in ad.nla_tracks: tr.mute = (tr.name != track)
        if track is None:
            for pb in rig.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        scene.frame_set(frame or 1); cam.location = pos; d = Vector(look) - Vector(pos); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = os.path.join(PREVIEW, name + '.png'); bpy.ops.render.render(write_still=True)
    c = 0.56
    shot('01-front', (0, -2.9, 0.6), (0, 0, c)); shot('02-threeq', (1.9, -2.3, 0.75), (0, 0, c)); shot('03-side', (2.9, 0, 0.6), (0, 0, c)); shot('04-back', (-1.3, 2.6, 0.8), (0, 0, c))
    shot('05-face', (0.3, -1.25, 0.95), (0, 0, 0.9)); shot('06-idle', (0.9, -2.7, 0.65), (0, 0, c), 60, 'Idle')
    shot('07-walk-a', (2.2, -1.9, 0.65), (0, 0, c), 1, 'Walk'); shot('08-walk-b', (2.2, -1.9, 0.65), (0, 0, c), 7, 'Walk'); shot('09-walk-c', (2.2, -1.9, 0.65), (0, 0, c), 13, 'Walk')
    shot('10-run-a', (2.6, -1.0, 0.65), (0, 0, c), 3, 'Run'); shot('11-run-b', (2.6, -1.0, 0.65), (0, 0, c), 11, 'Run'); shot('12-wave', (0.5, -2.8, 0.7), (0, 0, c + 0.05), 30, 'Wave')
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
                          export_skins=True, export_morph=True, export_force_sampling=True, export_yup=True, export_apply=False)
print('EXPORTED', OUT, os.path.getsize(OUT))
