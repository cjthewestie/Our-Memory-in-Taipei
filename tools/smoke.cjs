// tools/smoke.cjs — load the page in headless Chromium in every mode, collect errors, take screenshots.
//
//   node tools/smoke.cjs [outDir] [port]
//
// Serves the repo on a local port (python3 -m http.server), then: the square (walk mode, welcome skipped),
// each of the three sections, the scroll tour at three points, and a phone-sized square. Prints one JSON
// line: { ok, errors[], shots[], stats{} }; exits 1 if any page error or console error (other than
// network failures for YouTube / Supabase / fonts, which a sandbox cannot reach) was seen.
// Software WebGL (SwiftShader) is slow: frame-rate numbers here are relative, never absolute.
'use strict';
const path = require('path');
const { spawn } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, '.smoke'));
const PORT = +(process.argv[3] || 8790);
const URL0 = `http://localhost:${PORT}/`;
const IGNORE = /ERR_TUNNEL|ERR_CONNECTION|ERR_NAME|net::ERR|youtube|ytimg|supabase|Failed to load resource|favicon/i;

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', ROOT], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const errors = [], shots = [], stats = {};
  const watch = (p, tag) => {
    p.on('pageerror', e => errors.push(`[${tag}] PAGEERR ${(e.stack || e.message).split('\n').slice(0, 3).join(' | ')}`));
    p.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(`[${tag}] console: ${m.text().slice(0, 300)}`); });
  };
  const shot = async (p, name) => { const f = path.join(OUT, name + '.png'); await p.screenshot({ path: f, timeout: 120000 }); shots.push(f); };
  try {
    // walk mode
    const p = await b.newPage({ viewport: { width: 960, height: 540 } }); watch(p, 'walk');
    await p.goto(URL0 + '?nowelcome&skip', { waitUntil: 'load', timeout: 120000 });
    await p.waitForTimeout(14000);
    await shot(p, 'walk-square');
    stats.square = await p.evaluate(() => ({ where: window.WALK && WALK.where, calls: window.RIG && RIG.renderer.info.render.calls, textures: window.RIG && RIG.renderer.info.memory.textures, programs: window.RIG && RIG.renderer.info.programs.length }));
    for (const k of ['red', 'dadao', 'tower']) {
      await p.evaluate(k => window.__walk && __walk.enter(k, true), k);
      await p.waitForTimeout(4000);
      await shot(p, 'walk-' + k);
    }
    await p.evaluate(() => window.__walk && __walk.goSquare(null, true));
    await p.waitForTimeout(2500);
    // tour
    await p.evaluate(() => window.__walk && __walk.startTour());
    for (const f of [0.5, 0.97]) {
      await p.evaluate(f => scrollTo(0, f * (document.documentElement.scrollHeight - innerHeight)), f);
      await p.waitForTimeout(5000);
      await shot(p, 'tour-' + Math.round(f * 100));
    }
    await p.close();
    // phone
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const q = await ctx.newPage(); watch(q, 'phone');
    await q.goto(URL0 + '?nowelcome&skip', { waitUntil: 'load', timeout: 120000 });
    await q.waitForTimeout(12000);
    await shot(q, 'phone-square');
    await ctx.close();
  } catch (e) {
    errors.push('HARNESS ' + e.message);
  } finally {
    await b.close(); srv.kill();
  }
  console.log(JSON.stringify({ ok: errors.length === 0, errors, shots, stats }));
  process.exit(errors.length ? 1 : 0);
})();
