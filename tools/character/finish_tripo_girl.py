# finish_tripo_girl.py — takes the Noodles girl as Tripo made her (rigged FBX with idle, walk, run, wave)
# and makes the web model: warmer skin and a small smile painted onto her texture,
# a 2K texture, and one .glb with the four motions named Idle, Walk, Run and Wave.
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
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=glob.glob(SRC + '/*.fbx')[0], automatic_bone_orientation=False)
scene = bpy.context.scene
mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]; arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; me = mesh.data
actions = {a.name.split('|')[-1].split('.')[0]: a for a in bpy.data.actions}
arm.animation_data.action = None
for pb in arm.pose.bones: pb.rotation_mode = pb.rotation_mode; pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)

# ── the texture, at 2K ───────────────────────────────────────────────────────────────────────────
im = [i for i in bpy.data.images if 'BaseColor' in i.filepath][0]; im.scale(2048, 2048); W = H = 2048
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
# ── skin: less yellow, a warm peach like CJ's sheet ──────────────────────────────────────────────
skin = has & (r > 0.78) & (g_ > 0.5) & (g_ < 0.86) & (b_ > 0.3) & (b_ < 0.72) & (r - b_ > 0.18) & ((Z_ > 0.5) | (np.abs(X_) > 0.19))
before = px[skin][:, :3].mean(0)
px[skin, 0] = np.clip(px[skin, 0] * 1.005, 0, 1); px[skin, 1] = np.clip(px[skin, 1] * 0.985, 0, 1); px[skin, 2] = np.clip(px[skin, 2] * 1.17, 0, 1)
SK = px[skin][:, :3].mean(0)
FACE_PAINT = os.environ.get('FACE_PAINT') == '1'   # off by default: repainting eyes and mouth on this texture was tried three times and
px_plain = px.copy()                                  # each result looked wrong to CJ (2026-11-21: 「不對」, 「嘴巴也怪怪的」). A face is fixed in the drawing Tripo starts from.
# ── what can be seen from the front, and what of that is hair hanging in front of the face ───────
# A depth buffer along her facing direction: for each millimetre of (x, z), the nearest surface.
gx = np.clip(((X_ + 0.26) / 0.001).astype(int), 0, 519); gz = np.clip((Z_ / 0.001).astype(int), 0, 999)
zbuf = np.full((520, 1000), 9.0, np.float32); np.minimum.at(zbuf, (gx[has], gz[has]), Y_[has])
visible = has & (Y_ <= zbuf[gx, gz] + 0.004) & (Y_ < -0.03)
# the face's own surface, fitted to the skin that shows (three passes, each dropping what does not fit),
# so a black pixel well in front of it is a strand of hair and not an eyelash or a brow
fs = visible & skin & (np.abs(X_) < 0.115) & (Z_ > 0.59) & (Z_ < 0.77)
def basis(x, z): return np.stack([np.ones_like(x), x ** 2, z, z ** 2, x ** 2 * z, x ** 4], -1)
coef = None; keep = np.ones(int(fs.sum()), bool); fx, fz, fy = X_[fs], Z_[fs], Y_[fs]
for _ in range(4):
    coef, *_ = np.linalg.lstsq(basis(fx[keep], fz[keep]), fy[keep], rcond=None); res = np.abs(basis(fx, fz) @ coef - fy); keep = res < max(0.004, np.percentile(res[keep], 85))
