// Headless before/after capture for the Blender model upgrade (research/blender-detail/).
// Usage: node scripts/capture-districts.cjs <label> [port]
//   Serves nothing itself: run `python3 -m http.server <port> --bind 127.0.0.1` from the repo root first.
//   Optional env SERVE_ROOT / SERVE_COMMIT (see below) when serving a clean export.
//   Writes research/blender-detail/<label>/<district>-<n>.png and metrics.json.
//   PROBE=1 node scripts/capture-districts.cjs probe [port] sweeps fractions and prints which landmarks
//   are in frame (no screenshots), the way the fixed SHOTS below were picked.
// Headless only. GPU first (ANGLE Metal on this Mac); falls back to SwiftShader if WebGL is missing.
// Requests to any host other than the local server are aborted: the YouTube iframe API otherwise hangs
// the load event in a sandbox, and a before/after must not depend on the network.
const fs = require('node:fs');
const path = require('node:path');
let pw;
for (const m of ['playwright',
  '/Users/cjthewestie/Documents/CJ-project-vault/agent-flow-studio/node_modules/playwright',
  '/Users/cjthewestie/Documents/CJ-project-vault/Mars-Farm/node_modules/playwright']) {
  try { pw = require(m); break; } catch (_) {}
}
if (!pw) { console.error('playwright not found'); process.exit(1); }

const label = process.argv[2];
const port = Number(process.argv[3] || 8173);
if (!label) { console.error('usage: node scripts/capture-districts.cjs <label> [port]'); process.exit(1); }
const ORIGIN = `http://127.0.0.1:${port}/`;
const PAGE = ORIGIN + '?tour=1';   // the scroll tour; the bare URL opens the walkable lantern square (walk.js), which does not scroll
const out = path.resolve(__dirname, '..', 'research/blender-detail', label);
const PROBE = process.env.PROBE === '1';
// SERVE_ROOT: the folder the http.server serves (default this repo); SERVE_COMMIT: the commit it should
// match (default HEAD). For a clean run while other work sits uncommitted in the worktree:
//   git archive <commit> | tar -x -C <dir>; serve <dir>; SERVE_ROOT=<dir> SERVE_COMMIT=<commit> node ...
const ROOT = path.resolve(process.env.SERVE_ROOT || path.resolve(__dirname, '..'));
const SERVE_COMMIT = process.env.SERVE_COMMIT || 'HEAD';

// Two fixed scroll fractions per district (chapter fractions: red 0.02–0.347, dadao 0.347–0.582,
// tower 0.582–1.0). Picked with PROBE=1: each frames the named landmarks (see `why`).
const SHOTS = [
  { district: 'ximen', n: 1, u: 0.14, why: 'camZ -7: the 中華商場 row runs down the left (north end at x -0.66), Red House ahead right' },
  { district: 'ximen', n: 2, u: 0.22, why: 'camZ -47: Red House close on the right (x 0.50), 萬年大樓 ahead left (x -0.76)' },
  { district: 'dadao', n: 1, u: 0.38, why: 'camZ -164: inside the 迪化街 arcade rows, 霞海城隍廟 ahead left (x -0.51)' },
  { district: 'dadao', n: 2, u: 0.46, why: 'camZ -216: 霞海城隍廟 close left (x -0.84), 永樂市場 ahead left (x -0.42)' },
  { district: 'xinyi', n: 1, u: 0.66, why: 'camZ -325: 101 ahead, 新光三越 A11 right (x 0.37), skywalk across the lower frame (y -0.62)' },
  { district: 'xinyi', n: 2, u: 0.78, why: 'camZ -367: the base shot HANDOFF measures at, 101 west face, A11 at the right edge (x 0.85), skywalk deck at the bottom' },
];
// world points per landmark (x, y, z) from scene-red.js, scene-dadao.js, scene-tower.js
const LANDMARKS = {
  chunghwa_s: [-11, 5, 30], chunghwa_n: [-11, 5, -35], redhouse: [16.6, 6, -70], wannian: [-16, 16, -124],
  dihua_w: [-8, 6, -165], dihua_e: [8, 6, -200], temple: [-13, 4, -240], yongle: [-14, 10, -274],
  t101_base: [0, 30, -420], t101_top: [0, 300, -420], a11: [22, 17, -394], skywalk: [0, 7, -392],
};

