// character.js — a jointed, skinned, animated character made in code (no model file).
// CJ, 2026-11-21: 「張君雅小妹妹也要重制喔變成一個專業可動的角色」, and earlier the same day
// 「主角不一定要張君雅小妹妹我會有很多角色讓大家選」— so this is a character MAKER: one skeleton, one
// animation set, and a list of options (hair, clothes, colours, proportions) that makes a different
// person each time. makeCharacter(THREE, PRESETS.girl) is the bowl-cut girl.
//
// How it works: one mesh, 17 bones. Each vertex follows one or two bones; around the elbows, knees,
// waist and skirt the weights blend, so joints bend smoothly instead of hinging. The motion is not
// played from a file: every frame the bone angles are computed from how fast she is moving, so idle,
// walk and run blend into each other and her steps match the ground she covers.
(function () {
  'use strict';
  const B = { hips: 0, spine: 1, chest: 2, neck: 3, head: 4, uArmL: 5, fArmL: 6, handL: 7, uArmR: 8, fArmR: 9, handR: 10, thighL: 11, shinL: 12, footL: 13, thighR: 14, shinR: 15, footR: 16 };
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  const PRESETS = {
    girl: { skin: '#f2c9a5', hair: '#1c1512', hairStyle: 'bowl', top: '#d6d0c2', bottom: '#1f2a44', bottomStyle: 'skirt', socks: '#d6d0c2', shoes: '#5a1f1a', pack: '#c8402f', blush: '#f08a7a' },
  };

  function makeCharacter(T, opt) {
    const o = Object.assign({}, PRESETS.girl, opt || {});
    const C = (hex) => new T.Color(hex).convertSRGBToLinear();
    const col = { skin: C(o.skin), hair: C(o.hair), top: C(o.top), bottom: C(o.bottom), socks: C(o.socks), shoes: C(o.shoes), pack: C(o.pack) };

    // ── rest pose (metres, facing +z, arms down) ───────────────────────────────────────────────
    const REST = [[0, 0.58, 0], [0, 0.68, 0], [0, 0.80, 0], [0, 0.965, 0], [0, 1.02, 0],
      [0.128, 0.925, 0], [0.128, 0.735, 0], [0.128, 0.565, 0], [-0.128, 0.925, 0], [-0.128, 0.735, 0], [-0.128, 0.565, 0],
      [0.066, 0.56, 0], [0.066, 0.30, 0], [0.066, 0.065, 0], [-0.066, 0.56, 0], [-0.066, 0.30, 0], [-0.066, 0.065, 0]];
    const PARENT = [-1, 0, 1, 2, 3, 2, 5, 6, 2, 8, 9, 0, 11, 12, 0, 14, 15];

    // ── geometry, gathered part by part ────────────────────────────────────────────────────────
    const P = [], COL = [], SI = [], SW = [], IDX = [];
    const vert = (x, y, z, c, w) => {            // w: [[bone, weight], …] up to 4
      P.push(x, y, z); COL.push(c.r, c.g, c.b);
      const a = w.slice(0, 4); while (a.length < 4) a.push([0, 0]); const s = a.reduce((t, e) => t + e[1], 0) || 1;
      SI.push(a[0][0], a[1][0], a[2][0], a[3][0]); SW.push(a[0][1] / s, a[1][1] / s, a[2][1] / s, a[3][1] / s);
      return P.length / 3 - 1;
    };
    // a tube built from rings; ring(i) → { y, cx, cz, rx, rz, colour, weights(angle) }
    function tube(rings, seg, capTop, capBottom, wobble) {
      const start = P.length / 3;
      rings.forEach(r => { for (let s = 0; s < seg; s++) { const a = s / seg * Math.PI * 2, k = wobble ? wobble(a, r) : 1;
        vert(r.cx + Math.sin(a) * r.rx * k, r.y, r.cz + Math.cos(a) * r.rz * k, r.c, r.w(a)); } });
      for (let i = 0; i < rings.length - 1; i++) for (let s = 0; s < seg; s++) { const a = start + i * seg + s, b = start + i * seg + (s + 1) % seg, c = a + seg, d = b + seg; IDX.push(a, b, c, b, d, c); }
      const cap = (ri, flip) => { const r = rings[ri], c = vert(r.cx, r.y, r.cz, r.c, r.w(0)); for (let s = 0; s < seg; s++) { const a = start + ri * seg + s, b = start + ri * seg + (s + 1) % seg; flip ? IDX.push(c, b, a) : IDX.push(c, a, b); } };
      if (capTop) cap(0, false); if (capBottom) cap(rings.length - 1, true);
    }
    // an ellipsoid stuck to one bone
    function blob(cx, cy, cz, rx, ry, rz, c, bone, seg = 14, rows = 10, shape) {
      const start = P.length / 3;
      for (let i = 0; i <= rows; i++) { const v = i / rows * Math.PI; for (let s = 0; s <= seg; s++) { const u = s / seg * Math.PI * 2;
        let p = [Math.sin(v) * Math.sin(u) * rx, Math.cos(v) * ry, Math.sin(v) * Math.cos(u) * rz]; if (shape) p = shape(p, u, v);
        vert(cx + p[0], cy + p[1], cz + p[2], c, [[bone, 1]]); } }
      for (let i = 0; i < rows; i++) for (let s = 0; s < seg; s++) { const a = start + i * (seg + 1) + s, b = a + 1, c2 = a + seg + 1, d = c2 + 1; IDX.push(a, c2, b, b, c2, d); }
    }
    const one = (b) => () => [[b, 1]];

    // torso: hips to neck. Shirt above the waist, the waistband under it.
    { const prof = [[0.50, 0.100, 0.082], [0.56, 0.108, 0.088], [0.62, 0.100, 0.082], [0.68, 0.092, 0.076], [0.74, 0.098, 0.080], [0.80, 0.106, 0.084], [0.86, 0.112, 0.084], [0.91, 0.110, 0.078], [0.945, 0.070, 0.060], [0.965, 0.046, 0.046], [1.00, 0.043, 0.043]];
      tube(prof.map(([y, rx, rz]) => ({ y, cx: 0, cz: 0, rx, rz, c: y > 0.955 ? col.skin : (y > 0.66 ? col.top : col.bottom),
        w: () => y < 0.60 ? [[B.hips, 1]] : y < 0.74 ? [[B.hips, 1 - ss(0.60, 0.74, y)], [B.spine, ss(0.60, 0.74, y)]] : y < 0.86 ? [[B.spine, 1 - ss(0.74, 0.86, y)], [B.chest, ss(0.74, 0.86, y)]] : y < 0.95 ? [[B.chest, 1]] : [[B.chest, 1 - ss(0.95, 1.0, y)], [B.neck, ss(0.95, 1.0, y)]] })), 16, false, true); }
    // collar
    tube([0.975, 0.955, 0.94].map((y, i) => ({ y, cx: 0, cz: 0.004, rx: 0.05 + i * 0.022, rz: 0.05 + i * 0.02, c: col.top, w: one(B.chest) })), 14, false, false);

    // arms: one continuous tube from shoulder to wrist, blended at the elbow; short sleeve on top
    [[1, B.uArmL, B.fArmL, B.handL], [-1, B.uArmR, B.fArmR, B.handR]].forEach(([sx, U, F, H]) => {
      const ys = [0.955, 0.925, 0.88, 0.83, 0.80, 0.77, 0.735, 0.70, 0.65, 0.60, 0.575];
      tube(ys.map((y, i) => ({ y, cx: sx * (i === 0 ? 0.105 : 0.128), cz: 0, rx: i === 0 ? 0.03 : y > 0.80 ? 0.043 : lerp(0.03, 0.036, ss(0.575, 0.80, y)), rz: i === 0 ? 0.035 : y > 0.80 ? 0.045 : lerp(0.03, 0.037, ss(0.575, 0.80, y)),
        c: y > 0.80 ? col.top : col.skin, w: () => i === 0 ? [[B.chest, 0.6], [U, 0.4]] : [[U, 1 - ss(0.77, 0.70, y)], [F, ss(0.77, 0.70, y)]] })), 10, true, true);
      blob(sx * 0.128, 0.545, 0.004, 0.032, 0.042, 0.036, col.skin, H, 10, 8);                         // hand
      blob(sx * 0.150, 0.552, 0.012, 0.012, 0.022, 0.014, col.skin, H, 6, 5);                          // thumb
    });

    // legs: thigh to ankle, blended at the knee; white sock, strapped shoe
    [[1, B.thighL, B.shinL, B.footL], [-1, B.thighR, B.shinR, B.footR]].forEach(([sx, Th, Sh, Ft]) => {
      const ys = [0.60, 0.56, 0.50, 0.44, 0.38, 0.34, 0.30, 0.26, 0.21, 0.16, 0.11, 0.07];
      tube(ys.map((y) => ({ y, cx: sx * 0.066, cz: 0, rx: y > 0.30 ? lerp(0.047, 0.058, ss(0.30, 0.56, y)) : lerp(0.032, 0.046, ss(0.07, 0.24, y)), rz: y > 0.30 ? lerp(0.05, 0.062, ss(0.30, 0.56, y)) : lerp(0.034, 0.05, ss(0.07, 0.24, y)),
        c: y < 0.185 ? col.socks : col.skin, w: () => y > 0.52 ? [[B.hips, ss(0.50, 0.60, y) * 0.6], [Th, 1 - ss(0.50, 0.60, y) * 0.6]] : [[Th, 1 - ss(0.345, 0.255, y)], [Sh, ss(0.345, 0.255, y)]] })), 12, true, true);
      blob(sx * 0.066, 0.038, 0.032, 0.048, 0.04, 0.088, col.shoes, Ft, 12, 8, (p) => [p[0], Math.max(p[1], -0.036) * (p[2] < -0.03 ? 1.15 : 1), p[2]]);   // shoe, flat sole, raised heel cup
      tube([-1, 1].map(k => ({ y: 0.078, cx: sx * 0.066, cz: 0.012 + k * 0.009, rx: 0.05, rz: 0.0, c: col.shoes, w: one(Ft) })), 8, false, false);            // strap
    });

    // skirt: pleated, follows the hips at the waist and each thigh toward the hem
    if (o.bottomStyle === 'skirt') {
      const rows = 7;
      tube(Array.from({ length: rows }, (_, i) => { const t = i / (rows - 1), y = lerp(0.695, 0.385, t);
        return { y, cx: 0, cz: 0, rx: lerp(0.096, 0.215, Math.pow(t, 0.85)), rz: lerp(0.08, 0.2, Math.pow(t, 0.85)), c: col.bottom, t,
          w: (a) => { const k = t * 0.62, l = Math.min(1, Math.max(0, 0.5 + Math.sin(a) * 0.9)); return [[B.hips, 1 - k], [B.thighL, k * l], [B.thighR, k * (1 - l)]]; } }; }), 48, false, false,
        (a, r) => 1 + r.t * 0.085 * Math.sin(a * 12));
    }

    // head, ears, nose
    const HY = 1.158;
    blob(0, HY, 0.008, 0.158, 0.162, 0.156, col.skin, B.head, 22, 16, (p) => [p[0] * (p[1] < -0.04 ? lerp(1, 0.84, ss(-0.04, -0.16, p[1])) : 1), p[1], p[2] * (p[1] < -0.06 && p[2] > 0 ? lerp(1, 0.9, ss(-0.06, -0.16, p[1])) : 1)]);   // chin tapers
    blob(0.155, HY - 0.02, 0.0, 0.016, 0.03, 0.022, col.skin, B.head, 6, 5); blob(-0.155, HY - 0.02, 0.0, 0.016, 0.03, 0.022, col.skin, B.head, 6, 5);
    blob(0, HY - 0.045, 0.158, 0.012, 0.01, 0.012, col.skin, B.head, 6, 5);

    // hair: a bowl. A shell just outside the head whose lower edge is folded up to a cut line:
    // straight across the brow, lower round the sides and back.
    if (o.hairStyle === 'bowl') {
      blob(0, HY + 0.014, -0.004, 0.182, 0.18, 0.186, col.hair, B.head, 30, 18, (p, u) => {
        const front = Math.max(0, Math.cos(u)), cut = lerp(-0.115, 0.022, Math.pow(front, 2.6));     // back and sides low, fringe high
        if (p[1] < cut) { const k = 0.955 - ss(0, 0.05, cut - p[1]) * 0.05; return [p[0] * k, cut - Math.min(0.012, (cut - p[1]) * 0.12), p[2] * k]; }
        return p;
      });
    }
    // backpack with two straps
    if (o.pack) {
      blob(0, 0.80, -0.118, 0.092, 0.112, 0.055, col.pack, B.chest, 12, 10, (p) => [Math.sign(p[0]) * Math.pow(Math.abs(p[0]) / 0.092, 0.6) * 0.092, Math.sign(p[1]) * Math.pow(Math.abs(p[1]) / 0.112, 0.6) * 0.112, p[2]]);
      [1, -1].forEach(sx => tube([[0.925, 0.082, -0.03], [0.90, 0.088, 0.062], [0.80, 0.09, 0.086], [0.72, 0.09, 0.06], [0.70, 0.085, -0.06]].map(([y, x, z]) => ({ y, cx: sx * x, cz: z, rx: 0.016, rz: 0.006, c: col.pack, w: one(B.chest) })), 6, false, false));
    }

    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(COL, 3));
    geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(SI, 4)); geo.setAttribute('skinWeight', new T.Float32BufferAttribute(SW, 4));
    geo.setIndex(IDX); geo.computeVertexNormals();

    // ── skeleton ───────────────────────────────────────────────────────────────────────────────
    const bones = REST.map((p, i) => { const b = new T.Bone(); const q = PARENT[i] < 0 ? [0, 0, 0] : REST[PARENT[i]]; b.position.set(p[0] - q[0], p[1] - q[1], p[2] - q[2]); return b; });
    PARENT.forEach((p, i) => { if (p >= 0) bones[p].add(bones[i]); });
    const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, side: T.DoubleSide });
    mat.onBeforeCompile = (sh) => {                                   // a soft edge light, so she reads against any background
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rim = pow(1.0 - max(dot(normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0), normalize(vViewPosition)), 0.0), 3.0);
        totalEmissiveRadiance += diffuseColor.rgb * rim * 0.16;`);
    };
    const mesh = new T.SkinnedMesh(geo, mat); mesh.add(bones[0]); mesh.bind(new T.Skeleton(bones));
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    const group = new T.Group(); group.add(mesh);

    // face: eyes that blink, cheeks, mouth — small parts riding the head bone
    const head = bones[B.head], hp = REST[B.head], face = (m, x, y, z) => { m.position.set(x - hp[0], y - hp[1], z - hp[2]); head.add(m); return m; };
    const dark = new T.MeshStandardMaterial({ color: 0x0e0b0a, roughness: 0.18 }), white = new T.MeshBasicMaterial({ color: 0xffffff });
    const eyes = [1, -1].map(sx => { const e = face(new T.Mesh(new T.SphereGeometry(0.021, 12, 10), dark), sx * 0.06, HY - 0.012, 0.148); e.scale.set(0.86, 1.18, 0.42);
      const g = new T.Mesh(new T.SphereGeometry(0.0062, 6, 5), white); g.position.set(sx * 0.004 + 0.006, 0.008, 0.02); e.add(g); return e; });
    [1, -1].forEach(sx => { const b = face(new T.Mesh(new T.CircleGeometry(0.026, 14), new T.MeshBasicMaterial({ color: C(o.blush), transparent: true, opacity: 0.42, depthWrite: false })), sx * 0.098, HY - 0.052, 0.133); b.rotation.y = sx * 0.62; });
    const mouth = face(new T.Mesh(new T.TorusGeometry(0.016, 0.0036, 5, 12, Math.PI), new T.MeshStandardMaterial({ color: 0x8a3a30, roughness: 0.5 })), 0, HY - 0.07, 0.151); mouth.rotation.z = Math.PI;
    [1, -1].forEach(sx => { const br = face(new T.Mesh(new T.BoxGeometry(0.03, 0.005, 0.004), dark), sx * 0.06, HY + 0.026, 0.157); br.rotation.z = sx * -0.12; });

    // ── motion ─────────────────────────────────────────────────────────────────────────────────
    const S = { phase: 0, t: 0, move: 0, run: 0, lean: 0, turn: 0, blink: 2 + Math.random() * 3, blinkT: 0, pack: 0, packV: 0 };
    const rot = (i, x, y, z) => bones[i].rotation.set(x || 0, y || 0, z || 0);
    // speed in m/s along the ground, turn in rad/s (positive = turning left)
    function update(dt, speed, turn) {
      S.t += dt;
      S.move += (ss(0.05, 0.6, speed) - S.move) * Math.min(1, dt * 8);                 // 0 idle … 1 moving
      S.run += (ss(1.9, 3.6, speed) - S.run) * Math.min(1, dt * 6);                    // 0 walk … 1 run
      S.turn += ((turn || 0) - S.turn) * Math.min(1, dt * 6);
      const stride = lerp(0.40, 0.78, S.run);                                          // metres per step
      S.phase += speed * dt / stride * Math.PI;
      const m = S.move, r = S.run, ph = S.phase, t = S.t, idle = 1 - m;
      const A = lerp(0.50, 0.95, r) * m, K = lerp(1.0, 1.9, r) * m, arm = lerp(0.55, 1.0, r) * m, elbow = lerp(0.28, 1.45, r);
      const bob = lerp(0.016, 0.042, r) * m;

      // hips: bounce twice a stride, roll and twist with the legs; idle shifts weight slowly
      bones[B.hips].position.y = REST[0][1] + Math.cos(ph * 2) * bob - bob * 0.6 - idle * 0.004 * (1 + Math.sin(t * 1.7));
      bones[B.hips].position.x = Math.sin(ph) * 0.012 * m + Math.sin(t * 0.5) * 0.01 * idle;
      rot(B.hips, lerp(0.03, 0.2, r) * m, Math.sin(ph) * 0.13 * m, Math.sin(ph) * 0.05 * m + Math.sin(t * 0.5) * 0.025 * idle - S.turn * 0.05);
      rot(B.spine, lerp(0.02, 0.1, r) * m + Math.sin(t * 1.7) * 0.012 * idle, -Math.sin(ph) * 0.09 * m, -Math.sin(ph) * 0.03 * m - Math.sin(t * 0.5) * 0.02 * idle);
      rot(B.chest, Math.sin(t * 1.7 + 0.5) * 0.018 * idle, -Math.sin(ph) * 0.12 * m, 0);
      rot(B.neck, -lerp(0.02, 0.1, r) * m, Math.sin(ph) * 0.06 * m, 0);
      rot(B.head, -0.03 + Math.cos(ph * 2 + 0.6) * 0.025 * m + Math.sin(t * 0.9) * 0.02 * idle, Math.sin(ph) * 0.05 * m + (Math.sin(t * 0.37) * 0.3 + Math.sin(t * 0.83) * 0.12) * idle + S.turn * 0.12, Math.sin(t * 0.6) * 0.03 * idle);

      // legs: the thigh swings, the knee folds while the foot is in the air, the foot stays near level
      [[B.thighL, B.shinL, B.footL, ph], [B.thighR, B.shinR, B.footR, ph + Math.PI]].forEach(([th, sh, ft, p]) => {
        const swing = -Math.sin(p) * A - lerp(0.02, 0.18, r) * m, knee = Math.pow(Math.max(0, Math.cos(p)), 1.3) * K + 0.06 * m + Math.max(0, -Math.sin(p)) * 0.12 * m;
        rot(th, swing, 0, (th === B.thighL ? 1 : -1) * 0.012); rot(sh, knee, 0, 0);
        rot(ft, -(swing + knee) * 0.7 + Math.max(0, Math.sin(p)) * 0.25 * m - Math.max(0, -Math.cos(p + 0.9)) * 0.3 * m, 0, 0);
      });
      // arms: swing against the legs, elbows fold more the faster she goes; at rest they hang with a small sway
      [[B.uArmL, B.fArmL, B.handL, 1, ph], [B.uArmR, B.fArmR, B.handR, -1, ph + Math.PI]].forEach(([u, f, h, sx, p]) => {
        rot(u, Math.sin(p) * arm + Math.sin(t * 1.1 + sx) * 0.03 * idle, 0, sx * (0.13 + 0.06 * r * m) + sx * Math.sin(t * 1.7) * 0.01 * idle);
        rot(f, -(elbow * m + 0.12) - Math.max(0, -Math.sin(p)) * 0.35 * m, 0, 0);
        rot(h, 0, 0, -sx * 0.1);
      });

      // blink
      S.blink -= dt; if (S.blink < 0) { S.blinkT = 0.13; S.blink = 2.2 + Math.random() * 3.5; }
      S.blinkT = Math.max(0, S.blinkT - dt); const lid = S.blinkT > 0 ? 0.12 + 0.88 * Math.abs(S.blinkT / 0.13 * 2 - 1) : 1;
      eyes.forEach(e => { e.scale.y = 1.18 * lid; });
    }
    update(0, 0, 0);
    return { group, mesh, bones, update, state: S, options: o };
  }

  window.CHARACTER = { makeCharacter, PRESETS, BONES: B };
})();
