// square-paving.js — the lantern square's floor, laid like the front plaza of 西門紅樓.
//
// CJ, 2026-10-31: "i need the square be more realistic". The square in walk.js stood on one 256 px
// canvas of flat running-bond rectangles. This file lays the ground a Taipei plaza actually has:
//   紅磚 red-brick paving in herringbone, every brick its own tone, darker sand joints, chipped corners
//   磨石子 terrazzo bands — a frame round the edge, a cross from the centre to the four sides, a centre disc
//   yellow tactile paving (導盲磚): bar tiles along the west, north and east arms, dot tiles at both ends
//   cast-iron rainwater covers (round, and one square utility plate), a trench-drain grate across each
//   gate and along the south wall, granite kerb stones at the foot of every wall
//   wear: stain and gum decals, patches of newer brick, the floor darkening toward the walls
// Every map is drawn on a canvas at load (colour + normal, + roughness for the brick); no photo is
// used as a texture. The photos the tones and sizes come from are listed in
// research/reference/square/paving/sources.md.
//
// API — window.SQUARE_PAVING.build(S, SQ, opts?) with S = window.SCENE and SQ = walk.js's
// { x, z, h, gate }. It returns { group, materials, textures, stats, layout, dispose() } and adds
// nothing to the scene: the caller adds `group`. opts: { y: 0.04 (floor height), centreDisc: true,
// stains: 46, patches: 9, seed: 7 }. Uses S.lit (the engine's MeshStandardMaterial, so the era tween
// scales it), S.aoBake and S.TEX_SCALE (half-size canvases on a phone) only.
(function () {
  'use strict';

  // ── small tools ───────────────────────────────────────────────────────────────
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hash2 = (a, b, c) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hex = s => [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255];

  // periodic value noise on a w x h canvas, g cells across (so the map still tiles)
  function noise(rand, w, h, g) {
    const gy = Math.max(1, Math.round(g * h / w)), lat = new Float32Array(g * gy), out = new Float32Array(w * h);
    for (let i = 0; i < lat.length; i++) lat[i] = rand();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const fx = x / w * g, fy = y / h * gy, x0 = Math.floor(fx), y0 = Math.floor(fy);
      let tx = fx - x0, ty = fy - y0; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const a = lat[(y0 % gy) * g + x0 % g], b = lat[(y0 % gy) * g + (x0 + 1) % g];
      const c = lat[((y0 + 1) % gy) * g + x0 % g], d = lat[((y0 + 1) % gy) * g + (x0 + 1) % g];
      out[y * w + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    }
    return out;
  }
  function fbm(rand, w, h, g, oct) {
    const out = new Float32Array(w * h); let amp = 0.5, tot = 0;
    for (let o = 0; o < oct; o++) { const n = noise(rand, w, h, g << o); for (let i = 0; i < out.length; i++) out[i] += n[i] * amp; tot += amp; amp *= 0.5; }
    for (let i = 0; i < out.length; i++) out[i] /= tot;
    return out;
  }

  // a painted field: colour (rgb floats), height (0..1), roughness (0..1)
  function field(w, h) { return { w, h, col: new Float32Array(w * h * 3), hgt: new Float32Array(w * h), rgh: new Float32Array(w * h).fill(0.9) }; }
  function canvas(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }
  const stats = [];
  function texture(cv, name) {
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.name = 'paving-' + name;
    stats.push({ name, w: cv.width, h: cv.height, bytes: Math.round(cv.width * cv.height * 4 * 4 / 3) });   // RGBA8 + mip chain
    return t;
  }
  // The engine treats canvas colours as linear and gamma-encodes the frame at the end (app.js post
  // pass), so a tone picked from a photo is linearised here to come out as that tone on screen.
  // `raw` skips it (the stains atlas is an alpha mask, not a colour).
  function colourMap(F, name, raw) {
    const cv = canvas(F.w, F.h), g = cv.getContext('2d'), img = g.createImageData(F.w, F.h), d = img.data, e = raw ? 1 : 2.2;
    for (let i = 0, j = 0; i < d.length; i += 4, j += 3) { d[i] = clamp(Math.pow(Math.max(0, F.col[j]), e) * 255, 0, 255); d[i + 1] = clamp(Math.pow(Math.max(0, F.col[j + 1]), e) * 255, 0, 255); d[i + 2] = clamp(Math.pow(Math.max(0, F.col[j + 2]), e) * 255, 0, 255); d[i + 3] = 255; }
    g.putImageData(img, 0, 0); return texture(cv, name);
  }
  // tangent-space normals by wrapped central differences (canvas y runs down, uv v up: green takes +dh/dy,
  // the same convention as assets-core.js normalTexture)
  function normalMap(F, k, name) {
    const { w, h, hgt } = F, cv = canvas(w, h), g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) {
      const yu = ((y - 1 + h) % h) * w, yd = ((y + 1) % h) * w, row = y * w;
      for (let x = 0; x < w; x++) {
        const hx = (hgt[row + (x + 1) % w] - hgt[row + (x - 1 + w) % w]) * 0.5, hy = (hgt[yd + x] - hgt[yu + x]) * 0.5;
        const nx = -k * hx, ny = k * hy, l = 1 / Math.sqrt(nx * nx + ny * ny + 1), i = (row + x) * 4;
        d[i] = (nx * l * 0.5 + 0.5) * 255; d[i + 1] = (ny * l * 0.5 + 0.5) * 255; d[i + 2] = (l * 0.5 + 0.5) * 255; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0); return texture(cv, name);
  }
  // roughness into the green channel (MeshStandardMaterial reads G), box-filtered down by `down`
  function roughMap(F, down, name) {
    const w = F.w / down, h = F.h / down, cv = canvas(w, h), g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0; for (let v = 0; v < down; v++) for (let u = 0; u < down; u++) s += F.rgh[(y * down + v) * F.w + x * down + u];
      const r = clamp(s / (down * down) * 255, 0, 255), i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = r; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); return texture(cv, name);
  }
  function stamp(F, cx, cy, r, fn) {   // visit pixels within r of (cx, cy), wrapped: fn(index, distance/r)
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dd = Math.hypot(x - cx, y - cy) / r; if (dd > 1) continue;
      fn(((y % F.h + F.h) % F.h) * F.w + ((x % F.w + F.w) % F.w), dd);
    }
  }

  // ── 紅磚: herringbone, 20 x 10 cm bricks, one canvas = BRICK_M metres ─────────────
  // Cell (i, j) of 10 cm: d = (i - j) mod 4. d 0|1 are the left|right halves of a horizontal brick,
  // d 2|3 the upper|lower halves of a vertical one (d 2 pairs with the cell above it, d 3 below).
  // The pattern repeats every 4 cells, so a 32-cell canvas tiles.
  const BRICK_M = 3.2, BRICK_CELLS = 32;
  // tones from the 紅樓 plaza and Minsheng East Road photos: dusty sun-faded brick red, with burnt-brown and faded-pink outliers
  const BRICK_TONES = ['#a46a5a', '#9a6253', '#ad7464', '#93594b', '#a66d5c', '#b37e6e', '#8d5649', '#a87060'].map(hex);
  const BRICK_ODD = { burnt: hex('#7d4a3e'), faded: hex('#b8958a'), fresh: hex('#b8644c') };
  const JOINT = hex('#5a5045');
  function paintBrick(N, rand) {
    const F = field(N, N), c = N / BRICK_CELLS, dirt = fbm(rand, N, N, 4, 4), grain = noise(rand, N, N, N / 4), polish = noise(rand, N, N, 3);
    const jw = Math.max(0.8, c * 0.09);   // joint half-width in px (about 1 cm)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = Math.floor(x / c), j = Math.floor(y / c), d = ((i - j) % 4 + 4) % 4;
      let ai, aj, x0, y0, bw, bh, kind;
      if (d === 0) { ai = i; aj = j; x0 = i * c; y0 = j * c; bw = 2 * c; bh = c; kind = 0; }
      else if (d === 1) { ai = i - 1; aj = j; x0 = (i - 1) * c; y0 = j * c; bw = 2 * c; bh = c; kind = 0; }
      else if (d === 2) { ai = i; aj = j; x0 = i * c; y0 = (j - 1) * c; bw = c; bh = 2 * c; kind = 1; }
      else { ai = i; aj = j + 1; x0 = i * c; y0 = j * c; bw = c; bh = 2 * c; kind = 1; }
      const key = [((ai % BRICK_CELLS) + BRICK_CELLS) % BRICK_CELLS, ((aj % BRICK_CELLS) + BRICK_CELLS) % BRICK_CELLS, kind];
      const r0 = hash2(key[0], key[1], key[2] + 1), r1 = hash2(key[0], key[1], key[2] + 7), r2 = hash2(key[0], key[1], key[2] + 13);
      const lx = x + 0.5 - x0, ly = y + 0.5 - y0, e = Math.min(lx, bw - lx, ly, bh - ly);
      // chipped corner on 5% of bricks: a triangle off one corner sinks to joint level
      let chip = false;
      if (r2 < 0.05) { const cs = c * (0.35 + r1 * 0.4), q = Math.floor(r2 * 80) % 4; const ux = q & 1 ? bw - lx : lx, uy = q & 2 ? bh - ly : ly; chip = ux + uy < cs; }
      const p = y * N + x, o = p * 3;
      if (e < jw || chip) {
        const v = 0.85 + grain[p] * 0.25 - (chip ? 0.05 : 0);
        F.col[o] = JOINT[0] * v; F.col[o + 1] = JOINT[1] * v; F.col[o + 2] = JOINT[2] * v;
        F.hgt[p] = chip ? 0.18 : 0.1 + grain[p] * 0.05; F.rgh[p] = 0.97; continue;
      }
      let t = BRICK_TONES[Math.floor(r0 * BRICK_TONES.length)];
      if (r1 > 0.965) t = BRICK_ODD.burnt; else if (r1 < 0.03) t = BRICK_ODD.faded; else if (r1 > 0.94) t = BRICK_ODD.fresh;
      const bevel = sstep(0, c * 0.22, e - jw);                         // rounded arris
      const wear = 0.9 + 0.1 * bevel;                                   // grime caught along the edges
      const v = (0.95 + r2 * 0.08) * wear * (0.86 + dirt[p] * 0.2) * (0.96 + grain[p] * 0.08);
      F.col[o] = t[0] * v; F.col[o + 1] = t[1] * v; F.col[o + 2] = t[2] * v;
      F.hgt[p] = 0.35 + 0.6 * bevel + (grain[p] - 0.5) * 0.08;
      F.rgh[p] = 0.84 + (grain[p] - 0.5) * 0.1 - polish[p] * 0.14;     // foot-polished patches read a little glossier
    }
    return F;
  }

  // ── 磨石子 terrazzo: grey cement with white, black, grey and rust chips; one canvas = 1 m ──
  const TERRAZZO_M = 1;
  function paintTerrazzo(N, rand) {
    const F = field(N, N), base = hex('#aca79f'), dirt = fbm(rand, N, N, 4, 3), fine = noise(rand, N, N, N / 2);
    for (let p = 0; p < N * N; p++) { const v = 0.9 + dirt[p] * 0.14 + (fine[p] - 0.5) * 0.05; F.col[p * 3] = base[0] * v; F.col[p * 3 + 1] = base[1] * v; F.col[p * 3 + 2] = base[2] * v; F.hgt[p] = 0.5 + (fine[p] - 0.5) * 0.04; F.rgh[p] = 0.6; }
    const chips = ['#f1ede4', '#ece6da', '#2f2e2c', '#4a4744', '#8e8a83', '#a3a09a', '#9a5d43', '#6d7768'].map(hex), wts = [0.24, 0.16, 0.14, 0.1, 0.14, 0.1, 0.07, 0.05];
    const n = Math.round(N * N * 0.03);
    for (let k = 0; k < n; k++) {
      let u = rand(), ci = 0; for (; ci < wts.length - 1 && u > wts[ci]; ci++) u -= wts[ci];
      const col = chips[ci], r = (0.5 + rand() * rand() * 3.2) * N / 256, s = 0.88 + rand() * 0.2;
      stamp(F, rand() * N, rand() * N, r, (p, dd) => { F.col[p * 3] = col[0] * s; F.col[p * 3 + 1] = col[1] * s; F.col[p * 3 + 2] = col[2] * s; F.hgt[p] = 0.56 - dd * 0.05; F.rgh[p] = 0.45; });
    }
    return F;
  }

  // ── 導盲磚 tactile tiles, 30 cm: left half bars (directional, along v), right half dots (warning) ──
  const TACTILE_M = 0.3;
  function paintTactile(N, rand) {   // canvas N*2 x N
    const W = N * 2, F = field(W, N), yel = hex('#e0ad1c'), dirt = fbm(rand, W, N, 4, 3), grime = hex('#6f5a2a');
    for (let y = 0; y < N; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x, lx = x % N, e = Math.min(lx, N - 1 - lx, y, N - 1 - y);
      let top = 0;
      if (x < N) { const bw = N / 4, bx = (lx % bw) - bw / 2, half = bw * 0.27, ends = N * 0.08;      // four bars, 2.5 cm wide
        const ry = y < ends ? (ends - y) : y > N - 1 - ends ? (y - (N - 1 - ends)) : 0, dd = Math.hypot(Math.max(0, Math.abs(bx) - half * 0.4), ry) / (half * 0.6 + 0.001);
        top = Math.abs(bx) < half && dd < 1 ? 1 - dd * dd * 0.6 : 0; }
      else { const s = N / 5, dx = (lx % s) - s / 2, dy = (y % s) - s / 2, dd = Math.hypot(dx, dy) / (s * 0.32); top = dd < 1 ? Math.sqrt(1 - dd * dd) : 0; }
      const groove = top > 0 ? 0 : 1, edge = e < Math.max(1, N / 90) ? 1 : 0;
      const v = (0.82 + dirt[p] * 0.22) * (1 - 0.1 * groove), g = groove * 0.25 + edge * 0.6;
      F.col[p * 3] = (yel[0] * (1 - g) + grime[0] * g) * v; F.col[p * 3 + 1] = (yel[1] * (1 - g) + grime[1] * g) * v; F.col[p * 3 + 2] = (yel[2] * (1 - g) + grime[2] * g) * v;
      F.hgt[p] = edge ? 0 : 0.3 + top * 0.6; F.rgh[p] = top > 0 ? 0.62 : 0.85;
    }
    return F;
  }

  // ── cast iron: round rainwater cover (diamond anti-slip field, ring of lettering bumps, emblem) ──
  function paintIron(N, rand) {
    const F = field(N, N), iron = hex('#4b4743'), worn = hex('#7d776f'), rust = hex('#6e4a33'), dirt = fbm(rand, N, N, 4, 3);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const p = y * N + x, u = (x + 0.5) / N * 2 - 1, v = (y + 0.5) / N * 2 - 1, r = Math.hypot(u, v), a = Math.atan2(v, u);
      let top = 0;
      if (r > 0.94) top = 0.2;                                                            // rim gap to the frame
      else if (r > 0.86) top = 0.9;                                                       // flat rim
      else if (r > 0.7) top = (Math.sin(a * 22) > 0.2 && Math.abs(r - 0.78) < 0.045) ? 1 : 0.55;   // lettering ring
      else if (r > 0.3) { const s = 11, gx = (u + v) * s, gy = (u - v) * s; top = (Math.abs(gx - Math.round(gx)) < 0.2 || Math.abs(gy - Math.round(gy)) < 0.2) ? 1 : 0.5; }   // diamond grid
      else top = r > 0.26 ? 1 : (Math.abs(Math.sin(a * 3 + r * 9)) > 0.6 ? 0.95 : 0.6);   // the city emblem, abstracted
      const shine = top > 0.85 ? 0.75 : 0, rs = sstep(0.55, 0.85, dirt[p]) * (1 - shine) * 0.8;
      for (let k = 0; k < 3; k++) F.col[p * 3 + k] = (iron[k] * (1 - shine) + worn[k] * shine) * (1 - rs) + rust[k] * rs;
      F.hgt[p] = top; F.rgh[p] = shine ? 0.45 : 0.75;
    }
    return F;
  }
  // trench-drain grate: one canvas = 0.5 m of grate (u along the drain), 0.25 m across (v)
  const GRATE_M = 0.5;
  function paintGrate(N, rand) {   // canvas N x N/4
    const H = N / 4, F = field(N, H), iron = hex('#4f4a45'), slot = hex('#141210'), rust = hex('#6a4630'), dirt = noise(rand, N, H, 8);
    for (let y = 0; y < H; y++) for (let x = 0; x < N; x++) {
      const p = y * N + x, frame = y < H * 0.12 || y > H * 0.88, bar = (x % (N / 12)) < N / 12 * 0.42, sl = !frame && !bar;
      const rs = sstep(0.6, 0.9, dirt[p]) * 0.6, c = sl ? slot : iron;
      for (let k = 0; k < 3; k++) F.col[p * 3 + k] = sl ? c[k] : c[k] * (1 - rs) + rust[k] * rs;
      F.hgt[p] = sl ? 0 : frame ? 0.85 : 1; F.rgh[p] = 0.7;
    }
    return F;
  }
  // granite kerb: speckled grey, one canvas = 1 m with a joint at the u seam
  function paintGranite(N, rand) {
    const F = field(N, N), g = hex('#a6a39c'), fine = noise(rand, N, N, N / 2), dirt = fbm(rand, N, N, 3, 3);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const p = y * N + x, sp = rand(), joint = x < Math.max(1, N / 128) || x >= N - Math.max(1, N / 128);
      let v = 0.88 + (fine[p] - 0.5) * 0.18 + dirt[p] * 0.12; if (sp < 0.06) v *= 0.45; else if (sp > 0.95) v *= 1.15;
      if (joint) v *= 0.45;
      for (let k = 0; k < 3; k++) F.col[p * 3 + k] = g[k] * v;
      F.hgt[p] = joint ? 0 : 0.6 + (fine[p] - 0.5) * 0.1; F.rgh[p] = 0.8;
    }
    return F;
  }
  // stains atlas (2 x 2): soft blotch, oil ring, gum dots, water streaks. Grey = alpha.
  function paintStains(N, rand) {
    const F = field(N, N), n1 = fbm(rand, N, N, 4, 4), n2 = noise(rand, N, N, 24), q = N / 2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const p = y * N + x, cell = (y < q ? 0 : 2) + (x < q ? 0 : 1), u = (x % q) / q * 2 - 1, v = (y % q) / q * 2 - 1, r = Math.hypot(u, v);
      let a = 0;
      if (cell === 0) a = sstep(0.95, 0.4, r + (n1[p] - 0.5) * 0.7) * (0.6 + n2[p] * 0.4);
      else if (cell === 1) { const rr = r + (n1[p] - 0.5) * 0.25; a = sstep(0.85, 0.7, rr) * (0.35 + 0.5 * sstep(0.45, 0.75, rr)); }
      else if (cell === 3) a = sstep(0.9, 0.5, Math.abs(u) * 1.6 + (n1[p] - 0.5) * 0.8) * sstep(1, 0.2, Math.abs(v)) * (0.4 + n2[p] * 0.5);
      F.col[p * 3] = F.col[p * 3 + 1] = F.col[p * 3 + 2] = a;
    }
    for (let k = 0; k < 40; k++) stamp(F, q + rand() * q * 0.8 + q * 0.1 - q, q + rand() * q * 0.8 + q * 0.1, (1 + rand() * 2.5) * N / 256, p => { F.col[p * 3] = F.col[p * 3 + 1] = F.col[p * 3 + 2] = 0.85; });   // gum, bottom-left cell
    return F;
  }

  // ── geometry helpers ────────────────────────────────────────────────────────────
  // flat quads on the ground with world-space uv (u = x / m, v = -z / m), so every piece of one material
  // lines up with the next and overlaps are invisible. quad: [x0, z0, x1, z1] axis-aligned.
  function groundQuads(quads, m, y, uOff, vOff) {
    const pos = [], uv = [], nor = [];
    quads.forEach(([x0, z0, x1, z1]) => {
      const P = [[x0, z1], [x1, z1], [x1, z0], [x0, z1], [x1, z0], [x0, z0]];
      P.forEach(([x, z]) => { pos.push(x, y, z); nor.push(0, 1, 0); uv.push(x / m + (uOff || 0), -z / m + (vOff || 0)); });
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  }
  function merge(geos) {
    const out = { position: [], normal: [], uv: [] };
    geos.forEach(g0 => { const g = g0.index ? g0.toNonIndexed() : g0; Object.keys(out).forEach(k => { const a = g.attributes[k]; if (a) out[k].push(...a.array); }); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(out.position, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(out.normal, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2));
    return g;
  }

  function build(S, SQ, opts) {
    opts = Object.assign({ y: 0.04, centreDisc: true, stains: 46, patches: 9, seed: 7 }, opts || {});
    stats.length = 0;
    const rand = rng(opts.seed), TS = S.TEX_SCALE || 1, sz = n => Math.max(32, Math.round(n * TS));
    const cx = SQ.x, cz = SQ.z, H = SQ.h, Y = opts.y, group = new THREE.Group(); group.name = 'square-paving';
    // the floor darkens toward the walls (the same idea as the road's kerb AO in app.js)
    const edgeAO = (x, z) => 0.8 + 0.2 * sstep(0, 3.2, H - Math.max(Math.abs(x - cx), Math.abs(z - cz)));
    const addAO = g => { const p = g.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = edgeAO(p.getX(i), p.getZ(i)); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; };
    const mesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = 'paving-' + name; m.receiveShadow = true; group.add(m); return m; };

    // textures
    const fB = paintBrick(sz(512), rand), fT = paintTerrazzo(sz(256), rand), fK = paintTactile(sz(128), rand);
    const fI = paintIron(sz(128), rand), fG = paintGrate(sz(128), rand), fR = paintGranite(sz(128), rand), fS = paintStains(sz(256), rand);
    const T = {
      brick: colourMap(fB, 'brick'), brickN: normalMap(fB, 3.2 * TS, 'brick-normal'), brickR: roughMap(fB, 2, 'brick-rough'),
      terrazzo: colourMap(fT, 'terrazzo'), terrazzoN: normalMap(fT, 2 * TS, 'terrazzo-normal'),
      tactile: colourMap(fK, 'tactile'), tactileN: normalMap(fK, 2.4 * TS, 'tactile-normal'),
      iron: colourMap(fI, 'iron'), ironN: normalMap(fI, 2.2 * TS, 'iron-normal'),
      grate: colourMap(fG, 'grate'), grateN: normalMap(fG, 3 * TS, 'grate-normal'),
      granite: colourMap(fR, 'granite'), graniteN: normalMap(fR, 1.5 * TS, 'granite-normal'),
      stains: colourMap(fS, 'stains', true),
    };
    const nS = new THREE.Vector2(1, 1);
    const M = {
      brick: S.lit({ color: 0xffffff, map: T.brick, normalMap: T.brickN, normalScale: nS, roughnessMap: T.brickR, roughness: 1, vertexColors: true }),
      patch: S.lit({ color: new THREE.Color(1.12, 1.0, 0.94), map: T.brick, normalMap: T.brickN, roughnessMap: T.brickR, roughness: 0.92, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
      terrazzo: S.lit({ color: 0xffffff, map: T.terrazzo, normalMap: T.terrazzoN, roughness: 0.62, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      tactile: S.lit({ color: 0xffffff, map: T.tactile, normalMap: T.tactileN, roughness: 0.75, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
      iron: S.lit({ color: 0xffffff, map: T.iron, normalMap: T.ironN, roughness: 0.62, metalness: 0.45, vertexColors: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
      grate: S.lit({ color: 0xffffff, map: T.grate, normalMap: T.grateN, roughness: 0.7, metalness: 0.4, vertexColors: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
      granite: S.lit({ color: 0xffffff, map: T.granite, normalMap: T.graniteN, roughness: 0.8, vertexColors: true }),
      stain: S.lit({ color: 0x2a2119, alphaMap: T.stains, transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.95, vertexColors: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }),
    };

    // 1. the brick field: a 52 x 52 plane in 26 x 26 segments (so the AO has vertices to sit on)
    const floor = new THREE.PlaneGeometry(H * 2, H * 2, 26, 26).rotateX(-Math.PI / 2).translate(cx, Y, cz);
    { const p = floor.attributes.position, uv = floor.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / BRICK_M, -p.getZ(i) / BRICK_M); }
    mesh(addAO(floor), M.brick, 'brick');

    // 2. patches of newer brick: squares snapped to the 40 cm herringbone period, uv shifted by whole periods
    const patches = [];
    for (let k = 0; k < opts.patches; k++) {
      const w = 0.8 + Math.floor(rand() * 4) * 0.4, d = 0.8 + Math.floor(rand() * 3) * 0.4;
      const px = Math.round((cx + (rand() * 2 - 1) * (H - 4)) / 0.4) * 0.4, pz = Math.round((cz + (rand() * 2 - 1) * (H - 4)) / 0.4) * 0.4;
      if (Math.hypot(px - cx, pz - cz) < 9) continue;
      patches.push([px, pz, px + w, pz + d]);
    }
    if (patches.length) mesh(addAO(groundQuads(patches, BRICK_M, Y + 0.002, 0.375, 0.5)), M.patch, 'patches');

    // 3. 磨石子 bands: a frame 1.6 m in from the walls, a cross from the centre to the four sides, a centre disc
    const F0 = H - 1.6, FW = 0.7, AW = 0.6, R0 = 8;   // frame inner edge, frame width, half the arm width, centre radius
    const bands = [
      [cx - F0 - FW, cz - F0 - FW, cx + F0 + FW, cz - F0], [cx - F0 - FW, cz + F0, cx + F0 + FW, cz + F0 + FW],
      [cx - F0 - FW, cz - F0, cx - F0, cz + F0], [cx + F0, cz - F0, cx + F0 + FW, cz + F0],
      [cx - F0, cz - AW, cx - R0 + 0.3, cz + AW], [cx + R0 - 0.3, cz - AW, cx + F0, cz + AW],
      [cx - AW, cz - F0, cx + AW, cz - R0 + 0.3], [cx - AW, cz + R0 - 0.3, cx + AW, cz + F0],
      // the arms run on through the frame to the gate thresholds (west, north, east)
      [cx - H, cz - SQ.gate, cx - F0 - FW, cz + SQ.gate], [cx + F0 + FW, cz - SQ.gate, cx + H, cz + SQ.gate], [cx - SQ.gate, cz - H, cx + SQ.gate, cz - F0 - FW],
    ];
    const terr = [groundQuads(bands, TERRAZZO_M, Y + 0.004)];
    if (opts.centreDisc) {
      const disc = new THREE.CircleGeometry(R0, 64).rotateX(-Math.PI / 2).translate(cx, Y + 0.004, cz);
      { const p = disc.attributes.position, uv = disc.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / TERRAZZO_M, -p.getZ(i) / TERRAZZO_M); }
      terr.push(disc);
    }
    mesh(addAO(merge(terr)), M.terrazzo, 'terrazzo');

    // 4. tactile strips to the three gates: bar tiles along the walking line, 2 x 2 dot tiles at each end
    const tq = [], arms = [];
    const strip = (ax, az, len, alongX) => {   // from the centre edge outward; (ax, az) unit direction
      const start = R0 + 0.3, end = H - 0.75, tile = TACTILE_M, n = Math.floor((end - start) / tile);
      const at = s => [cx + ax * s, cz + az * s];
      for (let k = 0; k < n; k++) {
        const s0 = start + k * tile, [x0, z0] = at(s0), [x1, z1] = at(s0 + tile), dots = k < 2 || k >= n - 2;
        const rect = alongX ? [Math.min(x0, x1), cz - tile / 2, Math.max(x0, x1), cz + tile / 2] : [cx - tile / 2, Math.min(z0, z1), cx + tile / 2, Math.max(z0, z1)];
        tq.push({ rect, dots, alongX });
        if (dots) { const side = alongX ? [rect[0], rect[1] - tile, rect[2], rect[1]] : [rect[0] - tile, rect[1], rect[0], rect[3]]; tq.push({ rect: side, dots: true, alongX }); }
      }
      arms.push({ from: at(start), to: at(start + n * tile), width: tile });
    };
    strip(-1, 0, 0, true); strip(1, 0, 0, true); strip(0, -1, 0, false);
    { // per-tile uv: bars in u 0..0.5, dots in 0.5..1; bars run along the walking line, so the x-arms turn the tile
      const pos = [], uv = [], nor = [];
      tq.forEach(({ rect: [x0, z0, x1, z1], dots, alongX }) => {
        const P = [[x0, z1], [x1, z1], [x1, z0], [x0, z1], [x1, z0], [x0, z0]];
        P.forEach(([x, z]) => {
          let u = (x - x0) / (x1 - x0), v = (z1 - z) / (z1 - z0); if (alongX && !dots) { const t = u; u = v; v = t; }
          pos.push(x, Y + 0.008, z); nor.push(0, 1, 0); uv.push(u * 0.5 + (dots ? 0.5 : 0), v);
        });
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      T.tactile.wrapS = T.tactileN.wrapS = THREE.ClampToEdgeWrapping;
      mesh(addAO(g), M.tactile, 'tactile');
    }

    // 5. cast-iron covers: round rainwater covers in the four panels and by the gates, a square utility plate
    const covers = [[cx - 13, cz - 13], [cx + 13, cz - 13], [cx - 13, cz + 13], [cx + 13, cz + 13], [cx - 19, cz + 6.5], [cx + 19, cz - 6.5], [cx + 6.5, cz - 19]];
    const coverGeos = covers.map(([x, z]) => new THREE.CircleGeometry(0.34, 28).rotateX(-Math.PI / 2).rotateY(rand() * Math.PI * 2).translate(x, Y + 0.01, z));
    const frameGeos = covers.map(([x, z]) => new THREE.RingGeometry(0.34, 0.4, 28, 1).rotateX(-Math.PI / 2).translate(x, Y + 0.009, z));
    const plate = new THREE.PlaneGeometry(0.6, 0.6).rotateX(-Math.PI / 2).translate(cx - 7, Y + 0.01, cz + 17);
    mesh(merge(coverGeos.concat([plate])), M.iron, 'covers');
    { const fg = merge(frameGeos), uv = fg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5, 0.97); mesh(fg, M.iron, 'cover-frames'); }

    // 6. trench drains: across each gate threshold and along the south wall
    const drains = [
      { rect: [cx - H + 0.2, cz - SQ.gate, cx - H + 0.45, cz + SQ.gate], alongX: false },
      { rect: [cx + H - 0.45, cz - SQ.gate, cx + H - 0.2, cz + SQ.gate], alongX: false },
      { rect: [cx - SQ.gate, cz - H + 0.2, cx + SQ.gate, cz - H + 0.45], alongX: true },
      { rect: [cx - H + 1, cz + H - 0.75, cx + H - 1, cz + H - 0.5], alongX: true },
    ];
    { const pos = [], uv = [], nor = [];
      drains.forEach(({ rect: [x0, z0, x1, z1], alongX }) => {
        const P = [[x0, z1], [x1, z1], [x1, z0], [x0, z1], [x1, z0], [x0, z0]];
        P.forEach(([x, z]) => { pos.push(x, Y + 0.011, z); nor.push(0, 1, 0); uv.push(alongX ? (x - x0) / GRATE_M : (z1 - z) / GRATE_M, alongX ? (z1 - z) / (z1 - z0) : (x - x0) / (x1 - x0)); });
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      mesh(g, M.grate, 'drains');
    }

    // 7. granite kerb stones at the foot of the walls, 1 m stones, 14 cm high, gaps at the three gates
    const kerbs = [], KW = 0.35, KH = 0.14;
    const sides = [{ n: 'west', gate: true }, { n: 'east', gate: true }, { n: 'north', gate: true }, { n: 'south', gate: false }];
    sides.forEach(({ n, gate }) => {
      for (let a = -H; a < H - 0.01; a += 1) {
        const m = a + 0.5; if (gate && Math.abs(m) < SQ.gate + 0.5) continue;
        const along = n === 'north' || n === 'south', off = H - KW / 2;
        const g = new THREE.BoxGeometry(1, KH, KW);   // u runs along the stone, so the texture's joint sits on its ends
        if (!along) g.rotateY(Math.PI / 2);
        g.translate(n === 'west' ? cx - off : n === 'east' ? cx + off : cx + m, Y + KH / 2, n === 'north' ? cz - off : n === 'south' ? cz + off : cz + m);
        kerbs.push(g);
      }
    });
    const kerbGeo = S.aoBake ? S.aoBake(merge(kerbs)) : merge(kerbs);
    const kerb = mesh(kerbGeo, M.granite, 'kerbs'); kerb.castShadow = true;

    // 8. wear: stains and gum, thicker where people walk (the arms, the gates, the drains)
    const sq = [];
    for (let k = 0; k < opts.stains; k++) {
      let x, z;
      if (k % 3 === 0) { const arm = Math.floor(rand() * 3), s = R0 + rand() * (H - R0 - 1); x = arm === 0 ? cx - s : arm === 1 ? cx + s : cx + (rand() - 0.5) * 6; z = arm === 2 ? cz - s : cz + (rand() - 0.5) * 6; }
      else { x = cx + (rand() * 2 - 1) * (H - 1); z = cz + (rand() * 2 - 1) * (H - 1); }
      if (Math.hypot(x - cx, z - cz) < 3.2) continue;
      const cell = k % 7 === 0 ? 2 : k % 5 === 0 ? 1 : k % 4 === 0 ? 3 : 0, s = cell === 2 ? 0.8 + rand() * 0.8 : 0.7 + rand() * 2.2, rot = rand() * Math.PI * 2;
      sq.push({ x, z, s, rot, cell });
    }
    { const pos = [], uv = [], nor = [];
      sq.forEach(({ x, z, s, rot, cell }) => {
        const c = Math.cos(rot) * s / 2, sn = Math.sin(rot) * s / 2, u0 = (cell % 2) * 0.5, v0 = cell < 2 ? 0.5 : 0;
        const corner = (a, b) => [x + a * c - b * sn, z + a * sn + b * c];
        const P = [[-1, 1, 0, 0], [1, 1, 1, 0], [1, -1, 1, 1], [-1, 1, 0, 0], [1, -1, 1, 1], [-1, -1, 0, 1]];
        P.forEach(([a, b, uu, vv]) => { const [px, pz] = corner(a, b); pos.push(px, Y + 0.012, pz); nor.push(0, 1, 0); uv.push(u0 + uu * 0.5, v0 + (1 - vv) * 0.5); });
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      const m = mesh(g, M.stain, 'stains'); m.receiveShadow = true; m.renderOrder = 1;
    }

    const bytes = stats.reduce((s, t) => s + t.bytes, 0);
    return {
      group, materials: M, textures: T,
      stats: { textures: stats.slice(), bytes, mb: +(bytes / 1048576).toFixed(2), drawCalls: group.children.length },
      layout: { floorY: Y, centreRadius: R0, frame: { inner: F0, width: FW }, armHalfWidth: AW, tactile: arms, covers, drains: drains.map(d => d.rect), kerb: { width: KW, height: KH } },
      dispose() { group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); Object.values(M).forEach(m => m.dispose()); Object.values(T).forEach(t => t.dispose()); },
    };
  }

  window.SQUARE_PAVING = { build, BRICK_M, TERRAZZO_M, TACTILE_M };
})();
