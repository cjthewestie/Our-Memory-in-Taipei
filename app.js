// 時代迷霧 · 大稻埕 — scroll rig, directional fog, era re-render, anchor silhouettes,
// the 月下老人 queue beat, and the uPrint post pass (woodblock → night photograph).

(function () {
  const { PALETTE, GRID, ERAS, TILES, CAM, CLOSING, WORDS, OPENING } = window.DATA;
  const C = k => new THREE.Color(PALETTE[k]);

  // ── tunables ──────────────────────────────────────────────────────────────────
  const FOG_LEAD = 44;        // how far ahead of the camera the fog frontier sits
  const FOG_SOFT = 28;        // width of the soft edge, in world units
  const HAZE_DENSITY = 0.0012; // faint distance haze on the far skyline only (issue #13: was 0.0022; CJ, 2026-09-20: "CLOSE THE MIST")
  const DAMP = 5.5;           // scroll damping. higher = snappier
  // ── the change of era: a real photograph fades through (issue #19) ──────────
  // CJ, 2026-09-24: 「換時代的那個迷霧太短沒感覺，有其他手法可以表現嗎」, then 「5個都想做都給我
  // preview下」, then, of the five previews (research/plan-6/transition-5/README.md), the
  // photograph. It replaces the chapter-cut flash. Then, having scrolled it, 2026-09-24: 「剩下照片
  // 有點太老有點crippy要拿溫馨熱鬧的照片 照片淡淡的經過就可以了不需要那麼久只是一個過場而已就跟滑鼠一起
  // 滑過然後淡一點」— so the picture is not held on a timer: its opacity is a function of how far
  // past the marking the scroll is (PHOTO.window of progress, a sine bell peaking at PHOTO.peak),
  // so it tracks the hand, holds where the hand stops and comes back when the scroll comes back.
  // Faint, full-bleed, over in a flick of the wheel; the caption and credit fade with it. The
  // 500 ms era tween runs underneath as before. A frame at a given progress always looks the same
  // (no timer, so none of issue #13's lingering flash). &slow=S still slows the page's clock.
  const QS = new URLSearchParams(location.search);
  const SLOW = Math.max(1, parseFloat(QS.get('slow')) || 1);
  const PHOTO = { window: 0.03, peak: 0.25, print: 0.2 };   // the pass spans `window` of scroll progress past the marking (0.03 ≈ 15vh of page, two or three wheel notches); `peak` = opacity at its middle; `print` = how much old-print treatment (0 = the photograph as it is)
  // One constant per crossing: the file, the caption, the credit, keyed by the chapter entered.
  // Swapping a picture is editing its line here and dropping the file into asset/photos/
  // (CREDITS.md records the licence). Two crossings only: a third picture at the top of the
  // climb was raised and dropped the same day (CJ, 2026-09-24: 「先不用好了先把本來的事情做好」).
  // Both pictures now in are the first round from research/photos/ (a 1961 newspaper halftone of
  // 中華商場 and a 2012 永樂市場 façade); CJ wants warm and crowded frames instead (「溫馨熱鬧」) and
  // sonnet-photos is sourcing them: they replace the two `src` lines below, nothing else changes.
  const PHOTO_SRC = {
    dadao: { src: 'asset/photos/chunghwa-1961.webp', caption: '中華商場 · 1961, the year it opened · newspaper photograph', credit: 'photo 涂柏辰 / 國立臺灣歷史博物館 · CC BY 3.0 TW' },
    tower: { src: 'asset/photos/yongle-2012.webp',   caption: '永樂市場 · 迪化街 Dihua Street · 2012',                 credit: 'photo 玄史生, Wikimedia Commons · CC BY-SA 3.0' },
  };
  const ERA_MS = 500;         // the world re-renders into the next era over this long
  const LABEL_NEAR = 70;      // anchor labels fade in inside this distance
  // surface pass (issue #3 step 1): the light budget. EXPOSURE is the tone-mapping knob, ENV_I how
  // much of the canvas sky every lit surface receives, HEMI the hemisphere light and KEY the sun,
  // both in chapter 1 (ERA_MIX scales them for the others). Set together against step0-0.05.png:
  // the road and the shop walls sit 3–8 levels brighter than before and the saturation is unchanged,
  // while the clipped-white share of the frame goes from 3% to 0.
  // WARM — CJ, 2026-09-24 「整體色調可以改復古一點黃一點嗎我覺得太藍了」. 0 is the old cool frame, 1 the full amber roll.
  const WARM = 1.0;
  const EXPOSURE = 0.85;
  const ENV_I = 0.35;
  const HEMI = 0.65;
  const KEY = 1.3;
  // per-era light mix: lamp is the sun, hemi the hemisphere light, env scales the canvas-sky
  // environment. No night axis: the sky is daylight in every chapter, at every fraction (CJ,
  // 2026-09-20: "CLOSE THE MIST I WANT THE WEBSITE BE BRIGHT AND PRETTY"). Issue #9 removed the
  // `night` term that used to pull the dome, the mountains and a moon toward dusk by chapter 3.
  const ERA_MIX = { red: { lamp: KEY, hemi: HEMI, env: 1.0 }, dadao: { lamp: KEY * 1.09, hemi: HEMI * 0.91, env: 0.95 },
                    tower: { lamp: KEY, hemi: HEMI * 0.68, env: 0.7 } };
  // per-era sky (issue #9): the gradient dome is shown, and its horizon takes a bright tint from
  // the chapter's accent, keyed to the scroll year through the era. All three are daylight:
  // childhood a rose morning (verm at the horizon), Spring Festival gold (lamp), the future a
  // clear, cooler blue. `horizon`/`top` are the dome's two stops, `mount` the mountains; the
  // fog colour follows the horizon so the distance haze blends into the dome. Tinted from the
  // same daylight base (bone→sky for the horizon, sky→ink 0.1 for the top) so no chapter drops
  // below chapter 1's brightness.
  const SKY = (() => {
    const base = () => new THREE.Color(PALETTE.bone).lerp(new THREE.Color(PALETTE.sky), 0.35);
    const top = () => new THREE.Color(PALETTE.sky).lerp(new THREE.Color(PALETTE.ink), 0.1);
    const mount = () => new THREE.Color(PALETTE.haze).lerp(new THREE.Color(PALETTE.sky), 0.35);
    const verm = new THREE.Color(PALETTE.verm), lamp = new THREE.Color(PALETTE.lamp), sky = new THREE.Color(PALETTE.sky);
    return {
      red:   { horizon: base().lerp(verm, 0.16), top: top().lerp(verm, 0.06), mount: mount().lerp(verm, 0.10) },
      dadao: { horizon: base().lerp(lamp, 0.26), top: top().lerp(lamp, 0.08), mount: mount().lerp(lamp, 0.14) },
      tower: { horizon: base().lerp(sky, 0.18),  top: top().lerp(sky, 0.25),  mount: mount().lerp(sky, 0.20) }
    };
  })();

  // ── fog: directional, permanent, and cheap ───────────────────────────────────
  // three.js fog is distance-from-camera. The brief's fog is "the part of the century you
  // have not reached": a wall at a world-z frontier, thick beyond, clear behind, and it only
  // ever moves forward. The four fog chunks are replaced globally so every material inherits
  // it; the two extra uniforms are shared objects, updated once per frame.
  const FOG_U = { frontier: { value: 0 }, soft: { value: FOG_SOFT } };
  THREE.ShaderChunk.fog_pars_vertex = `
    #ifdef USE_FOG
      varying float vFogDepth;
      varying float vFogZ;
    #endif`;
  THREE.ShaderChunk.fog_vertex = `
    #ifdef USE_FOG
      vFogDepth = - mvPosition.z;
      vec4 fogWP = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        fogWP = instanceMatrix * fogWP;
      #endif
      fogWP = modelMatrix * fogWP;
      vFogZ = fogWP.z;
    #endif`;
  THREE.ShaderChunk.fog_pars_fragment = `
    #ifdef USE_FOG
      uniform vec3 fogColor;
      uniform float fogDensity;
      uniform float uFrontier;
      uniform float uSoft;
      varying float vFogDepth;
      varying float vFogZ;
    #endif`;
  THREE.ShaderChunk.fog_fragment = `
    #ifdef USE_FOG
      float fogAhead = uFrontier - vFogZ;
      float fogVeil = smoothstep( 0.0, uSoft, fogAhead );
      float fogHaze = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
      float fogFactor = max( fogVeil, fogHaze );
      gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
    #endif`;
  const withFog = mat => {
    mat.onBeforeCompile = shader => {
      shader.uniforms.uFrontier = FOG_U.frontier;
      shader.uniforms.uSoft = FOG_U.soft;
    };
    return mat;
  };
  // lit(params): the one material every lit engine surface uses (issue #3 step 1). It was
  // MeshLambertMaterial; it is MeshStandardMaterial now so scene.environment reaches it (in r149
  // the environment map lights Standard materials only) and so step 2's normal maps have a
  // material that reads them. Rough and non-metal, so it shades like the Lambert it replaces
  // plus the sky's ambient; every option Lambert took (map, emissive, vertexColors) still works.
  // (issue #3 step 2) lit() takes a `surface` too: one of the library's five procedural families
  // (brick, plaster, concrete, wood, asphalt, from NostalgiaCore.surface), whose colour and normal
  // maps are attached; a caller's own `map` wins and only the normal map is added. lam(col) picks
  // the family from the palette key so the scene files name nothing: bone is plaster, walk and
  // haze are concrete, brick is brick. Tile = TILE world units; the engine sets each map's repeat
  // from the mesh's size where it knows it (part, instSet), so bricks stay brick-sized.
  const SURFACE_OF = { bone: 'plaster', walk: 'concrete', haze: 'concrete', brick: 'brick', road: 'asphalt' };
  const TILE = 3;
  const surface = name => { const Core = window.NostalgiaCore; return name && Core && Core.surface ? Core.surface(name) : null; };
  // ── ambient occlusion, baked per vertex at build time (issue #3 step 4) ──────
  // No screen-space pass: every lit material reads vertex colours, and the geometry carries the
  // occlusion. aoBake(geo) is the cheap rule for the engine's shared geometries (every part() box,
  // every instanced set): the bottom ring of vertices sits at AO_MIN and the top at 1, and any
  // face pointing down (an eave, a canopy, a deck) is AO_MIN, so walls darken where they meet the
  // road and undersides read as shade. Geometries that already carry colours are left alone.
  // aoBakeAsset() is the library's heuristic, in asset() below. AO_MIN = 0.75 is the darkest.
  const AO_MIN = 0.75, aoBaked = new Set();
  function aoBake(geo) {
    if (!geo || aoBaked.has(geo) || !geo.attributes.position || geo.attributes.color) return geo;
    aoBaked.add(geo);
    geo.computeBoundingBox();
    const bb = geo.boundingBox, pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count;
    const col = new Float32Array(n * 3), span = Math.max(1e-6, bb.max.y - bb.min.y);
    for (let i = 0; i < n; i++) {
      let t = (pos.getY(i) - bb.min.y) / span; t = t * t * (3 - 2 * t);
      let ao = AO_MIN + (1 - AO_MIN) * t;
      if (nor && nor.getY(i) < -0.5) ao = AO_MIN;
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }
  const litMats = [];   // every material that reads scene.environment, so the era tween can scale it
  const lit = params => {
    const p = Object.assign({ roughness: 0.92, metalness: 0, envMapIntensity: ENV_I, vertexColors: true }, params);
    const S = surface(p.surface); delete p.surface;
    if (S) { if (!p.map) p.map = S.map.clone(); p.normalMap = S.normalMap; }
    const m = new THREE.MeshStandardMaterial(p); litMats.push(m); return m;
  };
  const lam = (col, extra) => lit(Object.assign({ color: C(col), surface: SURFACE_OF[col] || null }, extra || {}));
  const fitTile = (mat, w, h) => { const m = mat.map; if (m && m.userData.tile) m.repeat.set(Math.max(w, 0.01) / TILE, Math.max(h, 0.01) / TILE); };

  // ── renderer, scene, camera ──────────────────────────────────────────────────
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  // pixel ratio cap: 2 on a desktop, 1.5 on a phone (coarse pointer or a narrow screen), so a
  // 3x phone does not render 9x the pixels of a laptop
  const IS_PHONE = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_PHONE ? 1.5 : 2));
  // Canvas textures at half size on a phone (CJ, 2026-09-25: 「載很久」, then the Dihua and Xinyi
  // roads black with the lantern shadows on them). The three sign atlases alone were 2048 x 4096,
  // 2048 x 4096 and 2048 x 2048: 230 MB of 2D canvas and 57.6 million texels for the GPU at load.
  // iOS Safari caps a page's canvas memory well under that, and a texture uploaded after the cap
  // (the road's Dihua and Xinyi maps go up at the era flip, not at load) came out blank, so those
  // roads rendered black but for their sheen. On a phone the atlases are painted at TEX_SCALE
  // through a scale transform (scene-*.js SIGNS: layout and UVs unchanged) and the library's
  // text signs are shrunk here, the full-size canvas released at once.
  const TEX_SCALE = IS_PHONE ? 0.5 : 1;
  function shrink(cv) {
    if (TEX_SCALE >= 1 || !cv || !cv.width || cv.width * cv.height < 256 * 256) return cv;
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(cv.width * TEX_SCALE)); out.height = Math.max(1, Math.round(cv.height * TEX_SCALE));
    const g = out.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(cv, 0, 0, out.width, out.height);
    cv.width = cv.height = 0;                                        // give its canvas memory back now, not at the next GC
    return out;
  }
  if (window.NostalgiaCore) window.NostalgiaCore.shrink = shrink;   // the library's text signs (assets-core.js textTexture)
  // Shader error checks off unless ?debug=1: with them on, three reads every program's info log
  // the moment it is created, which makes the browser finish compiling and linking it right there,
  // one program after another. Forty-odd programs made the first frame the slowest part of loading.
  renderer.debug.checkShaderErrors = new URLSearchParams(location.search).get('debug') === '1';
  renderer.outputEncoding = THREE.LinearEncoding; // gamma is applied at the end of the post pass
  // tone mapping (issue #3 step 1): the ACES filmic curve on the renderer. In this r149 build the
  // renderer's tone mapping runs on the offscreen draw as well (only outputEncoding is gated on
  // the render target), so the post pass receives a tone-mapped linear frame and gamma-encodes it
  // as before. What changes is the highlight shoulder: a sunlit wall keeps its gradation instead
  // of clipping to white. The curve is applied to luminance only, as a CustomToneMapping: the
  // stock ACESFilmicToneMapping runs its curve through the RRT matrices and lost 30% of the frame's
  // saturation (measured 0.144 → 0.103 at 0.05, the lit windows and the 101 glass going cream),
  // which is the greyer page CJ ruled out on 2026-09-20. Scaling the colour by curve(Y)/Y keeps
  // every hue and only rolls the highlights off. The sky dome and the particles are
  // ShaderMaterials and are untouched by it.
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `vec3 CustomToneMapping( vec3 color ) {
      color *= toneMappingExposure;
      float y = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
      float t = ( y * ( 2.51 * y + 0.03 ) ) / ( y * ( 2.43 * y + 0.59 ) + 0.14 );
      return color * ( t / max( y, 1e-4 ) );
    }`);
  renderer.toneMapping = THREE.CustomToneMapping;
  renderer.toneMappingExposure = EXPOSURE;

  const scene = new THREE.Scene();
  scene.background = C('haze');
  scene.fog = new THREE.FogExp2(PALETTE.haze, HAZE_DENSITY);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);

  // hemisphere: pale blue sky above, a warm pavement bounce below, so a roof and an underside are
  // never the same colour; its intensity is ERA_MIX.hemi, tweened per era
  // coloured shadow (issue #11, research/bruno-simon/README.md section 4 and 6b): a shadowed
  // surface receives only the hemisphere light and the environment, so tinting the hemisphere
  // toward violet makes every shadow read as colour instead of grey while the sun stays warm.
  // The tint keeps each colour's luminance, so nothing gets darker (CJ, 2026-09-20: bright).
  // No day cycle: one tint, every chapter.
  const SHADOW_TINT = new THREE.Color('#7b5cff'), SHADOW_MIX = 0.3;
  const lumOf = c => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
  const tinted = c => { const y = lumOf(c); c.lerp(SHADOW_TINT, SHADOW_MIX); return c.multiplyScalar(y / lumOf(c)); };
  const hemi = new THREE.HemisphereLight(tinted(C('bone').lerp(C('sky'), 0.2)), tinted(C('walk').lerp(C('ink'), 0.5)), 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(C('lamp'), 0.9);
  key.position.set(18, 26, 12);
  scene.add(key);
  // ── the sun casts shadows (issue #3 step 3) ──────────────────────────────────
  // One shadow map for the whole street: an orthographic box SUN_BOX units square, re-centred every
  // frame on a point SUN_AHEAD units down the road from the scroll camera, so the map's texels are
  // spent where the camera looks and the 460-unit street never needs a bigger map. PCF soft, 2048
  // on a desktop and 1024 on a phone (texel 0.06 / 0.12 units). Every lit, opaque mesh casts and
  // receives; the two biases are what keep the flat walls free of acne.
  const SUN_DIR = key.position.clone().normalize(), SUN_BOX = 120, SUN_AHEAD = 45, SUN_DIST = 160;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  key.castShadow = true;
  key.shadow.mapSize.set(IS_PHONE ? 1024 : 2048, IS_PHONE ? 1024 : 2048);
  key.shadow.camera.left = -SUN_BOX / 2; key.shadow.camera.right = SUN_BOX / 2;
  key.shadow.camera.top = SUN_BOX / 2; key.shadow.camera.bottom = -SUN_BOX / 2;
  key.shadow.camera.near = 1; key.shadow.camera.far = SUN_DIST + SUN_BOX;
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.05;
  scene.add(key.target);
  function sunFollow(camZ) {
    key.target.position.set(0, 0, camZ - SUN_AHEAD);
    key.position.copy(key.target.position).addScaledVector(SUN_DIR, SUN_DIST);
  }
  // flags set once, after the scene files have built, before the first draw. The same pass bakes
  // the occlusion into any geometry a vertex-colour material draws that has no colour attribute
  // yet (the girl, the climbing man, anything a scene file gave lit() directly): three.js only
  // substitutes a default colour for a missing attribute on ShaderMaterial, so a lit() material
  // over a bare geometry would draw black (CJ, 2026-09-23: 「the character all black」).
  function enableShadows() {
    scene.traverse(o => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || !m.isMeshStandardMaterial) return;                  // unlit signs, the sky, the mountains, the particles: no
      if (m.vertexColors && o.geometry && !o.geometry.attributes.color) aoBake(o.geometry);
      o.receiveShadow = true;
      o.castShadow = !m.transparent;
    });
  }

  // ── environment: a canvas-drawn sky, PMREM'd into scene.environment (issue #3 step 1) ──
  // Every Standard material (the asset library and, from this step, the engine's lit() surfaces)
  // reads scene.environment: upward faces pick up sky, sides pick up the warm ground band, and the
  // 101 curtain wall has something to reflect. Drawn at load with two gradients and a sun disc
  // placed where the key light is (equirect u from atan2(z, x), v from asin(y)); no image file.
  const skyEnv = (() => {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    const g = cv.getContext('2d');
    const up = g.createLinearGradient(0, 0, 0, 128);          // zenith → horizon
    up.addColorStop(0, '#8ec3f0'); up.addColorStop(0.72, '#bcd8ee'); up.addColorStop(1, PALETTE.bone);
    g.fillStyle = up; g.fillRect(0, 0, 512, 128);
    const dn = g.createLinearGradient(0, 128, 0, 256);        // horizon → ground bounce
    dn.addColorStop(0, PALETTE.bone); dn.addColorStop(0.5, '#cfc6b4'); dn.addColorStop(1, '#8e8778');
    g.fillStyle = dn; g.fillRect(0, 128, 512, 128);
    const kd = key.position.clone().normalize();
    const sx = (Math.atan2(kd.z, kd.x) / (2 * Math.PI) + 0.5) * 512, sy = (0.5 - Math.asin(kd.y) / Math.PI) * 256;
    const sun = g.createRadialGradient(sx, sy, 4, sx, sy, 78);
    sun.addColorStop(0, '#fff6e2'); sun.addColorStop(1, 'rgba(255,246,226,0)');
    g.fillStyle = sun; g.fillRect(sx - 90, 0, 180, 140);
    const t = new THREE.CanvasTexture(cv);
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  })();
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromEquirectangular(skyEnv).texture;
  pmrem.dispose(); skyEnv.dispose();

  // stripGeo(make, n, step): n copies of make()'s geometry laid end to end down -z, `step` apart and
  // centred on 0, merged into one indexed geometry (one draw call). Each copy keeps its own UVs.
  function stripGeo(make, n, step) {
    const parts = [], attrs = {}, index = [];
    let base = 0;
    for (let i = 0; i < n; i++) {
      const g = make(); g.translate(0, 0, (n * step) / 2 - step / 2 - i * step); parts.push(g);
    }
    Object.keys(parts[0].attributes).forEach(k => { attrs[k] = []; });
    parts.forEach(g => {
      Object.keys(attrs).forEach(k => { const a = g.attributes[k].array; for (let j = 0; j < a.length; j++) attrs[k].push(a[j]); });
      const ix = g.index.array; for (let j = 0; j < ix.length; j++) index.push(ix[j] + base);
      base += g.attributes.position.count; g.dispose();
    });
    const out = new THREE.BufferGeometry();
    Object.keys(attrs).forEach(k => out.setAttribute(k, new THREE.Float32BufferAttribute(attrs[k], parts[0].attributes[k].itemSize)));
    out.setIndex(index);
    return out;
  }

  // ── ground, road, river ──────────────────────────────────────────────────────
  const flat = (w, d, col, x, y, z) => {
    const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, withFog(lit({ color: C(col) })));
    m.position.set(x, y, z); scene.add(m); return m;
  };
  flat(400, 900, 'leaf', 0, 0, -200).material.color.lerp(C('ink'), 0.45);
  flat(GRID.roadWidth, 620, 'road', 0, 0.02, -200);
  flat(60, 620, 'sky', -50, -0.3, -200).material.color.lerp(C('haze'), 0.5);

  // ── year markings painted on the road at each era boundary ───────────────────
  // Digits drawn to a canvas with the system font (no font files, no images), laid flat on
  // the road in perspective. The camera passes over them at the exact flip.
  function yearMarking(year, z) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 512;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.bone;
    g.font = '700 400px -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(year), 512, 276);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const geo = new THREE.PlaneGeometry(GRID.roadWidth - 1, (GRID.roadWidth - 1) * 1.1);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, withFog(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false })));
    m.position.set(0, 0.05, z - 8);
    scene.add(m);
  }
  ERAS.slice(1).forEach(e => yearMarking(e.start, e.zRange[0]));

  // ── parts: every box in the world, with a height and colour per era ──────────
  // A part is { mesh, look:{era:{h,c}} }. Height 0 = not there. The era tween lerps all of
  // them together over ERA_MS, ahead of the camera and behind it alike.
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0); // origin at the base so scale.y is height
  const parts = [];
  function part(x, y, z, w, d, look, rotY, geo) {
    const first = ERAS.map(e => look[e.key]).find(s => s && s.h > 0);          // the surface family follows the first era's colour
    const mesh = new THREE.Mesh(aoBake(geo || boxGeo), withFog(lit({ color: C('bone'), surface: first ? SURFACE_OF[first.col] : null })));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, 1, d);
    if (rotY) mesh.rotation.y = rotY;
    scene.add(mesh);
    const L = {};
    ERAS.forEach(e => { const s = look[e.key]; L[e.key] = s && s.h > 0 ? { h: s.h, c: C(s.col) } : { h: 0, c: C('ink') }; });
    const p = { mesh, look: L, fromH: 0, fromC: C('ink'), tileMap: mesh.material.map && mesh.material.map.userData.tile ? mesh.material.map : null };
    parts.push(p);
    return p;
  }
  const only = (eras, h, col) => { const o = {}; eras.forEach(k => o[k] = { h, col }); return o; };

  const tileX = tile => tile.grid[0] * GRID.laneX + tile.grid[0] * (tile.size[0] / 2 - 4);
  const tileZ = tile => -tile.grid[1] * GRID.lot;

  // generic lots: one plain box each, from the type table
  TILES.filter(t => !t.hero).forEach(t => part(tileX(t), 0, tileZ(t), t.size[0], t.size[1], t.byEra));

  // ── the four anchors, built from primitives ──────────────────────────────────
  const anchors = {};
  TILES.filter(t => t.hero).forEach(t => { anchors[t.id] = { tile: t, x: tileX(t), z: tileZ(t), top: 8 }; });
  const built = (t, k) => t.byEra[k].built;

  const ALL = ERAS.map(e => e.key);

  // The four anchors themselves are built in the scene files (scene-red.js: the Red House;
  // scene-dadao.js: Dihua Street and the temple; scene-tower.js: Taipei 101), each from a real
  // reference. They set anchors[id].top for the label and, for the tower, TOWER.h / TOWER.faceX.
  const TOWER = { x: anchors.tower101.x, z: anchors.tower101.z, h: 100, faceX: null };

  // the man climbing the west face: a small figure whose height follows the scroll in the last
  // chapter. Issue #12 (CJ, 2026-09-23: 「101上的人要爬到頂端」): he climbs the glass on TOWER.faceX
  // until his hands reach the crown rim (TOWER.h), pulls himself over it and stands on the crown
  // roof. The crown, not the spire: the spire is a mast nobody stands on (research/plan-6 §4).
  const man = new THREE.Group();
  const manMat = withFog(lit({ color: C('verm') }));
  const manBody = new THREE.Mesh(boxGeo, manMat); manBody.scale.set(0.7, 1.4, 0.5); man.add(manBody);
  const manHead = new THREE.Mesh(boxGeo, withFog(lit({ color: C('bone') }))); manHead.scale.set(0.5, 0.5, 0.5); manHead.position.y = 1.45; man.add(manHead);
  // the arms pivot at the shoulders and point up (the climbing grip), so that once he stands on
  // the crown the sky-side arm can wave over his head and the other drop to his side. CJ,
  // 2026-09-24, on what the page is for: 「高樓上的人正在跟我們招手」— the man up there is waving at us.
  const arm = x => { const g = new THREE.Group(); g.position.set(x, 1.15, 0); const m = new THREE.Mesh(boxGeo, manMat); m.scale.set(0.25, 1.1, 0.25); g.add(m); man.add(g); return g; };   // boxGeo sits on its base: the arm grows up from the pivot
  const armL = arm(-0.42), armR = arm(0.42);              // pivots inside the shoulder line so the arm stays attached when it swings
  man.scale.setScalar(1.6);
  scene.add(man);
  const MAN_HANDS = 2.25 * 1.6;     // soles (the group origin; boxGeo sits on its base) to the raised hands, world units
  const CLIMB_TOP = 0.93;           // chapter fraction at which his hands reach the crown rim
  const RIM_Y = () => TOWER.h + 0.05;                       // the crown rim's top face (tower101.py crown_rim)
  const STAND = { dx: -2.85, dz: 1.4, rotY: -0.6 };         // on the roof ledge between the rim (hw 3.4) and the mechanical box (hw 2.1), turned to the closing camera
  const WAVE = { lean: 0.35, swing: 0.3, hz: 1.8 };         // the waving arm leans out over the sky by `lean` and swings about it
  const manState = { f: 0, phase: 'off' };
  function updateMan(u) {
    const i = ERAS.length - 1, f = Math.min(1, Math.max(0, (u - BOUNDS[i]) / (BOUNDS[i + 1] - BOUNDS[i])));
    man.visible = ERAS[eraIdx].key === 'tower';
    const t = performance.now() / 1000;
    manState.f = f;
    if (f < CLIMB_TOP) {
      // climbing: origin 6 → just under the rim, x on the face at that height so the flare per segment keeps him on the glass
      const climb = 6 + Math.pow(f / CLIMB_TOP, 1.4) * (RIM_Y() - MAN_HANDS - 6);   // soles; the hands reach the rim at CLIMB_TOP
      const fx = TOWER.faceX ? Math.min(TOWER.faceX(climb), TOWER.faceX(climb + 1.8), TOWER.faceX(climb + MAN_HANDS)) : TOWER.x - 6.1;   // the most outward face across his height: each segment flares out over the next one's base, so at a joint he stands on the ledge
      man.position.set(fx, climb, TOWER.z + 1.5);
      man.rotation.y = 0;
      armL.position.y = 1.15 + Math.sin(t * 3) * 0.2; armR.position.y = 1.15 - Math.sin(t * 3) * 0.2; armL.rotation.z = armR.rotation.z = 0;
      manState.phase = 'climb';
    } else {
      // the mantle: hanging at the rim → standing on the crown roof. Height first, then the step in.
      const k = (f - CLIMB_TOP) / (1 - CLIMB_TOP), ss = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
      const ky = ss(k * 1.4), kx = ss((k - 0.3) / 0.7);
      const y0 = RIM_Y() - MAN_HANDS, y1 = RIM_Y();                                   // soles: hanging from the rim → standing on it
      const x0 = TOWER.faceX ? TOWER.faceX(y0) : TOWER.x - 4.4, x1 = TOWER.x + STAND.dx;
      man.position.set(x0 + (x1 - x0) * kx, y0 + (y1 - y0) * ky, TOWER.z + 1.5 + (STAND.dz - 1.5) * kx);
      man.rotation.y = STAND.rotY * kx;                                  // turns to face us as he steps onto the roof
      armL.position.y = armR.position.y = 1.15;
      const kw = ss((k - 0.45) / 0.55);                                   // once he is standing: the right arm drops, the left one waves
      armR.rotation.z = Math.PI * kw;
      armL.rotation.z = (WAVE.lean + Math.sin(t * WAVE.hz * Math.PI * 2) * WAVE.swing) * kw;
      manState.phase = k >= 1 ? 'top' : 'mantle';
    }
  }

  // ── BACKGROUND: sky dome, mountains, distant city ────────────────────────────
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: C('ink') }, horizon: { value: C('haze') } },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 top, horizon; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.55)), 1.0); }`,
    side: THREE.BackSide, depthWrite: false, fog: false
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 24, 12), skyMat);
  scene.add(sky);
  scene.background = null;

  const mountainMat = new THREE.MeshBasicMaterial({ color: C('haze'), fog: false });
  const coneGeo = new THREE.ConeGeometry(1, 1, 7); coneGeo.translate(0, 0.5, 0);
  const mountains = new THREE.InstancedMesh(coneGeo, mountainMat, 26);
  (() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * 0.05 + (i / 26) * Math.PI * 2.1, r = 430 + (i % 3) * 30;
      const h = 60 + ((i * 37) % 70), w = 140 + ((i * 53) % 120);
      m.makeScale(w, h, w).setPosition(Math.sin(a) * r, -6, -200 + Math.cos(a) * r);
      mountains.setMatrixAt(i, m);
    }
    mountains.instanceMatrix.needsUpdate = true;
  })();
  scene.add(mountains);

  // per-era instanced sets: each instance has a place and a height per era, tweened together
  const instSets = [];
  function instSet(geo, mat, items, opts) {
    const mesh = new THREE.InstancedMesh(aoBake(geo), withFog(mat), items.length);
    mesh.frustumCulled = false;
    // shadow flags set here, not in enableShadows(): the glb street elements (MODELS.instance:
    // lamps, trees, Dihua bays, stalls, shopfront modules, bollards, props) arrive after the
    // first frame's pass has run, and their Lambert materials sat outside its Standard gate.
    // Issue #11's runtime check: 47 instanced sets cast nothing before this line.
    if (mat.isMeshStandardMaterial || mat.isMeshLambertMaterial) { mesh.receiveShadow = true; mesh.castShadow = !mat.transparent; }
    if (mat.map && mat.map.userData.tile && items.length) {           // one repeat for the set: its median footprint and height
      const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
      fitTile(mat, med(items.map(it => Math.max(it.w, it.d))), med(items.map(it => Math.max(...Object.values(it.h)))));
    }
    if (opts && opts.colors && items.length) {                 // an empty set has no instanceColor buffer
      items.forEach((it, i) => mesh.setColorAt(i, it.c || C('haze')));
      mesh.instanceColor.needsUpdate = true;
    }
    scene.add(mesh);
    const set = { mesh, items, from: items.map(() => 0) };
    if (opts && opts.rise) set.riseT0 = clockNow;                // a late model (models.js): grow out of the ground over ERA_MS instead of popping in
    instSets.push(set);
    return set;
  }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), P3 = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  function instSnapshot() { instSets.forEach(set => set.items.forEach((it, i) => { set.from[i] = it.cur == null ? 0 : it.cur; })); }
  function instUpdate(e, key) {
    instSets.forEach(set => {
      let es = e;
      if (set.riseT0 != null) { const k = Math.min(1, (clockNow - set.riseT0) / ERA_MS); es = Math.min(e, ease3(k)); if (k >= 1) delete set.riseT0; }
      set.items.forEach((it, i) => {
        const to = it.h[key] || 0, h = set.from[i] + (to - set.from[i]) * es;
        it.cur = h;
        Q.setFromAxisAngle(Y, it.r || 0);
        const on = h > 0.01;                                     // absent items vanish entirely, no flat footprint
        S3.set(on ? it.w : 0.0001, Math.max(h, 0.0001), on ? it.d : 0.0001);
        P3.set(it.x, on ? (it.y || 0) : -50, it.z);
        set.mesh.setMatrixAt(i, M4.compose(P3, Q, S3));
      });
      set.mesh.instanceMatrix.needsUpdate = true;
    });
  }
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  // distant city on both sides of the street: low roofs, then a skyline
  (() => {
    const items = [];
    for (let i = 0; i < 320; i++) {
      const side = i % 2 ? 1 : -1, x = side * (30 + rnd() * 90), z = 60 - rnd() * 560;
      const w = 5 + rnd() * 9, d = 5 + rnd() * 9, far = Math.abs(x) / 120;
      if (x < -28 && z < -186 && z > -244) continue;                              // the river behind the Dadaocheng wharf
      items.push({ x, z, w, d, h: { red: 2 + rnd() * 3, dadao: 3 + rnd() * 6, tower: 6 + rnd() * (10 + 30 * far) } });
    }
    instSet(boxGeo, lit({ color: C('haze') }), items);
  })();

  // ── STREET DETAIL ────────────────────────────────────────────────────────────
  // sidewalks and curbs
  const walkX = GRID.roadWidth / 2 + 1.6;
  // In 12-unit pieces merged into one mesh, four concrete tiles each, for the same reason as the
  // road: one 620-unit box put v at 207 at the Xinyi end, past what a phone's texture unit resolves.
  const WALK_SEG = 12, WALK_N = 52;                                    // 624 units, 2 past the road at each end
  const walkGeo = aoBake(stripGeo(() => new THREE.BoxGeometry(3.2, 0.22, WALK_SEG), WALK_N, WALK_SEG));
  [-1, 1].forEach(s => {
    const m = new THREE.Mesh(walkGeo, withFog(lit({ color: C('walk'), surface: 'concrete' })));
    m.position.set(s * walkX, 0, -200); scene.add(m);
    fitTile(m.material, 3.2, WALK_SEG);                                // the top face is the one seen: u along x, v along z
  });
  // road surface pattern: dirt at first, then a painted centre line — drawn to a canvas, repeated
  // The canvas is one 12 x 10 unit stretch of road (one tile of the road mesh), so the asphalt family's tile
  // (TILE units square) is drawn 32 x 77 px here, multiplied over the base colour. Seeded, like the
  // library's own surfaces, so the speckle is the same every load.
  const texRnd = (() => { let a = 3; return () => { a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  function roadTexture(kind) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = PALETTE.road; g.fillRect(0, 0, 128, 256);
    const asphalt = surface('asphalt');
    if (asphalt) {
      const tw = 128 / (GRID.roadWidth / TILE), th = 256 / (10 / TILE);
      g.globalCompositeOperation = 'multiply';
      for (let y = 0; y < 256; y += th) for (let x = 0; x < 128; x += tw) g.drawImage(asphalt.map.image, x, y, tw, th);
      g.globalCompositeOperation = 'source-over';
    }
    if (kind === 'dirt') { for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(10,12,16,0.35)'; g.fillRect(texRnd() * 128, texRnd() * 256, 2, 2); } }
    if (kind === 'tram') { g.fillStyle = PALETTE.ink; g.fillRect(40, 0, 3, 256); g.fillRect(85, 0, 3, 256); }
    if (kind === 'lines') { g.fillStyle = PALETTE.bone; g.fillRect(62, 20, 4, 90); g.fillRect(6, 0, 3, 256); g.fillRect(119, 0, 3, 256); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;   // repeat 1 x 1: the road mesh is one tile per 10 units (below)
    return t;
  }
  const roadMaps = { red: roadTexture('dirt'), dadao: roadTexture('plain'), tower: roadTexture('lines') }; // Dihua Street: plain asphalt, no tram, no centre line
  const roadMesh = scene.children.find(o => o.geometry && o.geometry.parameters && o.geometry.parameters.width === GRID.roadWidth);
  roadMesh.material.map = roadMaps.red; roadMesh.material.needsUpdate = true;
  // (issue #3 step 4) the road is eight strips across so its vertex colours can darken the outer
  // 2.5 units toward the kerbs, where the walls and the sidewalks meet it
  // It is also 62 separate 10-unit tiles, each with its own 0..1 texture coordinates, not one
  // plane with the map repeated 62 times: at the Xinyi end v ran to 40-62, more than a phone GPU's
  // texture coordinates resolve cleanly. A desktop GPU hides it; a phone may not.
  roadMesh.geometry.dispose();
  roadMesh.geometry = stripGeo(() => new THREE.PlaneGeometry(GRID.roadWidth, 10, 8, 1).rotateX(-Math.PI / 2), 62, 10);
  (() => {
    const pos = roadMesh.geometry.attributes.position, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const e = Math.min(1, (GRID.roadWidth / 2 - Math.abs(pos.getX(i))) / 2.5), ao = 0.85 + 0.15 * e * e * (3 - 2 * e);
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
    }
    roadMesh.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  })();

  // windows on every generic building: dark grid on the facade, lit at night via emissive
  function windowTexture(cols, rows, lit) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = lit ? '#000' : '#fff'; g.fillRect(0, 0, 128, 128);
    const cw = 128 / cols, ch = 128 / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const on = lit ? ((i * 7 + j * 13) % 5 !== 0) : true;
      g.fillStyle = lit ? (on ? PALETTE.lamp : '#000') : 'rgba(0,0,0,0.55)';
      g.fillRect(i * cw + cw * 0.28, j * ch + ch * 0.25, cw * 0.44, ch * 0.5);
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  const winMap = windowTexture(3, 3, false), winLit = windowTexture(3, 3, true);
  parts.forEach(p => {
    if (p.mesh.geometry !== boxGeo || p.mesh.scale.x < 4) return;
    const mat = p.mesh.material;
    mat.map = winMap.clone(); mat.map.needsUpdate = true;
    mat.emissiveMap = winLit.clone(); mat.emissiveMap.needsUpdate = true;
    mat.emissive = C('lamp'); mat.emissiveIntensity = 0;
    mat.needsUpdate = true;
    p.windows = true;
  });
  function updateWindows(key) {
    parts.forEach(p => {
      if (!p.windows) return;
      const h = p.mesh.scale.y, w = p.mesh.scale.x;
      p.mesh.material.map.repeat.set(w / 3, h / 3);
      p.mesh.material.emissiveMap.repeat.set(w / 3, h / 3);
      p.mesh.material.emissiveIntensity = key === 'tower' ? 0.9 * eraE : (key === 'dadao' ? 0.35 * eraE : 0);
    });
  }

  // lampposts on both sidewalks: sparse at first, then dense. Issue #5: the lamp is a glb
  // (asset/blender/lamp.py) instanced through MODELS.instance; the height per era scales it, the
  // curved arm turns toward the road, the lantern head glows a little.
  (() => {
    const items = [];
    for (let z = 40; z > -460; z -= 12) [-1, 1].forEach(s => {
      const k = Math.round(z / 12) % 3 === 0;
      items.push({ x: s * (walkX + 0.9), z, w: 1, d: 1, r: s > 0 ? -Math.PI / 2 : Math.PI / 2, h: { red: k ? 0.75 : 0, dadao: 0.9, tower: 1 } });
    });
    if (window.MODELS) MODELS.load('lamp', gltf => MODELS.instance(gltf.scene, items, { emissive: 0.6 }));
  })();
  // trees along the sidewalks from the 1930s (asset/blender/tree.py, a rounded canopy on a trunk)
  (() => {
    const items = [];
    for (let z = 34; z > -460; z -= 15) [-1, 1].forEach(s => {
      if (Math.abs(z + 405) < 45) return;                       // the 101 plaza and the base shot
      if (z < -138 && z > -292) return;                          // Dihua Street has no street trees
      const sc = 0.85 + rnd() * 0.3;
      items.push({ x: s * (walkX - 0.8), z, w: sc, d: sc, r: rnd() * 6.28, h: { red: 0, dadao: 0.8, tower: 1 } });
    });
    if (window.MODELS) MODELS.load('tree', gltf => MODELS.instance(gltf.scene, items));
  })();
  // ── pedestrians (issue #13): one figure, seven wardrobes, placed here and by every chapter ──
  // A figure is a few boxes coloured per vertex (bone skin, ink hair, a shirt and trousers or a
  // skirt in the palette), base at y 0 and height normalised to 1, so an item's h is the figure's
  // real height per era and the engine's per-era tween grows and drops it like everything else.
  // people(items) splits the items by wardrobe into one instSet per wardrobe, seven draw calls a
  // call, so a chapter calls it once with its whole crowd. Never on the road (CJ, 2026-09-20):
  // sidewalks, plazas, the 1999 pedestrian zone, the 年貨大街 market and the skywalk deck only.
  //   items: { x, z, y?, r?, v?, h:{red,dadao,tower} }   v: wardrobe 0..6, seeded pick when absent
  const WARDROBE = [
    { top: 'bone', legs: 'ink' }, { top: 'haze', legs: 'ink' }, { top: 'lamp', legs: 'haze' }, { top: 'sky', legs: 'walk' },
    { top: 'bone', skirt: 'verm' }, { top: 'haze', skirt: 'ink' }, { top: 'verm', skirt: 'ink' },
  ];
  const FIG_H = 1.6;
  function figureGeo(w) {
    const P = [];
    const box = (x, y, z, wd, h, d, col) => P.push({ x, y, z, w: wd, h, d, col });
    if (w.skirt) {
      [-0.09, 0.09].forEach(x => box(x, 0, 0, 0.14, 0.5, 0.16, 'bone'));        // legs under the skirt
      box(0, 0.48, 0, 0.44, 0.36, 0.3, w.skirt);
      box(0, 0.82, 0, 0.4, 0.46, 0.24, w.top);
      [-0.26, 0.26].forEach(x => box(x, 0.84, 0, 0.11, 0.44, 0.12, w.top));
      box(0, 1.1, -0.12, 0.3, 0.44, 0.12, 'ink');                                // long hair down the back
    } else {
      [-0.1, 0.1].forEach(x => box(x, 0, 0, 0.16, 0.74, 0.18, w.legs));
      box(0, 0.74, 0, 0.44, 0.52, 0.26, w.top);
      [-0.28, 0.28].forEach(x => box(x, 0.76, 0, 0.11, 0.48, 0.12, w.top));
      box(0, 1.36, -0.1, 0.28, 0.16, 0.1, 'ink');                                 // the back of the hair
    }
    box(0, 1.28, 0, 0.26, 0.26, 0.26, 'bone');                                    // head
    box(0, 1.5, 0, 0.28, 0.1, 0.28, 'ink');                                       // hair cap, top at FIG_H
    const pos = [], nor = [], uv = [], col = [];
    P.forEach(p => {
      const g = new THREE.BoxGeometry(p.w, p.h, p.d).toNonIndexed();
      g.translate(p.x, p.y + p.h / 2, p.z);
      const A = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv.array, c = C(p.col);
      for (let i = 0; i < A.length; i += 3) { pos.push(A[i], A[i + 1] / FIG_H, A[i + 2]); nor.push(N[i], N[i + 1], N[i + 2]); col.push(c.r, c.g, c.b); }
      for (let i = 0; i < U.length; i++) uv.push(U[i]);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return geo;
  }
  const FIG_GEO = WARDROBE.map(figureGeo);
  const figMat = lit({ vertexColors: true });
  const figRnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();   // its own seed: the shared rnd sequence stays as it was
  const peopleCalls = [];                                                       // items per people() call, in load order: engine, red, dadao, tower
  function people(items) {
    const byV = FIG_GEO.map(() => []);
    items.forEach(it => byV[it.v == null ? Math.floor(figRnd() * FIG_GEO.length) : it.v].push(Object.assign({ w: 1, d: 1 }, it)));
    peopleCalls.push(items.length);
    return byV.map((its, v) => its.length ? instSet(FIG_GEO[v], figMat, its) : null).filter(Boolean);
  }
  // people on the sidewalks the whole street long: more each era, facing along the street
  (() => {
    const items = [];
    for (let i = 0; i < 90; i++) {
      const s = i % 2 ? 1 : -1, z = 40 - rnd() * 500, x = s * (walkX - 1.2 + rnd() * 2.4), rr = rnd();
      items.push({ x, z, y: 0.22, r: (rr < 0.5 ? 0 : Math.PI) + ((rr * 4) % 1 - 0.5) * 0.9, h: { red: i < 12 ? 1.6 : 0, dadao: i < 36 ? 1.6 : 0, tower: 1.6 } });
    }
    people(items);
  })();
  // shop signs hanging off the facades: a few painted boards, then a wall of neon
  (() => {
    const items = [];
    for (let i = 0; i < 70; i++) {
      const s = i % 2 ? 1 : -1, z = 20 - rnd() * 440, y = 3 + rnd() * 5;
      const c = i % 3 === 0 ? C('verm') : (i % 3 === 1 ? C('lamp') : C('bone'));
      const ximen = z > -140;                                                     // Ximending 1985–1999 already wore a wall of signs
      items.push({ x: s * (GRID.roadWidth / 2 + 3.2), z, y, w: 1.4, d: 0.25, c, h: { red: ximen ? (i % 2 === 0 ? 1.6 : 0) : (i % 6 === 0 ? 0.8 : 0), dadao: i % 2 === 0 ? 1.6 : 0, tower: 2.2 } });
    }
    instSet(boxGeo, lit({ color: C('bone'), emissive: C('lamp'), emissiveIntensity: 0.25 }), items, { colors: true });
  })();
  // utility poles, from the 1930s
  (() => {
    const items = [];
    for (let z = 30; z > -460; z -= 22) items.push({ x: walkX + 2.2, z, w: 0.3, d: 0.3, h: { red: 0, dadao: 7, tower: 8 } });
    for (let z = 30; z > -460; z -= 22) items.push({ x: walkX + 2.2, z, y: 6.5, w: 2.4, d: 0.2, h: { red: 0, dadao: 0.2, tower: 0.2 } });
    instSet(boxGeo, lit({ color: C('ink') }), items);
  })();

  // traffic: moving wallpaper. Only on ground already reached. Density per era is the point.
  const vehicles = (() => {
    const items = [], n = 34;
    for (let i = 0; i < n; i++) {
      const lane = i % 2 ? 1 : -1, big = i % 5 === 0;
      items.push({ x: lane * 2.6, z: 40 - rnd() * 500, w: big ? 2.2 : 1.7, d: big ? 5.5 : 3.6, lane, big,
                   speed: (big ? 9 : 14) + rnd() * 8, c: i % 4 === 0 ? C('bone') : (i % 9 === 0 ? C('verm') : C('haze')),
                   h: { red: i < 3 ? 1.3 : 0, dadao: i < 12 ? 1.2 : 0, tower: big ? 2.2 : 1.3 } });
    }
    const set = instSet(boxGeo, lit({ color: C('haze') }), items, { colors: true });
    set.mesh.visible = false; // traffic switched off: nothing moves on the road except the girl
    return set;
  })();
  function updateVehicles(dt, key) {
    const front = FOG_U.frontier.value;
    const slow = key === 'red' ? 0.25 : key === 'dadao' ? 0.6 : 1;
    vehicles.items.forEach((v, i) => {
      v.z += v.lane * v.speed * slow * dt;              // one lane each way
      if (v.z < -470) v.z = 50; if (v.z > 50) v.z = -470;
      const to = (v.h[key] || 0) * (v.z < front + 4 ? 0 : 1);
      const h = vehicles.from[i] + (to - vehicles.from[i]) * eraE;
      v.cur = h;
      S3.set(v.w, Math.max(h, 0.0001), v.d); P3.set(v.x, 0.2, v.z); Q.set(0, 0, 0, 1);
      vehicles.mesh.setMatrixAt(i, M4.compose(P3, Q, S3));
    });
    vehicles.mesh.instanceMatrix.needsUpdate = true;
  }
  // lamp heads and tree crowns sit on top of their post/trunk
  function liftTops() {
    instSets.forEach(set => {
      if (!set.items[0] || !set.items[0].yOf) return;
      set.items.forEach(it => { it.y = it.yOf.cur || 0; });
    });
  }



  // ── the teammate's asset library (asset/3d/), placed by the scene files ──────
  // Each build() returns a Group, origin at its base, front facing +Z. libGroup(eras) makes a
  // group that is only visible in those eras; asset() builds one library item into it.
  // Library materials are unfogged: the mist is off and its shader chunk is not theirs.
  const libGroups = [];
  function libGroup(eras) {
    const g = new THREE.Group(); g.userData.eras = eras; scene.add(g); libGroups.push(g);
    g.visible = eras.indexOf(ERAS[eraIdx].key) >= 0;   // the scene files run after the first setEra, so start in the right state
    return g;
  }
  // rise(obj): a model that arrives after the first frame (models.js's late groups) grows from its base
  // over ERA_MS, the era tween's own move, so nothing pops in ahead of the camera.
  const risers = [];
  function rise(obj) { risers.push({ obj, t0: clockNow, sy: obj.scale.y }); obj.scale.y = 0.0001; }
  function updateRisers(now) {
    for (let i = risers.length - 1; i >= 0; i--) {
      const r = risers[i], k = Math.min(1, (now - r.t0) / ERA_MS);
      r.obj.scale.y = Math.max(0.0001, r.sy * ease3(k));
      if (k >= 1) risers.splice(i, 1);
    }
  }
  const unfog = g => g.traverse(o => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.fog = false; if (m.isMeshStandardMaterial) { m.envMapIntensity = ENV_I; litMats.push(m); } m.needsUpdate = true; }); } });
  const libBox = new THREE.Box3(), libSize = new THREE.Vector3();
  function findAsset(id) {
    const REG = window.NOSTALGIA_ASSETS || {};
    for (const k in REG) { const a = REG[k].find(a => a.id === id); if (a) return a; }
    return null;
  }
  // asset(id, group, x, z, rotY, scale?) → the placed Group (or null when the library is missing).
  // The returned group carries userData.size = its world-space bounding box size after rotation.
  function asset(id, group, x, z, rotY, scale) {
    const a = findAsset(id), Core = window.NostalgiaCore;
    if (!a || !Core) return null;
    const o = a.build(Core);
    o.rotation.y = rotY || 0;
    if (scale) o.scale.setScalar(scale);
    o.position.set(x, 0.2, z);
    o.updateMatrixWorld(true);
    libBox.setFromObject(o); libBox.getSize(libSize);
    o.userData.size = libSize.clone();
    unfog(o); aoBakeAsset(o, o.position.y); group.add(o);
    return o;
  }
  // (issue #3 step 4) per-vertex occlusion for a library item, no rays: each vertex darkens with
  // its height above the item's base over the first AO_RISE units, and again when another box of
  // the same item hangs over it within AO_OVER units (a canopy over a counter, an eave over a
  // wall, a shelf over the goods). The darkest is AO_MIN. Library boxes each own their geometry,
  // so the colours are per mesh; a geometry two meshes share is cloned for the second.
  const AO_RISE = 1.2, AO_OVER = 1.5, AO_MARGIN = 0.25, aoV = new THREE.Vector3();
  function aoBakeAsset(root, baseY) {
    const meshes = [], boxes = [];
    root.traverse(m => {
      if (!m.isMesh || !m.geometry || !m.geometry.attributes.position || !m.material || !m.material.isMeshStandardMaterial || m.material.transparent) return;
      meshes.push(m); boxes.push(new THREE.Box3().setFromObject(m));
    });
    const used = new Set();
    meshes.forEach((m, mi) => {
      let geo = m.geometry;
      if (geo.attributes.color) return;
      if (used.has(geo)) { geo = geo.clone(); m.geometry = geo; }
      used.add(geo);
      const pos = geo.attributes.position, n = pos.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        aoV.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        let t = Math.min(1, Math.max(0, (aoV.y - baseY) / AO_RISE)), occ = 1;
        let ao = AO_MIN + (1 - AO_MIN) * t * t * (3 - 2 * t);
        for (let j = 0; j < boxes.length; j++) {
          if (j === mi) continue;
          const b = boxes[j], dy = b.min.y - aoV.y;
          if (dy < -0.05 || dy > AO_OVER) continue;
          if (aoV.x < b.min.x - AO_MARGIN || aoV.x > b.max.x + AO_MARGIN || aoV.z < b.min.z - AO_MARGIN || aoV.z > b.max.z + AO_MARGIN) continue;
          occ = Math.min(occ, AO_MIN + (1 - AO_MIN) * Math.max(0, dy) / AO_OVER);
        }
        ao = Math.max(AO_MIN, ao * occ);
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      m.material.vertexColors = true; m.material.needsUpdate = true;
    });
  }

  // ── scene API for the per-chapter scene files (scene-*.js), loaded after this file ──
  // part(x, y, z, w, d, lookByEra, rotY?, geo?)  lookByEra: { red:{h,col}, dadao:{h,col}, tower:{h,col} }
  // instSet(geo, material, items, {colors})     items: { x, z, y?, w, d, r?, c?, h:{red,dadao,tower} }
  // lit(params)                                 the engine's lit material; params.surface = 'brick' | 'plaster' | 'concrete' | 'wood' | 'asphalt'
  // lam(col, extra?)                            lit() by palette key, surface family chosen from the key
  // aoBake(geo)                                 bakes the height-rule occlusion into a geometry's vertex colours (part and instSet do it)
  // people(items)                               pedestrians through instSet: { x, z, y?, r?, v?, h:{red,dadao,tower} }, h = figure height
  window.SCENE = { part, instSet, only, C, boxGeo, withFog, lit, lam, aoBake, scene, GRID, ERAS, anchors, PALETTE, rnd, TOWER, walkX, libGroup, asset, findAsset, people, rise, shrink, TEX_SCALE };
  window.SCENE.camera = camera;   // issue #17: photos.js projects its street markers with the scroll camera; it only reads it


  // ── 張君雅小妹妹 running down the middle of the street, always a little ahead of the camera ──
  // Issue #1 Part 2 (CJ, 2026-09-21: 「go 開始 Part 2」). Suggested, not copied: bowl-cut black
  // hair with a straight fringe, white shirt, dark skirt on two straps, red cheeks, a bowl of
  // noodles carried in both hands in front of her. She is the viewer's memory, so she runs the
  // whole street, not only the 2000s. Primitives and the palette only.
  const girl = new THREE.Group();
  const gSkin = withFog(lit({ color: C('bone') }));
  const gShirt = withFog(lit({ color: C('bone') }));
  const gInk = withFog(lit({ color: C('ink') }));
  const gVerm = withFog(lit({ color: C('verm') }));
  const gLamp = withFog(lit({ color: C('lamp') }));
  const skirtGeo = new THREE.ConeGeometry(0.5, 1, 10); skirtGeo.translate(0, 0.5, 0);
  const skirt = new THREE.Mesh(skirtGeo, gInk); skirt.scale.set(1, 0.85, 1); skirt.position.y = 0.8; girl.add(skirt);        // dark skirt
  const torso = new THREE.Mesh(boxGeo, gShirt); torso.scale.set(0.52, 0.6, 0.32); torso.position.y = 1.62; girl.add(torso);   // white shirt
  [-0.13, 0.13].forEach(x => { const st = new THREE.Mesh(boxGeo, gInk); st.scale.set(0.09, 0.6, 0.34); st.position.set(x, 1.62, 0); girl.add(st); }); // straps
  const bib = new THREE.Mesh(boxGeo, gInk); bib.scale.set(0.36, 0.22, 0.35); bib.position.y = 1.62; girl.add(bib);          // the skirt's bib
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), gSkin); head.position.y = 2.46; girl.add(head);
  // bowl cut: a cap of hair over the top and back, a straight fringe across the forehead
  const capGeo = new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const hairCap = new THREE.Mesh(capGeo, gInk); hairCap.position.y = 2.47; girl.add(hairCap);
  const fringe = new THREE.Mesh(boxGeo, gInk); fringe.scale.set(0.5, 0.16, 0.14); fringe.position.set(0, 2.42, 0.2); girl.add(fringe);
  const hair = new THREE.Mesh(boxGeo, gInk); hair.scale.set(0.56, 0.3, 0.16); hair.position.set(0, 2.28, -0.2); girl.add(hair);  // the back of the bowl
  [-0.17, 0.17].forEach(x => { const ch = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), gVerm); ch.position.set(x, 2.38, 0.22); girl.add(ch); }); // red cheeks
  const legL = new THREE.Mesh(boxGeo, gSkin); legL.scale.set(0.16, 0.8, 0.16); legL.position.set(-0.15, 0.8, 0); legL.rotation.x = Math.PI; girl.add(legL);
  const legR = new THREE.Mesh(boxGeo, gSkin); legR.scale.set(0.16, 0.8, 0.16); legR.position.set(0.15, 0.8, 0); legR.rotation.x = Math.PI; girl.add(legR);
  [legL, legR].forEach(l => { const shoe = new THREE.Mesh(boxGeo, gInk); shoe.scale.set(1.2, 0.12, 1.6); shoe.position.set(0, 0.95, -0.25); l.add(shoe); }); // shoes at the foot end of the leg
  // arms held forward, both hands on the bowl
  const gArmL = new THREE.Mesh(boxGeo, gSkin); gArmL.scale.set(0.13, 0.55, 0.13); gArmL.position.set(-0.3, 1.95, 0.06); gArmL.rotation.x = -Math.PI / 2 + 0.25; girl.add(gArmL);
  const gArmR = new THREE.Mesh(boxGeo, gSkin); gArmR.scale.set(0.13, 0.55, 0.13); gArmR.position.set(0.3, 1.95, 0.06); gArmR.rotation.x = -Math.PI / 2 + 0.25; girl.add(gArmR);
  const bowl = new THREE.Group();
  const bowlGeo = new THREE.CylinderGeometry(0.3, 0.2, 0.22, 12); bowlGeo.translate(0, 0.11, 0);
  bowl.add(new THREE.Mesh(bowlGeo, gShirt));
  const noodles = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), gLamp); noodles.position.y = 0.18; bowl.add(noodles);
  const egg = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), gVerm); egg.position.set(0.08, 0.36, 0.05); bowl.add(egg);
  [-0.05, 0.03].forEach((x, i) => { const cs = new THREE.Mesh(boxGeo, gInk); cs.scale.set(0.025, 0.5, 0.025); cs.position.set(x, 0.2, -0.02 + i * 0.03); cs.rotation.z = 0.35 + i * 0.1; cs.rotation.x = -0.4; bowl.add(cs); });
  bowl.position.set(0, 1.78, 0.5); girl.add(bowl);
  girl.scale.setScalar(1.15);
  scene.add(girl);
  // Issue #5 step 4: the girl is a glb (asset/blender/girl.py) with two run frames, runA (left
  // leg forward) and runB (right leg forward), swapped by stride phase. The primitive build above
  // stays until the glb arrives; the same group carries position, bob and scale.
  let frameA = null, frameB = null;
  if (window.MODELS) MODELS.load('girl', gltf => {
    const root = MODELS.lambertize(gltf.scene);
    const a = MODELS.node(root, 'runA'), b = MODELS.node(root, 'runB');
    if (!a || !b) return;
    girl.children.slice().forEach(c => girl.remove(c));
    // the glb faces +z (the library convention) and she runs down -z ahead of the camera, so
    // turn the frames once here and the camera sees her back (CJ, 2026-09-23: 「人物可以不要倒著走嗎」)
    a.rotation.y = b.rotation.y = Math.PI;
    girl.add(a, b);
    frameA = a; frameB = b;
  });
  let stride = 0, lastProg = 0, run = 0;
  function updateGirl(u, camZ, dt) {
    const speed = Math.abs(u - lastProg) / Math.max(dt, 1e-3); lastProg = u;      // scroll speed drives the run
    run += (Math.min(1, speed * 6) - run) * (1 - Math.exp(-6 * dt));
    stride += (0.4 + run * 14) * dt * 2.2;
    const z = Math.max(-398, camZ - 18 + run * 4);
    girl.position.set(Math.sin(stride * 0.15) * 0.6, Math.abs(Math.sin(stride)) * 0.12 * run, z);
    const sw = Math.sin(stride) * (0.25 + run * 0.9);
    legL.rotation.x = Math.PI + sw; legR.rotation.x = Math.PI - sw;
    if (frameA) { const fwd = Math.sin(stride) >= 0; frameA.visible = fwd; frameB.visible = !fwd; }   // the two-frame run
    const carry = Math.sin(stride * 2) * 0.04 * run;                                 // the bowl bobs a little as she runs; the arms stay on it
    bowl.position.y = 1.78 + carry; gArmL.position.y = gArmR.position.y = 1.95 + carry;
    hair.position.z = -0.2 - run * 0.06; fringe.position.y = 2.42 + Math.sin(stride * 2) * 0.01 * run;
    girl.rotation.y = 0;
  }

  // ── curve particles (IVRESS borrow g): lantern sparks in Dadaocheng, a light stream up 101 ──
  // Two THREE.Points, CPU-updated each frame, each riding a CatmullRomCurve3 sampled once into a
  // table: the sparks drift along a curve threaded through the eight lantern strings and rise off
  // it; the stream spirals up the tower on a curve that follows TOWER.faceX. A tiny shader gives
  // each point a soft round sprite and its own alpha. Capped at 500 + 900 points.
  const SPARK_N = 500, STREAM_N = 900;
  const pointsMat = (size) => new THREE.ShaderMaterial({
    uniforms: { uSize: { value: size }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float aAlpha; attribute vec3 aColor; uniform float uSize, uPR; varying float vA; varying vec3 vC;
      void main(){ vC = aColor; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min(28.0, uSize * uPR * 240.0 / max(1.0, -mv.z)); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; varying vec3 vC;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d); if (r > 0.25) discard;
        gl_FragColor = vec4(vC, vA * smoothstep(0.25, 0.06, r)); }`,
    transparent: true, depthWrite: false, fog: false
  });
  function pointsSet(n, size) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), alp = new Float32Array(n);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alp, 1));
    const mesh = new THREE.Points(geo, pointsMat(size)); mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh);
    return { mesh, pos, col, alp, n, p: [] };
  }
  const sampleCurve = (pts, n) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getSpacedPoints(n);
  const curveAt = (tab, t) => { const f = Math.min(tab.length - 1.001, Math.max(0, t) * (tab.length - 1)), i = Math.floor(f), k = f - i; return P3.copy(tab[i]).lerp(tab[i + 1], k); };
  const sparks = pointsSet(SPARK_N, 0.55), stream = pointsSet(STREAM_N, 0.7);
  const sparkCurve = sampleCurve([[0, 7.2, -186], [1.5, 7.0, -204], [-1.5, 7.4, -228], [1.0, 7.0, -252], [-1.0, 7.3, -276], [0, 7.5, -290]].map(a => new THREE.Vector3(a[0], a[1], a[2])), 256);
  const lampC = C('lamp'), vermC = C('verm'), boneC = C('bone'), glassC = C('glass');
  for (let i = 0; i < SPARK_N; i++) sparks.p.push({ t: rnd(), x: (rnd() - 0.5) * 11, life: rnd(), rate: 0.25 + rnd() * 0.3, sway: rnd() * 6.28, warm: rnd() });
  let streamCurve = null;
  function buildStreamCurve() {                                    // needs TOWER.faceX from scene-tower.js
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const y = 2 + (TOWER.h + 18 - 2) * k / 14, r = TOWER.x - TOWER.faceX(y) + 1.6, a = k * 1.35;
      pts.push(new THREE.Vector3(TOWER.x + Math.cos(a) * r, y, TOWER.z + Math.sin(a) * r));
    }
    streamCurve = sampleCurve(pts, 512);
    for (let i = 0; i < STREAM_N; i++) stream.p.push({ t: rnd(), rate: 0.045 + rnd() * 0.05, jx: (rnd() - 0.5) * 1.2, jy: (rnd() - 0.5) * 1.2, jz: (rnd() - 0.5) * 1.2, bright: rnd() });
  }
  function updateParticles(dt, now, key) {
    sparks.mesh.visible = key === 'dadao';
    stream.mesh.visible = key === 'tower' && !!streamCurve;
    if (sparks.mesh.visible) {
      const P = sparks.p, t = now / 1000;
      for (let i = 0; i < SPARK_N; i++) {
        const q = P[i]; q.life += q.rate * dt; if (q.life > 1) { q.life = 0; q.t = rnd(); q.x = (rnd() - 0.5) * 11; }
        curveAt(sparkCurve, q.t);
        const rise = q.life * 4.5, sw = Math.sin(t * 1.7 + q.sway) * 0.35 * q.life;
        sparks.pos[i * 3] = P3.x + q.x + sw; sparks.pos[i * 3 + 1] = P3.y + rise; sparks.pos[i * 3 + 2] = P3.z + Math.cos(t * 1.3 + q.sway) * 0.3;
        tmpC.copy(lampC).lerp(vermC, q.warm * 0.6);
        sparks.col[i * 3] = tmpC.r; sparks.col[i * 3 + 1] = tmpC.g; sparks.col[i * 3 + 2] = tmpC.b;
        sparks.alp[i] = Math.sin(q.life * Math.PI) * 0.9;
      }
      sparks.mesh.geometry.attributes.position.needsUpdate = true; sparks.mesh.geometry.attributes.aColor.needsUpdate = true; sparks.mesh.geometry.attributes.aAlpha.needsUpdate = true;
    }
    if (stream.mesh.visible) {
      const P = stream.p;
      for (let i = 0; i < STREAM_N; i++) {
        const q = P[i]; q.t += q.rate * dt; if (q.t > 1) q.t -= 1;
        curveAt(streamCurve, q.t);
        stream.pos[i * 3] = P3.x + q.jx; stream.pos[i * 3 + 1] = P3.y + q.jy; stream.pos[i * 3 + 2] = P3.z + q.jz;
        tmpC.copy(glassC).lerp(boneC, 0.5 + q.bright * 0.5).lerp(lampC, q.t * 0.5);   // cool at the base, warm and pale near the crown
        stream.col[i * 3] = tmpC.r; stream.col[i * 3 + 1] = tmpC.g; stream.col[i * 3 + 2] = tmpC.b;
        stream.alp[i] = (0.35 + 0.65 * q.bright) * Math.min(1, q.t * 8) * Math.min(1, (1 - q.t) * 6);
      }
      stream.mesh.geometry.attributes.position.needsUpdate = true; stream.mesh.geometry.attributes.aColor.needsUpdate = true; stream.mesh.geometry.attributes.aAlpha.needsUpdate = true;
    }
  }

  // ── the words ──────────────────────────────────────────────────────────────
  // Each word is split into glyph spans with a per-glyph transition-delay; toggling .show on the
  // block reveals them letter by letter with no JS per frame (IVRESS borrow b). The block's own
  // opacity still follows scroll distance so a word also fades as you leave it.
  const wordEl = document.getElementById('word'), wordBig = wordEl.children[0], wordSub = wordEl.children[1];
  const GLYPH_MS = 38;
  // words are kept whole (a .w span per word, nowrap) so lines break between words, never inside one
  const glyphs = (text, from) => { let i = 0; return text.split(' ').map(w => '<span class="w">' + w.split('').map(ch => `<span style="transition-delay:${from + (i++) * GLYPH_MS}ms">${ch}</span>`).join('') + '</span>').join(' '); };
  let wordShown = -1;
  function updateWords(u) {
    let best = -1, bestA = 0;
    WORDS.forEach((w, i) => { const a = Math.max(0, 1 - Math.abs(u - w.at) / 0.045); if (a > bestA) { bestA = a; best = i; } });
    if (best !== wordShown && best >= 0) {
      wordShown = best;
      wordEl.classList.remove('show');
      wordBig.innerHTML = glyphs(WORDS[best].big, 0);
      wordSub.innerHTML = glyphs(WORDS[best].sub || '', WORDS[best].big.length * GLYPH_MS * 0.6);
      void wordEl.offsetWidth;                                       // restart the transitions
    }
    wordEl.classList.toggle('show', bestA > 0.35);
    const a = Math.min(1, bestA * 1.6);
    wordEl.style.opacity = a.toFixed(2);
    wordEl.style.transform = `translateY(${((1 - a) * 18).toFixed(1)}px)`;
  }

  // ── era state and the 500ms re-render ────────────────────────────────────────
  let eraIdx = 0, eraT0 = -1e9, eraFrom = 0, eraE = 1;
  // the page's clock: the frame's rAF time, divided by SLOW (issue #19) so every transition can be
  // shot in slow motion. Everything timed reads clockNow, never performance.now() directly.
  let clockNow = performance.now(), clock0 = -1;
  const ease3 = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;   // ease in-out cubic, k 0..1
  function setEra(i, instant) {
    if (i === eraIdx && !instant) return;
    const now = clockNow;
    parts.forEach(p => { p.fromH = p.mesh.scale.y; p.fromC = p.mesh.material.color.clone(); });
    instSnapshot();
    roadMesh.material.map = roadMaps[ERAS[i].key]; roadMesh.material.needsUpdate = true;
    mixFrom = { lamp: mixCur.lamp, hemi: mixCur.hemi, env: mixCur.env, print: mixCur.print };
    skyFrom.horizon.copy(skyCur.horizon); skyFrom.top.copy(skyCur.top); skyFrom.mount.copy(skyCur.mount);
    eraFrom = eraIdx; eraIdx = i;
    libGroups.forEach(g => { g.visible = g.userData.eras.indexOf(ERAS[i].key) >= 0; });
    eraT0 = instant ? now - ERA_MS : now;
    swapEraLabel(ERAS[i], instant);
  }
  const tmpC = new THREE.Color();
  let mixCur = { lamp: KEY * 0.5, hemi: HEMI * 0.65, env: 0.7, print: 1 }, mixFrom = { ...mixCur };
  const skyCur = { horizon: SKY.red.horizon.clone(), top: SKY.red.top.clone(), mount: SKY.red.mount.clone() };
  const skyFrom = { horizon: skyCur.horizon.clone(), top: skyCur.top.clone(), mount: skyCur.mount.clone() };
  let envCur = -1;
  function updateWorld(now) {
    const k = Math.min(1, (now - eraT0) / ERA_MS);
    const e = ease3(k);
    eraE = e;
    const era = ERAS[eraIdx], key = era.key;
    parts.forEach(p => {
      const to = p.look[key];
      const h = p.fromH + (to.h - p.fromH) * e;
      p.mesh.scale.y = Math.max(h, 0.0001);
      p.mesh.visible = h > 0.01;
      p.mesh.material.color.copy(tmpC.copy(p.fromC).lerp(to.c, e));
      if (p.tileMap && p.mesh.material.map === p.tileMap) fitTile(p.mesh.material, Math.max(p.mesh.scale.x, p.mesh.scale.z), h);
    });
    // sky, fog, light and print level: held flat inside an era, moved in the same 500ms
    const M = ERA_MIX[key];
    mixCur.lamp = mixFrom.lamp + (M.lamp - mixFrom.lamp) * e;
    mixCur.hemi = mixFrom.hemi + (M.hemi - mixFrom.hemi) * e;
    mixCur.env = mixFrom.env + (M.env - mixFrom.env) * e;
    mixCur.print = mixFrom.print + (era.uPrint - mixFrom.print) * e;
    // daylight sky, tinted per chapter (SKY above), moved in the same 500 ms as everything else.
    const S = SKY[key];
    skyCur.horizon.copy(skyFrom.horizon).lerp(S.horizon, e);
    skyCur.top.copy(skyFrom.top).lerp(S.top, e);
    skyCur.mount.copy(skyFrom.mount).lerp(S.mount, e);
    scene.fog.color.copy(skyCur.horizon);
    skyMat.uniforms.horizon.value.copy(skyCur.horizon);
    skyMat.uniforms.top.value.copy(skyCur.top);
    mountainMat.color.copy(skyCur.mount);
    sky.position.copy(camera.position);
    liftTops();
    instUpdate(e, key);
    updateRisers(now);
    updateWindows(key);
    key.intensity = mixCur.lamp;
    hemi.intensity = mixCur.hemi;
    const ei = ENV_I * mixCur.env;                                   // only touched while an era tween runs
    if (ei !== envCur) { envCur = ei; litMats.forEach(m => { m.envMapIntensity = ei; }); }
    post.uniforms.uPrint.value = mixCur.print;
  }

  // ── camera rig ───────────────────────────────────────────────────────────────
  const V = a => new THREE.Vector3(a[0], a[1], a[2]);
  const posCurve = new THREE.CatmullRomCurve3(CAM.map(k => V(k.p)), false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3(CAM.map(k => V(k.t)), false, 'centripetal');
  const fovs = CAM.map(k => k.fov);
  const pTmp = new THREE.Vector3(), tTmp = new THREE.Vector3();
  // mouse parallax (IVRESS borrow f): a damped offset along the camera's own right and up axes,
  // applied after lookAt so the frame slides rather than turns; it fades to nothing within
  // PARALLAX_FADE of each chapter cut and of the end, so the cuts and the closing shot stay fixed.
  const PARALLAX_FADE = 0.04, PARALLAX_X = 0.6, PARALLAX_Y = 0.3;
  let mouseX = 0, mouseY = 0, driftX = 0, driftY = 0;
  const camRight = new THREE.Vector3(), camUp = new THREE.Vector3();
  function parallaxFade(u) {
    let f = 1;
    for (let i = 1; i < BOUNDS.length; i++) f = Math.min(f, Math.abs(u - BOUNDS[i]) / PARALLAX_FADE);
    f = Math.min(1, f);
    return f * f * (3 - 2 * f);
  }
  // The phone frame (fault 5, CJ 2026-09-24: 「手機的鏡頭能轉嗎 不然都看不到畫面」). PerspectiveCamera.fov is the
  // vertical angle, so a 390x844 phone (aspect 0.46) at the keyframes' 50° saw 24° of street sideways against 73°
  // at 1440x900. Portrait only, the keyframes untouched, a landscape frame pixel-identical: the fov is lifted so
  // the frame's CORNER sits at the same angle off-axis as the 16:10 desktop corner, i.e. the same edge stretch the
  // desktop already has (tan(v/2) scales by sqrt((1+A²)/(1+a²)), A = REF_ASPECT), `match` of the way, capped at
  // MAX_FOV. Full compensation (a 116° vertical) is a fisheye; this is not. match 0.6 is where it landed
  // (2026-09-25): 66° vertical / 34° sideways at the 50° keyframes; at 1 (77° / 40°) the near lantern and the
  // arcade column at the frame edge had started to stretch in the Dadaocheng frame.
  // The pitch is NOT touched. A lens shift that slid the horizon down the frame was tried and measured (a raycast
  // grid over the frame, sky / road / street): at 1994 the phone showed sky 30 / road 36 / street 34 before any
  // change, and with the lift kept no horizon setting gets sky and road both under a quarter — sliding the
  // horizon only trades one for the other, and the balance point is where the keyframes already have it. What the
  // portrait frame lacks vertically is the price of widening it; the lever that would change that is a
  // portrait-only camera position, which is a framing decision, not a correction.
  // window.__fog.portrait reads the result; PORTRAIT is live-tunable there.
  const PORTRAIT = { REF_ASPECT: 1.6, match: 0.6, MAX_FOV: 85 };
  let portraitState = { fov: 0, hfov: 0 };
  const hfovOf = (v, a) => 2 * Math.atan(Math.tan(v * Math.PI / 360) * a) * 180 / Math.PI;
  function placeCamera(u) {
    posCurve.getPoint(u, pTmp);
    tgtCurve.getPoint(u, tTmp);
    const s = u * (fovs.length - 1), i = Math.min(fovs.length - 2, Math.floor(s)), f = s - i;
    let fov = fovs[i] + (fovs[i + 1] - fovs[i]) * f;
    const a = camera.aspect, portrait = a < 1;
    if (portrait) {
      const lifted = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * Math.sqrt((1 + PORTRAIT.REF_ASPECT * PORTRAIT.REF_ASPECT) / (1 + a * a))) * 180 / Math.PI;
      fov += (Math.min(PORTRAIT.MAX_FOV, lifted) - fov) * PORTRAIT.match;
    }
    camera.fov = fov;
    camera.position.copy(pTmp);
    camera.lookAt(tTmp);
    const k = parallaxFade(u);
    camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(camRight, driftX * k).addScaledVector(camUp, driftY * k);
    camera.updateProjectionMatrix();
    portraitState = { fov: +fov.toFixed(1), hfov: +hfovOf(fov, a).toFixed(1) };
    return pTmp.z;
  }
  // scroll progress u at which the camera reaches world z, by bisection.
  // Relies on CAM's z decreasing along the whole path — data.js says so.
  function uAtZ(z) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (posCurve.getPoint(mid, pTmp).z > z) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // ── year ⇄ scroll, the one number that drives everything ─────────────────────
  // Each era owns a slice of the scroll. The slice boundaries are exactly where the camera
  // passes over that era's road marking, so the world flips as the digits go under you.
  const BOUNDS = ERAS.map((e, i) => i === 0 ? 0 : uAtZ(e.zRange[0]));
  BOUNDS.push(1);
  function eraAtU(u) { for (let i = ERAS.length - 1; i > 0; i--) if (u >= BOUNDS[i]) return i; return 0; }
  function yearAtU(u) {
    const i = eraAtU(u), e = ERAS[i];
    const f = Math.min(1, Math.max(0, (u - BOUNDS[i]) / (BOUNDS[i + 1] - BOUNDS[i])));
    return e.start + f * (e.end - e.start);
  }
  function uAtYear(y) {
    y = Math.min(ERAS[ERAS.length - 1].end, Math.max(ERAS[0].start, y));
    let i = 0;
    for (let k = 0; k < ERAS.length; k++) if (y >= ERAS[k].start) i = k;
    const e = ERAS[i], f = (y - e.start) / (e.end - e.start);
    return BOUNDS[i] + f * (BOUNDS[i + 1] - BOUNDS[i]);
  }

  // ── the uPrint post pass: posterize, grain, outline, vignette ────────────────
  // One fullscreen pass. uPrint 1 = woodblock print, 0 = night photograph. Lighting stays on
  // the whole time; posterizing flattens it into print blocks. Grain is shader noise.
  // Fault 6 (CJ, 2026-09-25: 「這個招牌怪怪的」): with no stencil, r149 gives this target a 16-bit depth renderbuffer, and at
  // 30 m that cannot tell a steel bar 2.5 cm behind a sign face from the face — the Lux neon's cage (lux.py neon_frame)
  // bled through the 樂聲戲院 board as dashed diagonals. stencilBuffer asks for DEPTH24_STENCIL8: 24 bits of depth.
  const rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true, stencilBuffer: true });
  // (issue #19) the photograph at a crossing goes through the post pass: uPhoto is the picture,
  // uPhotoA its opacity over the frame (scroll-driven, updatePhoto), uPhotoFit the cover-fit,
  // uPhotoOld how much old-print treatment it takes. uPhoto starts as a 1×1 blank.
  const blankTex = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); blankTex.needsUpdate = true;
  const post = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uPrint: { value: 1 },
                uTime: { value: 0 }, uInk: { value: C('ink') }, uHaze: { value: C('haze') }, uBone: { value: C('bone') },
                uPhoto: { value: blankTex }, uPhotoA: { value: 0 }, uPhotoOld: { value: 0 }, uPhotoFit: { value: new THREE.Vector2(1, 1) },
                uWarm: { value: WARM } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uPrint, uTime, uWarm; uniform vec3 uInk, uHaze, uBone;
      uniform sampler2D uPhoto; uniform float uPhotoA, uPhotoOld; uniform vec2 uPhotoFit;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
      void main(){
        vec2 px = 1.0 / uRes;
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        // OUTLINE — luminance edge, ink at 1, nothing at 0
        float l0 = lum(c);
        float edge = abs(l0 - lum(texture2D(tDiffuse, vUv + vec2(px.x * 1.5, 0.0)).rgb))
                   + abs(l0 - lum(texture2D(tDiffuse, vUv + vec2(0.0, px.y * 1.5)).rgb))
                   + abs(l0 - lum(texture2D(tDiffuse, vUv - vec2(px.x * 1.5, 0.0)).rgb))
                   + abs(l0 - lum(texture2D(tDiffuse, vUv - vec2(0.0, px.y * 1.5)).rgb));
        float ink = smoothstep(0.05, 0.18, edge) * uPrint;
        // POSTERIZE — few steps at 1, continuous at 0. In print the tones become the paper,
        // the second ink and the ink; the vermilion accent keeps its hue.
        float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
        float q = floor(l0 * 3.0 + 0.5) / 3.0;
        vec3 tone = q < 0.34 ? uInk : (q < 0.67 ? uHaze : uBone);
        vec3 red = floor(c * 3.0 + 0.5) / 3.0;
        vec3 printed = mix(tone, red, smoothstep(0.15, 0.4, sat));
        c = mix(c, printed, uPrint);
        c = mix(c, uInk, ink);
        c = pow(max(c, 0.0), vec3(1.0 / 2.2));
        // GRAIN — paper grain at 1 (coarser, static), film grain at 0 (finer, moving).
        // Luminance-aware: it lives in the shadows and leaves the sky clean; stepped at 30 Hz.
        vec2 cell = floor(gl_FragCoord.xy / mix(1.0, 2.0, uPrint));
        float g = hash(cell + floor(uTime * mix(30.0, 2.0, uPrint)) * 0.37) - 0.5;
        g *= mix(1.0, 1.0 - lum(c), 0.85);
        c += g * mix(0.06, 0.045, uPrint);
        // VIGNETTE — restrained
        float d = distance(vUv, vec2(0.5));
        c *= 1.0 - smoothstep(0.45, 1.0, d) * 0.3;
        // PHOTOGRAPH (issue #19) — past a chapter marking a picture of the place surfaces faintly
        // over the frame and sinks again as the scroll moves on: full-bleed (cover-fit), a touch
        // of old-print treatment (warm grey and a soft vignette, uPhotoOld), at most uPhotoA.
        if (uPhotoA > 0.0) {
          vec2 puv = (vUv - 0.5) * uPhotoFit + 0.5;
          vec3 p = texture2D(uPhoto, puv).rgb;
          float g = smoothstep(0.03, 0.97, lum(p));
          vec3 print = mix(vec3(0.16, 0.14, 0.12), vec3(0.93, 0.90, 0.84), g);
          print *= 1.0 - smoothstep(0.35, 0.85, d) * 0.4;
          c = mix(c, mix(p, print, uPhotoOld), uPhotoA);
        }
        // WARM GRADE — CJ, 2026-09-24 「整體色調可以改復古一點黃一點嗎我覺得太藍了」. The street read
        // lavender: the violet shadow tint (issue #11) over a blue sky left every mid-tone cool. This is
        // a grade, not a repaint — the palette hues are untouched, the frame is rolled toward amber,
        // hardest in the shadows where the violet sat, and a little saturation comes out the way an old
        // print sits. uWarm scales the whole thing so it can be tuned or switched off from one place.
        float wl = lum(c);
        vec3 warmAmt = mix(vec3(0.115, 0.020, -0.105), vec3(0.040, 0.010, -0.040), smoothstep(0.18, 0.82, wl));
        c *= (1.0 + warmAmt * uWarm);
        c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 1.0 - 0.07 * uWarm);
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false, depthWrite: false
  });
  const postScene = new THREE.Scene();
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ── the photograph at the crossing (issue #19) ───────────────────────────────
  // The pictures load at start (the page's own files, nothing fetched elsewhere). Every frame,
  // updatePhoto() asks how far past a marking the damped scroll progress is: inside PHOTO.window
  // the picture keyed to that chapter shows at PHOTO.peak × sin(π · d / window), the caption and
  // credit with it (at most 0.75, never full); outside every window nothing shows. No timer, no
  // hold: the pass is the scroll's own. A picture whose file has not decoded yet is skipped.
  let photoKey = null;
  const photoTex = {};
  // Fault 1 (CJ, 2026-09-24: 「東西太多loading太久」): the two pictures (300 KB) are not in the first request. They load
  // when the scroll is PHOTO_LEAD short of the first marking or, whichever comes first, PHOTO_IDLE_MS after the load event;
  // a pass whose picture is not decoded yet is skipped, as before.
  const PHOTO_LEAD = 0.12, PHOTO_IDLE_MS = 2500;
  let photosLoading = false;
  function loadPhotos() {
    if (photosLoading) return; photosLoading = true;
    Object.keys(PHOTO_SRC).forEach(k => { photoTex[k] = new THREE.TextureLoader().load(PHOTO_SRC[k].src, t => { t.encoding = THREE.sRGBEncoding; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; }); });
  }
  const photoIdle = () => setTimeout(loadPhotos, PHOTO_IDLE_MS);
  if (document.readyState === 'complete') photoIdle(); else window.addEventListener('load', photoIdle);
  // caption and credit, top-right under the site title, ink on a paper pill so it reads over the
  // picture and over the street alike. CC BY and CC BY-SA both require the credit to be visible.
  const photoNote = (() => {
    const el = document.createElement('div');
    el.className = 'hud-photo-note';
    el.style.cssText = 'position:absolute;right:clamp(20px,4vw,56px);top:calc(clamp(20px,4vw,56px) + 44px);text-align:right;font-size:11px;letter-spacing:0.22em;line-height:1.7;opacity:0;color:var(--ink);text-shadow:none;background:rgba(247,242,232,0.88);padding:6px 10px;border-radius:4px;max-width:min(60vw,560px);';
    el.innerHTML = '<div class="photo-caption"></div><div class="photo-credit" style="opacity:0.8"></div>';
    document.querySelector('.hud').appendChild(el);
    return el;
  })();
  const photoAt = () => [{ key: 'dadao', at: BOUNDS[1] }, { key: 'tower', at: BOUNDS[2] }];   // where each pass starts: the two road markings, in scroll progress
  function photoSelect(key) {
    photoKey = key;
    const P = PHOTO_SRC[key], t = photoTex[key], img = t.image;
    post.uniforms.uPhoto.value = t; post.uniforms.uPhotoOld.value = PHOTO.print;
    const fa = innerWidth / innerHeight, pa = img.width / img.height;   // cover-fit: the frame is filled, the picture's short sides are cropped
    post.uniforms.uPhotoFit.value.set(pa > fa ? fa / pa : 1, pa > fa ? 1 : pa / fa);
    photoNote.children[0].textContent = P.caption; photoNote.children[1].textContent = P.credit;
  }
  function updatePhoto() {
    let key = null, a = 0;
    if (!photosLoading && progress >= photoAt()[0].at - PHOTO_LEAD) loadPhotos();
    photoAt().forEach(s => {
      const d = progress - s.at;
      if (d < 0 || d > PHOTO.window) return;
      const t = photoTex[s.key];
      if (!t || !t.image || !t.image.width) return;                       // a file not decoded yet: nothing shows
      key = s.key; a = PHOTO.peak * Math.sin(Math.PI * d / PHOTO.window);
    });
    if (key && key !== photoKey) photoSelect(key);
    post.uniforms.uPhotoA.value = a;
    photoNote.style.opacity = (0.75 * a / PHOTO.peak).toFixed(2);
  }

  // ── HUD: era label, year, anchor labels ──────────────────────────────────────
  const yearEl = document.getElementById('year');
  // the chapter column (top-left): "01/03", the name in caps, the years, the Chinese name vertical
  const eraBox = document.querySelector('.hud-chapter');
  const eraLabelEl = document.getElementById('eraLabel');
  const eraYearsEl = document.getElementById('eraYears');
  const eraZhEl = document.getElementById('eraZh');
  const chapNEl = document.getElementById('chapN');
  let swapTimer = 0;
  function swapEraLabel(era, instant) {
    const apply = () => {
      const zh = era.zh.split(' · ');                                  // '西門町 · Ximending' → vertical 西門町, romanised name under the years
      chapNEl.textContent = String(ERAS.indexOf(era) + 1).padStart(2, '0');
      eraLabelEl.textContent = era.label; eraYearsEl.textContent = era.years + (zh[1] ? ' · ' + zh[1] : ''); eraZhEl.textContent = zh[0];
      measureLabelMin();                                             // the block's height follows its text (fault 5: the anchor label sits under it on a phone)
    };
    clearTimeout(swapTimer);
    if (instant) { eraBox.classList.remove('swap'); apply(); return; }
    eraBox.classList.add('swap');
    swapTimer = setTimeout(() => { apply(); eraBox.classList.remove('swap'); }, 240);
  }
  // the closing line (issue #16): two beats, each a span with its own fade window, see data.js CLOSING
  const closingEl = document.getElementById('closing');
  const closingParts = CLOSING.parts.map((p, i) => { const el = document.createElement('span'); el.className = 'c' + (i + 1); el.textContent = p.text; el.style.opacity = '0'; closingEl.appendChild(el); return { p, el }; });
  const labelHost = document.getElementById('labels');
  const labels = Object.values(anchors).map(A => {
    const el = document.createElement('div');
    el.className = 'label';
    el.innerHTML = '<div class="label-name"></div><div class="label-en"></div><div class="label-cap"></div>';
    labelHost.appendChild(el);
    return { A, el, shownKey: '', name: el.children[0], en: el.children[1], cap: el.children[2] };
  });
  const wp = new THREE.Vector3();
  // on a portrait phone the label is clamped into the left column, under the chapter block (fault 5: at 110 px it
  // sat on the block's last line); measured once per resize, since the block's height depends on the wrap
  let labelMinY = 110;
  const wp2 = new THREE.Vector3();
  const chapterEl = document.querySelector('.hud-chapter');
  function measureLabelMin() { labelMinY = innerWidth < innerHeight && chapterEl ? Math.max(110, chapterEl.getBoundingClientRect().bottom + 14) : 110; }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureLabelMin);   // and the web font, which wraps it differently
  function updateLabels() {
    const key = ERAS[eraIdx].key;
    labels.forEach(L => {
      const s = L.A.tile.byEra[key];
      wp.set(L.A.x, L.A.top + 1.5, L.A.z).project(camera);
      const dist = Math.hypot(L.A.x - camera.position.x, L.A.z - camera.position.z);
      const inFront = wp.z < 1 && Math.abs(wp.x) < 1.1;
      const near = Math.min(1, Math.max(0, (LABEL_NEAR - dist) / 30));
      // labels step aside for the closing line. On a portrait phone the label is pinned to the left column, the
      // same column the closing line takes (lx below clamps it there), so there it is gone before the first
      // beat rises in; on a landscape screen the label sits by the building, clear of the line, and keeps closingA
      const aside = innerWidth < innerHeight ? Math.min(1, Math.max(0, (progress - (CLOSING.parts[0].from - 0.03)) / 0.02)) : closingA;
      const vis = s.built && inFront ? near * eraE * (1 - aside) : 0;
      if (L.shownKey !== key) { // reveal the caption word by word (per character, this is 中文)
        L.shownKey = key;
        L.name.textContent = L.A.tile.name.en;
        L.en.textContent = L.A.tile.name.zh;
        L.cap.innerHTML = (s.caption || '').split('').map((ch, i) => `<span style="transition-delay:${i * 18}ms">${ch}</span>`).join('');
      }
      el = L.el;
      el.style.opacity = vis.toFixed(2);
      el.classList.toggle('on', vis > 0.6);
      const lx = Math.min(innerWidth - Math.min(380, innerWidth * 0.7 + 20), (wp.x + 1) / 2 * innerWidth);
      let ly = (1 - wp.y) / 2 * innerHeight;
      if (innerWidth < innerHeight) {                                    // fault 5: the left-column clamp put the label beside the roofline, over sky; centre it on the building's face instead
        const base = wp2.set(L.A.x, 0, L.A.z).project(camera);
        ly = (ly + (1 - base.y) / 2 * innerHeight) / 2 - L.el.offsetHeight / 2;
      }
      ly = Math.max(labelMinY, ly);
      el.style.transform = `translate(${lx.toFixed(0)}px, ${ly.toFixed(0)}px)`;
    });
  }
  let el;

  // ── the opening: fog, the title in it, clear as you scroll (issue #16) ───────
  // CJ, 2026-09-24: 「開頭也要迷霧然後顯示our memory in taipei」. The directional veil (FOG_U.frontier,
  // switched off for the street since 2026-09-20 by the -1e5 write below) and the haze density
  // are driven over the opening window only: total at scroll 0, gone by OPENING.fogTo, before
  // the first word. The title (#opening, index.html) waits in the fog in ink and turns bone as
  // the veil goes, then fades out over titleFrom → titleTo.
  const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const openEl = document.getElementById('opening');
  // the HUD blocks that sit over the opening fog and have to darken with the title
  // the phone guide (CJ, 2026-09-24: 「手機版一開始套上一個黑屏然後給引導箭頭呢」, then 「首頁壓按不要 箭頭要」): #guide
  // (index.html, style.css .hud-guide) is a swipe-up arrow over the opening screen, no dim, display: none except under 480px.
  // Its opacity follows the fog, so it clears in the same window and is gone by OPENING.fogTo.
  const guideEl = document.getElementById('guide');
  // Where it stands: centred in the gap between the sub line and the music bar, measured, because
  // the title is centred on the screen and the bar is pinned to the bottom, so the gap moves with
  // every phone's height. Too small for arrow and word → .tight, the arrow alone.
  function placeGuide() {
    if (!guideEl || getComputedStyle(guideEl).display === 'none') return;
    const sub = openEl && openEl.querySelector('.op-sub'), mus = document.getElementById('music');
    if (!sub || !mus) return;
    const a = sub.getBoundingClientRect().bottom, b = mus.getBoundingClientRect().top, gap = b - a;
    const tight = gap < 64, h = tight ? 44 : 60;
    guideEl.classList.toggle('tight', tight);
    guideEl.style.setProperty('--guide-top', Math.round(a + Math.max(0, (gap - h) / 2)) + 'px');
  }
  placeGuide();
  window.addEventListener('resize', placeGuide);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeGuide);
  window.addEventListener('load', placeGuide);
  if (window.ResizeObserver && document.getElementById('music')) new ResizeObserver(placeGuide).observe(document.getElementById('music'));   // a long song title wraps the bar taller
  const fogCol = new THREE.Color(), boneCol = C('bone'), inkCol = C('ink'), titleCol = new THREE.Color();
  // CJ, 2026-09-24: 「不然先給opening 一個復古色調的背景」. The opening fog carries a warm faded-print
  // tone instead of plain bone, strongest at scroll 0 and gone with the fog by OPENING.fogTo, so
  // the street itself keeps the daylight palette untouched.
  const SEPIA = new THREE.Color('#d8bc93'), OPEN_SEPIA = 0.8;
  let openState = { fog: 1, title: 1 };
  // The library items and the canvas-drawn signs opt out of fog (unfog(), scene-red.js sign()) because
  // the street is mist-free and they never had the veil's uniforms. For the opening every material
  // has to take the veil, so once, before the warm-up compiles the programs, fog is switched on for
  // all of them and the veil's two uniforms attached (the sky dome, the mountains and the particle
  // points stay out).
  let openFogged = false;
  function openingFogAll() {
    if (openFogged) return; openFogged = true;
    scene.traverse(o => {
      if (!o.material || o.isPoints || o.material === skyMat || o.material === mountainMat) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
        if (m.fog !== false) return;
        m.fog = true;
        const prev = m.onBeforeCompile;
        m.onBeforeCompile = (shader, r) => { if (prev) prev(shader, r); shader.uniforms.uFrontier = FOG_U.frontier; shader.uniforms.uSoft = FOG_U.soft; };
        m.needsUpdate = true;
      });
    });
  }
  // The veil does not lift until chapter 1's models are in. Before this, a viewer who scrolled
  // straight away watched the street build itself out of black boxes while the glbs arrived one
  // at a time — CJ, 2026-09-25: 「為什麼第一次跑的時候還是破圖加黑屏」. The title is held with it,
  // because a title on a cream field is what a loading screen should look like, and because a lone
  // veil with nothing on it reads as a page that failed. Chapter 1 only: the veil must never wait
  // on Dadaocheng or on the tower.
  let veilHeld = true, veilFreed = 0;
  if (window.MODELS && MODELS.onCoreReady) MODELS.onCoreReady(() => { veilHeld = false; veilFreed = performance.now(); });
  else veilHeld = false;
  const VEIL_EASE_MS = 420;
  function veilFloor() {
    if (veilHeld) return 1;
    if (!veilFreed) return 0;
    const t = (performance.now() - veilFreed) / VEIL_EASE_MS;
    return t >= 1 ? 0 : 1 - sm(t);
  }

  function updateOpening(u, camZ) {
    const floor = veilFloor();
    const fog = Math.max(floor, 1 - sm(u / OPENING.fogTo)), title = Math.max(floor, 1 - sm((u - OPENING.titleFrom) / (OPENING.titleTo - OPENING.titleFrom)));
    openState = { fog: +fog.toFixed(3), title: +title.toFixed(3) };
    if (fog > 0.001) {
      FOG_U.frontier.value = camZ + 40 - (1 - fog) * 800; FOG_U.soft.value = 30; scene.fog.density = HAZE_DENSITY + fog * fog * 0.02;
      fogCol.copy(skyCur.horizon).lerp(boneCol, 0.55).lerp(SEPIA, fog * OPEN_SEPIA);
      scene.fog.color.copy(fogCol);
      skyMat.uniforms.horizon.value.lerp(fogCol, fog);
      skyMat.uniforms.top.value.lerp(fogCol, fog);
      mountainMat.color.lerp(fogCol, fog);
      // the mountains are tone-mapped and the dome is not, so the same fog colour renders darker on
      // them (grey wedges in the fog); while the veil is up they render raw, like the dome
      if (mountainMat.toneMapped) { mountainMat.toneMapped = false; mountainMat.needsUpdate = true; }
    } else {
      FOG_U.soft.value = FOG_SOFT; scene.fog.density = HAZE_DENSITY;
      if (!mountainMat.toneMapped) { mountainMat.toneMapped = true; mountainMat.needsUpdate = true; }
    }
    openEl.style.opacity = title.toFixed(3);
    openEl.style.color = '#' + titleCol.copy(inkCol).lerp(boneCol, 1 - fog).getHexString();
    openEl.style.visibility = title > 0.005 ? 'visible' : 'hidden';
    // CJ, 2026-09-24: 「我比較希望是換這邊的顏色」, then 「那些小字的顏色不對」. The HUD is bone
    // (#f7f2e8) everywhere, a 1.6:1 contrast on the opening's faded-print fog. The title already
    // turned ink in the fog; nothing else did. Enumerating elements in JS missed the credits button
    // and every `border-top: var(--bone)` rule, so this is a body class and style.css does the rest —
    // inheritance reaches the small text, and the borders are named explicitly there.
    document.body.classList.toggle('in-fog', fog > 0.004);
    if (guideEl) { guideEl.style.opacity = fog.toFixed(3); guideEl.style.visibility = fog > 0.005 ? 'visible' : 'hidden'; }
  }

  // ── scroll → progress, damped ────────────────────────────────────────────────
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  let progress = 0, frontier = Infinity, lastT = performance.now(), shownYear = -1, closingA = 0;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight, pr = renderer.getPixelRatio();
    renderer.setSize(w, h, false);
    rt.setSize(Math.floor(w * pr), Math.floor(h * pr));
    if (photoKey) photoSelect(photoKey);                            // the cover-fit follows the frame's aspect
    post.uniforms.uRes.value.set(Math.floor(w * pr), Math.floor(h * pr));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    measureLabelMin();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', ev => { mouseX = (ev.clientX / innerWidth - 0.5) * 2; mouseY = (ev.clientY / innerHeight - 0.5) * 2; });
  resize();

  // ── robustness: tab switches, keyboards, touch ───────────────────────────────
  // Coming back from another tab, the first frame's dt would be the whole absence; dt is clamped
  // to 50 ms and the clocks are reset so neither the camera damping nor the runner's scroll-speed
  // estimate sees a jump.
  const resetClocks = () => { lastT = clock0 < 0 ? performance.now() : clock0 + (performance.now() - clock0) / SLOW; lastProg = progress; };   // on the page's clock, so ?slow= survives a tab return
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resetClocks(); });
  window.addEventListener('pageshow', resetClocks);
  window.addEventListener('focus', resetClocks);
  // keyboard: arrows, page keys, space, home, end scroll the page even when the browser gave the
  // canvas focus and stopped scrolling the document itself
  window.addEventListener('keydown', ev => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const page = window.innerHeight * 0.8, step = 120;
    const by = { ArrowDown: step, ArrowUp: -step, PageDown: page, PageUp: -page, ' ': ev.shiftKey ? -page : page }[ev.key];
    if (by !== undefined) { ev.preventDefault(); window.scrollBy({ top: by, behavior: 'smooth' }); }
    else if (ev.key === 'Home') { ev.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (ev.key === 'End') { ev.preventDefault(); window.scrollTo({ top: maxScroll(), behavior: 'smooth' }); }
  });
  // touch: the document scrolls natively (touch-action: pan-y on the canvas). If an in-app browser
  // swallows the gesture and scrollY does not move, drag the page by hand for the rest of the swipe.
  let touchY = 0, touchScroll0 = 0, touchMoves = 0, touchManual = false;
  window.addEventListener('touchstart', ev => { touchY = ev.touches[0].clientY; touchScroll0 = window.scrollY; touchMoves = 0; touchManual = false; }, { passive: true });
  window.addEventListener('touchmove', ev => {
    const y = ev.touches[0].clientY, dy = touchY - y; touchY = y; touchMoves++;
    if (!touchManual && touchMoves >= 3 && Math.abs(dy) > 4 && window.scrollY === touchScroll0) touchManual = true;
    if (touchManual) window.scrollBy(0, dy);
  }, { passive: true });

  // ── render warm-up (IVRESS borrow h) ─────────────────────────────────────────
  // three.js compiles a material's program and uploads its textures the first time the object is
  // drawn, so the first crossing into each era used to hitch on the buildings that only exist
  // there. Era differences are visibility and uniforms only, so one pass with everything visible
  // covers all three: compile every program, draw one frame into the offscreen target so the
  // textures upload, then restore. Runs on the first frame, after the scene files have built.
  // ?nowarm=1 skips it, for measuring.
  let warm = null;
  function warmUp() {
    const t0 = performance.now(), vis = [];
    scene.traverse(o => { vis.push([o, o.visible]); o.visible = true; });
    renderer.compile(scene, camera);
    renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null);
    vis.forEach(([o, v]) => { o.visible = v; });
    // the road carries one map per era and only the current one is drawn above: upload the other
    // two now, at load, rather than at the era flip deep in the page when memory is tightest
    if (renderer.initTexture) Object.values(roadMaps).forEach(t => renderer.initTexture(t));
    warm = { ms: Math.round(performance.now() - t0), programs: renderer.info.programs.length, textures: renderer.info.memory.textures };
  }
  const NOWARM = new URLSearchParams(location.search).get('nowarm') === '1';
  if (NOWARM) requestAnimationFrame(enableShadows);                 // still once, before the first draw
  const hitch = { max: 0, at: 0 };                                 // the longest frame gap since load, for measuring
  function frame(rafNow) {
    if (clock0 < 0) clock0 = rafNow;
    const now = SLOW > 1 ? clock0 + (rafNow - clock0) / SLOW : rafNow;   // issue #19: ?slow=S for shooting transitions
    clockNow = now;
    const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    if (now - lastT > hitch.max && lastT > 0) { hitch.max = Math.round(now - lastT); hitch.at = +progress.toFixed(3); }
    lastT = now;
    if (!warm && !NOWARM) { enableShadows(); openingFogAll(); warmUp(); hitch.max = 0; }
    const target = Math.min(1, Math.max(0, window.scrollY / maxScroll()));
    progress += (target - progress) * (1 - Math.exp(-DAMP * dt));
    if (Math.abs(target - progress) < 0.00005) progress = target;
    driftX += (mouseX * PARALLAX_X - driftX) * (1 - Math.exp(-2 * dt));
    driftY += (-mouseY * PARALLAX_Y - driftY) * (1 - Math.exp(-2 * dt));

    const camZ = placeCamera(progress);
    sunFollow(camZ);
    frontier = Math.min(frontier, camZ - FOG_LEAD);
    FOG_U.frontier.value = -1e5; // mist switched off: the whole street is visible in daylight

    setEra(eraAtU(progress), false);
    updateWorld(now);
    updateOpening(progress, camZ);
    if (!streamCurve && TOWER.faceX) buildStreamCurve();
    updateParticles(dt, now, ERAS[eraIdx].key);
    updateMan(progress);
    updateGirl(progress, camZ, dt);
    updateWords(progress);
    updateLabels();
    closingA = Math.min(1, Math.max(0, (progress - CLOSING.showFrom) / (1 - CLOSING.showFrom) * 1.6));   // the labels step aside on this
    closingParts.forEach(({ p, el }) => { const a = Math.min(1, Math.max(0, (progress - p.from) / (p.to - p.from))); el.style.opacity = a.toFixed(2); el.classList.toggle('in', a > 0.02); });

    const y = Math.round(yearAtU(progress));
    if (y !== shownYear) { shownYear = y; yearEl.textContent = String(y); }

    post.uniforms.uTime.value = now / 1000;
    updatePhoto();
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
    if (booting) { booting = false; document.body.classList.remove('booting'); }   // the canvas has a frame: the boot screen can go
    frameMs += (performance.now() - rafNow - frameMs) * 0.05;       // the frame's own CPU time (update + draw submission), smoothed; a cost the display cap cannot hide (issue #19)
    requestAnimationFrame(frame);
  }
  let frameMs = 0, booting = document.body.classList.contains('booting');

  // ── demo insurance: ?year=1930 jumps straight there, no damping, fog already cleared ──
  function jumpToYear(y) {
    const u = uAtYear(y);
    window.scrollTo(0, u * maxScroll());
    progress = u;
    const camZ = placeCamera(u);
    frontier = camZ - FOG_LEAD;
    setEra(eraAtU(u), true);
  }
  const wantYear = parseInt(new URLSearchParams(location.search).get('year'), 10);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!isNaN(wantYear)) jumpToYear(wantYear); else { window.scrollTo(0, 0); setEra(0, true); }

  // a tiny probe for testing; harmless in the demo
  window.__fog = { get progress() { return progress; }, get year() { return shownYear; }, get era() { return ERAS[eraIdx].key; }, people: peopleCalls,
                   slow: SLOW, PHOTO, PHOTO_SRC, get frameMs() { return +frameMs.toFixed(2); },
                   get photo() { return { key: photoKey, a: +post.uniforms.uPhotoA.value.toFixed(3), note: +photoNote.style.opacity, window: PHOTO.window, peak: PHOTO.peak, at: photoAt().map(s => ({ key: s.key, at: +s.at.toFixed(4), d: +(progress - s.at).toFixed(4) })), loaded: Object.keys(photoTex).filter(k => photoTex[k].image && photoTex[k].image.width), fit: post.uniforms.uPhotoFit.value.toArray().map(v => +v.toFixed(3)), caption: photoNote.children[0].textContent, credit: photoNote.children[1].textContent }; },
                   get camZ() { return camera.position.z; }, get drift() { return [driftX, driftY, parallaxFade(progress)]; }, get warm() { return warm; }, hitch, get scrollY() { return window.scrollY; }, get man() { return Object.assign({ x: +man.position.x.toFixed(2), y: +man.position.y.toFixed(2), z: +man.position.z.toFixed(2), soles: +man.position.y.toFixed(2), hands: +(man.position.y + MAN_HANDS).toFixed(2), faceX: TOWER.faceX ? +TOWER.faceX(man.position.y).toFixed(2) : null, screen: (() => { const v = man.position.clone().project(camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; })() }, manState); }, get print() { return mixCur.print; }, BOUNDS, jumpToYear,
                   get opening() { return openState; }, get portrait() { return portraitState; }, PORTRAIT, get labelMinY() { return labelMinY; }, get camera() { return camera; }, get labels() { return labels; },
                   get shadow() { let c = 0, r = 0, t = 0, black = 0; scene.traverse(o => { if (o.isMesh) { t++; if (o.castShadow) c++; if (o.receiveShadow) r++; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.vertexColors && o.geometry && !o.geometry.attributes.color) black++; } });
                     return { enabled: renderer.shadowMap.enabled, lightCasts: key.castShadow, meshes: t, casters: c, receivers: r, uncoloured: black, map: !!key.shadow.map, size: key.shadow.mapSize.x,
                              box: [key.shadow.camera.left, key.shadow.camera.right], pos: key.position.toArray().map(v => +v.toFixed(1)), target: key.target.position.toArray().map(v => +v.toFixed(1)), camZ: +camera.position.z.toFixed(1) }; } };

  // The first frame does the one-time work (shadow flags, warm-up), so it must not run before the
  // scene files have built: the parser may yield to a frame between two script tags, and it did
  // once the environment map was generated at load. DOMContentLoaded fires after the last script.
  // Two animation frames, not one: a rAF callback runs before the paint of its own frame, so the
  // first frame's compile would otherwise block the boot screen (style.css body.booting) from
  // ever being painted. The first one lets the title reach the screen; the second starts the loop.
  const start = () => requestAnimationFrame(() => requestAnimationFrame(frame));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
