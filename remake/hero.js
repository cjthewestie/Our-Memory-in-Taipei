// hero.js — the player character's runtime, shared by every scene page in this folder.
// The model comes from Blender (tools/character/build_girl.py → asset/models/girl-rigged.glb) with
// Idle, Walk, Run and Wave. The three loops play together and are mixed by how fast she is moving;
// walk and run are driven by the distance she covers, so her feet keep pace with the ground.
(function () {
  'use strict';
  const WALK = 0.95, RUN = 2.6;                 // metres per second
  const WALK_CYCLE = 0.56, RUN_CYCLE = 1.15;    // metres covered by one full cycle (two steps) of each loop
  function rigged(T, gltf) {
  const group = gltf.scene, mixer = new T.AnimationMixer(group), act = {}; let eyes = null;
  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; if (o.morphTargetDictionary && 'blink' in o.morphTargetDictionary) eyes = o; } });
  gltf.animations.forEach(c => { act[c.name] = mixer.clipAction(c); act[c.name].play(); act[c.name].setEffectiveWeight(c.name === 'Idle' ? 1 : 0); });
  if (act.Wave) { act.Wave.setLoop(T.LoopOnce, 1); act.Wave.clampWhenFinished = false; }
  const S = { move: 0, run: 0, phase: 0, idleT: 0, wave: -1, blink: 2, blinkT: 0 };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // Loose things lag behind the body: when she speeds up, stops or turns, the braids and the satchel
  // swing on a spring, on top of the swing that is baked into each loop. She also leans into turns.
  const loose = []; group.traverse(o => { if (o.isBone && /^(braid|bag)/.test(o.name)) loose.push({ b: o, k: /2$/.test(o.name) ? 1.6 : /^bag/.test(o.name) ? 0.6 : 1 }); });
  const SP = { fx: 0, fv: 0, sx: 0, sv: 0, last: 0, lean: 0, pitch: 0 }; group.rotation.order = 'YXZ';
  function update(dt, speed, turn) {
    turn = turn || 0;
    if (dt > 0) {
      const acc = Math.max(-12, Math.min(12, (speed - SP.last) / dt)); SP.last = speed;
      SP.fv += ((-acc * 0.035 - SP.fx) * 70 - SP.fv * 6.5) * dt; SP.fx += SP.fv * dt;
      SP.sv += ((turn * 0.05 * Math.min(1, speed) - SP.sx) * 70 - SP.sv * 6.5) * dt; SP.sx += SP.sv * dt;
      SP.lean += (-turn * 0.035 * Math.min(1.5, speed) - SP.lean) * Math.min(1, dt * 6); SP.pitch += (acc * 0.012 - SP.pitch) * Math.min(1, dt * 5);
      group.rotation.z = SP.lean; group.rotation.x = SP.pitch;
    }
    S.move += (sm(0.05, 0.6, speed) - S.move) * Math.min(1, dt * 8); S.run += (sm(WALK * 1.25, RUN * 0.9, speed) - S.run) * Math.min(1, dt * 6);
    S.phase = (S.phase + speed * dt / (WALK_CYCLE + (RUN_CYCLE - WALK_CYCLE) * S.run)) % 1; S.idleT += dt;
    if (S.wave >= 0) { S.wave += dt; if (S.wave > act.Wave.getClip().duration || S.move > 0.3) S.wave = -1; }
    const wv = S.wave >= 0 ? Math.min(1, S.wave * 5) * Math.min(1, (act.Wave.getClip().duration - S.wave) * 5) : 0, idle = (1 - S.move) * (1 - wv);
    act.Idle.time = S.idleT % act.Idle.getClip().duration; act.Idle.setEffectiveWeight(idle);
    act.Walk.time = S.phase * act.Walk.getClip().duration; act.Walk.setEffectiveWeight(S.move * (1 - S.run));
    act.Run.time = S.phase * act.Run.getClip().duration; act.Run.setEffectiveWeight(S.move * S.run);
    if (act.Wave) { act.Wave.time = Math.max(0, S.wave); act.Wave.setEffectiveWeight(wv); }
    mixer.update(0);
    loose.forEach(({ b, k }) => { b.rotateX(-SP.fx * k); b.rotateZ(SP.sx * k); });
    S.blink -= dt; if (S.blink < 0) { S.blinkT = 0.14; S.blink = 2.2 + Math.random() * 3.5; }
    S.blinkT = Math.max(0, S.blinkT - dt); if (eyes) eyes.morphTargetInfluences[eyes.morphTargetDictionary.blink] = S.blinkT > 0 ? 1 - Math.abs(S.blinkT / 0.14 * 2 - 1) : 0;
  }
  update(0, 0);
  return { group, update, state: S, wave() { if (act.Wave) S.wave = 0; }, actions: Object.keys(act) };
}
  window.HERO = { rigged, WALK, RUN };
})();
