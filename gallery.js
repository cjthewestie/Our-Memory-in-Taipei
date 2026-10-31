// gallery.js — the photo walls: where the visitors' pictures hang, and the frame that says how to add one.
//
// CJ, 2026-10-31, walking the square: "make it gallery like, i dont know where to put picutres?"
//
// Two walls stand in the square on either side of the arrival path: on the left the opening exhibition
// (the page's own licensed photographs, captioned with their real credits, photos.js), on the right the
// visitors' wall. Each district (西門町, 大稻埕, 信義) has a smaller wall just inside its gate. Every wall
// starts with an empty frame marked "+ Add your photo": walk up to it and press E (or tap the bubble),
// or click it, and the memory form opens with the photo field first. Text-only memories stay lanterns.
//
// What may hang, and why it is safe (the privacy rule is memories.js's and is not changed here):
//  - online, shared photos come only from memories.js: approved rows, each photo through a signed URL
//    (window.__memories.photoURL → m.photoSigned). Pending and rejected photos are never fetched.
//  - a visitor's own photo, kept in their own browser: offline, memories.js keeps it (m.local, "kept in
//    this browser"); online, this file keeps a small copy of what they just sent, shown only to them
//    with "only you can see this until it is approved", and dropped once the approved one arrives.
//  - until a real photo exists, a frame shows an ink outline and "Your photo could hang here". No fake
//    visitor photos, ever.
//
// Hooks it relies on: walk.js WALK.layout and the 'walk:section' event; memories.js the 'memory:added'
// and 'memory:saved' events and window.__memories (openForm, openRead, photoURL, list). Every string a
// visitor wrote is drawn on a canvas or set through textContent, never innerHTML.
(function () {
  'use strict';
  if (!window.THREE || !window.SCENE || !window.RIG || !window.WALK || !window.WALK.layout || !window.__memories) return;
  const S = window.SCENE, R = window.RIG, WALK = window.WALK, MEM = window.__memories, P = S.PALETTE, C = S.C;
  const { SQ, SECT, SIDE } = WALK.layout;
  const MINE_KEY = 'our-memory-in-taipei:my-pending-photos';
  const NEAR = 4.5;   // same reach as a lantern (memories.js)
  const TOUCH = R.IS_PHONE || ('ontouchstart' in window);
  const FONT_EN = '"Barlow Condensed", "Barlow", sans-serif';
  const FONT_TXT = '"Barlow", "Chocolate Classical Sans", "Noto Sans TC", "PingFang TC", sans-serif';
  const FONT_ZH = '"Chocolate Classical Sans", "Noto Sans TC", "PingFang TC", sans-serif';
  const NAMES = { square: ['廣場', 'THE SQUARE'], red: ['西門町', 'XIMENDING'], dadao: ['大稻埕', 'DADAOCHENG'], tower: ['信義', 'XINYI'] };

  // ── a frame: one canvas texture on a plane, in a dark moulding ──────────────
  const FW = 2.3, FH = 2.9;                     // world size of one frame
  const CW = 460, CH = 580;                     // its canvas, in layout px (same aspect as FW:FH, so nothing on it stretches)
  const Q = R.IS_PHONE ? 1 : 1.5;               // canvas px per layout px: sharper captions on a desktop screen
  const PH = { x: 34, y: 34, w: CW - 68, h: 330 };   // the photo's place on the mat
  const moulding = S.lit({ color: C('ink'), vertexColors: false });
  const frameGeo = new THREE.BoxGeometry(FW + 0.16, FH + 0.16, 0.1);
  const planeGeo = new THREE.PlaneGeometry(FW, FH);
  // a soft shadow on the wall behind each frame, as in a gallery under ceiling lights
  const shadowMat = (() => {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 160;
    const g = cv.getContext('2d');
    g.shadowColor = 'rgba(40, 24, 10, 0.9)'; g.shadowBlur = 14; g.shadowOffsetY = 9;
    g.fillStyle = 'rgba(40, 24, 10, 0.9)'; g.fillRect(22, 22, 84, 112);
    const t = new THREE.CanvasTexture(cv);
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false });
  })();
  const shadowGeo = new THREE.PlaneGeometry((FW + 0.16) * 128 / 84, (FH + 0.16) * 160 / 112);

  function wrap(g, text, x, y, maxW, lineH, maxLines) {
    const words = String(text).replace(/\s+/g, ' ').trim().split(/(\s|(?<=[　-鿿]))/).filter(w => w && w !== ' ');
    let line = '', lines = [];
    const cjk = w => /[　-鿿]/.test(w);
    for (const w of words) {
      const join = line && !(cjk(w) && cjk(line.slice(-1))) ? line + ' ' + w : line + w;
      if (g.measureText(join).width > maxW && line) { lines.push(line); line = w; } else line = join;
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let l = lines[maxLines - 1];
      while (l.length && g.measureText(l + '…').width > maxW) l = l.slice(0, -1);
      lines[maxLines - 1] = l.replace(/\s+$/, '') + '…';
    }
    lines.forEach((l, i) => g.fillText(l, x, y + i * lineH));
  }
  function dashed(g, x, y, w, h, col, lw, dash) {
    g.save(); g.strokeStyle = col; g.lineWidth = lw; g.setLineDash(dash); g.strokeRect(x, y, w, h); g.restore();
  }

  // item: { kind: 'add' | 'empty' | 'photo', m?, title?, sub?, note? }
  function drawFrame(g, item, img) {
    g.setTransform(Q, 0, 0, Q, 0, 0);
    g.fillStyle = P.bone; g.fillRect(0, 0, CW, CH);
    g.textBaseline = 'alphabetic';
    if (item.kind === 'add') {
      g.fillStyle = '#fff6e6'; g.fillRect(PH.x, PH.y, PH.w, CH - 68);
      dashed(g, PH.x + 6, PH.y + 6, PH.w - 12, CH - 80, P.verm, 6, [22, 14]);
      g.fillStyle = P.verm; g.textAlign = 'center';
      g.beginPath(); g.arc(CW / 2, 200, 74, 0, Math.PI * 2); g.fill();
      g.fillStyle = P.bone; g.fillRect(CW / 2 - 40, 192, 80, 16); g.fillRect(CW / 2 - 8, 160, 16, 80);
      g.fillStyle = P.ink; g.font = `700 52px ${FONT_EN}`; g.fillText('Add your photo', CW / 2, 350);
      g.font = `400 26px ${FONT_TXT}`; g.globalAlpha = 0.75;
      g.fillText('A picture of Taipei you remember', CW / 2, 396);
      g.fillText(TOUCH ? 'Walk up and tap, or tap here' : 'Walk up and press E, or click', CW / 2, 438);
      g.globalAlpha = 1;
      g.font = `700 22px ${FONT_EN}`; g.fillStyle = P.verm; g.fillText('新增你的照片', CW / 2, 500);
      return;
    }
    // the photo, or the empty outline where one could hang
    if (item.kind === 'photo' && img) {
      // the whole photo, fitted inside its place on the mat at its own aspect: a tall photo hangs tall,
      // a wide one wide, nothing cropped and nothing stretched
      const k = Math.min(PH.w / img.width, PH.h / img.height), w = img.width * k, h = img.height * k;
      const x = PH.x + (PH.w - w) / 2, y = PH.y + (PH.h - h) / 2;
      g.save(); g.shadowColor = 'rgba(40, 24, 10, 0.35)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
      g.fillStyle = '#fff'; g.fillRect(x, y, w, h); g.restore();
      g.drawImage(img, x, y, w, h);
      g.strokeStyle = P.ink; g.lineWidth = 1.5; g.strokeRect(x, y, w, h);
      item.fit = { nw: img.width, nh: img.height, dw: w, dh: h, sx: FW / CW, sy: FH / CH, visible: 1 };
    } else {
      g.fillStyle = '#efe7d8'; g.fillRect(PH.x, PH.y, PH.w, PH.h);
      dashed(g, PH.x + 10, PH.y + 10, PH.w - 20, PH.h - 20, P.ink, 3, [10, 9]);
      g.fillStyle = P.ink; g.globalAlpha = 0.55; g.textAlign = 'center';
      g.font = `400 30px ${FONT_TXT}`; g.fillText(item.kind === 'photo' ? 'The photo is on its way…' : 'Your photo could hang here', CW / 2, PH.y + PH.h / 2 + 10);
      g.globalAlpha = 1;
    }
    g.textAlign = 'left'; g.fillStyle = P.ink;
    if (item.kind === 'empty') return;
    g.font = `400 29px ${FONT_TXT}`;
    wrap(g, item.title || '', PH.x, PH.y + PH.h + 44, PH.w, 34, 3);
    g.font = `700 23px ${FONT_EN}`; g.globalAlpha = 0.8;
    wrap(g, item.sub || '', PH.x, CH - (item.note ? 62 : 34), PH.w, 24, 1);
    g.globalAlpha = 1;
    if (item.note) {
      g.fillStyle = P.verm; g.font = `italic 400 19px ${FONT_TXT}`;
      wrap(g, item.note, PH.x, CH - 30, PH.w, 22, 1);
    }
  }

  const imgCache = {};
  function loadImg(url, cb) {
    if (imgCache[url]) { const c = imgCache[url]; if (c.ok) cb(c.img); else c.wait.push(cb); return; }
    const img = new Image(), c = imgCache[url] = { img, ok: false, wait: [cb] };
    if (!/^data:/.test(url)) img.crossOrigin = 'anonymous';   // signed URLs are cross-origin; a tainted canvas cannot become a texture
    img.decoding = 'async';
    img.onload = () => { c.ok = true; c.wait.forEach(f => f(img)); c.wait = []; };
    img.onerror = () => { console.warn('[gallery] a photo did not load'); };
    img.src = url;
  }

  const redraws = [];
  function makeFrame(item) {
    const g0 = new THREE.Group();
    const back = new THREE.Mesh(frameGeo, moulding); back.position.z = -0.06; back.castShadow = true; g0.add(back);
    const shade = new THREE.Mesh(shadowGeo, shadowMat); shade.position.set(0, -0.06, -0.044); shade.renderOrder = 1; g0.add(shade);
    const cv = document.createElement('canvas'); cv.width = CW * Q; cv.height = CH * Q;
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; tex.encoding = THREE.sRGBEncoding;
    const face = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    face.position.z = 0.002; g0.add(face);
    let img = null;
    const redraw = () => { drawFrame(cv.getContext('2d'), item, img); tex.needsUpdate = true; };
    redraw(); redraws.push(redraw);
    if (item.kind === 'photo' && item.url) loadImg(item.url, i => { img = i; redraw(); });
    g0.userData.item = item;
    g0.traverse(o => { o.userData.item = item; });
    return g0;
  }

  // a header plate above a wall
  function plate(w, zh, en, sub, col) {
    const cv = document.createElement('canvas'); cv.width = Math.round(160 * w); cv.height = 120;
    const tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.75), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    const draw = () => {
      const g = cv.getContext('2d'), W = cv.width, H = cv.height;
      g.fillStyle = P.ink; g.fillRect(0, 0, W, H);
      g.fillStyle = P[col] || col; g.fillRect(0, H - 10, W, 10);
      g.fillStyle = P.bone; g.textBaseline = 'middle'; g.textAlign = 'left';
      g.font = `700 54px ${FONT_ZH}`; g.fillText(zh, 24, H * 0.46);
      const zw = g.measureText(zh).width;
      g.font = `700 40px ${FONT_EN}`; g.fillText(en, 24 + zw + 22, H * 0.36);
      g.font = `400 26px ${FONT_TXT}`; g.globalAlpha = 0.8; g.fillText(sub, 24 + zw + 22, H * 0.72); g.globalAlpha = 1;
      tex.needsUpdate = true;
    };
    draw(); redraws.push(draw);
    return m;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => redraws.forEach(f => f()));

  // ── a wall: a plaster board on two feet, a header, frames in a row ──────────
  const plaster = S.lit({ color: new THREE.Color('#efe6d6'), vertexColors: false });
  const footMat = S.lit({ color: C('ink'), vertexColors: false });
  const STEP = FW + 0.5;
  function buildWall(items, head) {
    const g = new THREE.Group();
    const n = items.length, w = n * STEP + 0.4, h = 4.0;
    const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), plaster);
    board.position.set(0, h / 2 + 0.1, -0.2); board.castShadow = board.receiveShadow = true; g.add(board);
    [-w / 2 + 0.4, w / 2 - 0.4].forEach(x => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1.4), footMat); f.position.set(x, 0.1, -0.2); g.add(f);
    });
    const hp = plate(Math.min(w - 0.4, 4.8), head[0], head[1], head[2], head[3]); hp.position.set(0, h - 0.45 + 0.1, -0.04); g.add(hp);
    const frames = items.map((it, i) => {
      const f = makeFrame(it); f.position.set(-w / 2 + 0.2 + STEP * (i + 0.5), 1.75, 0); g.add(f); return f;
    });
    return { group: g, frames };
  }

  // ── what hangs where ─────────────────────────────────────────────────────────
  const loadMine = () => { try { return JSON.parse(localStorage.getItem(MINE_KEY) || '[]'); } catch (_) { return []; } };
  const saveMine = l => { try { localStorage.setItem(MINE_KEY, JSON.stringify(l)); } catch (_) { /* full or private mode: it just isn't kept */ } };
  let mine = MEM.ONLINE ? loadMine() : [];   // offline, memories.js keeps the visitor's photos itself (m.local)
  const same = (a, b) => a.section === b.section && (a.body || '').trim() === (b.body || '').trim();

  function photoItem(m) {
    const who = m.name && String(m.name).trim() ? String(m.name).trim() : 'someone who was there';
    const note = m.mine ? 'Only you can see this until it is approved.' : m.local ? 'Kept in this browser.' : '';
    return { kind: 'photo', m, url: MEM.photoURL(m), title: m.body, sub: (m.year ? m.year + ' · ' : '') + who, note };
  }
  function visitorPhotos(section) {
    const shared = MEM.list().filter(m => m.section === section && MEM.photoURL(m));
    const own = mine.filter(m => m.section === section && !shared.some(s => !s.local && same(s, m)));
    return own.concat(shared).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }

  // the opening exhibition: the page's own licensed photographs (photos.js), with their real credits
  const SPOTS = (window.__photos && window.__photos.SPOTS) || [];
  const OPENING = ['redhouse', 'dihua', 'temple', 'tower101'].map(id => SPOTS.find(s => s.id === id)).filter(Boolean).map(s => ({
    kind: 'photo', landmark: s, url: 'asset/photos/hotspots/' + s.img,
    title: s.en + ' ' + s.zh + ', ' + s.when,
    sub: 'Photo: ' + s.by + ' · ' + s.licence,
  }));

  const walls = {};   // key → { group, frames, place }
  const MAX = { square: 5, red: 4, dadao: 4, tower: 4 };
  function slots(section) {
    const photos = visitorPhotos(section).slice(0, MAX[section]).map(photoItem);
    const min = section === 'square' ? 3 : 2;
    while (photos.length < min) photos.push({ kind: 'empty' });
    return [{ kind: 'add', section }].concat(photos);
  }
  // where each wall stands: the square's two halves flank the arrival path and lean toward it; a district's
  // wall stands on the east pavement just inside its gate, turned to face the visitor walking in.
  // GAP: half the path between the square's two walls, narrow enough that a phone's view on arrival
  // already holds the "Add your photo" frame (it hangs at the path end of the visitors' wall)
  const GAP = 1.8;
  function place(key, g, w) {
    if (key === 'square') { g.position.set(SQ.x + GAP + w / 2 * Math.cos(0.22), 0, SQ.z + 10 + w / 2 * Math.sin(0.22)); g.rotation.y = -0.22; }
    else {
      const s = SECT[key], th = -Math.PI / 2 + 0.42;
      g.position.set(SIDE - 2.6, 0, s.top - 20); g.rotation.y = th;
    }
  }
  function build(key) {
    const old = walls[key];
    if (old) { S.scene.remove(old.group); }
    const items = slots(key);
    const head = key === 'square'
      ? ['你的照片', 'VISITORS’ WALL', 'Photos left by people who were here', 'verm']
      : [NAMES[key][0], NAMES[key][1] + ' WALL', 'Photos of this district', 'verm'];
    const wall = buildWall(items, head);
    place(key, wall.group, items.length * STEP + 0.4);
    S.scene.add(wall.group);
    walls[key] = wall;
  }
  // the opening exhibition, the square's left half, mirrored
  const opening = buildWall(OPENING.length ? OPENING : [{ kind: 'empty' }], ['開幕展', 'OPENING EXHIBITION', 'Taipei, photographed · credits on each frame', 'lamp']);
  {
    const w = OPENING.length * STEP + 0.4;
    opening.group.position.set(SQ.x - GAP - w / 2 * Math.cos(0.22), 0, SQ.z + 10 + w / 2 * Math.sin(0.22));
    opening.group.rotation.y = 0.22;
    S.scene.add(opening.group);
  }
  ['square', 'red', 'dadao', 'tower'].forEach(build);

  let pending = {};
  const rebuild = section => { if (!walls[section] || pending[section]) return; pending[section] = true; requestAnimationFrame(() => { pending[section] = false; build(section); }); };
  window.addEventListener('memory:added', ev => { const m = ev.detail; if (m && MEM.photoURL(m)) rebuild(m.section); });

  // online, keep a small copy of the visitor's own photo so they can see it hang; it never leaves the browser
  window.addEventListener('memory:saved', async ev => {
    const d = ev.detail || {};
    if (d.how !== 'pending' || !d.file) return;
    try {
      const bmp = await createImageBitmap(d.file, { imageOrientation: 'from-image' });
      const k = Math.min(1, 640 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      const rec = Object.assign({}, d.rec, { id: 'mine-' + Date.now(), mine: true, created_at: new Date().toISOString(), photoData: cv.toDataURL('image/jpeg', 0.7) });
      mine.push(rec); saveMine(mine); rebuild(rec.section);
    } catch (e) { console.warn('[gallery] could not keep your photo here:', e.message); }
  });

  // ── showing the wall of the place you are in ────────────────────────────────
  function show() {
    const on = WALK.on, where = WALK.where;
    Object.keys(walls).forEach(k => { walls[k].group.visible = on && where === k; });
    opening.group.visible = on && where === 'square';
  }
  window.addEventListener('walk:section', show);

  // ── opening things ──────────────────────────────────────────────────────────
  const panelNote = () => document.querySelector('.mem-panel .mem-note');
  function activate(item) {
    if (!item) return;
    if (item.kind === 'add' || item.kind === 'empty') { MEM.openForm(); return; }
    if (item.landmark) {
      const s = item.landmark;
      MEM.openRead({ body: s.caption, year: null, section: WALK.where, name: 'photograph by ' + s.by + ', ' + s.holder + ', ' + s.licence, photoData: item.url });
      const pk = document.querySelector('.mem-panel .mem-k'); if (pk) pk.textContent = s.when + ' · ' + s.en + ' ' + s.zh;
      return;
    }
    MEM.openRead(item.m);
    const n = panelNote(); if (n && item.note) n.textContent = item.note;
  }

  // the bubble over the nearest frame
  const bubble = document.createElement('button'); bubble.type = 'button'; bubble.className = 'gal-bubble'; bubble.hidden = true;
  const bText = document.createElement('span'); bubble.appendChild(bText);
  const bKey = document.createElement('span'); bKey.className = 'gal-key'; bKey.textContent = 'E'; bubble.appendChild(bKey);
  document.body.appendChild(bubble);
  let nearest = null;
  bubble.addEventListener('click', () => activate(nearest && nearest.userData.item));
  const dialogOpen = () => !!document.querySelector('.mem-form:not([hidden]), .mem-panel:not([hidden])');
  window.addEventListener('keydown', ev => {
    const t = ev.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if ((ev.key === 'e' || ev.key === 'E') && WALK.on && nearest && !dialogOpen()) {
      ev.preventDefault(); ev.stopImmediatePropagation(); activate(nearest.userData.item);
    }
  }, true);

  // a click (not a drag) on a frame
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  R.canvas.addEventListener('pointerdown', ev => { down = { x: ev.clientX, y: ev.clientY, t: performance.now() }; });
  R.canvas.addEventListener('pointerup', ev => {
    if (!down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6 || performance.now() - down.t > 500) { down = null; return; }
    down = null;
    if (!WALK.on || dialogOpen()) return;
    ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, R.camera);
    const targets = [];
    Object.values(walls).concat([opening]).forEach(w => { if (w.group.visible) w.frames.forEach(f => targets.push(f)); });
    const hit = ray.intersectObjects(targets, true)[0];
    if (hit && hit.object.userData.item) activate(hit.object.userData.item);
  });

  // ── per frame: the nearest frame to her, and its bubble ─────────────────────
  const wp = new THREE.Vector3(), v = new THREE.Vector3();
  function tick() {
    show();
    let best = null, bestD = NEAR;
    if (WALK.on && !dialogOpen()) {
      const p = WALK.pos;
      Object.values(walls).concat([opening]).forEach(w => {
        if (!w.group.visible) return;
        w.frames.forEach(f => {
          f.getWorldPosition(wp);
          const d = Math.hypot(wp.x - p.x, wp.z - p.z);
          if (d < bestD) { bestD = d; best = f; }
        });
      });
    }
    nearest = best;
    if (best) {
      const it = best.userData.item;
      bText.textContent = it.kind === 'add' || it.kind === 'empty' ? '+ Add your photo' : 'See this photo';
      bubble.classList.toggle('add', it.kind === 'add' || it.kind === 'empty');
      best.getWorldPosition(v); v.y += FH / 2 + 0.25; v.project(R.camera);
      if (v.z < 1 && Math.abs(v.x) < 1.1) {
        bubble.hidden = false;
        bubble.style.transform = `translate(${((v.x + 1) / 2 * innerWidth).toFixed(0)}px, ${((1 - v.y) / 2 * innerHeight).toFixed(0)}px) translate(-50%, -100%)`;
      } else bubble.hidden = true;
    } else bubble.hidden = true;
    document.body.classList.toggle('gal-near', !!best);
    requestAnimationFrame(tick);
  }
  show();
  requestAnimationFrame(tick);

  window.__gallery = { walls, opening, get nearest() { return nearest && nearest.userData.item; }, activate, rebuild, mine: () => mine.slice() };
})();
