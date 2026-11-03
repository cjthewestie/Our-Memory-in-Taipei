// memories.js — the visitors' memories: a paper lantern where each one happened, and a form to leave one.
//
// CJ, 2026-10-31: 「people can visit freely and upload their memory in taipei」; text + an optional photo,
// approved by CJ before anyone else sees it. A memory is pinned to the spot the girl is standing on
// (just in front of her) in the square or in one of the three sections, and hangs there as a lantern.
// Walk up to one and press E (or tap the bubble, or click the lantern) to read it.
//
// Storage: Supabase (memories-config.js, supabase/schema.sql, docs/MEMORIES.md). The page only ever
// reads approved memories and submits new ones as pending; approving happens in the Supabase
// dashboard. With no config the page still works: the makers' own memories show, and what a visitor
// leaves is kept in their browser only, and the form tells them so.
//
// Every string a visitor wrote reaches the page through textContent, never innerHTML.
(function () {
  'use strict';
  if (!window.THREE || !window.SCENE || !window.RIG || !window.WALK) return;
  const S = window.SCENE, R = window.RIG, WALK = window.WALK, scene = S.scene, C = S.C;
  const CFG = window.MEMORY_CONFIG || {};
  const ONLINE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const API = ONLINE ? CFG.supabaseUrl.replace(/\/+$/, '') : '';
  const BUCKET = CFG.bucket || 'memory-photos';
  const LOCAL_KEY = 'our-memory-in-taipei:memories';
  const MAX_TEXT = 280, MAX_NAME = 40, NEAR = 4.5;

  const PLACE = { square: '廣場 · The Square', red: '西門町 · Ximending', dadao: '大稻埕 · Dadaocheng', tower: '信義 · Xinyi' };
  const YEARS = { square: [1950, 2026], red: [1985, 1999], dadao: [2000, 2019], tower: [2020, 2027] };
  const THIS_YEAR = new Date().getFullYear();

  // the makers' own memories, from the README: the first lanterns on the street
  const SEEDS = [
    { id: 'seed-ten-dollars', section: 'red', x: -5.2, z: 18, year: 1990, seed: true, name: 'the makers of this page',
      body: 'The ten dollars our mothers gave us in Ximending when we were small.' },
    { id: 'seed-climb', section: 'tower', x: 4.5, z: -388, year: THIS_YEAR, seed: true, name: 'the makers of this page',
      body: 'The day we could finally build something of our own, we looked up at Taipei 101, and the man high on the tower was waving at us. Let’s climb higher, together.' },
  ];

  // ── the lanterns ────────────────────────────────────────────────────────────
  const group = new THREE.Group(); scene.add(group);
  // the lantern itself is square.js's Taiwanese 燈籠 (lathe body, ribs, gold caps, tassel, halo), with the
  // memory's year written on it; the makers' own are red, the visitors' a warmer orange
  const SQM = window.SQUARE;
  const BODY = { seed: '#d23a2a', visitor: '#e0582c', local: '#e8952f' };
  const SIZE = 0.9;
  const kindOf = m => m.seed ? 'seed' : m.local ? 'local' : 'visitor';
  function lantern(m, cord) {
    const text = m.year ? String(m.year) : '憶';
    let o;
    if (SQM) o = SQM.makeLantern({ text, body: BODY[kindOf(m)], size: SIZE, cord: cord || 0 });
    else { o = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(BODY[kindOf(m)]) })); o.userData.phase = 0; }
    o.userData.memory = m; o.userData.phase = (m.x * 3.1 + m.z * 1.7) % 6.28;
    o.traverse(c => { c.userData.memory = m; });
    group.add(o);
    return o;
  }

  // on the street: each memory floats where it was left. A memory left in the square has no street
  // lantern: the square shows its memories in the banyan instead (below).
  const memories = [];   // { m, obj }  (obj null for the square's own)
  function addLantern(m) {
    if (memories.some(e => e.m.id === m.id)) return;
    let obj = null;
    if (m.section !== 'square') { obj = lantern(m, 0); obj.position.set(m.x, 2.9, m.z); }
    memories.push({ m, obj });
    rebuildTree();
  }
  // in the square: the newest memories, pinned to the notice board (square.js), and listed in full when
  // you walk up to it and press E
  const BOARD = SQM && SQM.board;
  const newest = () => memories.map(e => e.m).slice().sort((a, b) => (b.created_at ? Date.parse(b.created_at) : 0) - (a.created_at ? Date.parse(a.created_at) : 0));
  function rebuildTree() { if (BOARD) BOARD.setNotes(newest().slice(0, 8)); if (!list.hidden) fillList(); }

  // ── storage ─────────────────────────────────────────────────────────────────
  const loadLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch (_) { return []; } };
  const saveLocal = list => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); return true; } catch (_) { return false; } };
  const headers = extra => Object.assign({ apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey }, extra || {});
  const photoURL = m => m.photoData ? m.photoData : (m.photo_path && ONLINE ? `${API}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(m.photo_path)}` : null);
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));

  async function fetchApproved() {
    if (!ONLINE) return;
    try {
      const q = 'select=id,created_at,section,x,z,year,body,name,photo_path&status=eq.approved&order=created_at.desc&limit=500';
      const res = await fetch(`${API}/rest/v1/memories?${q}`, { headers: headers() });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      (await res.json()).forEach(addLantern);
    } catch (e) { console.warn('[memories] could not load the shared memories:', e.message); }
  }

  // a photo, made small: at most 1280 px on the long side, webp (jpeg where the browser cannot), under 1.9 MB
  async function shrink(file, maxSide) {
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (_) { src = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); }); }
    const k = Math.min(1, maxSide / Math.max(src.width, src.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(src.width * k); cv.height = Math.round(src.height * k);
    cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
    const toBlob = (type, q) => new Promise(ok => cv.toBlob(ok, type, q));
    let type = 'image/webp', q = 0.82, blob = await toBlob(type, q);
    if (!blob || blob.type !== 'image/webp') { type = 'image/jpeg'; blob = await toBlob(type, q); }
    while (blob && blob.size > 1.9e6 && q > 0.4) { q -= 0.12; blob = await toBlob(type, q); }
    if (!blob) throw new Error('This photo could not be read.');
    return { blob, type, ext: type === 'image/webp' ? 'webp' : 'jpg', canvas: cv };
  }

  async function submit(rec, file) {
    if (!ONLINE) {
      if (file) { const p = await shrink(file, 640); rec.photoData = p.canvas.toDataURL(p.type, 0.7); }
      rec.id = 'local-' + uuid(); rec.local = true; rec.created_at = new Date().toISOString();
      const list = loadLocal(); list.push(rec);
      if (!saveLocal(list)) { delete rec.photoData; list[list.length - 1] = rec; if (!saveLocal(list)) throw new Error('This browser would not save it (private mode?).'); }
      addLantern(rec);
      return 'local';
    }
    let photo_path = null;
    if (file) {
      const p = await shrink(file, 1280);
      photo_path = uuid() + '.' + p.ext;
      const up = await fetch(`${API}/storage/v1/object/${BUCKET}/${photo_path}`, {
        method: 'POST', headers: headers({ 'Content-Type': p.type, 'x-upsert': 'false' }), body: p.blob });
      if (!up.ok) throw new Error('The photo did not upload (' + up.status + ').');
    }
    const res = await fetch(`${API}/rest/v1/memories`, {
      method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ section: rec.section, x: rec.x, z: rec.z, year: rec.year, body: rec.body, name: rec.name, photo_path }) });
    if (!res.ok) throw new Error('It did not save (' + res.status + '). Please try again in a moment.');
    return 'pending';
  }

  // ── DOM: the bubble, the reading panel, the form ────────────────────────────
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };

  const bubble = el('button', 'mem-bubble', document.body);
  bubble.type = 'button'; bubble.hidden = true;
  bubble.innerHTML = '<span class="mem-b-k">A memory</span><span class="mem-b-key">E</span>';
  let nearest = null;
  let nearBoard = false;
  bubble.addEventListener('click', () => { if (nearBoard) openList(); else if (nearest) openRead(nearest.m); });

  const panel = el('aside', 'mem-panel', document.body); panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'memReadBody');
  const pClose = el('button', 'mem-close', panel, '×'); pClose.type = 'button'; pClose.setAttribute('aria-label', 'Close');
  const pFig = el('div', 'mem-fig', panel); const pImg = el('img', '', pFig); pImg.alt = ''; pImg.decoding = 'async';
  const pBody = el('div', 'mem-body', panel);
  const pK = el('div', 'mem-k', pBody);
  const pText = el('p', 'mem-text', pBody); pText.id = 'memReadBody';
  const pBy = el('div', 'mem-by', pBody);
  const pNote = el('div', 'mem-note', pBody);
  pClose.addEventListener('click', closeRead);
  function openRead(m) {
    closeForm(); list.hidden = true;
    pK.textContent = (m.year ? m.year + ' · ' : '') + (PLACE[m.section] || '');
    pText.textContent = m.body;
    pBy.textContent = '— ' + (m.name && m.name.trim() ? m.name.trim() : 'someone who was there');
    pNote.textContent = m.local ? 'Kept in this browser only.' : '';
    const u = photoURL(m);
    pFig.hidden = !u; if (u) pImg.src = u; else pImg.removeAttribute('src');
    panel.hidden = false; pClose.focus({ preventScroll: true });
  }
  function closeRead() { panel.hidden = true; }

  // the list: every memory, newest first, opened from the board in the square
  const list = el('aside', 'mem-panel mem-list', document.body); list.hidden = true;
  list.setAttribute('role', 'dialog'); list.setAttribute('aria-labelledby', 'memListTitle');
  const lClose = el('button', 'mem-close', list, '×'); lClose.type = 'button'; lClose.setAttribute('aria-label', 'Close');
  const lBody = el('div', 'mem-body', list);
  el('div', 'mem-k', lBody, '記憶公布欄 · The memory board');
  const lTitle = el('h2', 'mem-title', lBody, 'Everyone’s memories'); lTitle.id = 'memListTitle';
  const lItems = el('ol', 'mem-items', lBody);
  lClose.addEventListener('click', () => { list.hidden = true; });
  function fillList() {
    lItems.textContent = '';
    newest().forEach(m => {
      const li = el('li', '', lItems), b = el('button', 'mem-item', li); b.type = 'button';
      el('span', 'mem-item-k', b, (m.year ? m.year + ' · ' : '') + (PLACE[m.section] || ''));
      el('span', 'mem-item-t', b, m.body);
      if (m.name) el('span', 'mem-item-by', b, '— ' + m.name);
      b.addEventListener('click', () => { list.hidden = true; openRead(m); });
    });
  }
  function openList() { closeForm(); closeRead(); fillList(); list.hidden = false; lClose.focus({ preventScroll: true }); }

  // the form
  const form = el('form', 'mem-form', document.body); form.hidden = true; form.noValidate = true;
  form.setAttribute('role', 'dialog'); form.setAttribute('aria-labelledby', 'memFormTitle');
  form.innerHTML =
    '<button type="button" class="mem-close" aria-label="Close">×</button>' +
    '<div class="mem-body">' +
      '<div class="mem-k" id="memFormWhere"></div>' +
      '<h2 class="mem-title" id="memFormTitle">Leave a memory here</h2>' +
      '<label class="mem-field"><span>What happened here?</span>' +
        '<textarea name="body" rows="4" maxlength="' + MAX_TEXT + '" required placeholder="The ten dollars my mother gave me, the film we saw, the stall that isn’t there any more…"></textarea>' +
        '<span class="mem-count"><span id="memCount">0</span>/' + MAX_TEXT + '</span></label>' +
      '<div class="mem-row">' +
        '<label class="mem-field"><span>Year</span><input name="year" type="number" inputmode="numeric" min="1900" max="' + THIS_YEAR + '"></label>' +
        '<label class="mem-field"><span>Your name <em>(optional)</em></span><input name="name" type="text" maxlength="' + MAX_NAME + '" autocomplete="nickname"></label>' +
      '</div>' +
      '<label class="mem-field"><span>A photo <em>(optional, one you took or may share)</em></span><input name="photo" type="file" accept="image/*"></label>' +
      '<label class="mem-hp" aria-hidden="true">Leave this empty <input name="website" type="text" tabindex="-1" autocomplete="off"></label>' +
      '<label class="mem-consent"><input name="ok" type="checkbox" required> <span>I’m happy for this to be shown publicly on this page. It names no one who hasn’t agreed and shares nobody’s private details.</span></label>' +
      '<p class="mem-status" role="status" aria-live="polite"></p>' +
      '<div class="mem-actions"><button type="submit" class="wk-btn primary">Hang my lantern</button></div>' +
      '<p class="mem-fine"></p>' +
    '</div>';
  const F = {
    close: form.querySelector('.mem-close'), where: form.querySelector('#memFormWhere'), body: form.elements.body, year: form.elements.year,
    name: form.elements.name, photo: form.elements.photo, hp: form.elements.website, ok: form.elements.ok,
    status: form.querySelector('.mem-status'), send: form.querySelector('button[type=submit]'), count: form.querySelector('#memCount'), fine: form.querySelector('.mem-fine'),
  };
  F.fine.textContent = ONLINE
    ? 'Every memory is read by the makers before it appears, usually within a few days.'
    : 'This copy of the page isn’t connected to a shared store yet, so your lantern is kept in this browser and only you will see it.';
  F.body.addEventListener('input', () => { F.count.textContent = F.body.value.length; });
  F.close.addEventListener('click', closeForm);
  let spot = null, openedAt = 0, lastSent = 0;
  function openForm() {
    if (!WALK.on) return;
    closeRead();
    const p = WALK.pos, where = WALK.where;
    // just in front of her, so the lantern hangs where she is looking
    let x = p.x - Math.sin(p.h) * 1.6, z = p.z - Math.cos(p.h) * 1.6;
    if (where !== 'square') x = Math.max(-8.4, Math.min(8.4, x));
    spot = { section: where, x: +x.toFixed(2), z: +z.toFixed(2) };
    const yr = YEARS[where];
    F.where.textContent = PLACE[where];
    F.year.min = 1900; F.year.placeholder = yr[0] + '–' + Math.min(yr[1], THIS_YEAR);
    F.status.textContent = ''; F.status.classList.remove('ok'); F.send.disabled = false;
    form.hidden = false; openedAt = performance.now();
    setTimeout(() => F.body.focus(), 30);
  }
  function closeForm() { form.hidden = true; }
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const body = F.body.value.trim(), name = F.name.value.trim(), yearS = F.year.value.trim();
    const year = yearS ? parseInt(yearS, 10) : null;
    const say = (t, ok) => { F.status.textContent = t; F.status.classList.toggle('ok', !!ok); };
    if (F.hp.value) return say('Thank you.');                                  // a bot filled the hidden field
    if (!body) return say('Write a line or two first.');
    if (body.length > MAX_TEXT) return say('Keep it under ' + MAX_TEXT + ' characters.');
    if (year !== null && (isNaN(year) || year < 1900 || year > THIS_YEAR)) return say('The year should be between 1900 and ' + THIS_YEAR + '.');
    if (!F.ok.checked) return say('Please tick the box to say it can be shown.');
    if (performance.now() - openedAt < 2500) return say('One moment…');
    if (Date.now() - lastSent < 30000) return say('Thank you, one lantern at a time. Try again in half a minute.');
    const file = F.photo.files && F.photo.files[0];
    if (file && !/^image\//.test(file.type)) return say('That file is not a photo.');
    if (file && file.size > 25e6) return say('That photo is too large.');
    F.send.disabled = true; say(file ? 'Making the photo small…' : 'Hanging it…');
    try {
      const how = await submit({ section: spot.section, x: spot.x, z: spot.z, year, body, name: name || null }, file);
      lastSent = Date.now();
      F.body.value = ''; F.name.value = ''; F.year.value = ''; F.photo.value = ''; F.ok.checked = false; F.count.textContent = '0';
      say(how === 'local'
        ? 'Your lantern is hanging here, kept in this browser.'
        : 'Thank you. Your lantern will light up here once it has been read.', true);
      setTimeout(closeForm, 2600);
    } catch (e) {
      say(e.message || 'Something went wrong. Please try again.');
    } finally { F.send.disabled = false; }
  });

  // the button in the walk bar
  const leave = el('button', 'wk-btn primary', null, '+ Leave a memory');
  leave.type = 'button'; leave.id = 'wkLeave';
  if (WALK.bar) WALK.bar.insertBefore(leave, WALK.bar.firstChild);
  leave.addEventListener('click', openForm);

  // keys: E reads the nearest, Escape closes
  window.addEventListener('keydown', ev => {
    const t = ev.target;
    if (ev.key === 'Escape') { if (!form.hidden) closeForm(); else if (!panel.hidden) closeRead(); else if (!list.hidden) list.hidden = true; return; }
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if ((ev.key === 'e' || ev.key === 'E') && WALK.on && panel.hidden && form.hidden && list.hidden) {
      if (nearBoard) { ev.preventDefault(); openList(); } else if (nearest) { ev.preventDefault(); openRead(nearest.m); }
    }
  });

  // a click (not a drag) on a lantern opens it, in either mode
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  R.canvas.addEventListener('pointerdown', ev => { down = { x: ev.clientX, y: ev.clientY, t: performance.now() }; });
  R.canvas.addEventListener('pointerup', ev => {
    if (!down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6 || performance.now() - down.t > 500) { down = null; return; }
    down = null;
    ndc.set(ev.clientX / innerWidth * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, R.camera);
    const targets = memories.filter(e => e.obj && e.obj.visible).map(e => e.obj);
    if (BOARD && BOARD.mesh && WALK.section() === 'square') targets.push(BOARD.mesh);
    const hit = ray.intersectObjects(targets, true)[0];
    if (hit && BOARD && hit.object === BOARD.mesh) { openList(); return; }
    if (hit && hit.object.userData.memory) openRead(hit.object.userData.memory);
  });

  // ── per frame: show the lanterns of the place you are in, bob them, find the nearest ──
  const v = new THREE.Vector3();
  function tick(now) {
    const sec = WALK.section(), t = now / 1000, inSquare = sec === 'square';
    let best = null, bestD = NEAR;
    const p = WALK.on ? WALK.pos : null;
    const near = e => { if (!p) return; const d = Math.hypot(e.obj.position.x - p.x, e.obj.position.z - p.z); if (d < bestD) { bestD = d; best = e; } };
    memories.forEach(e => {
      if (!e.obj) return;
      const on = !inSquare && e.m.section === sec;
      e.obj.visible = on;
      if (!on) return;
      e.obj.position.y = 2.9 + Math.sin(t * 1.3 + e.obj.userData.phase) * 0.12;
      e.obj.rotation.y = Math.sin(t * 0.7 + e.obj.userData.phase) * 0.25;
      near(e);
    });
    // the board: near enough, and it is the thing to read
    let board = false;
    if (inSquare && BOARD && p && Math.hypot(BOARD.x - p.x, BOARD.z - p.z) < BOARD.r && !best) board = true;
    nearBoard = board;
    nearest = best;
    bubble.firstChild.textContent = nearBoard ? '記憶公布欄 · Read' : 'A memory';
    if ((best || nearBoard) && panel.hidden && form.hidden && list.hidden) {
      if (nearBoard) v.set(BOARD.x, 3.4, BOARD.z); else { v.copy(best.obj.position); v.y += 0.9; }
      v.project(R.camera);
      if (v.z < 1) {
        bubble.hidden = false;
        bubble.style.transform = `translate(${((v.x + 1) / 2 * innerWidth).toFixed(0)}px, ${((1 - v.y) / 2 * innerHeight).toFixed(0)}px) translate(-50%, -100%)`;
      } else bubble.hidden = true;
    } else bubble.hidden = true;
    requestAnimationFrame(tick);
  }

  SEEDS.forEach(addLantern);
  loadLocal().forEach(m => { m.local = true; addLantern(m); });
  fetchApproved();
  requestAnimationFrame(tick);

  window.__memories = { get count() { return memories.length; }, get nearBoard() { return nearBoard; }, openList, ONLINE, openForm, openRead, list: () => memories.map(e => e.m) };
})();
