# finish_tripo_girl.py — takes the Noodles girl as Tripo made her (rigged FBX with idle, walk, run, greet_04)
# and makes the web model: one matte material, a texture at TEX pixels (default 2048), her gait measured,
# and one .glb with the motions named Idle, Walk, Run and Wave. SKIN_SHIFT=1 warms a yellow skin.
# CJ, 2026-11-21: 「tripo那個不錯 膚色跟臉表情再修改一下」.
#
# Her texture is cut into hundreds of scattered pieces, so nothing can be painted on it directly.
# Instead every texture pixel is given the 3D point it covers on her body, and the paint is decided
# from that point: "is this pixel on the front of her face, near where the mouth is?"
#
#   Blender --background --factory-startup --python tools/character/finish_tripo_girl.py -- <folder with the unzipped Tripo export> <out.glb> [preview_dir]
import bpy, sys, glob, math, os
import numpy as np
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; SRC, OUT = argv[0], argv[1]; PREVIEW = argv[2] if len(argv) > 2 else None
NAME = os.environ.get('NAME', 'noodles-girl'); HEIGHT = float(os.environ.get('HEIGHT', 1.24))   # NAME=bear-poncho HEIGHT=1.2 finishes another Tripo character the same way
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=glob.glob(SRC + '/*.fbx')[0], automatic_bone_orientation=False)
scene = bpy.context.scene
mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]; arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; me = mesh.data
actions = {a.name.split('|')[-1].split('.')[0]: a for a in bpy.data.actions}
arm.animation_data.action = None
for pb in arm.pose.bones: pb.rotation_mode = pb.rotation_mode; pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)

# ── the texture, at 2K ───────────────────────────────────────────────────────────────────────────
im = [i for i in bpy.data.images if 'basecolor' in i.filepath.lower()][0]; TEX = int(os.environ.get('TEX', 2048)); im.scale(TEX, TEX); W = H = TEX
px = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4)
# ── a 3D position for every texture pixel ────────────────────────────────────────────────────────
co = np.array([mesh.matrix_world @ v.co for v in me.vertices], dtype=np.float32)
uvl = me.uv_layers[0].data; pos = np.zeros((H, W, 3), np.float32); has = np.zeros((H, W), bool)
me.calc_loop_triangles()
for t in me.loop_triangles:
    p = np.array([[uvl[l].uv[0] * W, uvl[l].uv[1] * H] for l in t.loops], np.float32); c = co[list(t.vertices)]
    x0, y0 = np.floor(p.min(0)).astype(int) - 1; x1, y1 = np.ceil(p.max(0)).astype(int) + 1
    x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, W - 1), min(y1, H - 1)
    if x1 < x0 or y1 < y0: continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    d = (p[1, 1] - p[2, 1]) * (p[0, 0] - p[2, 0]) + (p[2, 0] - p[1, 0]) * (p[0, 1] - p[2, 1])
    if abs(d) < 1e-9: continue
    a = ((p[1, 1] - p[2, 1]) * (gx - p[2, 0]) + (p[2, 0] - p[1, 0]) * (gy - p[2, 1])) / d
    b = ((p[2, 1] - p[0, 1]) * (gx - p[2, 0]) + (p[0, 0] - p[2, 0]) * (gy - p[2, 1])) / d
    g = 1 - a - b; m = (a >= -0.35) & (b >= -0.35) & (g >= -0.35)          # a little past each edge, so the seams get painted too
    sub = pos[y0:y1 + 1, x0:x1 + 1]; sh = has[y0:y1 + 1, x0:x1 + 1]; inside = (a >= 0) & (b >= 0) & (g >= 0)
    w = m & (inside | ~sh); sub[w] = (a[..., None] * c[0] + b[..., None] * c[1] + g[..., None] * c[2])[w]; sh[w] = True
X_, Y_, Z_ = pos[..., 0], pos[..., 1], pos[..., 2]; r, g_, b_ = px[..., 0], px[..., 1], px[..., 2]
lum = 0.3 * r + 0.59 * g_ + 0.11 * b_
front = has & (Y_ < -0.05)                                                  # she faces -Y
# ── skin ─────────────────────────────────────────────────────────────────────────────────────────
# The first Tripo model came out yellow and was warmed here. The second was generated from a sheet that
# already has the right peach skin, so the shift is off unless SKIN_SHIFT=1. Repainting eyes and mouth on
# the texture was tried and removed (CJ, 2026-11-21: 「不對」, 「嘴巴也怪怪的」): a face is fixed in the drawing.
if os.environ.get('SKIN_SHIFT') == '1':
    skin = has & (r > 0.78) & (g_ > 0.5) & (g_ < 0.86) & (b_ > 0.3) & (b_ < 0.72) & (r - b_ > 0.18) & ((Z_ > 0.5) | (np.abs(X_) > 0.19))
    px[skin, 0] = np.clip(px[skin, 0] * 1.005, 0, 1); px[skin, 1] = np.clip(px[skin, 1] * 0.985, 0, 1); px[skin, 2] = np.clip(px[skin, 2] * 1.17, 0, 1)
    print('SKIN', int(skin.sum()))
