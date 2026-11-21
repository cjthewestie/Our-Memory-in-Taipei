// lm/loader.js: loads a page's landmark modules and runs them at the end of its build.
// Why: many builders can work at once only if each owns its own file. A module is remake/lm/<district>-<piece>.js:
//     (window.LM = window.LM || {})['<district>-<piece>'] = function (E) { ... };
// It runs after LANDMARKS_<DISTRICT>(E) and PLACES.mount, so window.__places.entries (the clickable registry) is there.
// Shared kits (remake/lm/kit-<name>.js) load first and expose their own global; they register no LM key.
// Use, after places.js in the page:
//     <script src="lm/loader.js" data-district="ximen" data-shared="kit-people" data-modules="exit6 people ..."></script>
// and at the end of build(E): if (window.LM_RUN) LM_RUN(E, 'ximen');
// One module failing never stops the others or the page: its error is logged as [lm] <key> failed.
(function () {
  'use strict';
  const me = document.currentScript, d = me.dataset.district || '';
  const list = s => (s || '').split(/\s+/).filter(Boolean);
  window.LM = window.LM || {};
  list(me.dataset.shared).forEach(k => document.write('<script src="lm/' + k + '.js"><\/script>'));
  list(me.dataset.modules).forEach(m => document.write('<script src="lm/' + d + '-' + m + '.js"><\/script>'));
  window.LM_RUN = function (E, district) {
    const keys = Object.keys(window.LM).filter(k => k.indexOf(district + '-') === 0).sort(), ran = [];
    keys.forEach(k => { try { window.LM[k](E); ran.push(k); } catch (err) { console.error('[lm] ' + k + ' failed: ' + (err && err.stack || err)); } });
    window.__lm = { district, ran };
    return ran;
  };
})();
