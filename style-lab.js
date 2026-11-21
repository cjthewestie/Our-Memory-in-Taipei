// style-lab.js — a look test, not shipped behaviour. CJ, 2026-11-21: 「我是要你做出的3d場景」「並且用上述風格渲染」
// 「挑ourmemory in taipei裡面一個小區塊做示範」. Open index.html?style=<key> (the lantern square) and switch
// looks with the bar at the bottom or keys 1-9; 0 is the page as shipped. Without ?style the file does nothing.
//
// How: app.js still draws the scene into its offscreen target; when a style is on, this file draws the
// final fullscreen pass instead of app.js's own. It adds a depth texture to that target so the pass knows
// how far away each pixel is (fog, outlines, brick seams, light shafts all need that). Nothing in the
// scene's geometry or materials changes, so every look here is "light, air and finish" only.
(() => {
  const QS = new URLSearchParams(location.search);
  if (!QS.has('style')) return;
  const T = window.THREE;

  // every number a look can set; a preset lists only what differs from this
  const BASE = {
    exposure: 1, aces: 0, contrast: 1, sat: 1, redKeep: 0, fade: 0,
    tint: [1, 1, 1], shadowTint: [0, 0, 0], highTint: [0, 0, 0],
    fogA: 0, fogDen: 0.02, fogSky: 0, fogNear: [1, 1, 1], fogFar: [1, 1, 1], fogRange: 120,
    rays: 0, rayCol: [1, 1, 1], bloom: 0, specks: 0, speckCol: [1, 0.85, 0.5],
    outline: 0, outlineW: 1.2, outlineCol: [0.05, 0.04, 0.05], poster: 0, halftone: 0, paint: 0,
    lego: 0, grain: 0, paper: 0, vignette: 0.2, leak: 0, ca: 0,
  };
  const STYLES = {
    lego:  { name: 'Toy bricks', lego: 1, sat: 1.5, contrast: 1.12, outline: 0.3, outlineW: 1, bloom: 0.15, vignette: 0.15, fogA: 0.25, fogDen: 0.01, fogNear: [0.8, 0.9, 1], fogFar: [0.7, 0.85, 1] },
    comic: { name: 'American comic', outline: 1, outlineW: 1.7, poster: 4, halftone: 0.85, sat: 1.55, contrast: 1.25, vignette: 0.1 },
    real:  { name: 'Real', aces: 1, exposure: 1.25, bloom: 0.35, fogA: 0.55, fogDen: 0.012, fogSky: 0.25, fogNear: [1, 0.93, 0.8], fogFar: [0.75, 0.82, 0.9], sat: 1.05, contrast: 1.1, grain: 0.025, ca: 0.0012, vignette: 0.3 },
    abyss: { name: 'Undersea light', aces: 1, exposure: 0.95, contrast: 1.12, fogA: 0.9, fogDen: 0.022, fogSky: 0.8, fogNear: [0.12, 0.42, 0.5], fogFar: [0.02, 0.12, 0.32], fogRange: 70, rays: 1.0, rayCol: [0.7, 1, 0.95], bloom: 0.5, specks: 1, sat: 1.1, tint: [0.82, 1.05, 1.1], vignette: 0.55 },
    film:  { name: '35mm film', exposure: 1.12, fade: 0.12, sat: 0.78, contrast: 0.92, tint: [1.08, 1, 0.88], shadowTint: [-0.01, 0.025, 0.03], highTint: [0.04, 0.02, -0.03], grain: 0.09, leak: 0.55, bloom: 0.3, ca: 0.002, vignette: 0.38 },
    dusk:  { name: 'Purple dusk', aces: 1, exposure: 0.75, contrast: 1.1, fogA: 0.88, fogDen: 0.022, fogSky: 0.85, fogNear: [0.4, 0.16, 0.5], fogFar: [0.1, 0.04, 0.3], fogRange: 70, rays: 0.6, rayCol: [1, 0.6, 0.9], bloom: 0.75, specks: 1, tint: [0.92, 0.82, 1.2], vignette: 0.5 },
    paint: { name: 'Painterly', paint: 3.2, sat: 1.55, contrast: 1.2, shadowTint: [-0.03, 0.03, 0.05], highTint: [0.06, 0.02, -0.04], bloom: 0.2, vignette: 0.2 },
    anime: { name: 'Gouache anime', paint: 1.6, sat: 1.38, exposure: 1.1, outline: 0.35, outlineW: 0.9, outlineCol: [0.1, 0.14, 0.3], tint: [1, 1.02, 1.08], bloom: 0.3, fogA: 0.25, fogDen: 0.01, fogSky: 0.1, fogNear: [0.85, 0.93, 1], fogFar: [0.6, 0.8, 1], paper: 0.15 },
    ink:   { name: 'Ink poster', poster: 4, outline: 1, outlineW: 1.4, outlineCol: [0.12, 0.09, 0.1], sat: 0.5, redKeep: 1, fogA: 0.75, fogDen: 0.02, fogSky: 0.6, fogNear: [0.93, 0.86, 0.7], fogFar: [0.45, 0.6, 0.6], fogRange: 100, tint: [1.05, 1, 0.88], paper: 0.5, grain: 0.04, vignette: 0.3 },
  };
  const KEYS = Object.keys(STYLES);

  const U = { tDiffuse: { value: null }, tDepth: { value: null }, uRes: { value: new T.Vector2(1, 1) }, uTime: { value: 0 },
              uNear: { value: 0.1 }, uFar: { value: 600 }, uProjInv: { value: new T.Matrix4() }, uCamWorld: { value: new T.Matrix4() }, uCamPos: { value: new T.Vector3() } };
  for (const k in BASE) U['u_' + k] = { value: Array.isArray(BASE[k]) ? new T.Vector3(...BASE[k]) : BASE[k] };

  const frag = `
    precision highp float;
    uniform sampler2D tDiffuse, tDepth; uniform vec2 uRes; uniform float uTime, uNear, uFar;
    uniform mat4 uProjInv, uCamWorld; uniform vec3 uCamPos;
    uniform float u_exposure, u_aces, u_contrast, u_sat, u_redKeep, u_fade, u_fogA, u_fogDen, u_fogSky, u_fogRange, u_rays, u_bloom, u_specks,
                  u_outline, u_outlineW, u_poster, u_halftone, u_paint, u_lego, u_grain, u_paper, u_vignette, u_leak, u_ca;
    uniform vec3 u_tint, u_shadowTint, u_highTint, u_fogNear, u_fogFar, u_rayCol, u_speckCol, u_outlineCol;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
    float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    vec3 scn(vec2 uv){ return texture2D(tDiffuse, uv).rgb; }
    float rawD(vec2 uv){ return texture2D(tDepth, uv).x; }
    float viewZ(float d){ float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
    vec3 worldAt(vec2 uv, float d){ vec4 v = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); v /= v.w; return (uCamWorld * v).xyz; }
    vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

    // PAINT — a Kuwahara filter: of four neighbouring patches, keep the mean of the calmest one.
    // Flat areas turn into strokes and edges stay sharp, which is what a brush does.
    vec3 kuwahara(vec2 uv, float step){
      vec2 px = step / uRes; vec3 best = vec3(0.0); float bestVar = 1e9;
      for (int q = 0; q < 4; q++) {
        vec2 dir = vec2(q == 0 || q == 2 ? -1.0 : 1.0, q < 2 ? -1.0 : 1.0);
        vec3 m = vec3(0.0), s = vec3(0.0);
        for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) { vec3 c = scn(uv + dir * vec2(float(i), float(j)) * px); m += c; s += c * c; }
        m /= 16.0; s = abs(s / 16.0 - m * m); float v = s.r + s.g + s.b;
        if (v < bestVar) { bestVar = v; best = m; }
      }
      return best;
    }

    void main(){
      vec2 px = 1.0 / uRes;
      float d = rawD(vUv); bool sky = d >= 0.99995; float dist = viewZ(d);
      vec3 c;
      if (u_paint > 0.0) c = kuwahara(vUv, u_paint);
      else if (u_ca > 0.0) { vec2 o = (vUv - 0.5) * u_ca; c = vec3(scn(vUv + o).r, scn(vUv).g, scn(vUv - o).b); }
      else c = scn(vUv);

      vec3 wp = worldAt(vUv, d);
      vec3 n = normalize(cross(dFdx(wp), dFdy(wp)));

      // TOY BRICKS — studs on anything that faces up, brick seams on anything that stands, in world
      // space so they stay put as you walk. Fades with distance before it can shimmer.
      if (u_lego > 0.0 && !sky) {
        float P = 0.42, near = 1.0 - smoothstep(22.0, 55.0, dist), m = 1.0;
        if (abs(n.y) > 0.7) {
          vec2 cell = fract(wp.xz / P) - 0.5; float r = length(cell);
          m *= 1.0 - 0.28 * smoothstep(0.24, 0.29, r) * (1.0 - smoothstep(0.31, 0.36, r));   // the stud's shadow ring
          m *= 1.0 + 0.10 * (1.0 - smoothstep(0.0, 0.26, length(cell - vec2(-0.07, -0.07))));  // its lit top
          vec2 e = abs(fract(wp.xz / (P * 2.0)) - 0.5); m *= 1.0 - 0.18 * smoothstep(0.47, 0.5, max(e.x, e.y));
        } else {
          float H = P * 1.2, row = floor(wp.y / H);
          float t = (abs(n.x) > abs(n.z) ? wp.z : wp.x) + mod(row, 2.0) * P;
          m *= 1.0 - 0.3 * smoothstep(0.46, 0.5, abs(fract(wp.y / H) - 0.5));
          m *= 1.0 - 0.3 * smoothstep(0.48, 0.5, abs(fract(t / (P * 2.0)) - 0.5));
        }
        c *= mix(1.0, m, near * u_lego);
        vec3 v = normalize(uCamPos - wp), h = normalize(v + normalize(vec3(0.4, 0.8, 0.3)));
        c += pow(max(dot(n, h), 0.0), 48.0) * 0.22 * u_lego;                                   // plastic shine
        c = mix(c, floor(c * 5.0 + 0.5) / 5.0, 0.55 * u_lego);                                   // a short list of brick colours
      }

      // AIR — colour that thickens with distance and shifts from the near tint to the far one
      if (u_fogA > 0.0) {
        float f = sky ? u_fogSky : (1.0 - exp(-u_fogDen * dist));
        vec3 fc = mix(u_fogNear, u_fogFar, sky ? 0.75 : smoothstep(0.0, u_fogRange, dist));
        c = mix(c, fc, clamp(f, 0.0, 1.0) * u_fogA);
      }

      // POSTER — a few flat tones, hue kept
      if (u_poster > 0.0) { float l = lum(c); float q = floor(l * u_poster + 0.5) / u_poster; c *= q / max(l, 1e-3); }

      // HALFTONE — printed dots that grow in the shadows
      if (u_halftone > 0.0) {
        vec2 g = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / 5.0;
        float r = length(fract(g) - 0.5), need = (1.0 - lum(c)) * 0.62;
        c *= 1.0 - u_halftone * 0.5 * (1.0 - smoothstep(need - 0.06, need + 0.06, r));
      }

      // OUTLINE — an ink line wherever depth jumps or tone breaks
      if (u_outline > 0.0) {
        vec2 o = px * u_outlineW; float z0 = dist, e = 0.0, l0 = lum(scn(vUv)), le = 0.0;
        vec2 offs[4]; offs[0] = vec2(o.x, 0.0); offs[1] = vec2(-o.x, 0.0); offs[2] = vec2(0.0, o.y); offs[3] = vec2(0.0, -o.y);
        for (int i = 0; i < 4; i++) { e += abs(viewZ(rawD(vUv + offs[i])) - z0); le += abs(lum(scn(vUv + offs[i])) - l0); }
        float ink = max(smoothstep(0.02, 0.06, e / max(z0, 0.5)), smoothstep(0.25, 0.55, le) * 0.8);
        c = mix(c, u_outlineCol, ink * u_outline);
      }

      // LIGHT SHAFTS — brightness smeared along lines from a sun just above the frame
      if (u_rays > 0.0) {
        vec2 sun = vec2(0.5 + 0.12 * sin(uTime * 0.05), 1.18); float acc = 0.0, w = 1.0;
        float j = hash(gl_FragCoord.xy) / 28.0;
        for (int i = 0; i < 28; i++) {
          vec2 suv = vUv + (sun - vUv) * (float(i) / 28.0 + j);
          if (suv.y < 1.0) { float sd = rawD(suv); acc += (sd >= 0.99995 ? 1.0 : 0.04 + 0.5 * smoothstep(0.8, 1.6, lum(scn(suv)))) * w; }
          else acc += 0.55 * w;
          w *= 0.955;
        }
        float streak = 0.6 + 0.4 * vnoise(vec2(atan(vUv.x - sun.x, sun.y - vUv.y) * 26.0, uTime * 0.12));
        c += u_rayCol * pow(acc / 16.0, 2.0) * streak * u_rays * 0.38 * smoothstep(-0.2, 0.9, vUv.y);
      }

      // GLOW — bright things bleed a little
      if (u_bloom > 0.0) {
        vec3 b = vec3(0.0);
        for (int i = 0; i < 12; i++) { float a = float(i) * 0.5236; vec2 dv = vec2(cos(a), sin(a));
          b += max(scn(vUv + dv * px * 7.0) - 0.75, 0.0) + max(scn(vUv + dv * px * 19.0) - 0.75, 0.0) * 0.6; }
        c += b / 12.0 * u_bloom * 1.6;
      }

      // SPECKS — slow gold dust that twinkles
      if (u_specks > 0.0) {
        float s = 0.0;
        for (int L = 0; L < 2; L++) {
          float sc = L == 0 ? 46.0 : 82.0; vec2 p = gl_FragCoord.xy / sc + vec2(uTime * 0.02, uTime * (0.03 + 0.02 * float(L)));
          vec2 id = floor(p), f = fract(p) - 0.5; float h = hash(id + float(L) * 17.0);
          if (h > 0.9) { vec2 off = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.6;
            s += smoothstep(0.07, 0.0, length(f - off)) * (0.5 + 0.5 * sin(uTime * (1.0 + h * 3.0) + h * 40.0)); }
        }
        c += u_speckCol * s * u_specks * 0.8;
      }

      // GRADE
      c *= u_exposure * u_tint;
      if (u_aces > 0.5) c = aces(c);
      float l = lum(c);
      float redness = clamp((c.r - max(c.g, c.b)) * 4.0, 0.0, 1.0);
      c = mix(vec3(l), c, mix(u_sat, max(u_sat, 1.5), redness * u_redKeep));
      c = (c - 0.5) * u_contrast + 0.5;
      c += u_shadowTint * (1.0 - smoothstep(0.0, 0.5, l)) + u_highTint * smoothstep(0.5, 1.0, l);
      c = mix(c, vec3(1.0), u_fade * (1.0 - l));
      c = pow(max(c, 0.0), vec3(1.0 / 2.2));

      // FINISH — film grain, paper tooth, a light leak, darker corners
      c += (hash(gl_FragCoord.xy + floor(uTime * 24.0) * 0.37) - 0.5) * u_grain;
      if (u_paper > 0.0) c *= 1.0 - u_paper * 0.22 * (vnoise(gl_FragCoord.xy * 0.35) * 0.6 + vnoise(gl_FragCoord.xy * 0.06) * 0.4);
      if (u_leak > 0.0) c += vec3(1.0, 0.45, 0.15) * u_leak * 0.35 * pow(1.0 - vUv.x, 6.0) * (0.6 + 0.4 * vnoise(vec2(vUv.y * 3.0, 1.0)));
      float vd = distance(vUv, vec2(0.5)); c *= 1.0 - smoothstep(0.35, 0.95, vd) * u_vignette;
      gl_FragColor = vec4(c, 1.0);
    }`;

  const mat = new T.ShaderMaterial({ uniforms: U, fragmentShader: frag, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }' });
  mat.extensions = { derivatives: true };
  const quadScene = new T.Scene(), quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quadScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), mat));

  let current = null, depthReady = false, lastError = null;
  function apply(key) {
    current = STYLES[key] ? key : null;
    const s = Object.assign({}, BASE, current ? STYLES[current] : {});
    for (const k in BASE) { if (Array.isArray(BASE[k])) U['u_' + k].value.set(...s[k]); else U['u_' + k].value = s[k]; }
    const q = new URLSearchParams(location.search); q.set('style', current || 'off');
    try { history.replaceState(null, '', location.pathname + '?' + q.toString()); } catch (e) { /* file:// */ }
    bar.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === (current || 'off')));
  }

  // app.js calls this in place of its own final pass; false means "not on, draw yours"
  function render(renderer, rt, camera, time) {
    if (!current) return false;
    if (!depthReady) {            // first call: give the target a depth texture, let this frame go the old way
      const dt = new T.DepthTexture(rt.width, rt.height); dt.format = T.DepthStencilFormat; dt.type = T.UnsignedInt248Type;
      rt.depthTexture = dt; rt.dispose(); depthReady = true; return false;
    }
    U.tDiffuse.value = rt.texture; U.tDepth.value = rt.depthTexture; U.uRes.value.set(rt.width, rt.height); U.uTime.value = time;
    U.uNear.value = camera.near; U.uFar.value = camera.far;
    U.uProjInv.value.copy(camera.projectionMatrixInverse); U.uCamWorld.value.copy(camera.matrixWorld); U.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
    try { renderer.render(quadScene, quadCam); } catch (e) { lastError = String(e); current = null; return false; }
    return true;
  }

  // the picker
  const css = document.createElement('style');
  css.textContent = `#stylelab{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:9999;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:96vw;font:600 12px/1 system-ui,sans-serif}
    #stylelab button{border:0;border-radius:999px;padding:8px 12px;background:rgba(20,18,22,.72);color:#f4efe6;cursor:pointer;backdrop-filter:blur(6px)}
    #stylelab button.on{background:#f4efe6;color:#17141a}`;
  document.head.appendChild(css);
  const bar = document.createElement('div'); bar.id = 'stylelab';
  [['off', 'Original']].concat(KEYS.map(k => [k, STYLES[k].name])).forEach(([k, name], i) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = i + ' ' + name;
    b.addEventListener('click', e => { e.stopPropagation(); apply(k); }); bar.appendChild(b);
  });
  (document.body || document.documentElement).appendChild(bar);
  window.addEventListener('keydown', e => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key >= '0' && e.key <= '9') { const i = +e.key; apply(i === 0 ? 'off' : KEYS[i - 1]); }
  });

  window.STYLE_LAB = { render, apply, STYLES, BASE, get current() { return current; }, get error() { return lastError; }, uniforms: U };
  apply(QS.get('style'));
})();