im.pixels = px.ravel().tolist(); tex_path = os.path.join(os.path.dirname(OUT), '_' + NAME + '-basecolor.jpg')
im.filepath_raw = tex_path; im.file_format = 'JPEG'; scene.render.image_settings.quality = 90; im.save()
# ── one simple material: her painted colour, matte ───────────────────────────────────────────────
mat = bpy.data.materials.new(NAME); mat.use_nodes = True; bsdf = mat.node_tree.nodes['Principled BSDF']
tn = mat.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = im; mat.node_tree.links.new(tn.outputs['Color'], bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value = 0.9
me.materials.clear(); me.materials.append(mat)
# ── scale her to the height the scenes expect, and measure her gait ──────────────────────────────
K = HEIGHT / float(co[:, 2].max()); arm.scale = (arm.scale[0] * K,) * 3
def gait(act, foot='mixamorig:LeftFoot'):
    arm.animation_data.action = act; f0, f1 = int(act.frame_range[0]), int(act.frame_range[1]); ys, zs = [], []
    for f in range(f0, f1 + 1):
        scene.frame_set(f); m = arm.matrix_world @ arm.pose.bones[foot].matrix; h = arm.matrix_world @ arm.pose.bones['mixamorig:Hips'].matrix
        ys.append(m.translation.y - h.translation.y); zs.append(m.translation.z)
    ys = np.array(ys); zs = np.array(zs); up = (zs > zs.min() + 0.5 * (zs.max() - zs.min())).astype(int); lifts = int(((up[1:] - up[:-1]) == 1).sum()) or 1
    return dict(frames=f1 - f0, cycles=lifts, metres_per_cycle=round(float(2 * (ys.max() - ys.min())), 3), seconds=round((f1 - f0) / scene.render.fps, 3))
G = {n: gait(actions[n]) for n in ('walk', 'run')}; print('GAIT', G)
arm['walkCycle'] = G['walk']['metres_per_cycle']; arm['walkCycles'] = G['walk']['cycles']; arm['runCycle'] = G['run']['metres_per_cycle']; arm['runCycles'] = G['run']['cycles']
# ── the four motions as named tracks ─────────────────────────────────────────────────────────────
arm.animation_data.action = None; NAMES = {'idle': 'Idle', 'walk': 'Walk', 'run': 'Run'}
for k in actions:                                        # a standing wave (greet_04); Tripo's wave_goodbye_01 crouches and is not used
    if k.startswith('greet'): NAMES[k] = 'Wave'
for src, name in NAMES.items():
    a = actions[src]; a.name = name; tr = arm.animation_data.nla_tracks.new(); tr.name = name; st = tr.strips.new(name, int(a.frame_range[0]), a); st.name = name
scene.frame_set(1)
if PREVIEW:
    os.makedirs(PREVIEW, exist_ok=True)
    w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.86, 0.8, 0.72, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.5
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam; cam.data.lens = 70
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT', 'BLENDER_WORKBENCH'):
        try: scene.render.engine = eng; break
        except Exception: pass
    try: scene.view_settings.view_transform = 'Standard'
    except Exception: pass
    scene.render.resolution_x = scene.render.resolution_y = 600
    def shot(name, pos, look, track=None, frame=1):
        for tr in arm.animation_data.nla_tracks: tr.mute = (tr.name != track)
        scene.frame_set(frame); cam.location = pos; d = Vector(look) - Vector(pos); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); scene.render.filepath = os.path.join(PREVIEW, name + '.png'); bpy.ops.render.render(write_still=True)
    shot('1-face', (0.0, -1.2, 0.83), (0, 0, 0.815), 'Idle', 1); shot('0-face-side', (0.7, -1.0, 0.83), (0, 0, 0.815), 'Idle', 1); shot('2-front', (0, -4.0, 0.62), (0, 0, 0.62), 'Idle', 1); shot('3-walk', (2.6, -3.0, 0.7), (0, 0, 0.62), 'Walk', 14)
    shot('4-run', (3.2, -2.2, 0.7), (0, 0, 0.62), 'Run', 8); shot('5-wave', (0.4, -4.0, 0.7), (0, 0, 0.66), 'Wave', 30); shot('6-back', (-1.2, 3.8, 0.8), (0, 0, 0.62), 'Idle', 1)
    bpy.data.objects.remove(cam)
    for tr in arm.animation_data.nla_tracks: tr.mute = False
    scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT'); mesh.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
                          export_force_sampling=True, export_yup=True, export_apply=False, export_extras=True, export_image_format='JPEG', export_jpeg_quality=88)
print('EXPORTED', OUT, os.path.getsize(OUT))