// which commit the served page is, and whether the files the page loads match it (other work may sit
// uncommitted in the worktree; a fair before/after needs to know what was actually served)
function gitState() {
  const { execSync } = require('node:child_process');
  const repo = path.resolve(__dirname, '..'), run = c => { try { return execSync(c, { cwd: repo, encoding: 'utf8' }).trim(); } catch (_) { return null; } };
  const commit = run(`git rev-parse --short ${SERVE_COMMIT}`);
  const files = ['index.html', 'app.js', 'models.js', 'data.js', 'walk.js', 'scene-red.js', 'scene-dadao.js', 'scene-tower.js',
    ...fs.readdirSync(path.join(ROOT, 'asset/models')).filter(f => /^bundle-.*\.glb$/.test(f)).map(f => 'asset/models/' + f)];
  const dirty = files.filter(f => run(`git rev-parse -q --verify ${SERVE_COMMIT}:${f}`) !== run(`git hash-object "${path.join(ROOT, f)}"`));
  return { servedFrom: ROOT, commit, servedFilesDifferingFromCommit: dirty };
}

const frames = (p, n) => p.evaluate(n => new Promise(r => { let k = 0; const f = () => ++k >= n ? r() : requestAnimationFrame(f); requestAnimationFrame(f); }), n);
const position = async (p, u) => {
  await p.evaluate(u => scrollTo(0, u * (document.documentElement.scrollHeight - innerHeight)), u);
  await p.waitForFunction(() => Math.abs(__fog.progress - scrollY / (document.documentElement.scrollHeight - innerHeight)) < 1e-8, null, { timeout: 60000 });
  await frames(p, 90);
  return p.evaluate(L => {
    const c = RIG.camera, vis = {};
    for (const [k, v] of Object.entries(L)) {
      const w = new THREE.Vector3(...v).project(c);
      if (w.z < 1 && Math.abs(w.x) < 1 && Math.abs(w.y) < 1) vis[k] = [+w.x.toFixed(2), +w.y.toFixed(2)];
    }
    return { u: +__fog.progress.toFixed(4), camZ: +c.position.z.toFixed(2), year: __fog.year, era: __fog.era, inFrame: vis };
  }, LANDMARKS);
};
// rAF frame intervals over ms, plus triangles / draw calls of the scene pass (renderer.info resets on
// each render() call, so the post pass would leave 1 draw / 2 triangles: wrap render() and keep the
// largest call of the window, which is the scene pass including its shadow map pass).
const sample = (p, ms) => p.evaluate(ms => new Promise(resolve => {
  const r = window.RIG && RIG.renderer;
  let best = null;
  const orig = r && r.render;
  if (r) r.render = function (s, c) { orig.call(this, s, c); const i = this.info.render; if (!best || i.triangles > best.triangles) best = { triangles: i.triangles, calls: i.calls, points: i.points, lines: i.lines }; };
  const d = []; let last = null, t0 = null;
  const f = t => { if (t0 === null) t0 = t; if (last !== null) d.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else done(); };
  const done = () => {
    if (r) r.render = orig;
    const s = d.slice().sort((a, b) => a - b), mean = d.reduce((a, b) => a + b, 0) / d.length;
    const q = x => s[Math.min(s.length - 1, Math.floor(x * s.length))];
    resolve({ cpuFrameMs: window.__fog ? __fog.frameMs : null, frames: d.length, meanMs: +mean.toFixed(2), p50Ms: +q(0.5).toFixed(2), p95Ms: +q(0.95).toFixed(2), maxMs: +s[s.length - 1].toFixed(2),
      triangles: best ? best.triangles : null, drawCalls: best ? best.calls : null,
      programs: r ? r.info.programs.length : null, geometries: r ? r.info.memory.geometries : null, textures: r ? r.info.memory.textures : null });
  };
  requestAnimationFrame(f);
}), ms);

