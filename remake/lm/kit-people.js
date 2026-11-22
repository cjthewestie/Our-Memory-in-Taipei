// lm/kit-people.js: the shared stylised-people kit (window.PEOPLE). CJ, 2026-11-22: 「那些弱點也一起修掉」 (people were block figures).
// A person is head, hair, neck, shoulders, torso, hips, two arms with elbows and hands, two legs with knees and shoes, in clothes of a
// chosen palette, set in one of several poses, with small props (bowl and chopsticks, phone, shopping bags, backpack, cup, apron, cap,
// 斗笠, stool). No face is drawn and no real person is copied. Everything a crowd holds is drawn by seven instanced meshes (one per part
// shape, coloured per instance), so a street of eighty people costs seven draw calls.
//   const C = PEOPLE.crowd(E, { seed, palette: 'period' | 'modern' });
//   C.add(x, z, ry, { pose, shirt, pants, hair, skin, s, kid, woman, skirt, shorts, long, hat, bag, pack, apron, stool, y });   // front is +z at ry 0
//   C.queue(x, z, ry, n, gap, o)      // n people in line, the first at (x, z) facing ry
//   C.drop(x, z, ry, o) (only on free ground) · C.stroll(n, [[x0, x1, z0, z1, axis]], o) · C.huddle(x, z, n)
//   C.build()  ->  THREE.Group, already in the scene
//   PEOPLE.POSES: stand, walk, walk2, eat, phone, photo, wave, sit, sitEat, sitDraw, carry, talk, reach, drink, pray, sweep
//   PEOPLE.recorded(): the block figures a landmarks file handed over instead of building them (see person() there), in world space
(function () {
'use strict';
const T = THREE;
const PAL = {
  period: { shirt: ['#c9433a', '#e9e2d2', '#2f5f8f', '#e2b53e', '#4f7f5a', '#7a4f7f', '#d07a55', '#7fa8c9', '#f1ece2', '#b9c7a0', '#e7b7a8'], pants: ['#2b3550', '#3a3a3e', '#6a5a48', '#1f2a3a', '#7a6a55', '#4a3a30'], skirt: ['#b33a3a', '#2f4f7f', '#d9c9a0', '#5a3a5a', '#3f6a55'] },
  modern: { shirt: ['#f2f0ea', '#1e1f24', '#d8473a', '#3d6fb0', '#e8c23e', '#6fa58a', '#b7a7d6', '#f0a48c', '#8c8f96', '#2f4a3a', '#f6d9d0'], pants: ['#20242e', '#3a4a66', '#c9bfa8', '#15161a', '#5c6470', '#7d8fa8'], skirt: ['#1e1f24', '#c9b48a', '#d8473a', '#e9e2d2', '#55708a'] },
};
const SKIN = ['#eac6a2', '#dfb48e', '#cf9f7a', '#f1d4b8', '#d9aa84'], HAIR = ['#17120f', '#221912', '#0f0f12', '#2e2118', '#3b2a1e', '#17120f', '#8d8a86'], SHOE = ['#1a1a1d', '#efeae0', '#5a3a26', '#2a3550', '#8a2a22'];
// angles in radians. legs [swing forward, knee bend] · arms [swing forward, away from the body, elbow bend] · lean: torso forward · nod: head down
const POSES = {
  stand: { la: [0.05, 0.12, 0.2], ra: [0.02, 0.12, 0.15] },
  walk: { ll: [0.5, 0.15], rl: [-0.32, 0.6], la: [-0.45, 0.1, 0.35], ra: [0.5, 0.1, 0.55], lean: 0.05, drop: 0.03 },
  walk2: { ll: [-0.32, 0.6], rl: [0.5, 0.15], la: [0.5, 0.1, 0.55], ra: [-0.45, 0.1, 0.35], lean: 0.05, drop: 0.03 },
  eat: { la: [0.5, 0.05, 1.3], ra: [0.55, 0.1, 2.15], nod: 0.28, lean: 0.06, prop: 'bowl' },
  phone: { la: [0.04, 0.1, 0.15], ra: [0.38, 0.02, 1.95], nod: 0.38, prop: 'phone' },
  photo: { la: [1.05, -0.12, 1.15], ra: [1.05, -0.12, 1.15], nod: -0.08, prop: 'camera' },
  wave: { la: [0.03, 0.12, 0.2], ra: [0.1, 2.55, 0.5] },
  sit: { sit: 1, ll: [1.5, 1.5], rl: [1.5, 1.5], la: [0.55, 0.08, 0.85], ra: [0.55, 0.08, 0.85], lean: 0.08 },
  sitEat: { sit: 1, ll: [1.5, 1.5], rl: [1.5, 1.5], la: [0.5, 0.05, 1.3], ra: [0.55, 0.1, 2.15], nod: 0.3, lean: 0.14, prop: 'bowl' },
  sitDraw: { sit: 1, ll: [1.5, 1.5], rl: [1.5, 1.5], la: [0.5, 0.1, 0.9], ra: [0.95, 0.1, 0.75], lean: 0.12, nod: 0.05 },
  carry: { la: [0.04, 0.16, 0.12], ra: [-0.03, 0.16, 0.12], prop: 'bags' },
  talk: { la: [0.1, 0.5, 1.7], ra: [0.65, 0.2, 1.25], nod: -0.05 },
  reach: { la: [0.1, 0.12, 0.3], ra: [1.2, 0.05, 0.35], lean: 0.12 },
  drink: { la: [0.04, 0.1, 0.2], ra: [0.32, 0.05, 1.75], prop: 'cup' },
  pray: { la: [0.75, -0.3, 1.5], ra: [0.75, -0.3, 1.5], nod: 0.3, lean: 0.1 },
  sweep: { la: [0.6, 0.0, 0.7], ra: [0.35, 0.0, 1.1], lean: 0.2, nod: 0.2, prop: 'broom' },
};
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const GEO = {};
function geos() {
  if (GEO.sph) return GEO;
  GEO.sph = new T.SphereGeometry(0.5, 14, 10);
  GEO.hemi = new T.SphereGeometry(0.5, 14, 7, 0, Math.PI * 2, 0, Math.PI * 0.56);
  GEO.limb = new T.CylinderGeometry(0.5, 0.4, 1, 8); GEO.limb.translate(0, -0.5, 0);                    // hangs from its joint
  GEO.torso = new T.CylinderGeometry(0.5, 0.43, 1, 12);
  GEO.cone = new T.CylinderGeometry(0.5, 1, 1, 14);                                                     // skirt, 斗笠
  GEO.bowl = new T.CylinderGeometry(1, 0.6, 1, 12);
  GEO.box = new T.BoxGeometry(1, 1, 1);
  return GEO;
}
function crowd(E, opt) {
  opt = opt || {};
  const R = rng(opt.seed || 20261122), rr = (a, b) => a + (b - a) * R(), pick = a => a[Math.floor(R() * a.length)], pal = PAL[opt.palette] || PAL.period, list = [];
  const colCache = {}, col = c => { if (c && c.isColor) return c; if (c && c.isMaterial) return c.color; return colCache[c] || (colCache[c] = new T.Color(c).convertSRGBToLinear()); };
  const C = { list, count: 0, rr, pick,
    add(x, z, ry, o) { list.push({ x, z, ry: ry || 0, o: o || {} }); return C; },
    queue(x, z, ry, n, gap, o) { for (let i = 0; i < n; i++) C.add(x - Math.sin(ry) * i * (gap || 0.75) + rr(-0.08, 0.08), z - Math.cos(ry) * i * (gap || 0.75) + rr(-0.08, 0.08), ry + rr(-0.25, 0.25), Object.assign({ pose: pick(['stand', 'phone', 'stand', 'carry', 'talk']) }, o || {})); return C; },
    // free(x, z): not inside a showcase, marker or module footprint (PHOTOWALL.block) and not in an `avoid` circle [[x, z, r], ...]
    free(x, z, m) { if ((opt.avoid || []).some(a => Math.hypot(a[0] - x, a[1] - z) < a[2])) return false; if (!window.PHOTOWALL || !PHOTOWALL.keepOut) return true; const q = { x, z }; PHOTOWALL.keepOut(q, m == null ? 0.6 : m); return Math.abs(q.x - x) < 1e-6 && Math.abs(q.z - z) < 1e-6; },
    // drop: add only on free ground and not on top of someone already dropped
    drop(x, z, ry, o, gap) { if (!C.free(x, z) || list.some(n => Math.hypot(n.x - x, n.z - z) < (gap || 0.85))) return false; C.add(x, z, ry, o); return true; },
    // stroll(n, areas, o): n walkers scattered over rectangles [x0, x1, z0, z1]; o.axis 'z' | 'x' sets which way the street runs; some walk in pairs, some with a child
    stroll(n, areas, o) { o = o || {}; const tot = areas.reduce((t, a) => t + (a[1] - a[0]) * (a[3] - a[2]), 0);
      for (let i = 0, tries = 0; i < n && tries < n * 12; tries++) { let k = R() * tot, a = areas[0]; for (const b of areas) { k -= (b[1] - b[0]) * (b[3] - b[2]); if (k <= 0) { a = b; break; } }
        const x = rr(a[0], a[1]), z = rr(a[2], a[3]), ax = a[4] || o.axis, ry = (ax === 'x' ? Math.PI / 2 : ax === 'z' ? 0 : rr(0, 6.283)) + (R() < 0.5 ? Math.PI : 0) + rr(-0.3, 0.3), w = R() < 0.5 ? 'walk' : 'walk2';
        if (!C.drop(x, z, ry, Object.assign({ pose: w, bag: R() < 0.2, pack: R() < 0.15 }, o.each || {}))) continue; i++;
        if (R() < (o.pairs == null ? 0.35 : o.pairs)) C.drop(x + Math.cos(ry) * 0.62, z - Math.sin(ry) * 0.62, ry + rr(-0.1, 0.1), Object.assign({ pose: w === 'walk' ? 'walk2' : 'walk', kid: R() < (o.kids == null ? 0.3 : o.kids) }, o.each || {}), 0.5); }
      return C; },
    // huddle(x, z, n): a small group facing each other
    huddle(x, z, n, o) { for (let k = 0; k < n; k++) { const a = k / n * 6.283 + rr(-0.3, 0.3), px = x + Math.cos(a) * 0.62, pz = z + Math.sin(a) * 0.62; C.drop(px, pz, Math.atan2(x - px, z - pz), Object.assign({ pose: pick(['talk', 'stand', 'drink', 'phone', 'wave', 'stand']) }, o || {}), 0.5); } return C; },
    build() {
      const G = geos(), bins = {}, e = new T.Euler(), q = new T.Quaternion(), p = new T.Vector3(), sc = new T.Vector3(), one = new T.Vector3(1, 1, 1);
      Object.keys(G).forEach(k => bins[k] = []);
      const frame = (par, x, y, z, rx, ry, rz) => { const m = new T.Matrix4().compose(p.set(x, y, z), q.setFromEuler(e.set(rx || 0, ry || 0, rz || 0)), one); return par ? m.premultiply(par) : m; };
      const emit = (kind, par, x, y, z, sx, sy, sz, c, rx, ry, rz) => { const m = new T.Matrix4().compose(p.set(x, y, z), q.setFromEuler(e.set(rx || 0, ry || 0, rz || 0)), sc.set(sx, sy, sz)).premultiply(par); bins[kind].push(m, col(c)); };
      const upright = (root, jf, x, y, z) => { const v = new T.Vector3(x, y, z).applyMatrix4(jf); return root.clone().setPosition(v); };   // the root's turn and size, at a point of a joint's frame
      list.forEach(it => {
        const o = it.o, P = POSES[o.pose] || POSES.stand, kid = !!o.kid, s = (o.s || rr(0.93, 1.05)) * (kid ? 0.66 : 1);
        const woman = o.woman != null ? o.woman : R() < 0.5, skirt = o.skirt != null ? o.skirt : (woman && R() < 0.45), shorts = o.shorts != null ? o.shorts : (!skirt && R() < 0.22), long = o.long != null ? o.long : R() < 0.35;
        const shirt = o.shirt || pick(pal.shirt), pants = o.pants || pick(pal.pants), skin = o.skin || pick(SKIN), hair = o.hair || pick(HAIR), shoe = o.shoe || pick(SHOE), skC = o.skirtColor || pick(pal.skirt);
        const hairStyle = o.hairStyle || (woman ? pick(['bob', 'long', 'pony', 'bun', 'bob']) : pick(['short', 'short', 'short', 'bob'])), hs = kid ? 1.22 : 1;
        const root = new T.Matrix4().compose(p.set(it.x, o.y || 0, it.z), q.setFromEuler(e.set(0, it.ry, 0)), sc.set(s, s, s));
        const LEG = 0.39, pelY = P.sit ? 0.5 : 2 * LEG + 0.02 - (P.drop || 0), ll = P.ll || [0, 0], rl = P.rl || [0, 0], la = P.la || [0, 0.1, 0.1], ra = P.ra || [0, 0.1, 0.1];
        const jit = () => rr(-0.05, 0.05);
        const pel = frame(root, 0, pelY, 0), body = frame(pel, 0, 0, 0, (P.lean || 0) + jit() * 0.5, 0, 0);
        // hips, torso, shoulders, neck
        emit('sph', pel, 0, 0.02, 0, 0.34, 0.24, 0.235, skirt ? skC : pants);
        emit('torso', body, 0, 0.27, 0, 0.35, 0.5, 0.225, shirt); emit('sph', body, 0, 0.49, 0, 0.4, 0.17, 0.235, shirt); emit('torso', body, 0, 0.59, 0, 0.11, 0.1, 0.11, skin);
        if (skirt) emit('cone', pel, 0, -0.17, 0, 0.36, 0.4, 0.3, skC);
        if (o.apron) { const ac = o.apron === true ? '#f1ece2' : o.apron; emit('box', body, 0, 0.1, 0.118, 0.3, 0.56, 0.025, ac); emit('box', body, 0, 0.4, 0.12, 0.16, 0.14, 0.02, ac); }
        if (o.pack) { emit('box', body, 0, 0.3, -0.175, 0.27, 0.36, 0.14, o.pack === true ? pick(['#2a3550', '#8a2a22', '#3a3a3e', '#c9a23e']) : o.pack); emit('box', body, 0, 0.36, -0.25, 0.2, 0.16, 0.04, '#1a1a1d'); }
        // head and hair
        const head = frame(body, 0, 0.77 + (hs - 1) * 0.1, 0, (P.nod || 0) + jit(), rr(-0.2, 0.2), 0);
        emit('sph', head, 0, 0, 0.005, 0.29 * hs, 0.32 * hs, 0.3 * hs, skin);
        emit('sph', head, 0, -0.02, 0.15 * hs, 0.05, 0.045, 0.04, skin);                                // a hint of a nose, so the facing reads
        [-1, 1].forEach(k => emit('sph', head, k * 0.147 * hs, -0.01, 0, 0.03, 0.07, 0.05, skin));         // ears
        emit('hemi', head, 0, 0.012, -0.012, 0.318 * hs, 0.345 * hs, 0.33 * hs, hair, -0.42);
        if (hairStyle === 'bob' || hairStyle === 'long') emit('sph', head, 0, -0.07 * hs, -0.07 * hs, 0.31 * hs, (hairStyle === 'long' ? 0.42 : 0.3) * hs, 0.2 * hs, hair);
        if (hairStyle === 'long') emit('box', body, 0, 0.5, -0.115, 0.22, 0.26, 0.05, hair);
        if (hairStyle === 'pony') { emit('sph', head, 0, 0.04, -0.17 * hs, 0.08, 0.08, 0.08, hair); emit('sph', head, 0, -0.1, -0.2 * hs, 0.085, 0.26, 0.085, hair, 0.25); }
        if (hairStyle === 'bun') emit('sph', head, 0, 0.17 * hs, -0.06, 0.13, 0.12, 0.13, hair);
        if (o.hat === 'cap') { const hc = o.hatColor || pick(['#c9433a', '#2f5f8f', '#f1ece2', '#1e1f24']); emit('hemi', head, 0, 0.03, 0, 0.33 * hs, 0.33 * hs, 0.34 * hs, hc, -0.12); emit('box', head, 0, 0.065, 0.2 * hs, 0.2, 0.018, 0.16, hc, 0.1); }
        if (o.hat === 'douli') emit('cone', head, 0, 0.2 * hs, 0, 0.3, 0.13, 0.3, '#cfa85a');                // 斗笠, the woven bamboo hat
        // legs
        [[-1, ll], [1, rl]].forEach(([k, L]) => {
          const hip = frame(pel, k * 0.088, 0, 0, -L[0], 0, k * -0.02), knee = frame(hip, 0, -LEG, 0, L[1], 0, 0), bare = skirt || shorts;
          emit('limb', hip, 0, 0.03, 0, 0.155, LEG + 0.03, 0.155, skirt ? skin : pants); emit('limb', knee, 0, 0.02, 0, 0.125, LEG, 0.125, bare ? skin : pants);
          emit('sph', knee, 0, -LEG + 0.01, 0.045, 0.115, 0.085, 0.245, shoe);
        });
        // arms and hands
        const hands = [];
        [[-1, la], [1, ra]].forEach(([k, A]) => {
          const sh = frame(body, k * 0.2, 0.47, 0, -A[0], 0, k * A[1]), el = frame(sh, 0, -0.265, 0, -A[2], 0, 0);
          emit('sph', sh, 0, 0, 0, 0.12, 0.12, 0.12, shirt); emit('limb', sh, 0, 0, 0, 0.105, 0.27, 0.105, shirt); emit('limb', el, 0, 0.01, 0, 0.088, 0.24, 0.088, long ? shirt : skin); emit('sph', el, 0, -0.265, 0, 0.085, 0.1, 0.085, skin);
          hands.push(el);
        });
        const prop = o.prop || P.prop;
        if (prop === 'bowl') { const b = upright(root, hands[0], 0, -0.3, 0.02); emit('bowl', b, 0, 0.02, 0, 0.085, 0.07, 0.085, '#f4efe4'); emit('bowl', b, 0, 0.052, 0, 0.074, 0.012, 0.074, '#b5713a');
          const h = upright(root, hands[1], 0, -0.3, 0); emit('box', h, 0, -0.02, 0.0, 0.012, 0.2, 0.012, '#e9dcc0', 0.5, 0, 0.3); }
        if (prop === 'phone') { const h = upright(root, hands[1], 0, -0.31, 0.01); emit('box', h, 0, 0.03, 0, 0.075, 0.15, 0.012, '#15161a', -0.5); }
        if (prop === 'camera') { const a = new T.Vector3(0, -0.3, 0).applyMatrix4(hands[0]), b = new T.Vector3(0, -0.3, 0).applyMatrix4(hands[1]), h = root.clone().setPosition(a.add(b).multiplyScalar(0.5)); emit('box', h, 0, 0.02, 0.02, 0.16, 0.085, 0.014, '#15161a'); }
        if (prop === 'cup') { const h = upright(root, hands[1], 0, -0.31, 0.02); emit('bowl', h, 0, 0.02, 0, 0.04, 0.14, 0.04, '#e9d7b8'); emit('box', h, 0.005, 0.14, 0, 0.008, 0.12, 0.008, '#d8473a'); }
        if (prop === 'bags' || o.bag) hands.forEach((el, i) => { if (prop !== 'bags' && i === 1) return; const h = upright(root, el, 0, -0.3, 0), bc = o.bagColor || pick(['#e9e2d2', '#c9433a', '#e2b53e', '#f6d9d0', '#2f5f8f', '#f2f0ea']); emit('box', h, 0, -0.26, 0, 0.09, 0.3, 0.27, bc); emit('box', h, 0, -0.07, 0, 0.012, 0.1, 0.14, '#3a3a3e'); });
        if (prop === 'broom') { const h = upright(root, hands[1], 0, -0.3, 0.02); emit('box', h, 0, -0.2, 0.2, 0.025, 1.5, 0.025, '#8a6a48', 0.45); emit('box', h, 0, -0.82, 0.52, 0.34, 0.24, 0.05, '#cfa85a', 0.45); }
        if (P.sit && o.stool !== false) emit('torso', root, 0, 0.22, -0.03, 0.34, 0.44, 0.34, o.stool && o.stool !== true ? o.stool : '#8a6a48');
        C.count++;
      });
      const g = new T.Group(); g.name = opt.name || 'people';
      const mat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0 });
      Object.keys(bins).forEach(k => { const b = bins[k], n = b.length / 2; if (!n) return; const im = new T.InstancedMesh(G[k], mat, n);
        for (let i = 0; i < n; i++) { im.setMatrixAt(i, b[i * 2]); im.setColorAt(i, b[i * 2 + 1]); }
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.name = 'people-' + k; g.add(im); });
      g.userData.count = C.count; E.scene.add(g); return g;
    } };
  return C;
}
// The landmarks files used to build block figures into their merged building meshes. When this kit is present their person() hands the
// figure over instead: { g: the building's group, x, y, z, ry (or m, a Matrix4): in that group's frame, o: the old options }. recorded() turns them into world space.
function recorded() {
  const m = new T.Matrix4(), l = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), sc = new T.Vector3(), e = new T.Euler();
  return (window.__lmPeople || []).map(r => { const g = r.g; g.updateWorldMatrix(true, false);
    if (r.m) l.copy(r.m); else l.compose(p.set(r.x, r.y || 0, r.z), q.setFromEuler(e.set(0, r.ry || 0, 0)), sc.set(1, 1, 1));
    m.multiplyMatrices(g.matrixWorld, l); const el = m.elements, s = Math.hypot(el[0], el[1], el[2]);
    return { x: el[12], y: el[13], z: el[14], ry: Math.atan2(el[8], el[10]), s, o: r.o || {}, name: g.name }; });
}
window.PEOPLE = { crowd, POSES, PAL, recorded };
})();
