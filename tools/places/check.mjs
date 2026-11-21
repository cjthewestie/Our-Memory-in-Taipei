#!/usr/bin/env node
// check.mjs: open one page in HEADLESS Chrome in real time (no virtual clock), print its console, save a screenshot.
// For checks that need drawn frames or real waits (walking, the E prompt, a form), where the one-line
// --virtual-time-budget recipe runs timers ahead of drawing. No packages: Node 22's own WebSocket and fetch.
//   node tools/places/check.mjs "<url>" <out.png> [--size=1280x800] [--mobile] [--until=<js expression>] [--ms=15000] [--settle=600] [--eval=<js>]
//   --until   take the shot when this is true in the page (default: window.__remake && window.__remake.ready)
//   --mobile  a 375 x 812 phone: touch points, coarse pointer, device scale 2
//   --eval    run this in the page once --until is true, then wait --settle ms before the shot
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, out, ...rest] = process.argv.slice(2);
if (!url || !out) { console.error('usage: check.mjs <url> <out.png> [--size=WxH] [--mobile] [--until=expr] [--ms=15000] [--settle=600] [--eval=js]'); process.exit(2); }
const opt = Object.fromEntries(rest.map(a => { const m = /^--([^=]+)(?:=(.*))?$/s.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const mobile = !!opt.mobile, [W, H] = mobile ? [375, 812] : String(opt.size || '1280x800').split('x').map(Number);
const until = opt.until || 'window.__remake && window.__remake.ready', limit = +(opt.ms || 15000), settle = +(opt.settle || 600);
const dir = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'places-check-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--use-angle=metal', '--enable-gpu', '--hide-scrollbars', '--no-first-run',
  `--window-size=${W},${H}`, '--remote-debugging-port=0', `--user-data-dir=${dir}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let code = 0;
try {
  const port = await new Promise((ok, no) => { let buf = ''; const t = setTimeout(() => no(new Error('Chrome did not start')), 15000);
    chrome.stderr.on('data', d => { buf += d; const m = /DevTools listening on ws:\/\/[^:]+:(\d+)\//.exec(buf); if (m) { clearTimeout(t); ok(m[1]); } }); });
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(), tab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const waiting = new Map();
  const send = (method, params = {}) => new Promise((ok, no) => { const i = ++id; waiting.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id && waiting.has(m.id)) { const w = waiting.get(m.id); waiting.delete(m.id); m.error ? w.no(new Error(m.error.message)) : w.ok(m.result); return; }
    if (m.method === 'Runtime.consoleAPICalled') console.log(`[${m.params.type}] ` + m.params.args.map(a => (a.value !== undefined ? String(a.value) : a.description || a.type)).join(' '));
    if (m.method === 'Runtime.exceptionThrown') { code = 1; console.log('[EXCEPTION] ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon\.ico/.test(m.params.entry.url || '')) { code = 1; console.log('[LOG error] ' + m.params.entry.text + ' ' + (m.params.entry.url || '')); } };
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url });
  const ev = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < limit) { try { if (await ev(`!!(${until})`)) { ok = true; break; } } catch (_) {} await sleep(150); }
  if (!ok) { code = 1; console.log(`[check] --until was not true after ${limit} ms: ${until}`); }
  if (opt.eval) console.log('[eval] ' + JSON.stringify(await ev(String(opt.eval))));
  await sleep(settle);
  const shot = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(`[check] ${ok ? 'ok' : 'TIMEOUT'} ${W}x${H}${mobile ? ' mobile' : ''} -> ${out} (${Date.now() - t0} ms)`);
  ws.close();
} catch (e) { code = 1; console.log('[check] failed: ' + e.message); }
chrome.kill(); await sleep(300); try { rmSync(dir, { recursive: true, force: true }); } catch (_) {}
process.exit(code);