surf = basis(X_, Z_) @ coef
hairfront = visible & (lum < 0.25) & (Y_ < surf - 0.0055)
paintable = visible & ~hairfront
# ── mouth: the small pout goes, a small smile comes ──────────────────────────────────────────────
mreg = paintable & (np.abs(X_) < 0.04) & (Z_ > 0.535) & (Z_ < 0.605)
lips = mreg & (r - g_ > 0.28) & (lum < 0.78)
mz = float(np.median(Z_[lips])) if lips.sum() > 30 else 0.572
old = paintable & (np.abs(X_) < 0.032) & (np.abs(Z_ - mz) < 0.014); px[old, :3] = SK
zc = (mz - 0.003) + 0.011 * (X_ / 0.026) ** 2
smile = paintable & (np.abs(X_) < 0.027) & (np.abs(Z_ - zc) < 0.0032 * (1.05 - 0.45 * (np.abs(X_) / 0.027)))
px[smile, :3] = (0.56, 0.2, 0.17)
# ── eyes: smaller and clean. CJ, 2026-11-21: 「角色的眼睛要修一下」, 「顏色跟眼球的地方太大」.
# Tripo's eyes filled a third of her face and the irises were muddy. The old eyes are painted out with
# skin and smaller ones drawn in their place: cream white, a blue iris dark at the top, a pupil, two
# highlights, a heavy upper lid as on his sheet. Hair hanging in front of the face is left alone.
EYES = {}
for sx in (1, -1):
    box = visible & (X_ * sx > 0.01) & (X_ * sx < 0.104) & (Z_ > 0.642) & (Z_ < 0.73)
    oldeye = box & ~skin; px[oldeye, :3] = SK                                # the old eye, lashes and all
    shade = box & (Z_ > 0.7); px[shade, :3] = px[shade, :3] * 0.5 + SK * 0.5   # even out the old lid's shading above the new eye
    cx, cz, ea, eb = sx * 0.054, 0.686, 0.0225, 0.0195                      # Tripo's were about 0.027 by 0.026 and nearly all iris
    e = ((X_ - cx) / ea) ** 2 + ((Z_ - cz) / eb) ** 2
    op = box & (e <= 1.0); px[op, :3] = (0.97, 0.94, 0.89)
    ix, iz, ri = cx - sx * 0.002, cz - 0.003, 0.0135; d2 = (X_ - ix) ** 2 + (Z_ - iz) ** 2
    iris = op & (d2 <= ri * ri); t = np.clip((Z_ - (iz - ri)) / (2 * ri), 0, 1)[iris]
    px[iris, 0] = 0.27 - 0.2 * t; px[iris, 1] = 0.47 - 0.35 * t; px[iris, 2] = 0.87 - 0.5 * t
    ring = iris & (d2 >= (ri * 0.87) ** 2); px[ring, :3] *= 0.55
    px[op & (d2 <= (ri * 0.44) ** 2), :3] = (0.03, 0.04, 0.11)
    hx, hz = ix + 0.36 * ri, iz + 0.38 * ri; px[op & ((X_ - hx) ** 2 + (Z_ - hz) ** 2 <= (ri * 0.25) ** 2), :3] = (1, 1, 1)
    hx, hz = ix - 0.34 * ri, iz - 0.42 * ri; px[op & ((X_ - hx) ** 2 + (Z_ - hz) ** 2 <= (ri * 0.12) ** 2), :3] = (0.75, 0.86, 1)
    lid = box & (e <= 1.25) & (Z_ > cz + 0.42 * eb); px[lid, :3] = (0.06, 0.05, 0.05)                     # the heavy upper lid
    wing = box & (np.abs(Z_ - (cz + 0.5 * eb + (X_ * sx - (abs(cx) + ea * 0.7)) * 0.55)) < 0.0045) & (X_ * sx > abs(cx) + ea * 0.6) & (X_ * sx < abs(cx) + ea * 1.45); px[wing, :3] = (0.06, 0.05, 0.05)
    low = box & (e >= 0.9) & (e <= 1.08) & (Z_ < cz - 0.45 * eb) & (X_ * sx > abs(cx) - ea * 0.2); px[low, :3] = SK * 0.55
    EYES['L' if sx > 0 else 'R'] = dict(erased=int(oldeye.sum()), eye_px=int(op.sum()))
print('EYES', EYES, 'fit residual mm', round(float(res[keep].mean() * 1000), 2), 'hair in front', int(hairfront.sum()), 'mouth z', round(mz, 4), 'lips px', int(lips.sum()))
if not FACE_PAINT: px = px_plain
# (Her brows are left as Tripo made them. Repainting them was tried and smeared across the hair that
# crosses her forehead, because those strands share the same patch of face.)
print('PAINT', dict(skin_px=int(skin.sum()), skin_after=(SK * 255).round(0).tolist(), mouth_erased=int(old.sum()), smile_px=int(smile.sum())))
im.pixels = px.ravel().tolist(); tex_path = os.path.join(os.path.dirname(OUT), '_noodles-girl-basecolor.jpg')
im.filepath_raw = tex_path; im.file_format = 'JPEG'; scene.render.image_settings.quality = 90; im.save()
# ── one simple material: her painted colour, matte ───────────────────────────────────────────────
mat = bpy.data.materials.new('noodles-girl'); mat.use_nodes = True; bsdf = mat.node_tree.nodes['Principled BSDF']
tn = mat.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = im; mat.node_tree.links.new(tn.outputs['Color'], bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value = 0.9
me.materials.clear(); me.materials.append(mat)
# ── scale her to the height the scenes expect, and measure her gait ──────────────────────────────
K = 1.24 / float(co[:, 2].max()); arm.scale = (arm.scale[0] * K,) * 3
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
arm.animation_data.action = None; NAMES = {'idle': 'Idle', 'walk': 'Walk', 'run': 'Run'}   # Tripo's wave_goodbye_01 is a crouching wave that looks wrong on her, so it is left out
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
    shot('4-run', (3.2, -2.2, 0.7), (0, 0, 0.62), 'Run', 8); shot('5-wave', (0.4, -4.0, 0.7), (0, 0, 0.66), 'Wave', 40); shot('7-wave-b', (0.4, -4.0, 0.7), (0, 0, 0.66), 'Wave', 120); shot('6-back', (-1.2, 3.8, 0.8), (0, 0, 0.62), 'Idle', 1)
    bpy.data.objects.remove(cam)
    for tr in arm.animation_data.nla_tracks: tr.mute = False
    scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT'); mesh.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
                          export_force_sampling=True, export_yup=True, export_apply=False, export_extras=True, export_image_format='JPEG', export_jpeg_quality=88)
print('EXPORTED', OUT, os.path.getsize(OUT))
