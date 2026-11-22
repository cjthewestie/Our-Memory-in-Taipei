// lm/ximen-people.js: the people of 西門町, drawn with the shared kit (lm/kit-people.js) in place of the old block figures.
// landmarks-ximen.js hands every figure it used to build (shop staff, the 阿宗麵線 crowd eating on their feet, the cinema queue, the
// portrait artists outside 獅子林, the shop-window mannequins of 來來) to window.__lmPeople; this module draws them in the same places
// and adds the plaza's own street life: strollers along both arcades, friends meeting by the path, people photographing the Red House.
// Clothes are the period palette (1970s–80s 西門町). No face and no real person.
(window.LM = window.LM || {})['ximen-people'] = function (E) {
  if (!window.PEOPLE) return;
  const C = PEOPLE.crowd(E, { seed: 5108, palette: 'period', name: 'ximen-people' }), rr = C.rr, pick = C.pick;
  PEOPLE.recorded().forEach(r => { const o = r.o, q = { y: r.y };
    if (o.mannequin) Object.assign(q, { pose: 'stand', skin: '#e9e4da', hair: '#e9e4da', hairStyle: 'short', shoe: '#e9e4da', s: 1.02 });
    else if (o.sit) q.pose = /lions/.test(r.name) ? 'sitDraw' : 'sit';
    else if (o.bowl) q.pose = 'eat';
    else if (o.reach) q.pose = 'reach';
    else q.pose = pick(['stand', 'stand', 'talk', 'phone', 'carry']);
    if (o.apron) { q.apron = true; q.pose = o.reach ? 'reach' : 'stand'; q.hat = 'cap'; q.hatColor = '#f1ece2'; }
    C.add(r.x, r.z, r.ry, q); });
  // street life in the open plaza: only on free ground (not in a showcase or marker footprint, not on the path she starts on)
  const free = (x, z) => { if (Math.abs(x) < 2.4) return false; if (!window.PHOTOWALL || !PHOTOWALL.keepOut) return true; const p = { x, z }; PHOTOWALL.keepOut(p, 0.7); return Math.abs(p.x - x) < 1e-6 && Math.abs(p.z - z) < 1e-6; };
  const near = []; const far = (x, z, d) => near.every(n => Math.hypot(n[0] - x, n[1] - z) > d);
  const drop = (x, z, ry, o) => { if (!free(x, z) || !far(x, z, 0.9)) return false; near.push([x, z]); C.add(x, z, ry, o); return true; };
  // walkers going up and down both sides of the plaza, in ones and pairs
  for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1, x = side * rr(5, 19.5), z = rr(14, 57), ry = (R2(i) ? 0 : Math.PI) + rr(-0.3, 0.3), pose = i % 2 ? 'walk' : 'walk2';
    if (drop(x, z, ry, { pose, bag: i % 5 === 0, pack: i % 7 === 0 }) && i % 3 === 0) drop(x + Math.cos(ry) * 0.62, z - Math.sin(ry) * 0.62, ry + rr(-0.1, 0.1), { pose: i % 2 ? 'walk2' : 'walk', kid: i % 6 === 0 }); }
  function R2(i) { return (i * 7 + 3) % 4 < 2; }
  // groups standing and talking
  [[-6.5, 24, 3], [6.5, 46, 2], [-14, 50.5, 3], [13, 31, 2], [-5.5, 52, 2], [15.5, 17.5, 3]].forEach(([x, z, n]) => { for (let k = 0; k < n; k++) { const a = k / n * 6.283 + rr(-0.3, 0.3), px = x + Math.cos(a) * 0.62, pz = z + Math.sin(a) * 0.62; drop(px, pz, Math.atan2(x - px, z - pz), { pose: pick(['talk', 'stand', 'drink', 'phone', 'wave']) }); } });
  // people photographing the Red House from the plaza, and one being photographed
  [[-3.6, 22.5], [4.2, 25], [3.1, 19.2]].forEach(([x, z], i) => drop(x, z, Math.atan2(0 - x, 8 - z) + (i === 2 ? Math.PI : 0), { pose: i === 2 ? 'wave' : 'photo' }));
  // snack eaters by the stalls
  [[9.6, 31.4, 2.4], [-9.9, 36.3, -2.2], [11.9, 38.9, 2.0], [-9.6, 45.8, -1.6]].forEach(([x, z, ry]) => drop(x, z, ry, { pose: pick(['eat', 'drink']) }));
  const g = C.build(); window.__lmPeopleCount = g.userData.count;
};
