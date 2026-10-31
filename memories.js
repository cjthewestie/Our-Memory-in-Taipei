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

  const PLACE = { square: 'The Square · 廣場', red: 'Ximending · 西門町', dadao: 'Dadaocheng · 大稻埕', tower: 'Xinyi · 信義' };
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
  // Round paper lanterns, all drawn as three instanced meshes (paper, trim, glow) however many there are.
  // The paper is unlit and shaded in its vertex colours (bright at the belly, ribbed, darker at the ends),
  // so it reads as lit from inside in daylight. Each one sways from its cord; the nearest one brightens.
  const group = new THREE.Group(); scene.add(group);
  const LATHE_SEG = 48, RIBS = 12, HANG = 2.9, CORD = 1.37;   // CORD: from the lantern's middle up to where it hangs
  // the paper: a lathe through a rounded profile, ribs and a belly glow baked into vertex colours
  const bodyGeo = (() => {
    const pts = [], N = 22;
    for (let j = 0; j <= N; j++) {
      const a = -Math.PI / 2 + Math.PI * j / N, y = Math.sin(a) * 0.31;
      pts.push(new THREE.Vector2(Math.max(0.15, Math.cos(a) * 0.36), y));
    }
    const g = new THREE.LatheGeometry(pts, LATHE_SEG), pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    for (let k = 0; k < pos.count; k++) {
      const i = Math.floor(k / (N + 1)), y = pos.getY(k) / 0.31;
      const rib = (i % (LATHE_SEG / RIBS)) === 0 ? 0.8 : 1;
      const v = (0.62 + 0.38 * (1 - y * y)) * rib;
      col[k * 3] = v; col[k * 3 + 1] = v; col[k * 3 + 2] = v;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  })();
  // the trim: ink caps, the cord, a vermilion tassel, merged into one geometry with its colours baked in
  const trimGeo = (() => {
    const ink = C('ink'), red = C('verm'), parts = [];
    const put = (g, y, c) => { g = g.toNonIndexed(); g.translate(0, y, 0); parts.push([g, c]); };
    put(new THREE.CylinderGeometry(0.17, 0.2, 0.06, 20), 0.31, ink);
    put(new THREE.CylinderGeometry(0.2, 0.17, 0.06, 20), -0.31, ink);
    put(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), 0.84, ink);
    put(new THREE.SphereGeometry(0.045, 10, 8), -0.38, red);
    put(new THREE.CylinderGeometry(0.035, 0.06, 0.26, 10), -0.54, red);
    const n = parts.reduce((s, [g]) => s + g.attributes.position.count, 0);
    const P = new Float32Array(n * 3), Cc = new Float32Array(n * 3); let o = 0;
    parts.forEach(([g, c]) => { const a = g.attributes.position.array; P.set(a, o * 3);
      for (let k = 0; k < a.length / 3; k++) { Cc[(o + k) * 3] = c.r; Cc[(o + k) * 3 + 1] = c.g; Cc[(o + k) * 3 + 2] = c.b; }
      o += a.length / 3; });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
    return g;
  })();
  const glowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.25, 'rgba(255,255,255,0.6)'); r.addColorStop(0.55, 'rgba(255,255,255,0.2)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  })();
  const PAPER = { visitor: new THREE.Color('#ff7a1c'), seed: C('verm').clone().lerp(new THREE.Color('#ff9a5a'), 0.25), local: new THREE.Color('#ff9a32') };
  const GLOW = new THREE.Color('#ff9a3a');
  const paperMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false });   // lit from inside: no haze, no highlight roll-off
  const trimMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false, toneMapped: false });
  let cap = 0, paperIM = null, trimIM = null, glowIM = null;
  function grow(n) {                      // (re)make the instanced meshes when there are more lanterns than room
    if (n <= cap) return;
    cap = Math.max(32, cap * 2); while (cap < n) cap *= 2;
    [paperIM, trimIM, glowIM].forEach(m => { if (m) { group.remove(m); m.dispose(); } });
    paperIM = new THREE.InstancedMesh(bodyGeo, paperMat, cap);
    trimIM = new THREE.InstancedMesh(trimGeo, trimMat, cap);
    glowIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), glowMat, cap);
    paperIM.setColorAt(0, PAPER.visitor); glowIM.setColorAt(0, GLOW);   // makes instanceColor exist before the first draw
    glowIM.renderOrder = 2;
    [paperIM, trimIM, glowIM].forEach(m => { m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(m); });
  }

  const memories = [];   // { m: the record, kind, phase, born: when it was left (it rises into place), hot: 0..1 near her }
  function addLantern(m, rising) {
    if (memories.some(e => e.m.id === m.id)) return;
    const kind = m.seed ? 'seed' : m.local ? 'local' : 'visitor';
    memories.push({ m, kind, phase: (m.x * 3.1 + m.z * 1.7) % 6.28, born: rising ? performance.now() : -1e9, hot: 0 });
    grow(memories.length);
    window.dispatchEvent(new CustomEvent('memory:added', { detail: m }));   // gallery.js hangs the photo ones
  }

  // ── storage ─────────────────────────────────────────────────────────────────
  // only well-formed records: a stored value that is not a list (an old version, a hand edit) would stop the lanterns
  const okRec = m => m && typeof m === 'object' && PLACE[m.section] && isFinite(m.x) && isFinite(m.z) && typeof m.body === 'string';
  const loadLocal = () => { try { const l = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); return Array.isArray(l) ? l.filter(okRec) : []; } catch (_) { return []; } };
  const saveLocal = list => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); return true; } catch (_) { return false; } };
  const headers = extra => Object.assign({ apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey }, extra || {});
  // The photo bucket is private. A photo is shown only through a signed URL, and the storage rules sign one
  // only when the memory naming it is approved (supabase/schema.sql), so pending and rejected photos never show.
  const photoURL = m => m.photoData || m.photoSigned || null;
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));

  // fetch with a time limit: a store that never answers (a slow network, a paused project) fails plainly
  // after `ms` instead of leaving the form on "Hanging it…" for ever
  async function net(url, opts, ms) {
    const ctl = window.AbortController ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), ms || 20000);
    try { return await fetch(url, Object.assign({}, opts, ctl ? { signal: ctl.signal } : {})); }
    catch (e) { throw new Error(e && e.name === 'AbortError' ? 'timeout' : 'unreachable'); }
    finally { clearTimeout(timer); }
  }

  async function fetchApproved() {
    if (!ONLINE) return;
    try {
      const q = 'select=id,created_at,section,x,z,year,body,name,photo_path&status=eq.approved&order=created_at.desc&limit=500';
      const res = await net(`${API}/rest/v1/memories?${q}`, { headers: headers() });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const rows = await res.json();
      await signPhotos(rows);
      rows.forEach(m => addLantern(m));
    } catch (e) {
      console.warn('[memories] could not load the shared memories:', e.message);
      F.fine.textContent = 'Other visitors’ lanterns couldn’t be loaded just now, so saving may fail too. If it does, your words stay in the form to try again.';
    }
  }

  // one request signs every approved photo for 12 hours; a photo that fails to sign is simply left off its card
  async function signPhotos(rows) {
    const paths = rows.filter(r => r.photo_path).map(r => r.photo_path);
    if (!paths.length) return;
    try {
      const res = await net(`${API}/storage/v1/object/sign/${BUCKET}`, {
        method: 'POST', headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ expiresIn: 43200, paths }) });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const byPath = {};
      (await res.json()).forEach(s => { if (s && s.signedURL && !s.error) byPath[s.path] = `${API}/storage/v1${s.signedURL}`; });
      rows.forEach(r => { if (r.photo_path && byPath[r.photo_path]) r.photoSigned = byPath[r.photo_path]; });
    } catch (e) { console.warn('[memories] could not load the shared photos:', e.message); }
  }

  // a photo, made small: at most 1280 px on the long side, webp (jpeg where the browser cannot), under 1.9 MB
  async function shrink(file, maxSide) {
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (_) {
      src = await new Promise((ok, no) => {
        const i = new Image(), u = URL.createObjectURL(file);
        i.onload = () => { URL.revokeObjectURL(u); ok(i); };
        i.onerror = () => { URL.revokeObjectURL(u); no(new Error('This photo could not be read. Try a JPEG or PNG.')); };
        i.src = u;
      });
    }
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
      if (!saveLocal(list)) { delete rec.photoData; list[list.length - 1] = rec; if (!saveLocal(list)) throw new Error('This browser couldn’t save it. Private browsing may be blocking it.'); }
      addLantern(rec, true);
      return 'local';
    }
    let photo_path = null;
    if (file) {
      const p = await shrink(file, 1280);
      photo_path = uuid() + '.' + p.ext;
      const up = await net(`${API}/storage/v1/object/${BUCKET}/${photo_path}`, {
        method: 'POST', headers: headers({ 'Content-Type': p.type, 'x-upsert': 'false' }), body: p.blob }, 60000);
      if (!up.ok) { console.warn('[memories] photo upload failed:', up.status); throw new Error('Saving failed: your photo didn’t upload. Your words are still here; try again, or send it without the photo.'); }
    }
    const res = await net(`${API}/rest/v1/memories`, {
      method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ section: rec.section, x: rec.x, z: rec.z, year: rec.year, body: rec.body, name: rec.name, photo_path }) });
    if (!res.ok) { console.warn('[memories] save failed:', res.status); throw new Error('Saving failed. Your words are still here; please try again in a moment.'); }
    return 'pending';
  }

  // ── DOM: the bubble, the reading panel, the form ────────────────────────────
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };

  const bubble = el('button', 'mem-bubble', document.body);
  bubble.type = 'button'; bubble.hidden = true;
  bubble.innerHTML = '<span class="mem-b-k">Read this memory</span><span class="mem-b-key">E</span>';
  let nearest = null;
  bubble.addEventListener('click', () => { if (nearest) openRead(nearest.m); });

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
    closeForm();
    pK.textContent = (m.year ? m.year + ' · ' : '') + (PLACE[m.section] || '');
    pText.textContent = m.body;
    pBy.textContent = '— ' + (m.name && m.name.trim() ? m.name.trim() : 'someone who was there');
    pNote.textContent = m.local ? 'Saved in this browser only. Only you can see it.' : '';
    const u = photoURL(m);
    pFig.hidden = !u; if (u) pImg.src = u; else pImg.removeAttribute('src');
    panel.hidden = false; pClose.focus({ preventScroll: true });
  }
  function closeRead() { panel.hidden = true; }

  // the form
  const form = el('form', 'mem-form', document.body); form.hidden = true; form.noValidate = true;
  form.setAttribute('role', 'dialog'); form.setAttribute('aria-labelledby', 'memFormTitle');
  form.innerHTML =
    '<button type="button" class="mem-close" aria-label="Close">×</button>' +
    '<div class="mem-body">' +
      '<div class="mem-k" id="memFormWhere"></div>' +
      '<h2 class="mem-title" id="memFormTitle">Add your photo or a memory</h2>' +
      '<label class="mem-field mem-photo"><span>Your photo <em>(optional: yours, or one you may share)</em></span><input name="photo" type="file" accept="image/*"></label>' +
      '<label class="mem-field"><span>What happened here?</span>' +
        '<textarea name="body" rows="4" maxlength="' + MAX_TEXT + '" required placeholder="The ten dollars my mother gave me, the film we saw, the stall that isn’t there any more…"></textarea>' +
        '<span class="mem-count"><span id="memCount">0</span>/' + MAX_TEXT + '</span></label>' +
      '<div class="mem-row">' +
        '<label class="mem-field"><span>Year</span><input name="year" type="number" inputmode="numeric" min="1900" max="' + THIS_YEAR + '"></label>' +
        '<label class="mem-field"><span>Your name <em>(optional)</em></span><input name="name" type="text" maxlength="' + MAX_NAME + '" autocomplete="nickname"></label>' +
      '</div>' +
      '<label class="mem-hp" aria-hidden="true">Leave this empty <input name="website" type="text" tabindex="-1" autocomplete="off"></label>' +
      '<label class="mem-consent"><input name="ok" type="checkbox" required> <span>I’m happy for this to be shown publicly on this page. It doesn’t name anyone without their agreement or share anyone’s private details.</span></label>' +
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
    : 'Memories aren’t shared online yet, so your lantern is saved in this browser and only you will see it.';
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
    setTimeout(() => F.photo.focus(), 30);   // the photo field comes first (gallery.js)
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
    if (!F.ok.checked) return say('Please tick the box so your memory can be shown.');
    if (performance.now() - openedAt < 2500) return say('One moment…');
    if (Date.now() - lastSent < 30000) return say('Thank you, one lantern at a time. Try again in half a minute.');
    const file = F.photo.files && F.photo.files[0];
    if (file && !/^image\//.test(file.type)) return say('That file isn’t a photo.');
    if (file && file.size > 25e6) return say('That photo is too large. Please choose one under 25 MB.');
    F.send.disabled = true; say(file ? 'Resizing your photo…' : 'Hanging your lantern…');
    try {
      const rec = { section: spot.section, x: spot.x, z: spot.z, year, body, name: name || null };
      const how = await submit(rec, file);
      lastSent = Date.now();
      window.dispatchEvent(new CustomEvent('memory:saved', { detail: { rec, file, how } }));   // gallery.js
      F.body.value = ''; F.name.value = ''; F.year.value = ''; F.photo.value = ''; F.ok.checked = false; F.count.textContent = '0';
      say(how === 'local'
        ? 'Your lantern is hanging here, saved in this browser.'
        : 'Thank you. Your lantern will light up here once the makers have read it.', true);
      setTimeout(closeForm, 2600);
    } catch (e) {
      // a network failure is said plainly: nothing was saved, and the words are still in the form
      const m = e && e.message;
      say(m === 'unreachable' ? 'Saving failed: the page can’t reach the internet right now. Your words are still here; please try again in a moment.'
        : m === 'timeout' ? 'Saving failed: the connection is too slow and it timed out. Your words are still here; please try again.'
        : m || 'Saving failed. Your words are still here; please try again.');
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
    if (ev.key === 'Escape') { if (!form.hidden) closeForm(); else if (!panel.hidden) closeRead(); return; }
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if ((ev.key === 'e' || ev.key === 'E') && WALK.on && nearest && panel.hidden && form.hidden) { ev.preventDefault(); openRead(nearest.m); }
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
    const hit = paperIM && ray.intersectObjects([paperIM, trimIM], false)[0];
    if (hit && shown[hit.instanceId]) openRead(shown[hit.instanceId].m);
  });

  // ── per frame: show the lanterns of the place you are in, sway them, light the nearest ──
  const v = new THREE.Vector3(), M = new THREE.Matrix4(), Mg = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  const one = new THREE.Vector3(), piv = new THREE.Vector3(), col = new THREE.Color(), WARM = new THREE.Color('#fff4dc');
  const shown = [];   // instance index -> entry, for the raycast
  const ease = k => 1 - Math.pow(1 - k, 3);
  function tick(now) {
    const sec = WALK.section(), t = now / 1000;
    let best = null, bestD = NEAR;
    const p = WALK.on ? WALK.pos : null;
    // a photo memory hangs on the wall instead (gallery.js)
    const here = e => e.m.section === sec && !(window.__gallery && photoURL(e.m));
    if (p) memories.forEach(e => { if (!here(e)) return; const d = Math.hypot(e.m.x - p.x, e.m.z - p.z); if (d < bestD) { bestD = d; best = e; } });
    nearest = best;
    shown.length = 0;
    if (paperIM) {
      const camQ = R.camera.quaternion;
      memories.forEach(e => {
        if (!here(e)) return;
        const i = shown.length; shown.push(e);
        e.hot += ((e === best ? 1 : 0) - e.hot) * 0.12;
        // a new lantern rises from her hands to its place over 1.8 s, swinging a little as it settles
        const age = (now - e.born) / 1800, k = age < 1 ? ease(Math.max(0, age)) : 1;
        const rise = (1 - k) * -1.9, swingBoost = 1 + (1 - k) * 3, ph = e.phase;
        // a gentle pendulum about the point it hangs from, and a slow turn on its cord
        E.set(Math.sin(t * 0.9 + ph) * 0.05 * swingBoost, Math.sin(t * 0.35 + ph) * 0.5, Math.sin(t * 1.1 + ph * 1.3) * 0.06 * swingBoost, 'YXZ');
        Q.setFromEuler(E);
        piv.set(e.m.x, HANG + CORD + rise + Math.sin(t * 1.3 + ph) * 0.04, e.m.z);
        const s = (0.55 + 0.45 * k) * (1 + e.hot * 0.08);
        one.set(s, s, s);
        M.compose(piv, Q, one); Mg.makeTranslation(0, -CORD, 0); M.multiply(Mg);
        paperIM.setMatrixAt(i, M); trimIM.setMatrixAt(i, M);
        // the light inside: a slow breath, a faint flicker, brighter when she is near or it is new
        const flick = 0.94 + Math.sin(t * 2.1 + ph * 5) * 0.03 + Math.sin(t * 7.3 + ph * 11) * 0.015;
        col.copy(PAPER[e.kind]).lerp(WARM, e.hot * 0.2 + (1 - k) * 0.2).multiplyScalar(flick + e.hot * 0.06);
        paperIM.setColorAt(i, col);
        // the glow faces the camera, centred on the paper
        v.set(0, 0, 0).applyMatrix4(M);
        const gs = (2.7 + e.hot * 0.9 + (1 - k) * 1.0) * s;
        one.set(gs, gs, gs); Mg.compose(v, camQ, one);
        glowIM.setMatrixAt(i, Mg);
        col.copy(GLOW).multiplyScalar(0.85 + e.hot * 0.15 + (flick - 0.94) * 2);
        glowIM.setColorAt(i, col);
      });
      [paperIM, trimIM, glowIM].forEach(m => { m.count = shown.length; m.instanceMatrix.needsUpdate = true; });
      paperIM.instanceColor.needsUpdate = true; glowIM.instanceColor.needsUpdate = true;
    }
    if (best && panel.hidden && form.hidden) {
      v.set(best.m.x, HANG + 0.9, best.m.z); v.project(R.camera);
      if (v.z < 1) {
        bubble.hidden = false;
        bubble.style.transform = `translate(${((v.x + 1) / 2 * innerWidth).toFixed(0)}px, ${((1 - v.y) / 2 * innerHeight).toFixed(0)}px) translate(-50%, -100%)`;
      } else bubble.hidden = true;
    } else bubble.hidden = true;
    requestAnimationFrame(tick);
  }

  SEEDS.forEach(m => addLantern(m));
  loadLocal().forEach(m => { m.local = true; addLantern(m); });
  fetchApproved();
  requestAnimationFrame(tick);

  window.__memories = { get count() { return memories.length; }, ONLINE, openForm, openRead, photoURL, list: () => memories.map(e => e.m) };
})();
