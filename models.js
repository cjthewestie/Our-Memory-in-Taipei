// models.js — the glb models (issue #5). Loaded before app.js; everything here that touches the
// engine (window.SCENE) runs inside load callbacks, after every script has run.
// Every model is built by a Blender script in asset/blender/ and exported to asset/models/
// (see asset/blender/stylized.py), then packed in place by tools/pack-models.sh (meshopt, fault 1,
// 2026-09-24): the loader needs meshopt_decoder.js, loaded after GLTFLoader.js. This file loads them
// once, hands the scene files what they need, and keeps the page's look on them: Lambert materials
// with the fog chunk, flat palette colours carried over from the glb, shadows on.
//
//   MODELS.load(name, cb)              loads asset/models/<name>.glb once, calls back (cached)
//   MODELS.lambertize(root)            swaps the loader's Standard materials for the page's Lambert
//   MODELS.node(root, name)            the glb node called name (a script's group=)
//   MODELS.prims(root)                 every mesh under root: [{ mesh, geometry, color }]
//   MODELS.unitGeo(geometry)           a copy with height 1 and base at y 0, for instSet items
//                                       whose h is the real height ({ geo, height })
//   MODELS.instance(node, items, opts) one instSet per primitive of node, items shared, so a glb
//                                       street element gets the engine's per-era height tween
//
// Late models (fault 1, CJ 2026-09-24: 「東西太多loading太久」). The camera opens in Ximending and
// takes a while to reach Dadaocheng, so chapter 2's and chapter 3's models are held out of the first
// request: a load() for one of them queues its callback, and the fetch starts when the scroll gets
// near (LATE_AT) or, whichever comes first, LATE_IDLE_MS after the page's load event — chapter 2's
// group, then chapter 3's once it is in. A model that arrives this way rises out of the ground over
// the engine's era tween (SCENE.rise, instSet's rise option) instead of popping in, so a bay that
// lands while the camera can already see down the street grows the way the era change grows things.
(function () {
  if (!window.THREE) return;
  const loader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
  if (loader && window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);
  else if (loader) console.error('meshopt_decoder.js is missing: the packed glbs need it (load it after GLTFLoader.js)');
  const cache = {};

  // Three requests, not eighteen (CJ, 2026-09-25: 「載很久」). Eighteen separate glbs queued on
  // GitHub Pages: a 2 KB bollard.glb was taking 5.7 seconds because it was waiting its turn, not
  // because it was large. tools/bundle-models.mjs merges them into one file per load group, each
  // model's contents re-parented under a node carrying its old file name — so load('props', …)
  // still hands back something whose children are the same nodes they always were.
  //
  // group 0 = the first request (chapter 1 and everything shared), group 1 = Spring Festival
  // (z -140 … -290), group 2 = The Future (z -290 on). A late group's fetch starts when the scroll
  // gets near (LATE_AT) or LATE_IDLE_MS after the load event, whichever comes first; its models
  // rise out of the ground over the era tween instead of popping in.
  const BUNDLES = {
    'bundle-core':  { group: 0, names: ['bollard','chunghwa','girl','lamp','lux','props','red-house','shopfront','tree','wannian','ximen-gate'] },
    'bundle-dadao': { group: 1, names: ['dihua-min','dihua-yang','dihua-baroque','dihua-zone2','dadao-entrance','stall','temple','yongle'] },
    'bundle-tower': { group: 2, names: ['tower101','skywalk','a11','cityhall'] },
    'bundle-square': { group: 0, names: ['sq-arcade','sq-gate','sq-banyan','sq-scooter','sq-planter'] },   // square.js: the walk-mode square
  };
  const BUNDLE_OF = {};                                   // model name → bundle file name
  Object.keys(BUNDLES).forEach(b => BUNDLES[b].names.forEach(n => BUNDLE_OF[n] = b));

  const LATE_AT = [0, 0.04, 0.30];      // scroll fraction that releases a group early (chapter 2 begins at 0.347, chapter 3 at 0.582)
  const LATE_IDLE_MS = 1500;            // after the load event, group 1 starts anyway; group 2 follows it
  const held = { 1: [], 2: [] }, released = { 1: false, 2: false }, inflight = { 1: 0, 2: 0 };
  const bundles = {};                   // bundle name → { gltf } | { waiting: [names] }
  let coreReady = false;
  const coreWaiters = [];

  function load(name, cb) {
    if (!loader) { console.error('THREE.GLTFLoader is missing: load GLTFLoader.js after three.min.js'); return; }
    const e = cache[name];
    if (e && e.gltf) { cb(e.gltf); return; }
    if (e) { e.waiting.push(cb); return; }
    const bundleName = BUNDLE_OF[name];
    if (!bundleName) { console.error(name + ' is in no bundle: add it to tools/bundle-models.mjs'); return; }
    const g = BUNDLES[bundleName].group;
    cache[name] = { waiting: [cb], group: g };
    if (g && !released[g]) { if (held[g].indexOf(name) < 0) held[g].push(name); return; }
    fetch(name);
  }

  // fetch(name) loads name's bundle if it is not already in, then hands every model waiting on
  // that bundle its own node out of it.
  function fetch(name) {
    const bundleName = BUNDLE_OF[name], b = bundles[bundleName];
    if (b && b.gltf) { deliver(bundleName); return; }
    if (b) return;                                        // already in flight; deliver() will catch it
    const g = BUNDLES[bundleName].group;
    bundles[bundleName] = { loading: true };
    if (g) inflight[g]++;
    loader.load('asset/models/' + bundleName + '.glb', gltf => {
      bundles[bundleName] = { gltf };
      deliver(bundleName);
      if (g === 0) { coreReady = true; coreWaiters.splice(0).forEach(f => f()); }
      done(g);
    }, undefined, err => {
      console.error(bundleName + '.glb failed to load', err);
      bundles[bundleName] = { failed: true };
      if (g === 0) { coreReady = true; coreWaiters.splice(0).forEach(f => f()); }
      done(g);
    });
  }

  function deliver(bundleName) {
    const b = bundles[bundleName];
    if (!b || !b.gltf) return;
    const g = BUNDLES[bundleName].group;
    BUNDLES[bundleName].names.forEach(n => {
      const e = cache[n];
      if (!e || e.gltf) return;
      const scene = b.gltf.scene.getObjectByName(n);
      if (!scene) { console.error(n + ' is missing from ' + bundleName + '.glb'); return; }
      scene.userData.late = g > 0;                        // a late group: rise, do not pop
      const one = { scene, animations: b.gltf.animations };
      const w = e.waiting;
      cache[n] = { gltf: one, waiting: [], group: g };
      w.forEach(f => f(one));
    });
  }

  function done(g) { if (g && --inflight[g] === 0 && g === 1) release(2); }
  function release(g) {
    if (released[g]) return;
    released[g] = true;
    const names = held[g]; held[g] = [];
    names.forEach(fetch);
    if (g === 1 && !names.length) release(2);
  }
  const scrollFrac = () => window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  function onScroll() {
    const f = scrollFrac();
    if (f >= LATE_AT[1]) release(1);
    if (f >= LATE_AT[2]) release(2);
    if (released[2]) window.removeEventListener('scroll', onScroll);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  const idle = () => setTimeout(() => release(1), LATE_IDLE_MS);
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle);

  // onCoreReady(cb): the opening veil waits on this, so nobody watches the street assemble itself
  // out of black boxes (CJ, 2026-09-25: 「為什麼第一次跑的時候還是破圖加黑屏」). Chapter 1 only —
  // the veil must never wait on chapter 3.
  function onCoreReady(cb) { if (coreReady) cb(); else coreWaiters.push(cb); }

  const isLate = o => { for (let p = o; p; p = p.parent) if (p.userData && p.userData.late) return true; return false; };

  function lambertize(root) {
    const { withFog, rise } = window.SCENE;
    root.traverse(o => {
      if (!o.isMesh) return;
      o.material = withFog(new THREE.MeshLambertMaterial({ color: o.material.color }));
      o.castShadow = o.receiveShadow = true;
    });
    if (rise && isLate(root)) rise(root);
    return root;
  }

  // node(root, name): three.js's GLTFLoader makes node names unique within a file, so once the
  // models share one bundle the three dihua styles' 'main' becomes main, main_1, main_2. The
  // search is scoped to one model's wrapper, where the name is unambiguous, so a _N suffix is
  // the same node and we take it (CJ, 2026-09-25: the bundling fault).
  function node(root, name) {
    const exact = root.getObjectByName(name);
    if (exact) return exact;
    const re = new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '_\\d+$');
    let found = null;
    root.traverse(o => { if (!found && o.name && re.test(o.name)) found = o; });
    return found;
  }

  function prims(root) {
    const out = [];
    root.traverse(o => { if (o.isMesh) out.push({ mesh: o, geometry: o.geometry, color: o.material.color.clone() }); });
    return out;
  }

  function unitGeo(geometry) {
    const g = geometry.clone();
    g.computeBoundingBox();
    const b = g.boundingBox, h = (b.max.y - b.min.y) || 1;
    g.translate(0, -b.min.y, 0);
    g.scale(1, 1 / h, 1);
    return { geo: g, height: h };
  }

  // instance(node, items, opts): items are instSet items ({ x, z, y?, w, d, r?, h:{era…}, c? });
  // every primitive of the node becomes one instSet over the same items. opts.height (default the
  // node's own height) is what an item's h of 1 means: items usually say h: only-eras(1), and the
  // real height comes from the model. opts.colorPrim = the material colour name whose primitive
  // takes per-item colours (it.c) — its material goes white so the instance colour is the colour.
  // opts.emissive = { color, intensity } for the 'lamp' primitives (lantern heads, bulbs).
  function instance(root, items, opts) {
    opts = opts || {};
    const { instSet, withFog } = window.SCENE;
    const ps = prims(root);
    let top = 0;
    ps.forEach(p => { p.geometry.computeBoundingBox(); top = Math.max(top, p.geometry.boundingBox.max.y); });
    const H = opts.height || top || 1;
    const sets = [], late = isLate(root);
    ps.forEach(p => {
      const g = p.geometry.clone();
      g.scale(1, 1 / H, 1);                                      // base stays at y 0, model top → 1
      const isColor = opts.colorPrim && p.color.getHex() === window.SCENE.C(opts.colorPrim).getHex();
      const m = new THREE.MeshLambertMaterial({ color: isColor ? 0xffffff : p.color });
      if (opts.emissive && p.color.getHex() === window.SCENE.C('lamp').getHex()) { m.emissive = window.SCENE.C('lamp'); m.emissiveIntensity = opts.emissive; }
      const its = items.map(it => Object.assign({}, it, { h: scaleH(it.h, H), c: isColor ? it.c : undefined }));
      sets.push(instSet(g, m, its, { colors: !!isColor, rise: late }));
    });
    return sets;
  }
  const scaleH = (h, H) => { const o = {}; Object.keys(h).forEach(k => o[k] = h[k] * H); return o; };

  window.MODELS = { load, lambertize, node, prims, unitGeo, instance, onCoreReady,
                    get coreReady() { return coreReady; },
                    get late() { return { released: { ...released }, held: { 1: held[1].slice(), 2: held[2].slice() }, inflight: { ...inflight } }; } };
})();
