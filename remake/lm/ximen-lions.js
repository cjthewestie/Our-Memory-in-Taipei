// lm/ximen-lions.js: the pair of guardian lions (石獅) at the gate of 台北天后宮. CJ, 2026-11-22: 「那些弱點也一起修掉」 (they were two blocks).
// A temple's pair follows one rule everywhere in Taiwan (general knowledge of the type, inferred for this temple; no photo of this pair was opened):
// seen from the gate looking out, the male sits on the left with a ball (繡球) under his paw, the female on the right with a cub under hers; both
// turn their heads toward the middle of the gate; mouths open on a stone pearl; curled mane, brows and tail; a red cloth tied at the neck (披紅彩)
// with a bell; each on a carved plinth. Built in the grey-green of 青斗石. landmarks-ximen.js leaves its block pair out when this module is loaded.
(window.LM = window.LM || {})['ximen-lions'] = function (E) {
  const L = window.LMK; if (!L) return;
  const M = L.mats(E), K = L.kit('tianhou-lions'), temple = E.scene.children.find(c => c.name === 'tianhou-temple'); if (!temple) return;
  const ST = M.tm('#8e9a8f', E.TEX.concrete, 3.2, 0.72), SD = M.tm('#6c776e', E.TEX.concrete, 3.2, 0.8), SL = M.tm('#a9b3a6', E.TEX.concrete, 3.2, 0.66), CLOTH = M.std('#c2261c', 0.75), INK = M.std('#2a2f2c', 0.9);
  function lion(x, z, side) {                                           // side -1: the male (ball), +1: the female (cub). Each looks toward x = 0
    const yaw = -side * 0.5, paw = -side, P = 0.62;                      // P: the top of the plinth; paw: which front paw is raised (the one toward the gate's middle)
    K.at(x, 0, z, 0);
    // plinth: a stepped base, a waist with a carved panel on each face, a top slab with a rolled edge
    K.bx(-0.4, 0.4, 0, 0.1, -0.46, 0.46, SD); K.bx(-0.36, 0.36, 0.1, 0.17, -0.42, 0.42, ST); K.bx(-0.31, 0.31, 0.17, 0.5, -0.37, 0.37, ST); K.bx(-0.36, 0.36, 0.5, 0.56, -0.42, 0.42, ST); K.bx(-0.39, 0.39, 0.56, P, -0.45, 0.45, SL);
    [[0, 0.375, 0], [0, -0.375, Math.PI], [0.315, 0, Math.PI / 2], [-0.315, 0, -Math.PI / 2]].forEach(([px, pz, ry]) => { K.box(0.46, 0.24, 0.012, SD, px, 0.335, pz, ry); K.box(0.4, 0.18, 0.02, SL, px, 0.335, pz, ry); K.box(0.2, 0.09, 0.03, ST, px, 0.335, pz, ry, 0, Math.PI / 4); });   // a lozenge in a sunk panel
    [-0.39, 0.39].forEach(ex => K.cyl(0.03, 0.03, 0.9, SL, ex, P - 0.03, 0, 8, [Math.PI / 2, 0, 0]));
    // the seated body: haunches, belly, chest
    K.sph(0.2, ST, 0, P + 0.19, -0.12, 0.95, 1.0, 1.2); K.sph(0.185, ST, 0, P + 0.36, 0.05, 1.3, 1.02, 0.95);
    [-1, 1].forEach(k => { K.sph(0.13, ST, k * 0.17, P + 0.14, -0.1, 1.0, 0.85, 1.25); K.sph(0.07, ST, k * 0.2, P + 0.05, 0.1, 0.7, 0.9, 1.7); for (let t = -1; t <= 1; t++) K.sph(0.028, SL, k * 0.2 + t * 0.035, P + 0.035, 0.21); });        // hind legs folded, feet forward with toes
    // spine curls and the tail: a fan of curls standing up the back
    for (let i = 0; i < 5; i++) K.sph(0.04, SL, 0, P + 0.3 + i * 0.075, -0.2 + i * 0.012, 1, 1.2);
    [[0, 0.16, 0.085], [-0.07, 0.24, 0.06], [0.07, 0.24, 0.06], [0, 0.31, 0.065], [-0.05, 0.37, 0.045], [0.05, 0.37, 0.045], [0, 0.42, 0.04]].forEach(([tx, ty, r]) => K.sph(r, SL, tx, P + ty, -0.34, 1, 1, 0.7));
    // front legs: the standing one straight down to its paw, the other raised on the ball or the cub
    const still = -paw; K.rod(ST, [still * 0.11, P + 0.36, 0.14], [still * 0.12, P + 0.06, 0.27], 0.062, 8); K.sph(0.075, ST, still * 0.12, P + 0.05, 0.3, 0.75, 1.05, 1.25); for (let t = -1; t <= 1; t++) K.sph(0.03, SL, still * 0.12 + t * 0.04, P + 0.035, 0.375);
    K.rod(ST, [paw * 0.11, P + 0.36, 0.14], [paw * 0.14, P + 0.22, 0.3], 0.062, 8); K.sph(0.07, ST, paw * 0.14, P + 0.215, 0.32, 0.7, 1.1, 1.2); for (let t = -1; t <= 1; t++) K.sph(0.028, SL, paw * 0.14 + t * 0.038, P + 0.19, 0.385);
    if (side < 0) { K.sph(0.1, SL, paw * 0.14, P + 0.1, 0.32); [[0, 0, 0], [Math.PI / 2, 0, 0], [0, 0, Math.PI / 2]].forEach(r => K.cyl(0.103, 0.103, 0.022, SD, paw * 0.14, P + 0.1, 0.32, 14, r)); }                                 // the ball, its three carved bands
    else { K.sph(0.085, ST, paw * 0.14, P + 0.075, 0.3, 0.85, 1, 1.3); K.sph(0.062, ST, paw * 0.16, P + 0.115, 0.42); [-1, 1].forEach(k => K.sph(0.02, SL, paw * 0.16 + k * 0.04, P + 0.16, 0.4)); K.sph(0.03, SL, paw * 0.16, P + 0.1, 0.475, 0.7); K.sph(0.035, SL, paw * 0.13, P + 0.12, 0.2); }   // the cub on its back under her paw
    // the red cloth at the neck, its knot and the bell
    K.cyl(0.175, 0.2, 0.07, CLOTH, 0, P + 0.5, 0.07, 14); K.sph(0.06, CLOTH, 0, P + 0.47, 0.25, 0.8, 1.3, 0.7); [-1, 1].forEach(k => K.box(0.05, 0.16, 0.02, CLOTH, k * 0.05, P + 0.38, 0.27, 0, 0, k * 0.25)); K.sph(0.04, M.brass, 0, P + 0.4, 0.29);
    // the head, turned toward the middle of the gate
    const hy = P + 0.66, hz = 0.12, c = Math.cos(yaw), s = Math.sin(yaw), H = (lx, ly, lz) => [lx * c + lz * s, hy + ly, hz - lx * s + lz * c];
    const hs = (r, mat, lx, ly, lz, sy, sx, sz) => { const p = H(lx, ly, lz); K.sph(r, mat, p[0], p[1], p[2], sy, sx, sz); };
    hs(0.2, ST, 0, 0, 0, 0.95, 1.08, 1.0); hs(0.115, ST, 0, -0.07, 0.17, 0.8, 1.35, 1.0); hs(0.1, ST, 0, -0.15, 0.13, 0.6, 1.25, 1.0);                       // skull, muzzle, jaw
    hs(0.05, SL, 0, -0.01, 0.275, 0.8, 1.7, 0.8); [-1, 1].forEach(k => hs(0.022, INK, k * 0.035, -0.02, 0.305, 1, 1, 0.6));                                   // the broad nose and nostrils
    { const p = H(0, -0.112, 0.2); K.box(0.2, 0.05, 0.14, INK, p[0], p[1], p[2], yaw); } hs(0.032, SL, 0, -0.112, 0.22);                                         // the open mouth and the pearl in it
    for (let t = -2; t <= 2; t++) hs(0.016, SL, t * 0.036, -0.088, 0.27, 1.3);                                                                              // teeth
    [-1, 1].forEach(k => { hs(0.048, SL, k * 0.092, 0.065, 0.155); hs(0.02, INK, k * 0.094, 0.065, 0.196); hs(0.05, ST, k * 0.095, 0.115, 0.14, 0.6, 1.7, 0.9); hs(0.03, SL, k * 0.15, 0.125, 0.12); hs(0.05, ST, k * 0.185, 0.13, -0.02, 1.2, 0.5, 1); });   // eyes, brows with a curl at the end, ears
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9 - row; i++) { const a = -2.1 + i * (4.2 / (8 - row)), el = 0.55 - row * 0.5, r = 0.215; hs(0.058 - row * 0.004, SL, Math.sin(a) * Math.cos(el) * r, Math.sin(el) * r + 0.02, -Math.cos(a) * Math.cos(el) * r * 0.95, 1); }   // three rows of mane curls round the back of the head
    [-1, 1].forEach(k => { for (let i = 0; i < 3; i++) hs(0.05, SL, k * (0.17 - i * 0.03), -0.1 - i * 0.07, 0.06 + i * 0.03); }); for (let t = -1; t <= 1; t++) hs(0.04, SL, t * 0.06, -0.21, 0.14, 1.3);                                           // side whiskers and the beard
    [-1, 0, 1].forEach(t => hs(0.045, SL, t * 0.075, 0.185, 0.07));                                                                                         // the knob of curls on the crown
    K.at();
  }
  lion(-2.75, 1.05, -1); lion(2.75, 1.05, 1);
  const g = K.done(temple.position.x, temple.position.z, temple.rotation.y);
  L.retarget(E, 'tianhou-temple', g);
};
