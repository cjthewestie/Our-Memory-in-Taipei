// Headless captures of the walk-mode square from three fixed views, plus rAF frame time.
// Usage: node scripts/capture-square.cjs <label> <port> [page]
//   before-shots: make a page without the square scripts first, e.g.
//   grep -v 'square-paving.js\|square-light.js\|src="square.js"' index.html > _before-index.html  (delete it after)
//   writes research/blender-detail/square/<label>-1..3.png and merges { <label>: {...} } into
//   research/blender-detail/square/metrics.json (mean / p95 frame ms over 3 s, console errors).
// Views (the girl is placed through window.__walk.st, the same state walk.js steps every frame):
//   1 arrival      — where startWalk() puts her: south side of the square, facing north
//   2 west gate    — east of centre, facing west toward the 西門町 gate
//   3 north gate   — south-east of centre, facing north toward the 大稻埕 gate
const fs = require('node:fs');
const path = require('node:path');
let pw;
for (const c of [process.env.PW_PATH, 'playwright', '/Users/cjthewestie/Documents/CJ-project-vault/agent-flow-studio/node_modules/playwright',
                 '/Users/cjthewestie/.npm/_npx/a492cbed87824007/node_modules/playwright'].filter(Boolean)) {
  try { pw = require(c); break; } catch (_) { /* next */ }
}
if (!pw) throw new Error('playwright not found: set PW_PATH');
const label = process.argv[2] || 'after', port = Number(process.argv[3] || 8933);
const page = process.argv[4] || '';   // optional page path, e.g. _test-square.html (the shared index.html is never edited for tests)
const out = path.resolve(__dirname, '..', 'research/blender-detail/square');
const VIEWS = [
  { n: 1, name: 'arrival',    dx: 0,   dz: 14, h: 0,           pitch: 0.18 },
  { n: 2, name: 'west-gate',  dx: 12,  dz: 3,  h: Math.PI / 2, pitch: 0.16 },
  { n: 3, name: 'north-gate', dx: -2,  dz: 4,  h: 0,           pitch: 0.16 },   // between the gallery walls
];
const frames = (p, n) => p.evaluate(n => new Promise(r => { let k = 0; const f = () => ++k >= n ? r() : requestAnimationFrame(f); requestAnimationFrame(f); setTimeout(r, 20000); }), n);

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await pw.chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const res = { label, when: new Date().toISOString(), viewport: '1440x900', console: [], errors: [], httpErrors: [], views: {} };
  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') res.console.push({ type: m.type(), text: m.text().slice(0, 300) }); });
    p.on('pageerror', e => res.errors.push(e.message));
    p.on('response', r => { if (r.status() >= 400) res.httpErrors.push({ status: r.status(), url: r.url() }); });
    await p.goto(`http://127.0.0.1:${port}/${page}`, { waitUntil: 'domcontentloaded', timeout: 400000 });
    // poll by hand (waitForFunction timed out here under SwiftShader while a plain evaluate answered at once)
    const until = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.evaluate(fn).catch(() => false)) return true; await new Promise(r => setTimeout(r, 2000)); } return false; };
    if (!await until(() => !!(window.__walk && window.MODELS && window.MODELS.coreReady), 400000)) throw new Error('page never got ready');
    res.squareReady = await until(() => !window.SQUARE || window.SQUARE.ready, 120000);
    await frames(p, 8);
    // hide the HUD so the shots show the square, not the overlay text
    await p.addStyleTag({ content: '#walkHud,#wkWalk,.wk-square,.wk-hint{display:none!important}' });
    for (const v of VIEWS) {
      await p.evaluate(v => {
        const W = window.__walk, st = W.st, SQ = W.SQ;
        st.x = SQ.x + v.dx; st.z = SQ.z + v.dz; st.h = st.yaw = v.h; st.pitch = v.pitch; st.vx = st.vz = 0;
      }, v);
      await frames(p, 8);
      await p.screenshot({ path: path.join(out, `${label}-${v.n}.png`), timeout: 240000 });
      res.views[v.n] = v.name;
    }
    // phone: 390×844 at the arrival spot, HUD shown (the lanterns-behind-the-HUD check)
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => { const st = document.querySelector('style:last-of-type'); if (st && /walkHud/.test(st.textContent)) st.remove(); });
    await p.evaluate(() => { const W = window.__walk, st = W.st, SQ = W.SQ; st.x = SQ.x; st.z = SQ.z + SQ.h - 12; st.h = st.yaw = 0; st.pitch = 0.28; });
    await frames(p, 8);
    await p.screenshot({ path: path.join(out, `${label}-phone.png`), timeout: 240000 });
    await p.setViewportSize({ width: 1440, height: 900 });
    // frame time: view 1, 3 s of rAF
    await p.evaluate(() => { const W = window.__walk, st = W.st, SQ = W.SQ; st.x = SQ.x; st.z = SQ.z + 20; st.h = st.yaw = 0; });
    await frames(p, 8);
    res.frame = await p.evaluate(() => new Promise(r => {
      const d = []; let last = null, t0 = null;
      const f = t => { if (last !== null) d.push(t - last); else t0 = t; last = t; if (t - t0 < 3000) requestAnimationFrame(f); else {
        d.sort((a, b) => a - b); const mean = d.reduce((a, b) => a + b, 0) / d.length;
        r({ frames: d.length, meanMs: +mean.toFixed(2), p95Ms: +d[Math.floor(d.length * 0.95)].toFixed(2) }); } };
      requestAnimationFrame(f);
    }));
    res.render = await p.evaluate(() => { const i = window.RIG.renderer.info; return { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures }; });
  } finally { await browser.close(); }
  const mf = path.join(out, 'metrics.json');
  const all = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : {};
  all[label] = res;
  fs.writeFileSync(mf, JSON.stringify(all, null, 2));
  console.log(JSON.stringify({ label, frame: res.frame, render: res.render, errors: res.errors, console: res.console.filter(c => c.type === 'error'), httpErrors: res.httpErrors }, null, 1));
})();
