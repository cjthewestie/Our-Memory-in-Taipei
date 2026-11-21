// photowall.js — the photo walls of the remade scenes: look at the photos, add your own, share one.
//
// CJ, 2026-11-21: 「跟讓大家上傳回憶的機制」, 「我還要想用什麼方式讓大家看得到照片或分享照片」.
//
// ── How a scene page uses it (the whole integration) ─────────────────────────────────────────
//   Before the page's own script:
//     <script src="../memories-config.js"></script>      <!-- the same config the live site uses -->
//     <script src="photo-topics.js"></script>            <!-- the one list of topics, per scene -->
//     <script src="photowall.js"></script>
//   Inside ENGINE.create({ build(E, models) { ... } }): one small SHOWCASE per topic of the scene
//   (CJ, 2026-11-21: "each topic or major event like climbing 101, make a small shop or stand or small wall
//   to showcase the event and we can click into a gallery show all the pictures"):
//     PHOTOWALL.showcases(E, { section: 'dadao', topics: PHOTO_TOPICS.dadao, spots: { temple: [7.2, -4.6, 0, 'shrine'], ... } });
//       spots  topic key -> [x, z, facing, kind]   kind: 'wall' | 'shop' | 'stand' | 'poster' | 'shrine' | 'kiosk'
//       spare  [[x, z, facing, kind], ...]         places for topics added to photo-topics.js later
//   Titles, years and the `ask` line are read from PHOTO_TOPICS[section]; a page never repeats them.
//   In the page's clamp(p): PHOTOWALL.keepOut(p) pushes her out of every showcase's footprint.
//   PHOTOWALL.block({ x, z, facing, hw, hd }) adds a footprint for a wall the page built itself.
//
//   Clicking anywhere on a showcase opens that topic's GALLERY: every photo of the topic in a grid, the
//   topic's `ask` line and an "Add your photo" button that opens the form already set to the topic. A
//   photo in the grid opens the large view (caption, year, place, share link). The page has ONE button,
//   "Photos", which lists the scene's topics. Several showcases share one button, one gallery, one large
//   view, one form, one keyboard handler and one ?photo= link.
//
// ── attach(options): the lower level, one call per wall or showcase ──────────────────────────
//   THREE, scene, camera, canvas   the page's live objects (required; the first call sets them for the page)
//   topic    the topic's key in PHOTO_TOPICS[section]. A new photo is stored with it; a wall shows only its
//            own topic. A record with no topic, or a topic no wall here has, hangs on the section's FIRST wall.
//   frames   [{ position: [x, y, z], size: [w, h], facing, add, photo, parent, hit, cue }]
//              position  the middle of the picture, in metres (world, or local to `parent`)
//              facing    which way it looks: an angle about Y in radians (0 looks toward +Z), or a normal [nx, ny, nz]
//              add       true marks the frame that says "+ Add your photo" (plain walls only)
//              photo     { id, url, caption, year, place, credit }: a fixed, curated picture (the opening exhibition)
//              hit       an existing mesh to use as that fixed photo's click target, instead of a new plane
//              parent    an Object3D to hang it on instead of the scene
//              cue       true: the "see all" plate of a showcase
//   showcase an Object3D: a click anywhere on it opens the topic's gallery
//   section  'square' | 'red' | 'dadao' | 'tower'  (the live site's four places; default 'square')
//   place    the place name shown under a photo (default: the section's name)
//   label    a name for a wall that has no topic (e.g. 'Opening exhibition')
//   spot     [x, z] stored with a new photo (default: the first frame's position)
//   keys     the engine's key map (E.keys), cleared when a dialog opens so she does not keep walking
//   buttons  false hides the on-screen button bar
//   returns  { ONLINE, ready (a promise), topic, list(), open(key), openGallery(), openForm(), add({ file, body, year, name }), refresh(), records(), frames }
//   window.__photowall is the page: { walls, list(), open(key), openGallery(topic), records(), ready }
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
    const where = key ? 'photo_path=in.(' + key + '.jpg,' + key + '.webp)' : 'section=eq.' + encodeURIComponent(section) + '&photo_path=not.is.null';   // each row carries its topic; the page hangs it on that topic's wall
    const res = await net(API + '/rest/v1/memories?select=id,created_at,section,topic,x,z,year,body,name,photo_path&status=eq.approved&' + where + '&order=created_at.desc&limit=200', { headers: headers() });
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
      body: JSON.stringify({ section: rec.section, x: rec.x, z: rec.z, year: rec.year, body: rec.body, name: rec.name, photo_path: rec.photo_path, topic: rec.topic || null }) });
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
  .pw-topic { font: 700 16px/1.3 ${FONT}; margin: 0; color: #2a2420; }
  .pw-ask { margin: 0; color: #5a4d40; font-size: 15px; }
  .pw-gal { width: min(1100px, 100%); min-height: calc(100vh - 32px); box-sizing: border-box; padding: 26px 26px 22px; display: flex; flex-direction: column; gap: 12px; }
  .pw-gal h2 { font: 700 30px/1.2 ${FONT}; margin: 0 40px 0 0; }
  .pw-gal h2 small { font: 600 16px/1.2 ${FONT}; color: #6b5d50; margin-left: 10px; }
  .pw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; overflow: auto; align-content: start; flex: 1; min-height: 0; padding: 2px; }
  .pw-tile { font: 600 14px/1.35 ${FONT}; text-align: left; color: #2a2420; background: #fffaf0; border: 1px solid #cdbfa5; border-radius: 10px; padding: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .pw-tile:hover { border-color: #b7372a; } .pw-tile:focus-visible { outline: 2px solid #b7372a; outline-offset: 2px; }
  .pw-tile img, .pw-tile .pw-ph { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 6px; background: #e6dcc6; display: block; }
  .pw-tile span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pw-tile em { font: 400 12px/1.3 ${FONT}; font-style: normal; color: #6b5d50; }
  .pw-tile b { font: 700 19px/1.2 ${FONT}; }
  .pw-none { margin: 18px 0; padding: 22px; border: 2px dashed #cdbfa5; border-radius: 12px; text-align: center; color: #5a4d40; font-size: 16px; }
  @media (max-width: 720px) {
    .pw-gal { padding: 18px 14px; } .pw-gal h2 { font-size: 23px; } .pw-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
    .pw-view { grid-template-columns: 1fr; } .pw-fig { border-radius: 14px 14px 0 0; min-height: 200px; } .pw-fig img { max-height: 52vh; }
    .pw-side { padding: 16px 16px 18px; } .pw-bar { right: 10px; bottom: 58px; font-size: 13px; } .pw-two { grid-template-columns: 1fr; }
  }`;
  let styled = false;
  const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };
  const el = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };

  // ── topics: read from photo-topics.js (window.PHOTO_TOPICS), never written here ─────────────
  const topicsOf = section => (window.PHOTO_TOPICS && Array.isArray(window.PHOTO_TOPICS[section]) ? window.PHOTO_TOPICS[section].filter(t => t && t.key) : []);
  const topicInfo = (section, key) => (key ? topicsOf(section).find(t => t.key === key) : null) || null;
  const topicName = t => (t ? [t.zh, t.en].filter(Boolean).join(' · ') : '');

  // a straight row of frames along a wall: the usual case, so a page does not do the trigonometry
  function row(o) {
    const n = o.count || 3, gap = o.gap || 2.6, th = o.facing || 0, out = o.out || 0, c = o.center, frames = [];
    for (let i = 0; i < n; i++) {
      const fx = (i - (n - 1) / 2) * gap;                                   // along the wall, then `out` metres off its face
      frames.push({ position: [c[0] + fx * Math.cos(th) + out * Math.sin(th), c[1], c[2] - fx * Math.sin(th) + out * Math.cos(th)], size: o.size || [2.0, 1.7], facing: th, add: i === (o.addAt || 0) });
    }
    return frames;
  }

  // ── footprints: where she cannot walk ───────────────────────────────────────────────────────
  // each is a box turned by `facing`: u runs along the face, v out of it. keepOut(p) is called from a page's clamp.
  const FOOT = [];
  function block(b) { const f = { x: b.x, z: b.z, th: b.facing || 0, u0: b.u0 != null ? b.u0 : -(b.hw || 1), u1: b.u1 != null ? b.u1 : (b.hw || 1), v0: b.v0 != null ? b.v0 : -(b.hd || 0.3), v1: b.v1 != null ? b.v1 : (b.hd || 0.3) }; FOOT.push(f); return f; }
  function keepOut(p, margin) {
    const m = margin == null ? 0.35 : margin;
    for (const f of FOOT) {
      const c = Math.cos(f.th), s = Math.sin(f.th), dx = p.x - f.x, dz = p.z - f.z;
      let u = dx * c - dz * s, v = dx * s + dz * c;
      if (u <= f.u0 - m || u >= f.u1 + m || v <= f.v0 - m || v >= f.v1 + m) continue;
      const push = [[u - (f.u0 - m), 'u', f.u0 - m], [(f.u1 + m) - u, 'u', f.u1 + m], [v - (f.v0 - m), 'v', f.v0 - m], [(f.v1 + m) - v, 'v', f.v1 + m]].sort((a, b) => a[0] - b[0])[0];
      if (push[1] === 'u') u = push[2]; else v = push[2];
      p.x = f.x + u * c + v * s; p.z = f.z - u * s + v * c;
    }
    return p;
  }

  // ── the page: one button bar, one gallery, one large view, one form, shared by every wall ────
  let P = null;
  function makePage(o) {
    const T = o.THREE || window.THREE, scene = o.scene, camera = o.camera, canvas = o.canvas;
    style();
    const walls = [], urls = new Map(), wanted = new URLSearchParams(location.search).get('photo');
    let own = [], shared = [], items = [], extra = [], keysMap = o.keys || null;
    const blobURL = r => { if (!urls.has(r.id)) urls.set(r.id, URL.createObjectURL(r.blob)); return urls.get(r.id); };
    const addable = () => walls.filter(w => w.free.length);
    const fit = (g, text, max) => { if (g.measureText(text).width <= max) return text; let s = text; while (s.length > 1 && g.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; };

    function paint(fr) {
      const cv = fr.cv; if (!cv) return;
      const g = cv.getContext('2d'), W = cv.width, H = cv.height, m = Math.round(W * 0.045), w = fr.wall;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (fr.kind === 'cue') {                                               // the "see all" plate of a showcase
        const n = w.items.length;
        g.fillStyle = '#b7372a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff6e6'; g.lineWidth = Math.max(3, H * 0.05); g.strokeRect(m * 0.4, m * 0.4, W - m * 0.8, H - m * 0.8);
        g.fillStyle = '#fff6e6'; g.font = `700 ${Math.round(H * 0.46)}px ${FONT}`;
        g.fillText(fit(g, n ? `See all ${n} photo${n === 1 ? '' : 's'} · 看全部  ›` : 'Open the gallery · 看照片  ›', W - 2 * m), W / 2, H * 0.53);
        fr.tex.needsUpdate = true; return;
      }
      g.fillStyle = '#f4ecdb'; g.fillRect(0, 0, W, H);
      if (fr.kind === 'add') {
        g.strokeStyle = '#b7372a'; g.lineWidth = 6; g.strokeRect(m, m, W - 2 * m, H - 2 * m);
        g.fillStyle = '#b7372a'; g.font = `700 ${Math.round(H * 0.34)}px ${FONT}`; g.fillText('＋', W / 2, H * 0.4);
        g.font = `700 ${Math.round(W * 0.085)}px ${FONT}`; g.fillText(w.showcase ? 'Add the first photo' : 'Add your photo', W / 2, H * 0.74);
        g.font = `500 ${Math.round(W * 0.05)}px ${FONT}`; g.fillText(fit(g, (w.info && w.info.ask) || '掛上你的照片', W - 3 * m), W / 2, H * 0.87);
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

    // ── which photo hangs where: its own topic's wall; no topic (or one no wall here has) → the section's first wall ──
    function collate() {
      const bySec = {}; addable().forEach(w => (bySec[w.section] = bySec[w.section] || []).push(w));
      const home = r => { const ws = bySec[r.section]; return ws ? ws.find(w => w.topic && w.topic === r.topic) || ws[0] : null; };
      walls.forEach(w => { w.items = w.fixed.slice(); }); extra = [];
      const put = (r, it) => { const w = home(r); it.section = r.section; it.topic = r.topic || null; it.info = topicInfo(r.section, r.topic); it.place = PLACE[r.section] || (w && w.placeName) || '';
        if (w) { it.wall = w; w.items.push(it); } else if (it.key === wanted) extra.push(it); };   // a photo of another place shows only when a link asks for it
      const sharedKeys = new Set(shared.map(r => r.photo_path.replace(/\.\w+$/, '')));
      own.filter(r => r.blob && !(r.mine && sharedKeys.has(r.key)))             // once approved, the shared one replaces the visitor's copy
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .forEach(r => put(r, { key: r.key, id: r.id, kind: r.mine ? 'mine' : 'local', body: r.body, year: r.year, name: r.name, url: blobURL(r) }));
      shared.forEach(r => put(r, { key: r.photo_path.replace(/\.\w+$/, ''), id: r.id, kind: 'shared', body: r.body, year: r.year, name: r.name, url: r.photoSigned }));
      items = walls.reduce((a, w) => a.concat(w.items), []).concat(extra);
    }
    function layout() {
      collate();
      walls.forEach(w => {
        const hang = w.items.filter(it => it.kind !== 'fixed');
        const addFr = w.showcase ? (hang.length ? null : w.free[0]) : (w.free.find(fr => fr.f.add) || w.free[0]);
        const slots = w.free.filter(fr => fr !== addFr || w.showcase);
        w.frames.forEach(fr => {
          if (fr.f.cue) { fr.kind = 'cue'; paint(fr); return; }
          const isFixed = !!(fr.f.photo && fr.f.photo.url);
          const it = isFixed ? w.fixed.find(x => x.frame === fr) : (fr === addFr && !w.showcase) ? null : hang[slots.indexOf(fr)] || null;
          const kind = it ? 'photo' : fr === addFr ? 'add' : 'empty';
          if (fr.item && it && fr.item.url === it.url && fr.kind === kind) { fr.item = it; paint(fr); return; }
          fr.item = it; fr.kind = kind; fr.img = null; paint(fr);
          if (it && fr.cv) { const img = new Image(); if (!/^blob:|^data:/.test(it.url)) img.crossOrigin = 'anonymous';
            img.onload = () => { if (fr.item === it || (fr.item && fr.item.url === it.url)) { fr.img = img; paint(fr); } };
            img.onerror = () => console.warn('[photowall] a photo did not load'); img.src = it.url; }
        });
      });
      const n = items.length, cases = walls.some(w => w.showcase), one = addable().length === 1 && !cases;
      bar.hidden = !walls.some(w => w.buttons !== false);
      bPhotos.textContent = n ? 'Photos · ' + n : 'Photos'; bPhotos.disabled = !n && !cases; bAdd.hidden = !one;
      if (!gBack.hidden) drawGallery();
    }

    // ── DOM ───────────────────────────────────────────────────────────────────────────────────
    let opener = null;
    const bar = el('div', 'pw-bar', document.body);
    const bPhotos = el('button', 'pw-btn', bar, 'Photos'); bPhotos.type = 'button'; bPhotos.disabled = true;
    const bAdd = el('button', 'pw-btn pw-primary', bar, '＋ Add your photo'); bAdd.type = 'button'; bAdd.hidden = true;
    bPhotos.addEventListener('click', () => { if (walls.some(w => w.showcase)) openGallery(null); else if (items.length) openView(items[0]); });
    bAdd.addEventListener('click', () => openForm(addable()[0]));
    const stopWalking = () => { if (keysMap) for (const k in keysMap) keysMap[k] = false; };
    const inDialog = a => vBack.contains(a) || fBack.contains(a) || gBack.contains(a);
    const remember = () => { const a = document.activeElement; if (a && a !== document.body && !inDialog(a)) opener = a; };
    const giveBack = () => { const a = opener; opener = null; if (a && a.isConnected && a.offsetParent !== null) a.focus({ preventScroll: true }); };
    const dialog = (cls, label) => { const back = el('div', 'pw-back', document.body); back.hidden = true; const card = el(cls === 'pw-form' ? 'form' : 'div', 'pw-card ' + cls, back);
      card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-label', label);
      const x = el('button', 'pw-x', card, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); return [back, card, x]; };

    // the gallery: every photo of one topic in a grid, or (no topic chosen) the scene's topics
    const [gBack, gal, gX] = dialog('pw-gal', 'Photo gallery');
    const gK = el('div', 'pw-k', gal), gTitle = el('h2', '', gal), gAsk = el('p', 'pw-ask', gal), gRow = el('div', 'pw-row', gal);
    const gAll = el('button', 'pw-btn pw-quiet', gRow, '‹ All topics'); gAll.type = 'button';
    const gAdd = el('button', 'pw-btn pw-primary', gRow, '＋ Add your photo · 掛上你的照片'); gAdd.type = 'button';
    const gNone = el('div', 'pw-none', gal), gGrid = el('div', 'pw-grid', gal);
    let gWall = null, back = undefined;                                        // back: the gallery to return to when the large view or the form closes
    const wallName = w => topicName(w.info) || w.label || w.placeName;
    function tile(parent, it) { const b = el('button', 'pw-tile', parent); b.type = 'button'; const im = el('img', '', b); im.loading = 'lazy'; im.alt = ''; im.src = it.url;
      el('span', '', b, it.body || 'A photo'); el('em', '', b, [it.year, it.kind === 'local' ? 'in this browser only' : it.kind === 'mine' ? 'waiting for approval' : it.credit || it.name].filter(Boolean).join(' · ') || ' ');
      b.addEventListener('click', () => openView(it)); return b; }
    function drawGallery() {
      const w = gWall; gGrid.textContent = '';
      if (!w) {                                                                // the list of this scene's topics
        const ws = walls.filter(x => x.showcase || x.items.length);
        gK.textContent = (ws[0] && ws[0].placeName) || ''; gTitle.textContent = 'Photos · 照片'; gAsk.textContent = 'Choose a topic to see its photos, or to add your own.'; gRow.hidden = true; gNone.hidden = true;
        ws.forEach(x => { const b = el('button', 'pw-tile', gGrid); b.type = 'button'; const first = x.items[0];
          if (first) { const im = el('img', '', b); im.alt = ''; im.loading = 'lazy'; im.src = first.url; } else el('div', 'pw-ph', b);
          el('b', '', b, (x.info && x.info.zh) || x.label || x.placeName); el('span', '', b, [(x.info && x.info.en), (x.info && x.info.years)].filter(Boolean).join(' · ') || ' ');
          el('em', '', b, x.items.length ? x.items.length + (x.items.length === 1 ? ' photo' : ' photos') : 'No photos yet');
          b.addEventListener('click', () => openGallery(x)); });
        return;
      }
      gK.textContent = w.placeName; gTitle.textContent = (w.info && w.info.zh) || w.label || w.placeName;
      const sub = [(w.info && w.info.en), (w.info && w.info.years)].filter(Boolean).join(' · '); if (sub) el('small', '', gTitle, sub);
      gAsk.textContent = (w.info && w.info.ask) || ''; gAsk.hidden = !gAsk.textContent;
      gRow.hidden = false; gAll.hidden = walls.filter(x => x.showcase).length < 2; gAdd.hidden = !w.free.length;
      gNone.hidden = !!w.items.length; gNone.textContent = 'No photos here yet. Be the first: add yours. · 這裡還沒有照片，掛上第一張吧。';
      w.items.forEach(it => tile(gGrid, it));
    }
    function openGallery(w) { remember(); stopWalking(); vBack.hidden = true; fBack.hidden = true; current = null; setParam(null); back = undefined; gWall = w || null; drawGallery(); gBack.hidden = false; gGrid.scrollTop = 0; gX.focus({ preventScroll: true }); }
    function closeGallery() { if (gBack.hidden) return; gBack.hidden = true; giveBack(); }
    const reopen = () => { const b = back; back = undefined; if (b === undefined) return giveBack(); gWall = b; drawGallery(); gBack.hidden = false; gX.focus({ preventScroll: true }); };
    const leaveGallery = () => { if (!gBack.hidden) { back = gWall; gBack.hidden = true; } };
    gX.addEventListener('click', closeGallery); gAll.addEventListener('click', () => openGallery(null)); gAdd.addEventListener('click', () => openForm(gWall));
    gBack.addEventListener('click', e => { if (e.target === gBack) closeGallery(); });

    // the large view
    const [vBack, view, vX] = dialog('pw-view', 'Photo');
    const vFig = el('div', 'pw-fig', view), vImg = el('img', '', vFig); vImg.alt = '';
    const vPrev = el('button', 'pw-nav pw-prev', vFig, '‹'); vPrev.type = 'button'; vPrev.setAttribute('aria-label', 'Previous photo');
    const vNext = el('button', 'pw-nav pw-next', vFig, '›'); vNext.type = 'button'; vNext.setAttribute('aria-label', 'Next photo');
    const vSide = el('div', 'pw-side', view);
    const vK = el('div', 'pw-k', vSide), vT = el('p', 'pw-topic', vSide), vCap = el('p', 'pw-cap', vSide), vBy = el('div', 'pw-by', vSide), vNote = el('div', 'pw-note', vSide);
    const vShare = el('div', 'pw-share', vSide), vLabel = el('label', '', vShare, 'Share link');
    const vLink = el('input', '', vShare); vLink.type = 'text'; vLink.readOnly = true; vLink.id = 'pwShareLink'; vLabel.htmlFor = 'pwShareLink';
    const vRow = el('div', 'pw-row', vShare);
    const vCopy = el('button', 'pw-btn pw-primary', vRow, 'Copy link'); vCopy.type = 'button';
    const vDel = el('button', 'pw-btn pw-quiet', vRow, 'Remove from this browser'); vDel.type = 'button';
    let current = null;
    const linkFor = it => { const u = new URL(location.href); ['debug', 'view', 'cam', 'pwtest'].forEach(k => u.searchParams.delete(k)); u.searchParams.set('photo', it.key); return u.href; };
    const setParam = key => { try { const u = new URL(location.href); if (key) u.searchParams.set('photo', key); else u.searchParams.delete('photo'); history.replaceState(null, '', u.href); } catch (_) {} };
    const around = it => (it && it.wall ? it.wall.items : items);             // ‹ › stay inside the photo's own topic
    function openView(it) {
      if (!it) return; remember(); stopWalking(); leaveGallery(); fBack.hidden = true; current = it;
      vImg.src = it.url; vImg.alt = it.body || 'A photo';
      vK.textContent = [it.year, it.place].filter(Boolean).join(' · ');
      vT.textContent = it.kind === 'fixed' ? (it.wall && it.wall.label) || '' : topicName(it.info); vT.hidden = !vT.textContent;
      vCap.textContent = it.body || '';
      vBy.textContent = it.kind === 'fixed' ? (it.credit || '') : '— ' + (it.name && String(it.name).trim() ? String(it.name).trim() : 'someone who was there');
      vBy.hidden = !vBy.textContent;
      vNote.textContent = it.kind === 'local' ? 'Saved in this browser. ' + ONLY_YOU + ' The share link opens it in this browser only.'
        : it.kind === 'mine' ? 'Sent, and waiting for the makers to approve it. Until then only you can see it, in this browser. The share link starts working for everyone once it is approved.' : '';
      vNote.hidden = !vNote.textContent;
      vShare.hidden = false; vLink.value = linkFor(it); vCopy.textContent = 'Copy link';
      vDel.hidden = !(it.kind === 'local' || it.kind === 'mine');
      vDel.textContent = it.kind === 'mine' ? 'Remove my copy from this browser' : 'Remove from this browser';
      vPrev.hidden = vNext.hidden = around(it).length < 2;
      vBack.hidden = false; setParam(it.key); vX.focus({ preventScroll: true });
    }
    function closeView() { if (vBack.hidden) return; vBack.hidden = true; current = null; setParam(null); reopen(); }
    const step = d => { const l = around(current); if (!current || l.length < 2) return; const i = l.findIndex(x => x.key === current.key); openView(l[(i + d + l.length) % l.length]); };
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

    // the form: always for one wall (its topic), named at the top with the topic's own question
    const [fBack, form, fX] = dialog('pw-form', 'Add your photo'); form.noValidate = true; form.setAttribute('aria-labelledby', 'pwFormTitle');
    const fK = el('div', 'pw-k', form);
    const fTitle = el('h2', '', form, 'Add your photo · 掛上你的照片'); fTitle.id = 'pwFormTitle';
    const fTopic = el('p', 'pw-topic', form), fAsk = el('p', 'pw-ask', form);
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
    el('p', 'pw-where ' + (ONLINE ? 'shared' : 'local'), form, ONLINE
      ? 'Your photo is sent to the site’s storage and stays private until the makers approve it. Then everyone who visits can see it.'
      : 'The site’s storage isn’t connected yet, so your photo is kept in this browser and nothing is sent anywhere. ' + ONLY_YOU);
    const fStatus = el('p', 'pw-status', form); fStatus.id = 'pwStatus'; fStatus.setAttribute('role', 'status'); fStatus.setAttribute('aria-live', 'polite');
    const fRow = el('div', 'pw-row', form), fSend = el('button', 'pw-btn pw-primary', fRow, 'Hang my photo'); fSend.type = 'submit';
    const fCancel = el('button', 'pw-btn pw-quiet', fRow, 'Cancel'); fCancel.type = 'button';
    let openedAt = 0, lastSent = 0, prevURL = null, fWall = null;
    const say = (t, ok) => { fStatus.textContent = t; fStatus.classList.toggle('ok', !!ok); };
    const clearBad = () => [fFile, fBody, fOk].forEach(f => { f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); });
    const bad = (f, t) => { clearBad(); f.setAttribute('aria-invalid', 'true'); f.setAttribute('aria-describedby', 'pwStatus'); f.focus({ preventScroll: true }); say(t); };
    const dropPrev = () => { if (prevURL) URL.revokeObjectURL(prevURL); prevURL = null; fPrev.hidden = true; fPrev.removeAttribute('src'); };
    fFile.addEventListener('change', () => { dropPrev(); const f = fFile.files && fFile.files[0]; if (f && /^image\//.test(f.type)) { prevURL = URL.createObjectURL(f); fPrev.src = prevURL; fPrev.hidden = false; } });
    function openForm(w) {
      const ws = addable(); if (!w || !w.free.length) { if (ws.length !== 1) return openGallery(null); w = ws[0]; }   // no wall named and several to choose from: ask which topic first
      remember(); stopWalking(); leaveGallery(); vBack.hidden = true; current = null; setParam(null); fWall = w;
      fK.textContent = w.placeName; const i = w.info;
      fTopic.textContent = i ? [topicName(i), i.years].filter(Boolean).join(' · ') : (w.label || ''); fTopic.hidden = !fTopic.textContent;
      fAsk.textContent = (i && i.ask) || ''; fAsk.hidden = !fAsk.textContent; fBody.placeholder = (i && i.ask) || 'The stall my mother took me to after school…';
      say(''); clearBad(); fSend.disabled = false; fBack.hidden = false; openedAt = performance.now(); setTimeout(() => fFile.focus({ preventScroll: true }), 30);
    }
    function closeForm() { if (fBack.hidden) return; fBack.hidden = true; reopen(); }
    fX.addEventListener('click', closeForm); fCancel.addEventListener('click', closeForm);
    fBack.addEventListener('click', e => { if (e.target === fBack) closeForm(); });

    // the one way a photo is added, used by the form (and by a page's own script if it wants)
    const clampN = (v, a, b) => Math.max(a, Math.min(b, +(+v).toFixed(2)));
    async function add(w, input) {
      const body = String(input.body || '').trim().slice(0, MAX_TEXT), name = String(input.name || '').trim().slice(0, MAX_NAME) || null;
      const year = input.year ? parseInt(input.year, 10) : null;
      if (!w || !w.free.length) throw new Error('This wall does not take photos.');
      if (!input.file || !/^image\//.test(input.file.type)) throw new Error('Choose a photo first.');
      if (!body) throw new Error('Write a short caption first.');
      if (year !== null && (isNaN(year) || year < 1900 || year > THIS_YEAR)) throw new Error('The year should be between 1900 and ' + THIS_YEAR + '.');
      const small = await shrink(input.file);                               // resized here, before it goes anywhere
      const key = ONLINE ? uuid() : 'local-' + uuid();
      const rec = { id: key, key, section: w.section, topic: w.topic || null, x: clampN(w.spot[0], -60, 60), z: clampN(w.spot[1], -500, 250), year, body, name, created_at: new Date().toISOString(),
        blob: small.blob, width: small.width, height: small.height, local: !ONLINE, mine: ONLINE, photo_path: ONLINE ? key + '.jpg' : null };
      if (ONLINE) await upload(rec, small.blob);                             // keys present: private bucket + a pending row
      try { await idbPut(rec); }
      catch (e) { if (!ONLINE) throw new Error('This browser couldn’t save it. Private browsing may be blocking it.'); }
      own.push(rec); layout();
      return { how: ONLINE ? 'pending' : 'local', key, topic: rec.topic, bytes: small.blob.size, width: small.width, height: small.height };
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
        const done = await add(fWall, { file, body: fBody.value, year: fYear.value, name: fName.value });
        lastSent = Date.now(); form.reset(); dropPrev();
        say(done.how === 'local' ? 'Saved in this browser. ' + ONLY_YOU : 'Sent. It appears for everyone once the makers approve it. Until then only you can see it here.', true);
        setTimeout(() => { const b = back; back = undefined; fBack.hidden = true; const it = items.find(x => x.key === done.key); back = b; if (it) openView(it); else reopen(); }, 1400);
      } catch (e) {
        const m = e && e.message;
        say(m === 'unreachable' ? 'Saving failed: the page can’t reach the internet right now. Please try again in a moment.'
          : m === 'timeout' ? 'Saving failed: the connection timed out. Please try again.' : m || 'Saving failed. Please try again.');
      } finally { fSend.disabled = false; }
    });

    // keys: while a dialog is open the scene does not hear the keyboard (typing "w" or "1" must not walk or cut the camera)
    const onKey = ev => {
      const box = !fBack.hidden ? form : !vBack.hidden ? view : !gBack.hidden ? gal : null; if (!box) return;
      ev.stopPropagation();
      if (ev.key === 'Escape') { ev.preventDefault(); if (box === form) closeForm(); else if (box === view) closeView(); else closeGallery(); return; }
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

    // a click or tap (not a drag): anywhere on a showcase opens its gallery; on a plain wall a photo opens large and an empty or "+" frame opens the form
    const ray = new T.Raycaster(), ndc = new T.Vector2(); ray.far = 45; let targets = [];
    const retarget = () => { targets = []; walls.forEach(w => { if (w.showcase) targets.push(w.showcase); else w.frames.forEach(fr => targets.push(fr.mesh)); }); };
    const hitAt = ev => { const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(targets, true)[0]; if (!h) return null;
      for (let n = h.object; n; n = n.parent) { if (n.userData.pwWall) return { wall: n.userData.pwWall }; if (n.userData.photowall && !n.userData.photowall.wall.showcase) return { fr: n.userData.photowall }; }
      return null; };
    let down = null, hoverT = 0;
    const onDown = ev => { down = { x: ev.clientX, y: ev.clientY, t: performance.now() }; };
    const onUp = ev => { const d = down; down = null; if (!d || Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 8 || performance.now() - d.t > 600) return;
      const h = hitAt(ev); if (!h) return; if (h.wall) openGallery(h.wall); else if (h.fr.item) openView(h.fr.item); else openForm(h.fr.wall); };
    const onMove = ev => { if (ev.buttons || ev.pointerType === 'touch') return; const now = performance.now(); if (now - hoverT < 60) return; hoverT = now; canvas.style.cursor = hitAt(ev) ? 'pointer' : ''; };
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointermove', onMove);

    // ── load: this browser's photos first (instant), then everyone's approved ones (keys only) ─
    async function refresh() {
      own = (await idbAll()).filter(r => r && r.id && r.key && r.blob && typeof r.body === 'string');
      layout();
      if (ONLINE) {
        try {
          let rows = []; for (const s of [...new Set(walls.map(w => w.section))]) rows = rows.concat(await fetchApproved(s));
          if (wanted && KEY_RE.test(wanted) && !rows.some(r => r.photo_path.indexOf(wanted) === 0)) rows = rows.concat(await fetchApproved(null, wanted));   // a link to a photo from another place
          shared = rows; layout();
        } catch (e) { console.warn('[photowall] could not load the shared photos:', e.message); }
      }
      return items.length;
    }
    function openWanted() {
      if (!wanted) return;
      const it = items.find(x => x.key === wanted);
      if (it) openView(it);
      else { remember(); current = null; vImg.removeAttribute('src'); vK.textContent = 'Shared photo'; vT.hidden = true; vCap.textContent = 'This photo isn’t here.';
        vBy.textContent = /^local-/.test(wanted) ? 'It was saved in one person’s browser only, so it opens only there.' : 'It may still be waiting for approval, or it was taken down.'; vBy.hidden = false;
        vNote.hidden = true; vShare.hidden = true; vPrev.hidden = vNext.hidden = true; vBack.hidden = false; vX.focus({ preventScroll: true }); }
    }
    let pending = null, first = true;
    const schedule = () => pending || (pending = Promise.resolve().then(() => { pending = null; return refresh(); }).then(n => { if (first) { first = false; openWanted(); selftest(); } return n; }));

    // ?pwtest=add:<topic>,<topic>…  adds one drawn picture to each named topic's wall, then prints every wall and record
    // ?pwtest=show  only prints · ?pwtest=gallery:<topic>  prints, then opens that topic's gallery. For headless checks; inert without the query.
    async function selftest() {
      const q = new URLSearchParams(location.search).get('pwtest'); if (!q) return;
      const [mode, arg] = q.split(':'), list = (arg || '').split(',').filter(Boolean);
      try {
        if (mode === 'add') for (let i = 0; i < list.length; i++) { const w = walls.find(x => x.topic === list[i]); if (!w) { console.log('PWTEST no wall for topic ' + list[i]); continue; }
          const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 900; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 900);
          gr.addColorStop(0, ['#f7b267', '#7fb8d8', '#b8d87f'][i % 3]); gr.addColorStop(1, '#3d2c4a'); g.fillStyle = gr; g.fillRect(0, 0, 1200, 900);
          g.fillStyle = '#fff3d6'; g.font = '700 120px sans-serif'; g.textAlign = 'center'; g.fillText('TEST ' + list[i] + ' #' + (i + 1), 600, 470);
          const blob = await new Promise(ok => cv.toBlob(ok, 'image/png'));
          console.log('PWTEST added ' + JSON.stringify(await add(w, { file: new File([blob], 't.png', { type: 'image/png' }), body: 'test photo ' + (i + 1) + ' for ' + list[i], year: 1990 + i, name: 'pwtest' }))); }
        console.log('PWTEST topics ' + JSON.stringify({ sections: [...new Set(walls.map(w => w.section))].map(s => ({ section: s, topicsInFile: topicsOf(s).length, showcases: walls.filter(w => w.section === s && w.showcase).length })) }));
        console.log('PWTEST walls ' + JSON.stringify(walls.map(w => ({ section: w.section, topic: w.topic, showcase: !!w.showcase, photos: w.items.map(it => it.key + (it.topic ? '[' + it.topic + ']' : '')), frames: w.frames.map(f => f.kind + (f.item ? ':' + f.item.key.slice(0, 14) : '')) }))));
        console.log('PWTEST records ' + JSON.stringify((await idbAll()).map(r => ({ key: r.key, section: r.section, topic: r.topic === undefined ? '(none)' : r.topic, year: r.year, body: r.body, name: r.name, local: r.local, blobType: r.blob && r.blob.type, blobBytes: r.blob && r.blob.size, width: r.width, height: r.height }))));
        if (mode === 'gallery') { const w = walls.find(x => x.topic === list[0]); openGallery(w || null); console.log('PWTEST gallery ' + JSON.stringify({ title: gTitle.textContent, ask: gAsk.textContent, tiles: gGrid.children.length, addButton: !gAdd.hidden })); }
      } catch (e) { console.log('PWTEST error ' + (e && e.message)); }
    }

    function addWall(w) { walls.push(w); retarget(); w.frames.forEach(paint); return schedule(); }
    function removeWall(w) { const i = walls.indexOf(w); if (i >= 0) walls.splice(i, 1); retarget(); layout(); }
    return { walls, addWall, removeWall, paint, layout, refresh, add, openView, openForm, openGallery, closeForm, closeView, closeGallery, schedule,
      list: () => items.map(it => Object.assign({}, it, { frame: undefined, wall: undefined, topic: it.topic, wallTopic: it.wall ? it.wall.topic : null })),
      open: key => openView(items.find(x => x.key === key)), records: idbAll, setKeys(k) { if (k) keysMap = k; }, get ready() { return schedule(); } };
  }

  // ── attach: one wall or showcase joins the page ─────────────────────────────────────────────
  function attach(o) {
    const T = o.THREE || window.THREE, scene = o.scene, camera = o.camera, canvas = o.canvas;
    if (!T || !scene || !camera || !canvas || !Array.isArray(o.frames) || !o.frames.length) throw new Error('PHOTOWALL.attach needs THREE, scene, camera, canvas and frames');
    if (!P) { P = makePage(o); const og = P.openGallery; window.__photowall = Object.assign(P, { ONLINE, openGallery: t => og(typeof t === 'string' ? P.walls.find(w => w.topic === t) : t) }); } else P.setKeys(o.keys);
    const section = PLACE[o.section] ? o.section : 'square';
    const w = { section, topic: o.topic || null, info: topicInfo(section, o.topic), label: o.label || '', placeName: o.place || PLACE[section], buttons: o.buttons, showcase: o.showcase || null, items: [], fixed: [], frames: [], free: [] };
    const first = o.frames[0].position || [0, 0, 0]; w.spot = o.spot || [first[0], first[2]];
    if (w.showcase) w.showcase.userData.pwWall = w;
    w.frames = o.frames.map((f, i) => {
      const fr = { i, f, wall: w, cv: null, tex: null, mesh: null, item: null, img: null, kind: 'empty', own: !f.hit };
      if (f.hit) fr.mesh = f.hit;                                             // a picture the page already hung: only the click is ours
      else {
        const fw = (f.size && f.size[0]) || 2.0, fh = (f.size && f.size[1]) || 1.7;
        fr.cv = document.createElement('canvas'); fr.cv.width = f.cue ? 1024 : 768; fr.cv.height = Math.round(fr.cv.width * fh / fw);
        fr.tex = new T.CanvasTexture(fr.cv); fr.tex.encoding = T.sRGBEncoding; fr.tex.anisotropy = 8;
        const mat = new T.MeshStandardMaterial({ map: fr.tex, roughness: 0.7, emissiveMap: fr.tex, emissive: new T.Color(1, 1, 1), emissiveIntensity: f.glow == null ? 0.18 : f.glow });
        fr.mesh = new T.Mesh(new T.PlaneGeometry(fw, fh), mat);
        fr.mesh.position.set(f.position[0], f.position[1], f.position[2]);
        fr.mesh.rotation.y = Array.isArray(f.facing) ? Math.atan2(f.facing[0], f.facing[2]) : (f.facing || 0);
        fr.mesh.receiveShadow = true; fr.mesh.name = 'photowall-frame-' + i;
        (f.parent || o.parent || scene).add(fr.mesh);
      }
      fr.mesh.userData.photowall = fr; return fr;
    });
    w.free = w.frames.filter(fr => !(fr.f.photo && fr.f.photo.url) && !fr.f.cue && !fr.f.hit);
    w.fixed = w.frames.filter(fr => fr.f.photo && fr.f.photo.url).map(fr => { const p = fr.f.photo;
      return { key: 'fixed-' + (p.id || (P.walls.length + '-' + fr.i)), kind: 'fixed', body: p.caption || '', year: p.year || null, place: p.place || w.placeName, credit: p.credit || '', url: p.url, frame: fr, wall: w, info: null }; });
    const ready = P.addWall(w);
    return { ONLINE, ready, topic: w.topic, section, frames: w.frames, wall: w, list: () => w.items.map(it => Object.assign({}, it, { frame: undefined, wall: undefined })),
      open: key => P.open(key), openGallery: () => P.openGallery(w), openForm: () => P.openForm(w), closeForm: P.closeForm, closeView: P.closeView, closeGallery: P.closeGallery,
      add: input => P.add(w, input), refresh: P.refresh, records: idbAll,
      dispose() { P.removeWall(w); w.frames.forEach(fr => { if (!fr.own) return; fr.mesh.parent && fr.mesh.parent.remove(fr.mesh); fr.mesh.geometry.dispose(); fr.mesh.material.dispose(); fr.tex.dispose(); }); } };
  }

  // ── showcases: the small shop, stand, poster board, shrine wall or kiosk that shows one topic in the scene ──
  const ACCENT = { square: '#1f2a44', red: '#b7372a', dadao: '#8a5a34', tower: '#1f5e8c' };
  const kits = new WeakMap();
  function kit(E) {
    if (kits.has(E)) return kits.get(E);
    const T = E.T, k = {
      plaster: E.triMat({ color: '#e9dfca', tex: E.TEX.plaster, scale: 0.5, rough: 0.9 }),
      stone: E.triMat({ color: '#b9b2a6', tex: E.TEX.concrete, scale: 1.2, rough: 0.6 }),
      wood: E.triMat({ color: '#8a6a48', tex: E.TEX.bark, scale: 2, rough: 0.8 }),
      steel: E.triMat({ color: '#b9bcc0', tex: E.TEX.metal, scale: 3, rough: 0.3, metal: 0.8 }),
      dark: new T.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.6 }),
      frame: new T.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.5 }),
      goods: ['#7a1f1a', '#d9852b', '#c9a56a', '#7d8f3a', '#d43a5a'].map(c => new T.MeshStandardMaterial({ color: E.col(c), roughness: 0.75 })),
      awning(hex) { const t = E.canvasTex(256, (c, s) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f1e6d0' : hex; c.fillRect(i * s / 8, 0, s / 8, s); } E.speckle(c, s, 2500, 0.1, true); });
        const m = new T.MeshStandardMaterial({ map: t, roughness: 0.9, side: T.DoubleSide, emissiveMap: t, emissive: new T.Color(0.9, 0.6, 0.3), emissiveIntensity: 0.3 }); return m; },
      tint(hex) { return E.triMat({ color: hex, tex: E.TEX.plaster, scale: 0.5, rough: 0.88 }); },
    };
    kits.set(E, k); return k;
  }
  // a title or text plate: lines = [[text, size as a share of the plate's height, y 0..1, weight]], each shrunk to fit the width
  function plate(T, lines, w, h, bg, fg, glow) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.max(64, Math.round(1024 * h / w)); const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(([txt, size, y, weight]) => { if (!txt) return; let px = Math.round(H * size); g.font = `${weight || 700} ${px}px ${FONT}`; const mw = g.measureText(txt).width, max = W - 70;
      if (mw > max) { px = Math.floor(px * max / mw); g.font = `${weight || 700} ${px}px ${FONT}`; } g.fillText(txt, W / 2, H * y); });
    const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: t, roughness: 0.6, emissiveMap: t, emissive: new T.Color(1, 1, 1), emissiveIntensity: glow == null ? 0.5 : glow }));
  }
  // each kind builds its body with box() and returns where the title, the photo frames and the "see all" plate go
  // (all [x, y, z, w, h] on its front, which looks along +Z), and its footprint [u0, u1, v0, v1].
  const KINDS = {
    wall(E, K, box, o) { box(3.8, 0.25, 0.7, K.stone, 0, 0.125, 0); box(3.6, 2.5, 0.3, o.body === 'brick' ? E.MATS.brick : o.body ? K.tint(o.body) : K.plaster, 0, 1.5, 0); box(3.6, 1.0, 0.14, K.dark, 0, 3.25, 0);
      return { title: [0, 3.25, 0.075, 3.5, 0.9], frames: [[-0.9, 1.8, 0.21, 1.45, 1.2], [0.9, 1.8, 0.21, 1.45, 1.2]], cue: [0, 0.78, 0.155, 3.0, 0.36], foot: [-1.9, 1.9, -0.35, 0.35] }; },
    shop(E, K, box, o, accent) { const T = E.T; box(3.6, 3.3, 1.4, K.tint(o.body || '#d8c8ac'), 0, 1.65, -0.7); box(3.9, 0.14, 1.7, K.dark, 0, 3.37, -0.7); box(3.6, 0.3, 0.12, K.stone, 0, 0.15, 0.04);
      box(3.8, 0.05, 0.95, K.awning(accent), 0, 2.22, 0.45).rotation.x = 0.22;
      [-1.2, 0, 1.2].forEach(x => { const b = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), E.GLOW(4.5, 3.0, 1.3)); b.position.set(x, 2.08, 0.5); o.g.add(b); });
      return { title: [0, 2.82, 0.012, 3.5, 0.86], frames: [[-0.86, 1.36, 0.07, 1.42, 1.16], [0.86, 1.36, 0.07, 1.42, 1.16]], cue: [0, 0.5, 0.11, 3.0, 0.34], foot: [-1.95, 1.95, -1.45, 0.15], glow: 0.3 }; },
    stand(E, K, box, o, accent) { const T = E.T; box(3.2, 0.9, 0.9, K.wood, 0, 0.45, 0.5); box(3.3, 0.06, 1.0, K.steel, 0, 0.93, 0.5); box(3.2, 2.3, 0.12, K.plaster, 0, 2.05, -0.06);
      [[-1.62, 0.96], [1.62, 0.96], [-1.62, -0.06], [1.62, -0.06]].forEach(([x, z]) => { const p = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 3.15, 6), K.steel); p.position.set(x, 1.575, z); p.castShadow = true; o.g.add(p); });
      box(3.6, 0.05, 1.5, K.awning(accent), 0, 3.17, 0.5).rotation.x = 0.14; box(3.4, 0.9, 0.12, K.dark, 0, 3.78, -0.06);
      [-1.15, -0.4, 0.4, 1.15].forEach((x, i) => { const c = new T.Mesh(new T.CylinderGeometry(0.22, 0.18, 0.24, 12), K.wood); c.position.set(x, 1.08, 0.66); c.castShadow = true; o.g.add(c);
        const s = new T.Mesh(new T.SphereGeometry(0.2, 12, 8), K.goods[i % K.goods.length]); s.scale.y = 0.55; s.position.set(x, 1.2, 0.66); o.g.add(s); });
      [-0.9, 0.9].forEach(x => { const b = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), E.GLOW(4.5, 3.0, 1.3)); b.position.set(x, 2.95, 0.6); o.g.add(b); });
      return { title: [0, 3.78, 0.005, 3.3, 0.8], frames: [[-0.82, 2.08, 0.03, 1.4, 1.15], [0.82, 2.08, 0.03, 1.4, 1.15]], cue: [0, 0.5, 0.96, 2.7, 0.36], foot: [-1.75, 1.75, -0.2, 1.0], glow: 0.38 }; },
    poster(E, K, box, o, accent) { const T = E.T; box(2.0, 0.3, 0.9, K.stone, 0, 0.15, 0); box(1.8, 4.4, 0.22, K.dark, 0, 2.5, 0); box(1.0, 1.0, 0.6, K.wood, 1.75, 0.5, 0.05); box(1.1, 0.05, 0.72, K.steel, 1.75, 1.04, 0.05).rotation.x = 0.22;
      [-0.6, 0.6].forEach(x => { const b = new T.Mesh(new T.BoxGeometry(0.3, 0.05, 0.12), E.GLOW(3.2, 1.9, 0.75)); b.position.set(x, 0.33, 0.36); o.g.add(b); });
      return { title: [0, 4.1, 0.115, 1.7, 1.0], frames: [[0, 2.85, 0.15, 1.5, 1.2], [0, 1.55, 0.15, 1.5, 1.2]], cue: [0, 0.68, 0.115, 1.6, 0.3], foot: [-1.05, 2.3, -0.5, 0.5], zh: 0.4 }; },
    shrine(E, K, box, o) { const T = E.T; box(3.6, 0.25, 0.8, K.stone, 0, 0.125, 0); box(3.2, 3.0, 0.35, E.MATS.verm, 0, 1.75, 0); box(4.2, 0.16, 1.3, E.MATS.ink, 0, 3.36, 0); box(3.6, 0.26, 0.3, E.MATS.ink, 0, 3.56, 0);
      [-1, 1].forEach(k => { box(0.5, 0.2, 0.3, E.MATS.ink, k * 1.98, 3.66, 0).rotation.z = k * 0.5;
        const c = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.42, 5), K.dark); c.position.set(k * 1.85, 3.07, 0.45); o.g.add(c);
        const l = new T.Mesh(new T.SphereGeometry(0.24, 14, 10), new T.MeshBasicMaterial({ color: new T.Color(1.9, 0.26, 0.1) })); l.scale.y = 0.84; l.position.set(k * 1.85, 2.68, 0.45); o.g.add(l); });
      return { title: [0, 2.8, 0.185, 2.9, 0.72], frames: [[-0.78, 1.78, 0.235, 1.35, 1.1], [0.78, 1.78, 0.235, 1.35, 1.1]], cue: [0, 0.74, 0.185, 2.8, 0.34], foot: [-1.9, 1.9, -0.45, 0.45], bg: '#2a1a14', fg: '#f3d27a' }; },
    kiosk(E, K, box, o) { const T = E.T; box(2.8, 2.7, 1.8, E.MATS.ink, 0, 1.35, -0.9); box(3.6, 0.12, 2.6, K.steel, 0, 2.78, -0.7); box(3.0, 0.9, 0.12, K.dark, 0, 3.3, -0.2);
      const s = new T.Mesh(new T.BoxGeometry(3.4, 0.04, 0.04), E.GLOW(1.2, 1.9, 2.6)); s.position.set(0, 2.69, 0.55); o.g.add(s);
      return { title: [0, 3.3, -0.135, 2.9, 0.8], frames: [[-0.68, 1.62, 0.07, 1.22, 1.0], [0.68, 1.62, 0.07, 1.22, 1.0]], cue: [0, 0.62, 0.012, 2.5, 0.34], foot: [-1.5, 1.5, -1.85, 0.15], glow: 0.3 }; },
  };
  function showcase(E, o) {
    const T = E.T, K = kit(E), info = topicInfo(o.section, o.topic) || { zh: o.topic || '', en: '', years: '' };
    const accent = o.accent || ACCENT[o.section] || ACCENT.square, kind = KINDS[o.kind] ? o.kind : 'wall';
    const g = new T.Group(); g.name = 'showcase-' + (o.topic || ''); g.position.set(o.at[0], 0, o.at[1]); g.rotation.y = o.facing || 0;
    const box = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    const L = KINDS[kind](E, K, box, Object.assign({}, o, { g }), accent);
    const [tx, ty, tz, tw, th] = L.title;
    const title = plate(T, [[info.zh, L.zh || 0.5, 0.39], [[info.en, info.years].filter(Boolean).join('  ·  '), 0.19, 0.8, 600]], tw, th, L.bg || accent, L.fg || '#fff3d6', 0.6);
    title.position.set(tx, ty, tz); g.add(title);
    const frames = L.frames.map(([x, y, z, w, h]) => { box(w + 0.2, h + 0.2, 0.06, K.frame, x, y, z - 0.03); return { position: [x, y, z + 0.012], size: [w, h], facing: 0, parent: g, glow: L.glow }; });
    frames.push({ position: [L.cue[0], L.cue[1], L.cue[2] + 0.012], size: [L.cue[3], L.cue[4]], facing: 0, parent: g, cue: true, glow: 0.55 });
    E.scene.add(g);
    const api = attach({ THREE: T, scene: E.scene, camera: E.camera, canvas: E.canvas, keys: E.keys, section: o.section, topic: o.topic, place: o.place, spot: o.at, frames, showcase: g });
    api.group = g; api.kind = kind; api.footprint = block({ x: o.at[0], z: o.at[1], facing: o.facing || 0, u0: L.foot[0], u1: L.foot[1], v0: L.foot[2], v1: L.foot[3] });
    return api;
  }
  // one showcase per topic of the section, each at its named spot: spots = { topicKey: [x, z, facing, kind, options] }
  function showcases(E, o) {
    const spare = (o.spare || []).slice();
    return (Array.isArray(o.topics) ? o.topics.filter(t => t && t.key) : topicsOf(o.section)).map(t => { const s = (o.spots && o.spots[t.key]) || spare.shift();
      if (!s) { console.warn('[photowall] no place in this scene for the topic "' + t.key + '": add it to the page\'s spots'); return null; }
      return showcase(E, Object.assign({ section: o.section, topic: t.key, place: o.place, at: [s[0], s[1]], facing: s[2] || 0, kind: s[3] }, s[4] || {})); }).filter(Boolean);
  }

  window.PHOTOWALL = { attach, row, showcase, showcases, block, keepOut, topics: topicsOf, ONLINE };
})();
