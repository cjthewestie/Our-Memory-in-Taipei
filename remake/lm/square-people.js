// lm/square-people.js: the people of the square, drawn with the shared kit (lm/kit-people.js) in place of the old block figures.
// landmarks-square.js hands over the figures it used to build (the garbage-truck queue, stall keepers, people on benches and stools,
// the workers in vests); this module draws them where they stood and adds people walking across the square, families, and
// friends meeting round the centre stone. One-material statue figures stay with landmarks-square.js.
(window.LM = window.LM || {})['square-people'] = function (E) {
  if (!window.PEOPLE) return;
  const C = PEOPLE.crowd(E, { seed: 2006, palette: 'modern', name: 'square-people', avoid: [[0, 11.5, 2.6], [0, 0, 3.4], [3.3, 5.4, 2.2]] }), rr = C.rr, pick = C.pick;
  PEOPLE.recorded().forEach(r => { const o = r.o, q = { y: r.y, s: r.s !== 1 ? r.s : undefined };
    q.pose = o.sit ? 'sit' : o.arms === 'fwd' ? 'reach' : o.arms === 'up' ? 'wave' : pick(['stand', 'stand', 'phone', 'carry']);
    if (o.sit) q.stool = false;
    if (o.vest) { q.shirt = '#e8d23a'; q.long = true; q.hat = 'cap'; q.hatColor = '#e8d23a'; q.woman = false; q.skirt = false; q.shorts = false; }
    C.add(r.x, r.z, r.ry, q); });
  C.stroll(22, [[-14.5, -3.6, -14.5, 12.5], [3.6, 14.5, -14.5, 12.5], [-3.6, 3.6, -14.5, -4]], { pairs: 0.45, kids: 0.4 });
  C.huddle(-5.2, 3.6, 3); C.huddle(6.2, -5.4, 3); C.huddle(-8.5, -8.5, 2); C.huddle(9.5, 6.5, 2);
  // looking at the centre stone and the lanterns overhead
  [[-4.3, -1.2], [4.1, 1.6], [1.2, -4.4]].forEach(([x, z], i) => C.drop(x, z, Math.atan2(-x, -z), { pose: i ? 'photo' : 'stand', pack: true }));
  const g = C.build(); window.__lmPeopleCount = g.userData.count;
};
