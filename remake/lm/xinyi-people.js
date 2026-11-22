// lm/xinyi-people.js: the people of 信義, drawn with the shared kit (lm/kit-people.js) in place of the old block figures.
// landmarks-xinyi.js hands over the figures it used to build (the street performer and the listeners on 香堤大道, people on the 象山
// steps, the marchers); this module draws them where they stood and adds the district's own street life: shoppers with bags crossing
// the plaza, people photographing the tower, friends meeting, people waiting at the crossing and walking 四四南村's lane.
(window.LM = window.LM || {})['xinyi-people'] = function (E) {
  if (!window.PEOPLE) return;
  const C = PEOPLE.crowd(E, { seed: 110, palette: 'modern', name: 'xinyi-people', avoid: [[0, 10.5, 2.4]] }), rr = C.rr, pick = C.pick;
  PEOPLE.recorded().forEach(r => { const o = r.o, a = o.arms, q = { y: r.y, s: (o.s || 1) < 0.75 ? 1 : (o.s || 1) * r.s, kid: (o.s || 1) < 0.75 };
    q.pose = !a ? pick(['stand', 'stand', 'phone', 'carry']) : a[0][1] > 0 ? 'wave' : a[0][2] > 0.2 && a[0][1] > -0.1 ? 'photo' : 'talk';
    C.add(r.x, r.z, r.ry, q); });
  // shoppers crossing the plaza, either side of the middle line she walks
  C.stroll(30, [[-15.5, -2.2, -16, 17], [2.2, 15.5, -16, 17]], { each: {}, pairs: 0.4, kids: 0.25 });
  C.list.forEach((p, i) => { if (/^walk/.test(p.o.pose) && i % 2) p.o.bag = true; });
  // photographing Taipei 101 (south of the plaza, down -z)
  [[-3.4, -9.5], [3.9, -12.2], [-5.6, -14.6], [5.0, 6.5]].forEach(([x, z], i) => C.drop(x, z, Math.PI + rr(-0.2, 0.2), { pose: 'photo', pack: i % 2 === 0 }));
  C.drop(4.4, -14.6, 0.2, { pose: 'wave' });
  C.huddle(-8.5, 4.5, 3); C.huddle(9.5, -3.5, 3); C.huddle(-10.5, -11, 2); C.huddle(11, 12, 2);
  // waiting at the crossing, and on the tower's forecourt
  [[-3.6, -18.4], [-2.6, -18.9], [3.1, -18.6], [3.9, -19.3], [-1.2, -19.2]].forEach(([x, z]) => C.drop(x, z, Math.PI + rr(-0.3, 0.3), { pose: pick(['stand', 'phone', 'carry', 'drink']) }, 0.6));
  C.stroll(12, [[-12, 34, -42.6, -35.6, 'x']], { pairs: 0.35 });
  [[2.5, -40.5], [-6, -41.5], [12, -41]].forEach(([x, z]) => C.drop(x, z, Math.PI + rr(-0.2, 0.2), { pose: 'photo' }));
  // 四四南村's lane
  C.stroll(6, [[-36.5, -14, -44, -35.6, 'x']], { pairs: 0.4 });
  const g = C.build(); window.__lmPeopleCount = g.userData.count;
};