async function launch() {
  const gpu = { headless: true, channel: 'chromium', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--mute-audio', '--disable-gpu-vsync', '--disable-frame-rate-limit'] };
  const soft = { headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--mute-audio', '--disable-gpu-vsync', '--disable-frame-rate-limit'] };
  for (const opt of [gpu, soft]) {
    const b = await pw.chromium.launch(opt);
    const p = await b.newPage();
    const gl = await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); if (!g) return null; const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
    await p.close();
    if (gl) return { browser: b, gl, args: opt.args };
    await b.close();
  }
  throw new Error('no WebGL in headless Chromium');
}

(async () => {
  if (!PROBE) fs.mkdirSync(out, { recursive: true });
  const { browser, gl, args } = await launch();
  const result = {
    label, page: PAGE, date: new Date().toISOString(), browser: browser.version(), launchArgs: args, webglRenderer: gl,
    note: 'Headless Chromium. webglRenderer says which GPU path ran: ANGLE Metal (real GPU, headless) or SwiftShader (software). vsync and the frame-rate limit are off, so rAF intervals are uncapped. cpuFrameMs is the page own smoothed CPU time per frame (__fog.frameMs). Either way frame times are relative between runs of this script on this machine, not the 100 fps display-cap figure HANDOFF.md records for headed runs. External hosts are aborted (YouTube iframe API, Supabase), so the music falls back to the local loops.',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 }, sampleMs: 3000, warmFrames: 90,
    tree: gitState(), bootMs: null, models: null, shots: [], load: {}, console: [], pageErrors: [], httpErrors: [], aborted: [],
  };
  const bytes = {}; let total = 0;
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.route(r => !r.href.startsWith(ORIGIN), r => { result.aborted.push(r.request().url()); r.abort(); });
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') result.console.push({ type: m.type(), text: m.text() }); });
    p.on('pageerror', e => result.pageErrors.push(e.message));
    p.on('response', r => { if (r.status() >= 400) result.httpErrors.push({ status: r.status(), url: r.url() }); });
    p.on('requestfinished', async rq => {
      try { const s = await rq.sizes(); const n = s.responseBodySize + s.responseHeadersSize; total += n; bytes[rq.url().replace(ORIGIN, '')] = s.responseBodySize; } catch (_) {}
    });
    const t0 = Date.now();
    await p.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 120000 });
    // all three model bundles in: groups 1 and 2 released, nothing in flight, nothing held, core ready
    const allIn = () => window.__fog && window.MODELS && MODELS.coreReady && MODELS.late.released[1] && MODELS.late.released[2]
      && MODELS.late.inflight[1] === 0 && MODELS.late.inflight[2] === 0 && !MODELS.late.held[1].length && !MODELS.late.held[2].length;
    // models.js releases the late groups LATE_IDLE_MS after the load event, or when the scroll passes 0.30.
    // If the load event has not released them in 30 s, scroll past 0.30 the way a reader would.
    result.release = 'idle';
    try { await p.waitForFunction(allIn, null, { timeout: 30000, polling: 250 }); }
    catch (_) {
      result.release = 'scroll';
      await p.waitForFunction(() => window.__fog, null, { timeout: 120000 });
      await p.evaluate(() => scrollTo(0, 0.31 * (document.documentElement.scrollHeight - innerHeight)));
      await p.waitForFunction(allIn, null, { timeout: 180000, polling: 250 });
    }
    result.bootMs = Date.now() - t0;
    result.models = await p.evaluate(() => MODELS.late);
    await p.mouse.move(720, 450);
    await frames(p, 90);

    if (PROBE) {
      for (let u = 0.04; u < 0.97; u += 0.02) { const s = await position(p, +u.toFixed(2)); console.log(JSON.stringify(s)); }
      return;
    }
    for (const s of SHOTS) {
      const pos = await position(p, s.u);
      const file = `${s.district}-${s.n}.png`;
      await p.screenshot({ path: path.join(out, file) });
      const m = await sample(p, 3000);
      result.shots.push({ ...s, file, ...pos, ...m });
      console.log(file, JSON.stringify({ u: pos.u, camZ: pos.camZ, meanMs: m.meanMs, p95Ms: m.p95Ms, cpuMs: m.cpuFrameMs, triangles: m.triangles, drawCalls: m.drawCalls }));
    }
    await frames(p, 10);
    const glb = {};
    for (const [k, v] of Object.entries(bytes)) if (/^asset\/models\/[^/]+\.glb$/.test(k)) glb[k] = v;
    for (const f of fs.readdirSync(path.join(ROOT, 'asset/models')).filter(f => f.endsWith('.glb')))
      glb['asset/models/' + f] = { transferred: glb['asset/models/' + f] ?? null, onDisk: fs.statSync(path.join(ROOT, 'asset/models', f)).size };
    result.load = { totalTransferredBytes: total, responses: Object.keys(bytes).length, glb, byUrl: bytes };
  } finally {
    if (!PROBE) fs.writeFileSync(path.join(out, 'metrics.json'), JSON.stringify(result, null, 2) + '\n');
    await browser.close();
  }
  if (!PROBE) console.log('wrote', path.join(out, 'metrics.json'), 'total bytes', total, 'console', result.console.length, 'pageErrors', result.pageErrors.length, 'http>=400', result.httpErrors.length);
})().catch(e => { console.error(e); process.exit(1); });
