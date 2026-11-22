// lm/dadao-people.js: the people of 大稻埕, drawn with the shared kit (lm/kit-people.js). The scene had none.
// Along 迪化街: shoppers with bags walking both ways under the arcades' edge, people stopping to photograph the fronts, worshippers in
// 霞海城隍廟's forecourt (palms together, facing the hall), shoppers in front of 永樂市場, people eating on stools in 慈聖宮's yard,
// and walkers in the lane to the water gate. Present-day clothes. No face and no real person.
(window.LM = window.LM || {})['dadao-people'] = function (E) {
  if (!window.PEOPLE) return;
  const C = PEOPLE.crowd(E, { seed: 1853, palette: 'modern', name: 'dadao-people', avoid: [[0.4, 29.5, 2.2]] }), rr = C.rr, pick = C.pick;
  PEOPLE.recorded().forEach(r => C.add(r.x, r.z, r.ry, { y: r.y, pose: 'stand' }));
  // the street: two bands either side of the middle she walks down
  C.stroll(34, [[-3.4, -1.5, -38, 37, 'z'], [1.5, 3.4, -38, 37, 'z']], { pairs: 0.4, kids: 0.25 });
  // stopping to look: photographers and window-shoppers facing the shopfronts
  [[-2.9, 21, -1], [2.8, 14.5, 1], [-3.0, 3.5, -1], [-2.7, -8, -1], [2.9, -19, 1], [-3.1, -27, -1], [2.6, 30.5, 1], [-2.8, 33.5, -1]].forEach(([x, z, side], i) => C.drop(x, z, side * Math.PI / 2 + rr(-0.3, 0.3), { pose: i % 2 ? 'photo' : pick(['stand', 'phone', 'carry']), pack: i % 3 === 0 }));
  C.huddle(-2.3, 9.5, 3); C.huddle(2.2, -24.5, 2); C.huddle(-2.4, -34, 3); C.huddle(2.4, 24, 2);
  // 霞海城隍廟's forecourt: worshippers facing the hall (+x), a few waiting behind
  [[7.6, -19.0], [8.3, -17.9], [7.9, -20.4], [6.6, -17.0]].forEach(([x, z]) => C.drop(x, z, Math.PI / 2 + rr(-0.15, 0.15), { pose: 'pray' }, 0.6));
  C.drop(5.4, -22.8, Math.PI / 2 + 0.4, { pose: 'photo' }); C.drop(5.2, -14.6, 0.9, { pose: 'phone' }); C.drop(6.0, -13.8, -2.2, { pose: 'talk' });
  // 永樂市場's front: shoppers with bags
  C.stroll(7, [[4.6, 9.0, -9.3, 5.6, 'z']], { each: { bag: true }, pairs: 0.3 });
  // 慈聖宮's yard: eating on stools at the food stalls
  [[5.2, -33.2, 0.6], [6.4, -34.6, -0.8], [7.3, -32.6, 2.4], [5.6, -36.6, 1.9], [7.2, -37.4, -2.2]].forEach(([x, z, ry]) => C.drop(x, z, ry, { pose: 'sitEat' }, 0.7));
  // the lane to the water gate
  C.stroll(6, [[-26, -5, -29.3, -26.7, 'x']], { pairs: 0.3 });
  const g = C.build(); window.__lmPeopleCount = g.userData.count;
};
