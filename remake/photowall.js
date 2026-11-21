// photowall.js — the photo walls of the remade scenes: look at the photos, add your own, share one.
//
// CJ, 2026-11-21: 「跟讓大家上傳回憶的機制」, 「我還要想用什麼方式讓大家看得到照片或分享照片」.
//
// ── How a scene page uses it (the whole integration) ─────────────────────────────────────────
//   In <head>/<body>, before the page's own script:
//     <script src="../memories-config.js"></script>      <!-- the same config the live site uses -->
//     <script src="photowall.js"></script>
//   Inside ENGINE.create({ build(E, models) { ... } }), after the wall itself is built:
//     PHOTOWALL.attach({ THREE: E.T, scene: E.scene, camera: E.camera, canvas: E.canvas, keys: E.keys,
//       section: 'square', place: 'The Square · 廣場',
//       frames: PHOTOWALL.row({ center: [7.4, 1.8, 8.6], facing: 0.34, count: 3, gap: 2.6, size: [2.0, 1.7], out: 0.32 }) });
//   (and delete the page's own painted placeholder faces for those frames, or they sit behind these.)
//
// ── attach(options) ──────────────────────────────────────────────────────────────────────────
//   THREE, scene, camera, canvas   the page's live objects (required)
//   frames   [{ position: [x, y, z], size: [w, h], facing, add, photo, parent }]
//              position  the middle of the picture, in metres (world, or local to `parent`)
//              facing    which way it looks: an angle about Y in radians (0 looks toward +Z), or a normal [nx, ny, nz]
//              add       true marks the frame that says "+ Add your photo" (default: the first frame without `photo`)
//              photo     { id, url, caption, year, place, credit }: a fixed, curated picture (the opening exhibition)
//              parent    an Object3D to hang it on instead of the scene
//   section  'square' | 'red' | 'dadao' | 'tower'  (the live site's four places; default 'square')
//   place    the place name shown under a photo (default: the section's name)
//   spot     [x, z] stored with a new photo (default: the first frame's position)
//   keys     the engine's key map (E.keys), cleared when a dialog opens so she does not keep walking
//   buttons  false hides the two on-screen buttons ("Photos", "+ Add your photo")
//   returns  { ONLINE, ready (a promise), list(), open(key), openForm(), add({ file, body, year, name }), refresh(), frames }
//
// ── Storage: the same contract as the live site (memories.js, supabase/schema.sql, docs/MEMORIES.md) ──
//   Keys present in memories-config.js: the resized photo goes to the PRIVATE bucket and a row is
//     inserted as 'pending'; the page reads only approved rows, each photo through a signed URL. The
//     visitor also keeps their own copy in this browser so they can see it hang while it waits.
//   No keys: nothing is sent anywhere. The photo is kept in this browser (IndexedDB) and the form, the
//     large view and the confirmation all say "only you can see this until the site's storage is connected".
//   There are no keys in this file. Every request goes through net(), and net() refuses to run without keys.
//   Every string a visitor wrote reaches the page through textContent or a canvas, never innerHTML.
//
// ── Sharing ──────────────────────────────────────────────────────────────────────────────────
//   Each photo has a key. "?photo=<key>" on the page's address opens that photo's large view on load.
//   Shared photo: the key is its file's UUID, known the moment it is uploaded, so the link can be
//   copied straight away and starts working for everyone once the photo is approved.
//   Browser-only photo: the key is 'local-…' and the link opens it in this browser only; the view says so.
(function () {
  'use strict';
  const CFG = window.MEMORY_CONFIG || {};
  const ONLINE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);          // the keys-present check: everything networked hangs on this
  const API = ONLINE ? String(CFG.supabaseUrl).replace(/\/+$/, '') : '';
  const BUCKET = CFG.bucket || 'memory-photos';
  const DB_NAME = 'our-memory-in-taipei-photowall', STORE = 'photos';
  const MAX_SIDE = 1600, MAX_BYTES = 1.9e6, MAX_TEXT = 140, MAX_NAME = 40;
  const PLACE = { square: 'The Square · 廣場', red: 'Ximending · 西門町', dadao: 'Dadaocheng · 大稻埕', tower: 'Xinyi · 信義' };
  const THIS_YEAR = new Date().getFullYear();
  const FONT = '"PingFang TC","Heiti TC","Noto Sans TC",system-ui,sans-serif';
  const KEY_RE = /^[0-9a-f-]{36}$/;
  const ONLY_YOU = 'Only you can see this until the site’s storage is connected.';

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));

  // ── this browser's own store (IndexedDB): the photo itself is kept as a Blob ────────────────
  const idb = () => new Promise((ok, no) => {
    let r; try { r = indexedDB.open(DB_NAME, 1); } catch (e) { return no(e); }
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); };
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error || new Error('indexedDB'));
  });
  const idbRun = (mode, fn) => idb().then(db => new Promise((ok, no) => {
    const tx = db.transaction(STORE, mode), q = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); ok(q && q.result); }; tx.onerror = tx.onabort = () => { db.close(); no(tx.error || new Error('indexedDB')); };
  }));
  const idbAll = () => idbRun('readonly', s => s.getAll()).then(l => (Array.isArray(l) ? l : []), () => []);
  const idbPut = rec => idbRun('readwrite', s => s.put(rec));
  const idbDel = id => idbRun('readwrite', s => s.delete(id));

  // ── the network: one door, shut without keys ────────────────────────────────────────────────
  const headers = extra => Object.assign({ apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey }, extra || {});
  async function net(url, opts, ms) {
    if (!ONLINE) throw new Error('offline');                          // no keys configured: nothing leaves the browser
    const ctl = window.AbortController ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), ms || 20000);
    try { return await fetch(url, Object.assign({}, opts, ctl ? { signal: ctl.signal } : {})); }
    catch (e) { throw new Error(e && e.name === 'AbortError' ? 'timeout' : 'unreachable'); }
    finally { clearTimeout(timer); }
  }
  // approved photo memories of one place (or the one a share link names), each with a 12-hour signed URL
  async function fetchApproved(section, key) {
    if (!ONLINE) return [];
    const where = key ? 'photo_path=in.(' + key + '.jpg,' + key + '.webp)' : 'section=eq.' + section + '&photo_path=not.is.null';
    const res = await net(API + '/rest/v1/memories?select=id,created_at,section,x,z,year,body,name,photo_path&status=eq.approved&' + where + '&order=created_at.desc&limit=200', { headers: headers() });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const rows = (await res.json()).filter(r => r && r.photo_path);
    if (!rows.length) return rows;
    const sres = await net(API + '/storage/v1/object/sign/' + BUCKET, { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn: 43200, paths: rows.map(r => r.photo_path) }) });
    if (!sres.ok) throw new Error(sres.status + ' ' + sres.statusText);
    const byPath = {};
    (await sres.json()).forEach(s => { if (s && s.signedURL && !s.error) byPath[s.path] = API + '/storage/v1' + s.signedURL; });
    return rows.filter(r => byPath[r.photo_path]).map(r => Object.assign(r, { photoSigned: byPath[r.photo_path] }));
  }
  async function upload(rec, blob) {
    if (!ONLINE) throw new Error('offline');
    const up = await net(API + '/storage/v1/object/' + BUCKET + '/' + rec.photo_path, { method: 'POST', headers: headers({ 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }), body: blob }, 60000);
    if (!up.ok) throw new Error('Saving failed: your photo didn’t upload. Nothing was lost; please try again.');
    const res = await net(API + '/rest/v1/memories', { method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ section: rec.section, x: rec.x, z: rec.z, year: rec.year, body: rec.body, name: rec.name, photo_path: rec.photo_path }) });
    if (!res.ok) throw new Error('Saving failed. Nothing was lost; please try again in a moment.');
  }

  // ── a photo made small in the browser, before it goes anywhere: long side 1600 px, JPEG ─────
  async function shrink(file) {
    let src;
    try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (_) {
      src = await new Promise((ok, no) => { const i = new Image(), u = URL.createObjectURL(file);
        i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => { URL.revokeObjectURL(u); no(new Error('This photo could not be read. Try a JPEG or PNG.')); }; i.src = u; });
    }
    const k = Math.min(1, MAX_SIDE / Math.max(src.width, src.height));
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(src.width * k)); cv.height = Math.max(1, Math.round(src.height * k));
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(src, 0, 0, cv.width, cv.height);
    const toBlob = q => new Promise(ok => cv.toBlob(ok, 'image/jpeg', q));
    let q = 0.86, blob = await toBlob(q);
    while (blob && blob.size > MAX_BYTES && q > 0.4) { q -= 0.12; blob = await toBlob(q); }   // the bucket takes 2 MB at most
    if (!blob) throw new Error('This photo could not be read.');
    return { blob, width: cv.width, height: cv.height };
  }

  // ── styles (all of them; the module is one file) ────────────────────────────────────────────
  const CSS = `
  .pw-bar { position: fixed; right: 16px; bottom: 16px; display: flex; gap: 8px; z-index: 30; font: 600 14px/1 ${FONT}; }
  .pw-btn { font: inherit; color: #f6ead8; background: rgba(20,16,14,.66); border: 1px solid rgba(246,234,216,.28); border-radius: 999px; padding: 11px 16px; cursor: pointer; backdrop-filter: blur(6px); }
  .pw-btn:hover { background: rgba(20,16,14,.82); }
  .pw-btn.pw-primary { background: #b7372a; border-color: #b7372a; color: #fff6e6; }
  .pw-btn.pw-primary:hover { background: #c9453a; }
  .pw-btn:focus-visible, .pw-x:focus-visible, .pw-nav:focus-visible { outline: 2px solid #ffd9a0; outline-offset: 2px; }
  .pw-btn[disabled] { opacity: .55; cursor: default; }
  .pw-back { position: fixed; inset: 0; z-index: 40; background: rgba(14,10,8,.72); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 16px; }
  .pw-back[hidden], .pw-card [hidden], .pw-bar[hidden] { display: none !important; }
  .pw-card { position: relative; background: #f4ecdb; color: #2a2420; border-radius: 14px; box-shadow: 0 24px 80px rgba(0,0,0,.55); font: 400 15px/1.5 ${FONT}; max-height: calc(100vh - 32px); overflow: auto; }
  .pw-view { width: min(920px, 100%); display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(240px, 1fr); }
  .pw-fig { background: #1b1512; border-radius: 14px 0 0 14px; display: flex; align-items: center; justify-content: center; min-height: 280px; position: relative; }
  .pw-fig img { max-width: 100%; max-height: calc(100vh - 32px); display: block; object-fit: contain; }
  .pw-side { padding: 44px 22px 20px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .pw-k { font: 700 12px/1.3 ${FONT}; letter-spacing: .08em; text-transform: uppercase; color: #b7372a; }
  .pw-cap { font: 600 19px/1.4 ${FONT}; margin: 0; overflow-wrap: anywhere; }
  .pw-by { color: #6b5d50; font-size: 14px; }
  .pw-note { background: #fff6e0; border: 1px solid #e3cfa0; border-radius: 8px; padding: 8px 10px; font-size: 13px; color: #5a4420; }
  .pw-share { margin-top: auto; display: flex; flex-direction: column; gap: 6px; }
  .pw-share label { font: 700 12px/1.3 ${FONT}; letter-spacing: .06em; text-transform: uppercase; color: #6b5d50; }
  .pw-share input { width: 100%; box-sizing: border-box; font: 13px ui-monospace, Menlo, monospace; padding: 8px; border: 1px solid #cdbfa5; border-radius: 8px; background: #fffaf0; color: #2a2420; }
  .pw-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .pw-card .pw-btn { background: #2a2420; border-color: #2a2420; color: #f6ead8; backdrop-filter: none; padding: 9px 14px; font: 600 13px/1 ${FONT}; }
  .pw-card .pw-btn.pw-primary { background: #b7372a; border-color: #b7372a; }
  .pw-card .pw-btn.pw-quiet { background: transparent; color: #6b5d50; border-color: #cdbfa5; }
  .pw-x { position: absolute; right: 10px; top: 8px; width: 34px; height: 34px; border: 0; border-radius: 50%; background: rgba(42,36,32,.08); color: #2a2420; font: 400 22px/1 system-ui; cursor: pointer; z-index: 2; }
  .pw-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; border: 0; border-radius: 50%; background: rgba(244,236,219,.85); color: #2a2420; font: 400 20px/1 system-ui; cursor: pointer; }
  .pw-prev { left: 10px; } .pw-next { right: 10px; }
  .pw-form { width: min(520px, 100%); padding: 22px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; }
  .pw-form h2 { font: 700 21px/1.3 ${FONT}; margin: 0 28px 0 0; }
  .pw-field { display: flex; flex-direction: column; gap: 5px; font: 600 13px/1.3 ${FONT}; }
  .pw-field em { font-weight: 400; font-style: normal; color: #6b5d50; }
  .pw-field input[type=text], .pw-field textarea, .pw-field select { font: 400 15px/1.4 ${FONT}; padding: 9px; border: 1px solid #cdbfa5; border-radius: 8px; background: #fffaf0; color: #2a2420; width: 100%; box-sizing: border-box; }
  .pw-field [aria-invalid=true] { border-color: #b7372a; box-shadow: 0 0 0 2px rgba(183,55,42,.2); }
  .pw-two { display: grid; grid-template-columns: 1fr 1.4fr; gap: 12px; }
  .pw-prev-img { max-width: 100%; max-height: 180px; border-radius: 8px; align-self: flex-start; }
  .pw-consent { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; }
  .pw-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
  .pw-status { min-height: 1.4em; margin: 0; font-size: 14px; color: #b7372a; }
  .pw-status.ok { color: #2f6b3c; }
  .pw-where { font-size: 13px; padding: 8px 10px; border-radius: 8px; margin: 0; }
  .pw-where.local { background: #fff6e0; border: 1px solid #e3cfa0; color: #5a4420; }
  .pw-where.shared { background: #e8f1e6; border: 1px solid #b9d0b4; color: #284a2c; }
  @media (max-width: 720px) {
    .pw-view { grid-template-columns: 1fr; } .pw-fig { border-radius: 14px 14px 0 0; min-height: 200px; } .pw-fig img { max-height: 52vh; }
    .pw-side { padding: 16px 16px 18px; } .pw-bar { right: 10px; bottom: 58px; font-size: 13px; } .pw-two { grid-template-columns: 1fr; }
  }`;
  let styled = false;
  const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };

  // a straight row of frames along a wall: the usual case, so a page does not do the trigonometry
  function row(o) {
    const n = o.count || 3, gap = o.gap || 2.6, th = o.facing || 0, out = o.out || 0, c = o.center, frames = [];
    for (let i = 0; i < n; i++) {
      const fx = (i - (n - 1) / 2) * gap;                                   // along the wall, then `out` metres off its face
      frames.push({ position: [c[0] + fx * Math.cos(th) + out * Math.sin(th), c[1], c[2] - fx * Math.sin(th) + out * Math.cos(th)], size: o.size || [2.0, 1.7], facing: th, add: i === (o.addAt || 0) });
    }
    return frames;
  }

  function attach(o) {
    const T = o.THREE || window.THREE, scene = o.scene, camera = o.camera, canvas = o.canvas;
    if (!T || !scene || !camera || !canvas || !Array.isArray(o.frames) || !o.frames.length) throw new Error('PHOTOWALL.attach needs THREE, scene, camera, canvas and frames');
    style();
    const section = PLACE[o.section] ? o.section : 'square', placeName = o.place || PLACE[section];
    const first = o.frames[0].position, spot = o.spot || [first[0], first[2]];
    const clampN = (v, a, b) => Math.max(a, Math.min(b, +(+v).toFixed(2)));

    // ── the frames: one plane each, its face painted on a canvas ──────────────────────────────
    const frames = o.frames.map((f, i) => {
      const w = (f.size && f.size[0]) || 2.0, h = (f.size && f.size[1]) || 1.7;
      const cv = document.createElement('canvas'); cv.width = 768; cv.height = Math.round(768 * h / w);
      const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
      const mat = new T.MeshStandardMaterial({ map: tex, roughness: 0.7, emissiveMap: tex, emissive: new T.Color(1, 1, 1), emissiveIntensity: 0.18 });
      const mesh = new T.Mesh(new T.PlaneGeometry(w, h), mat);
      mesh.position.set(f.position[0], f.position[1], f.position[2]);
      mesh.rotation.y = Array.isArray(f.facing) ? Math.atan2(f.facing[0], f.facing[2]) : (f.facing || 0);
      mesh.receiveShadow = true; mesh.name = 'photowall-frame-' + i;
      (f.parent || o.parent || scene).add(mesh);
      const fr = { i, f, cv, tex, mesh, item: null, img: null, kind: 'empty' };
      mesh.userData.photowall = fr; return fr;
    });
    const fit = (g, text, max) => { if (g.measureText(text).width <= max) return text; let s = text; while (s.length > 1 && g.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; };
    function paint(fr) {
      const cv = fr.cv, g = cv.getContext('2d'), W = cv.width, H = cv.height, m = Math.round(W * 0.045);
      g.fillStyle = '#f4ecdb'; g.fillRect(0, 0, W, H); g.textAlign = 'center'; g.textBaseline = 'middle';
      if (fr.kind === 'add') {
        g.strokeStyle = '#b7372a'; g.lineWidth = 6; g.strokeRect(m, m, W - 2 * m, H - 2 * m);
        g.fillStyle = '#b7372a'; g.font = `700 ${Math.round(H * 0.34)}px ${FONT}`; g.fillText('＋', W / 2, H * 0.4);
        g.font = `700 ${Math.round(W * 0.085)}px ${FONT}`; g.fillText('Add your photo', W / 2, H * 0.74);
        g.font = `500 ${Math.round(W * 0.05)}px ${FONT}`; g.fillText('掛上你的照片', W / 2, H * 0.87);
      } else if (fr.kind === 'empty') {
        g.strokeStyle = '#cdbfa5'; g.lineWidth = 4; g.setLineDash([18, 14]); g.strokeRect(m * 1.6, m * 1.6, W - 3.2 * m, H - 3.2 * m); g.setLineDash([]);
        g.fillStyle = '#b3a384'; g.font = `500 ${Math.round(W * 0.052)}px ${FONT}`; g.fillText('Your photo could hang here', W / 2, H / 2);
      } else {
        const it = fr.item, stripH = Math.round(H * 0.2), px = m, py = m, pw = W - 2 * m, ph = H - m - stripH;
        g.fillStyle = '#e6dcc6'; g.fillRect(px, py, pw, ph);
        if (fr.img) { const k = Math.min(pw / fr.img.width, ph / fr.img.height), dw = fr.img.width * k, dh = fr.img.height * k;
          g.drawImage(fr.img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh); }
        else { g.fillStyle = '#b3a384'; g.font = `500 ${Math.round(W * 0.045)}px ${FONT}`; g.fillText('The photo is on its way…', W / 2, py + ph / 2); }
        g.strokeStyle = '#3a2a1c'; g.lineWidth = 3; g.strokeRect(px, py, pw, ph);
        g.fillStyle = '#2a2420'; g.font = `700 ${Math.round(W * 0.05)}px ${FONT}`; g.fillText(fit(g, it.body || '', W - 2 * m), W / 2, H - stripH * 0.62);
        g.fillStyle = it.kind === 'local' || it.kind === 'mine' ? '#b7372a' : '#6b5d50'; g.font = `500 ${Math.round(W * 0.036)}px ${FONT}`;
        const sub = [it.year, it.kind === 'local' ? 'in this browser only' : it.kind === 'mine' ? 'waiting for approval' : it.credit || it.name].filter(Boolean).join(' · ');
        g.fillText(fit(g, sub, W - 2 * m), W / 2, H - stripH * 0.24);
      }
      fr.tex.needsUpdate = true;
    }

    // ── the photos: fixed ones on their frames, then the visitor's own, then everyone's ───────
    let own = [], shared = [], items = [];
    const urls = new Map();                                                  // record id -> object URL of its Blob
    const blobURL = r => { if (!urls.has(r.id)) urls.set(r.id, URL.createObjectURL(r.blob)); return urls.get(r.id); };
    const fixed = frames.filter(fr => fr.f.photo && fr.f.photo.url).map(fr => { const p = fr.f.photo;
      return { key: 'fixed-' + (p.id || fr.i), kind: 'fixed', body: p.caption || '', year: p.year || null, place: p.place || placeName, credit: p.credit || '', url: p.url, frame: fr }; });
    function collate() {
      const sharedKeys = new Set(shared.map(r => r.photo_path.replace(/\.\w+$/, '')));
      const mine = own.filter(r => r.blob && !(r.mine && sharedKeys.has(r.key)))    // once approved, the shared one replaces the visitor's copy
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .map(r => ({ key: r.key, id: r.id, kind: r.mine ? 'mine' : 'local', body: r.body, year: r.year, name: r.name, place: PLACE[r.section] || placeName, url: blobURL(r), here: r.section === section }));
      const theirs = shared.map(r => ({ key: r.photo_path.replace(/\.\w+$/, ''), id: r.id, kind: 'shared', body: r.body, year: r.year, name: r.name, place: PLACE[r.section] || placeName, url: r.photoSigned, here: r.section === section }));
      items = fixed.concat(mine, theirs);
    }
    function layout() {
      collate();
      const free = frames.filter(fr => !(fr.f.photo && fr.f.photo.url));
      const addFr = free.find(fr => fr.f.add) || free[0];
      const hang = items.filter(it => it.kind !== 'fixed' && it.here), slots = free.filter(fr => fr !== addFr);
      frames.forEach(fr => {
        const it = fr.f.photo && fr.f.photo.url ? fixed.find(x => x.frame === fr) : fr === addFr ? null : hang[slots.indexOf(fr)] || null;
        const kind = it ? 'photo' : fr === addFr ? 'add' : 'empty';
        if (fr.item && it && fr.item.url === it.url && fr.kind === kind) { fr.item = it; paint(fr); return; }
        fr.item = it; fr.kind = kind; fr.img = null; paint(fr);
        if (it) { const img = new Image(); if (!/^blob:|^data:/.test(it.url)) img.crossOrigin = 'anonymous';
          img.onload = () => { if (fr.item === it || (fr.item && fr.item.url === it.url)) { fr.img = img; paint(fr); } };
          img.onerror = () => console.warn('[photowall] a photo did not load'); img.src = it.url; }
      });
      if (bPhotos) { const n = items.length; bPhotos.textContent = n ? 'Photos · ' + n : 'Photos'; bPhotos.disabled = !n; }
    }

    // ── DOM: two buttons, the large view, the form ────────────────────────────────────────────
    let bPhotos = null, opener = null;
    const bar = el('div', 'pw-bar', document.body); if (o.buttons === false) bar.hidden = true;
    bPhotos = el('button', 'pw-btn', bar, 'Photos'); bPhotos.type = 'button'; bPhotos.disabled = true;
    const bAdd = el('button', 'pw-btn pw-primary', bar, '＋ Add your photo'); bAdd.type = 'button';
    bPhotos.addEventListener('click', () => { if (items.length) openView(items[0]); });
    bAdd.addEventListener('click', () => openForm());
    const stopWalking = () => { if (o.keys) for (const k in o.keys) o.keys[k] = false; };
    const remember = () => { const a = document.activeElement; if (a && a !== document.body && !vBack.contains(a) && !fBack.contains(a)) opener = a; };
    const giveBack = () => { const a = opener; opener = null; if (a && a.isConnected && a.offsetParent !== null) a.focus({ preventScroll: true }); };

    // the large view
    const vBack = el('div', 'pw-back', document.body); vBack.hidden = true;
    const view = el('div', 'pw-card pw-view', vBack); view.setAttribute('role', 'dialog'); view.setAttribute('aria-modal', 'true'); view.setAttribute('aria-label', 'Photo');
    const vX = el('button', 'pw-x', view, '×'); vX.type = 'button'; vX.setAttribute('aria-label', 'Close');
    const vFig = el('div', 'pw-fig', view), vImg = el('img', '', vFig); vImg.alt = '';
    const vPrev = el('button', 'pw-nav pw-prev', vFig, '‹'); vPrev.type = 'button'; vPrev.setAttribute('aria-label', 'Previous photo');
    const vNext = el('button', 'pw-nav pw-next', vFig, '›'); vNext.type = 'button'; vNext.setAttribute('aria-label', 'Next photo');
    const vSide = el('div', 'pw-side', view);
    const vK = el('div', 'pw-k', vSide), vCap = el('p', 'pw-cap', vSide), vBy = el('div', 'pw-by', vSide), vNote = el('div', 'pw-note', vSide);
    const vShare = el('div', 'pw-share', vSide), vLabel = el('label', '', vShare, 'Share link');
    const vLink = el('input', '', vShare); vLink.type = 'text'; vLink.readOnly = true; vLink.id = 'pwShareLink'; vLabel.htmlFor = 'pwShareLink';
    const vRow = el('div', 'pw-row', vShare);
    const vCopy = el('button', 'pw-btn pw-primary', vRow, 'Copy link'); vCopy.type = 'button';
    const vDel = el('button', 'pw-btn pw-quiet', vRow, 'Remove from this browser'); vDel.type = 'button';
    let current = null;
    const linkFor = it => { const u = new URL(location.href); u.searchParams.delete('debug'); u.searchParams.delete('view'); u.searchParams.set('photo', it.key); return u.href; };
    const setParam = key => { try { const u = new URL(location.href); if (key) u.searchParams.set('photo', key); else u.searchParams.delete('photo'); history.replaceState(null, '', u.href); } catch (_) {} };
    function openView(it) {
      if (!it) return; remember(); stopWalking(); fBack.hidden = true; current = it;
      vImg.src = it.url; vImg.alt = it.body || 'A photo';
      vK.textContent = [it.year, it.place].filter(Boolean).join(' · ');
      vCap.textContent = it.body || '';
      vBy.textContent = it.kind === 'fixed' ? (it.credit || '') : '— ' + (it.name && String(it.name).trim() ? String(it.name).trim() : 'someone who was there');
      vBy.hidden = !vBy.textContent;
      vNote.textContent = it.kind === 'local' ? 'Saved in this browser. ' + ONLY_YOU + ' The share link opens it in this browser only.'
        : it.kind === 'mine' ? 'Sent, and waiting for the makers to approve it. Until then only you can see it, in this browser. The share link starts working for everyone once it is approved.' : '';
      vNote.hidden = !vNote.textContent;
      vShare.hidden = false; vLink.value = linkFor(it); vCopy.textContent = 'Copy link';
      vDel.hidden = !(it.kind === 'local' || it.kind === 'mine');
      vDel.textContent = it.kind === 'mine' ? 'Remove my copy from this browser' : 'Remove from this browser';
      vPrev.hidden = vNext.hidden = items.length < 2;
      vBack.hidden = false; setParam(it.key); vX.focus({ preventScroll: true });
    }
    function closeView() { if (vBack.hidden) return; vBack.hidden = true; current = null; setParam(null); giveBack(); }
    const step = d => { if (!current || items.length < 2) return; const i = items.findIndex(x => x.key === current.key); openView(items[(i + d + items.length) % items.length]); };
    vX.addEventListener('click', closeView); vPrev.addEventListener('click', () => step(-1)); vNext.addEventListener('click', () => step(1));
    vBack.addEventListener('click', e => { if (e.target === vBack) closeView(); });
    vLink.addEventListener('focus', () => vLink.select());
    vCopy.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(vLink.value); ok = true; } catch (_) { vLink.focus(); vLink.select(); try { ok = document.execCommand('copy'); } catch (e) {} }
      vCopy.textContent = ok ? 'Copied' : 'Select and copy the link above';
    });
    vDel.addEventListener('click', async () => {
      if (!current || !current.id) return;
      const id = current.id; try { await idbDel(id); } catch (_) {}
      own = own.filter(r => r.id !== id); if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
      closeView(); layout();
    });

    // the form
    const fBack = el('div', 'pw-back', document.body); fBack.hidden = true;
    const form = el('form', 'pw-card pw-form', fBack); form.noValidate = true; form.setAttribute('role', 'dialog'); form.setAttribute('aria-modal', 'true'); form.setAttribute('aria-labelledby', 'pwFormTitle');
    const fX = el('button', 'pw-x', form, '×'); fX.type = 'button'; fX.setAttribute('aria-label', 'Close');
    el('div', 'pw-k', form, placeName);
    const fTitle = el('h2', '', form, 'Add your photo · 掛上你的照片'); fTitle.id = 'pwFormTitle';
    const lab = (text, hint, parent) => { const l = el('label', 'pw-field', parent || form), s = el('span', '', l, text + ' '); if (hint) el('em', '', s, hint); return l; };
    const lPhoto = lab('Your photo', '(yours, or one you may share)'); const fFile = el('input', '', lPhoto); fFile.type = 'file'; fFile.accept = 'image/*'; fFile.name = 'photo';
    const fPrev = el('img', 'pw-prev-img', form); fPrev.alt = ''; fPrev.hidden = true;
    const lBody = lab('A short caption', '(what is this, and when?)'); const fBody = el('textarea', '', lBody); fBody.name = 'body'; fBody.rows = 2; fBody.maxLength = MAX_TEXT; fBody.placeholder = 'The stall my mother took me to after school…';
    const two = el('div', 'pw-two', form);
    const lYear = lab('Year', '', two); const fYear = el('select', '', lYear); fYear.name = 'year';
    { const none = el('option', '', fYear, 'Not sure'); none.value = ''; for (let y = THIS_YEAR; y >= 1900; y--) { const op = el('option', '', fYear, String(y)); op.value = String(y); } }
    const lName = lab('Your name', '(optional)', two); const fName = el('input', '', lName); fName.type = 'text'; fName.name = 'name'; fName.maxLength = MAX_NAME; fName.autocomplete = 'nickname';
    const hp = el('label', 'pw-hp', form, 'Leave this empty '); hp.setAttribute('aria-hidden', 'true'); const fHp = el('input', '', hp); fHp.type = 'text'; fHp.name = 'website'; fHp.tabIndex = -1; fHp.autocomplete = 'off';
    const lOk = el('label', 'pw-consent', form), fOk = el('input', '', lOk); fOk.type = 'checkbox'; fOk.name = 'ok';
    el('span', '', lOk, 'This photo is mine to share, and I’m happy for it to be shown on this page. It doesn’t show anyone who would mind.');
    const fWhere = el('p', 'pw-where ' + (ONLINE ? 'shared' : 'local'), form, ONLINE
      ? 'Your photo is sent to the site’s storage and stays private until the makers approve it. Then everyone who visits can see it.'
      : 'The site’s storage isn’t connected yet, so your photo is kept in this browser and nothing is sent anywhere. ' + ONLY_YOU);
    const fStatus = el('p', 'pw-status', form); fStatus.id = 'pwStatus'; fStatus.setAttribute('role', 'status'); fStatus.setAttribute('aria-live', 'polite');
    const fRow = el('div', 'pw-row', form), fSend = el('button', 'pw-btn pw-primary', fRow, 'Hang my photo'); fSend.type = 'submit';
    const fCancel = el('button', 'pw-btn pw-quiet', fRow, 'Cancel'); fCancel.type = 'button';
    let openedAt = 0, lastSent = 0, prevURL = null;
    const say = (t, ok) => { fStatus.textContent = t; fStatus.classList.toggle('ok', !!ok); };
    const clearBad = () => [fFile, fBody, fOk].forEach(f => { f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); });
    const bad = (f, t) => { clearBad(); f.setAttribute('aria-invalid', 'true'); f.setAttribute('aria-describedby', 'pwStatus'); f.focus({ preventScroll: true }); say(t); };
    const dropPrev = () => { if (prevURL) URL.revokeObjectURL(prevURL); prevURL = null; fPrev.hidden = true; fPrev.removeAttribute('src'); };
    fFile.addEventListener('change', () => { dropPrev(); const f = fFile.files && fFile.files[0]; if (f && /^image\//.test(f.type)) { prevURL = URL.createObjectURL(f); fPrev.src = prevURL; fPrev.hidden = false; } });
    function openForm() { remember(); stopWalking(); vBack.hidden = true; current = null; setParam(null); say(''); clearBad(); fSend.disabled = false; fBack.hidden = false; openedAt = performance.now(); setTimeout(() => fFile.focus({ preventScroll: true }), 30); }
    function closeForm() { if (fBack.hidden) return; fBack.hidden = true; giveBack(); }
    fX.addEventListener('click', closeForm); fCancel.addEventListener('click', closeForm);
    fBack.addEventListener('click', e => { if (e.target === fBack) closeForm(); });

    // the one way a photo is added, used by the form (and by a page's own script if it wants)
    async function add(input) {
      const body = String(input.body || '').trim().slice(0, MAX_TEXT), name = String(input.name || '').trim().slice(0, MAX_NAME) || null;
      const year = input.year ? parseInt(input.year, 10) : null;
      if (!input.file || !/^image\//.test(input.file.type)) throw new Error('Choose a photo first.');
      if (!body) throw new Error('Write a short caption first.');
      if (year !== null && (isNaN(year) || year < 1900 || year > THIS_YEAR)) throw new Error('The year should be between 1900 and ' + THIS_YEAR + '.');
      const small = await shrink(input.file);                               // resized here, before it goes anywhere
      const key = ONLINE ? uuid() : 'local-' + uuid();
      const rec = { id: key, key, section, x: clampN(spot[0], -60, 60), z: clampN(spot[1], -500, 250), year, body, name, created_at: new Date().toISOString(),
        blob: small.blob, width: small.width, height: small.height, local: !ONLINE, mine: ONLINE, photo_path: ONLINE ? key + '.jpg' : null };
      if (ONLINE) await upload(rec, small.blob);                             // keys present: private bucket + a pending row
      try { await idbPut(rec); }
      catch (e) { if (!ONLINE) throw new Error('This browser couldn’t save it. Private browsing may be blocking it.'); }
      own.push(rec); layout();
      return { how: ONLINE ? 'pending' : 'local', key, bytes: small.blob.size, width: small.width, height: small.height };
    }
    form.addEventListener('submit', async ev => {
      ev.preventDefault(); clearBad();
      if (fHp.value) return say('Thank you.');                               // a bot filled the hidden field
      const file = fFile.files && fFile.files[0];
      if (!file) return bad(fFile, 'Choose a photo first.');
      if (!/^image\//.test(file.type)) return bad(fFile, 'That file isn’t a photo.');
      if (file.size > 30e6) return bad(fFile, 'That photo is too large. Please choose one under 30 MB.');
      if (!fBody.value.trim()) return bad(fBody, 'Write a short caption first.');
      if (!fOk.checked) return bad(fOk, 'Please tick the box so your photo can be shown.');
      if (performance.now() - openedAt < 1500) return say('One moment…');
      if (Date.now() - lastSent < 20000) return say('One photo at a time. Try again in a few seconds.');
      fSend.disabled = true; say(ONLINE ? 'Resizing and sending your photo…' : 'Resizing and saving your photo…');
      try {
        const done = await add({ file, body: fBody.value, year: fYear.value, name: fName.value });
        lastSent = Date.now(); form.reset(); dropPrev();
        say(done.how === 'local' ? 'Saved in this browser. ' + ONLY_YOU : 'Sent. It appears for everyone once the makers approve it. Until then only you can see it here.', true);
        setTimeout(() => { closeForm(); const it = items.find(x => x.key === done.key); if (it) openView(it); }, 1400);
      } catch (e) {
        const m = e && e.message;
        say(m === 'unreachable' ? 'Saving failed: the page can’t reach the internet right now. Please try again in a moment.'
          : m === 'timeout' ? 'Saving failed: the connection timed out. Please try again.' : m || 'Saving failed. Please try again.');
      } finally { fSend.disabled = false; }
    });

    // keys: while a dialog is open the scene does not hear the keyboard (typing "w" or "1" must not walk or cut the camera)
    const onKey = ev => {
      const box = !fBack.hidden ? form : !vBack.hidden ? view : null; if (!box) return;
      ev.stopPropagation();
      if (ev.key === 'Escape') { ev.preventDefault(); if (box === form) closeForm(); else closeView(); return; }
      const typing = ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);
      if (box === view && !typing && ev.key === 'ArrowLeft') return step(-1);
      if (box === view && !typing && ev.key === 'ArrowRight') return step(1);
      if (ev.key === 'Tab') {
        const f = [...box.querySelectorAll('button, input, textarea, select, a[href]')].filter(e => !e.disabled && e.tabIndex >= 0 && e.offsetParent !== null);
        const a = document.activeElement;
        if (f.length && (ev.shiftKey ? a === f[0] || !box.contains(a) : a === f[f.length - 1] || !box.contains(a))) { ev.preventDefault(); (ev.shiftKey ? f[f.length - 1] : f[0]).focus(); }
      }
    };
    window.addEventListener('keydown', onKey, true);

    // a click or tap (not a drag) on a frame: a photo opens large, an empty or "+" frame opens the form
    const ray = new T.Raycaster(), ndc = new T.Vector2(), meshes = frames.map(fr => fr.mesh);
    const hitAt = ev => { const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(meshes, false)[0]; return h ? h.object.userData.photowall : null; };
    let down = null, hoverT = 0;
    const onDown = ev => { down = { x: ev.clientX, y: ev.clientY, t: performance.now() }; };
    const onUp = ev => { const d = down; down = null; if (!d || Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 8 || performance.now() - d.t > 600) return;
      const fr = hitAt(ev); if (!fr) return; if (fr.item) openView(fr.item); else openForm(); };
    const onMove = ev => { if (ev.buttons || ev.pointerType === 'touch') return; const now = performance.now(); if (now - hoverT < 60) return; hoverT = now; canvas.style.cursor = hitAt(ev) ? 'pointer' : ''; };
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointermove', onMove);

    // ── load: this browser's photos first (instant), then everyone's approved ones (keys only) ─
    const wanted = new URLSearchParams(location.search).get('photo');
    async function refresh() {
      own = (await idbAll()).filter(r => r && r.id && r.key && r.blob && typeof r.body === 'string');
      layout();
      if (ONLINE) {
        try {
          shared = await fetchApproved(section);
          if (wanted && KEY_RE.test(wanted) && !shared.some(r => r.photo_path.indexOf(wanted) === 0)) shared = shared.concat(await fetchApproved(section, wanted));   // a link to a photo from another place
          layout();
        } catch (e) { console.warn('[photowall] could not load the shared photos:', e.message); }
      }
      return items.length;
    }
    const ready = refresh().then(() => {
      if (!wanted) return;
      const it = items.find(x => x.key === wanted);
      if (it) openView(it);
      else { remember(); current = null; vImg.removeAttribute('src'); vK.textContent = 'Shared photo'; vCap.textContent = 'This photo isn’t here.';
        vBy.textContent = /^local-/.test(wanted) ? 'It was saved in one person’s browser only, so it opens only there.' : 'It may still be waiting for approval, or it was taken down.'; vBy.hidden = false;
        vNote.hidden = true; vShare.hidden = true; vPrev.hidden = vNext.hidden = true; vBack.hidden = false; vX.focus({ preventScroll: true }); }
    });

    const api = { ONLINE, ready, frames, list: () => items.map(it => Object.assign({}, it, { frame: undefined })), open: key => openView(items.find(x => x.key === key)),
      openForm, closeForm, closeView, add, refresh, records: idbAll,
      dispose() { window.removeEventListener('keydown', onKey, true); canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointermove', onMove);
        [bar, vBack, fBack].forEach(n => n.remove()); frames.forEach(fr => { fr.mesh.parent && fr.mesh.parent.remove(fr.mesh); fr.mesh.geometry.dispose(); fr.mesh.material.dispose(); fr.tex.dispose(); }); urls.forEach(u => URL.revokeObjectURL(u)); } };
    window.__photowall = api;
    return api;
  }

  window.PHOTOWALL = { attach, row, ONLINE };
})();
