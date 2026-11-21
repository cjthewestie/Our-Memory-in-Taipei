/*
 * assets-core.js — 台北懷舊街景共用核心庫
 * 載入順序：three.min.js → assets-core.js → 各年代素材檔
 * 暴露全域：window.NOSTALGIA_ASSETS（素材 registry）、window.NostalgiaCore（工具庫 C）
 * 只使用 three.js 長期穩定 API（r100+），無 module、無外部資源。
 */
(function () {
  'use strict';

  // 全域素材 registry：年代檔把素材陣列註冊進來，例如 NOSTALGIA_ASSETS['ximen-1980s'] = [...]
  window.NOSTALGIA_ASSETS = window.NOSTALGIA_ASSETS || {};

  var C = {};

  // ---------------------------------------------------------------
  // C.PALETTE：共用色票（懷舊街景配色）
  // ---------------------------------------------------------------
  C.PALETTE = {
    neonPink: '#ff4fd8',
    neonBlue: '#3ec6ff',
    neonYellow: '#ffd23e',
    signRed: '#b3261e',
    signGreen: '#0d6e4f',
    cream: '#f5ead6',
    kraft: '#c9a86a',
    woodDark: '#5b4226',
    woodLight: '#a8865a',
    rust: '#7a4a2b',
    concrete: '#9a9a92',
    asphalt: '#3c3c3c',
    lantern: '#e03c31',
    white: '#f4f4f0',
    black: '#1a1a1a',
    steel: '#7d8489'
  };

  // ---------------------------------------------------------------
  // C.rand(seed)：mulberry32 決定性偽隨機
  // 傳入固定整數 seed，回傳一個 function，每次呼叫回傳 0~1 的數。
  // 素材建構一律用這個，不可用 Math.random()，確保每次載入結果相同。
  // ---------------------------------------------------------------
  C.rand = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---------------------------------------------------------------
  // C.mat(color, opts?)：建立 MeshStandardMaterial
  // opts: { roughness=0.85, metalness=0.05, emissive, emissiveIntensity, side,
  //         surface }  surface: 'brick'|'plaster'|'concrete'|'wood'|'asphalt'|null
  // 沒給 surface 時用 C.surfaceOf(color) 依色票決定材質家族（issue #3 step 2），
  // 家族的顏色圖與法線圖會掛上材質；顏色圖已 clone，repeat 由 C.box / C.cyl 依尺寸設定。
  // ---------------------------------------------------------------
  C.mat = function (color, opts) {
    opts = opts || {};
    var params = {
      color: new THREE.Color(color),
      roughness: opts.roughness !== undefined ? opts.roughness : 0.85,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.05
    };
    if (opts.emissive !== undefined) {
      params.emissive = new THREE.Color(opts.emissive);
      params.emissiveIntensity =
        opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1;
    }
    if (opts.side !== undefined) params.side = opts.side;
    var surf = opts.surface !== undefined ? opts.surface : C.surfaceOf(params.color);
    var S = surf ? C.surface(surf) : null;
    if (S) { params.map = S.map.clone(); params.normalMap = S.normalMap; }
    return new THREE.MeshStandardMaterial(params);
  };

  // ---------------------------------------------------------------
  // C.fitSurface(mat, w, h, d?)：依世界尺寸設定材質家族貼圖的 repeat（一格 = C.TILE 世界單位）
  // 只動由 C.surface 來的顏色圖（userData.tile），素材自己畫的貼圖不碰。
  // ---------------------------------------------------------------
  C.fitSurface = function (mat, w, h, d) {
    var m = mat && mat.map;
    if (!m || !m.userData || !m.userData.tile) return mat;
    m.repeat.set(Math.max(w, d || 0, 0.01) / C.TILE, Math.max(h, 0.01) / C.TILE);
    return mat;
  };

  // ---------------------------------------------------------------
  // C.box(w, h, d, color, opts?)：長方體 Mesh（幾何中心為原點）
  // ---------------------------------------------------------------
  C.box = function (w, h, d, color, opts) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), C.fitSurface(C.mat(color, opts), w, h, d));
  };

  // ---------------------------------------------------------------
  // C.cyl(rTop, rBottom, h, color, seg=12)：圓柱 Mesh（幾何中心為原點）
  // ---------------------------------------------------------------
  C.cyl = function (rTop, rBottom, h, color, seg) {
    return new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBottom, h, seg || 12),
      C.fitSurface(C.mat(color), Math.PI * (rTop + rBottom), h)
    );
  };

  // ---------------------------------------------------------------
  // C.surface(name)：程序化材質貼圖（issue #3 step 2）
  // 五個材質家族：brick / plaster / concrete / wood / asphalt。每個家族一張顏色圖、一張法線圖，
  // 512px 代表 C.TILE 世界單位，第一次要用時以固定 seed 產生一次，之後共用，所以每次載入都一樣。
  // 顏色圖是接近白色的乘數（色相仍由材質的 color 決定，只加淡淡的深淺變化），法線圖由高度圖
  // 做有限差分（左右上下皆環繞，所以無縫）。圖案刻意收斂：這是記憶，不是照片。
  // 回傳 { map, normalMap }；map 交給材質前請 clone() 再設 repeat（法線圖跟著 map 的 repeat）。
  // C.surfaceOf(color)：色票 → 家族名或 null（木色系 → wood、水泥/鋼 → concrete、米白 → plaster …）。
  // ---------------------------------------------------------------
  C.TILE = 3;
  // C.SURFACE_STRENGTH：材質貼圖的強度旋鈕，一個數同時放大顏色圖的對比（偏離 1 的量）與法線圖的起伏。
  // 1 = 各配方原本的細微值（CJ 2026-09-23 說看不出材質），2 以上在 0.05 / 0.44 的鏡頭距離看得見磚、灰泥、木紋。
  // 要在第一次呼叫 C.surface 之前設定（app.js 載入時已經是這個值）。
  C.SURFACE_STRENGTH = 3.0;
  C.SURFACE_OF = {
    woodDark: 'wood', woodLight: 'wood', kraft: 'wood', rust: 'wood',
    concrete: 'concrete', cream: 'plaster', white: 'plaster', asphalt: 'asphalt'
  };
  var SURF_HEX = { '8f3a2c': 'brick', '8a5a3b': 'wood', '5a2f20': 'wood', '8a682f': 'wood', 'b9b2a2': 'concrete' };
  var surfByHex = null, surfaces = {};
  C.surfaceOf = function (color) {
    if (!surfByHex) {
      surfByHex = {};
      for (var k in C.SURFACE_OF) surfByHex[new THREE.Color(C.PALETTE[k]).getHexString()] = C.SURFACE_OF[k];
      for (var h in SURF_HEX) surfByHex[h] = SURF_HEX[h];
    }
    var c = color && color.isColor ? color : new THREE.Color(color);
    return surfByHex[c.getHexString()] || null;
  };
  var SURF_N = 512;
  // value noise on a wrapped lattice of cells×cells, smoothstep-interpolated, SURF_N×SURF_N
  function valueNoise(rand, cells) {
    var n = SURF_N, lat = new Float32Array(cells * cells), out = new Float32Array(n * n), s = cells / n;
    for (var i = 0; i < lat.length; i++) lat[i] = rand();
    for (var y = 0; y < n; y++) {
      var fy = y * s, y0 = Math.floor(fy), ty = fy - y0, y1 = (y0 + 1) % cells; ty = ty * ty * (3 - 2 * ty);
      for (var x = 0; x < n; x++) {
        var fx = x * s, x0 = Math.floor(fx), tx = fx - x0, x1 = (x0 + 1) % cells; tx = tx * tx * (3 - 2 * tx);
        var a = lat[y0 * cells + x0], b = lat[y0 * cells + x1], c = lat[y1 * cells + x0], d = lat[y1 * cells + x1];
        var top = a + (b - a) * tx, bot = c + (d - c) * tx;
        out[y * n + x] = top + (bot - top) * ty;
      }
    }
    return out;
  }
  // fractal sum of value noise, mean 0.5, roughly 0..1
  function fbm(rand, cells, octaves, gain) {
    var out = new Float32Array(SURF_N * SURF_N), amp = 1, total = 0, i;
    for (var o = 0; o < octaves; o++) {
      var v = valueNoise(rand, cells);
      for (i = 0; i < out.length; i++) out[i] += (v[i] - 0.5) * amp;
      total += amp; amp *= gain; cells *= 2;
    }
    for (i = 0; i < out.length; i++) out[i] = out[i] / total + 0.5;
    return out;
  }
  function surfCanvas() { var cv = document.createElement('canvas'); cv.width = cv.height = SURF_N; return cv; }
  function surfTexture(cv) {
    var t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    return t;
  }
  // colour map from a per-pixel RGB multiplier (Float32Array n*n*3)
  function tintTexture(tint) {
    var cv = surfCanvas(), g = cv.getContext('2d'), img = g.createImageData(SURF_N, SURF_N), d = img.data;
    for (var i = 0, j = 0; i < d.length; i += 4, j += 3) {
      d[i] = Math.max(0, Math.min(255, Math.round(tint[j] * 255)));
      d[i + 1] = Math.max(0, Math.min(255, Math.round(tint[j + 1] * 255)));
      d[i + 2] = Math.max(0, Math.min(255, Math.round(tint[j + 2] * 255)));
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return surfTexture(cv);
  }
  // tangent-space normal map from a height field by central differences, wrapped; k = relief strength.
  // Canvas y runs down while uv v runs up (flipY), so the green channel takes +dh/dy.
  function normalTexture(h, k) {
    var n = SURF_N, cv = surfCanvas(), g = cv.getContext('2d'), img = g.createImageData(n, n), d = img.data;
    for (var y = 0; y < n; y++) {
      var yu = ((y - 1 + n) % n) * n, yd = ((y + 1) % n) * n, row = y * n;
      for (var x = 0; x < n; x++) {
        var hx = (h[row + (x + 1) % n] - h[row + (x - 1 + n) % n]) * 0.5;
        var hy = (h[yd + x] - h[yu + x]) * 0.5;
        var nx = -k * hx, ny = k * hy, nz = 1, l = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        var i = (row + x) * 4;
        d[i] = Math.round((nx * l * 0.5 + 0.5) * 255);
        d[i + 1] = Math.round((ny * l * 0.5 + 0.5) * 255);
        d[i + 2] = Math.round((nz * l * 0.5 + 0.5) * 255);
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return surfTexture(cv);
  }
  // each recipe fills height (0..1) and tint (RGB multiplier around 1) and returns the relief strength
  var RECIPES = {
    plaster: function (rand, height, tint) {                 // soft mottling and a fine grain
      var n = SURF_N, low = fbm(rand, 4, 3, 0.5), fine = valueNoise(rand, 128);
      for (var i = 0; i < n * n; i++) {
        height[i] = low[i] * 0.85 + fine[i] * 0.15;
        var t = 0.985 + (low[i] - 0.5) * 0.07 + (fine[i] - 0.5) * 0.03;
        tint[i * 3] = t; tint[i * 3 + 1] = t; tint[i * 3 + 2] = t * 0.995;
      }
      return 5;
    },
    brick: function (rand, height, tint) {                   // running bond: 13 bricks a course, 40 courses a tile
      var n = SURF_N, cols = 13, rows = 40, bw = n / cols, bh = n / rows, mortar = 2, fine = valueNoise(rand, 96);
      var tone = new Float32Array(rows * (cols + 1));
      for (var i = 0; i < tone.length; i++) tone[i] = rand();
      for (var y = 0; y < n; y++) {
        var r = Math.floor(y / bh), off = (r % 2) * bw * 0.5, ly = y - r * bh;
        for (var x = 0; x < n; x++) {
          var xx = (x + off) % n, c = Math.floor(xx / bw), lx = xx - c * bw;
          var inMortar = ly < mortar || lx < mortar;
          var j = y * n + x, t = tone[r * (cols + 1) + c];
          if (inMortar) {
            height[j] = 0.2 + fine[j] * 0.1;
            tint[j * 3] = 0.88; tint[j * 3 + 1] = 0.91; tint[j * 3 + 2] = 0.94;
          } else {
            height[j] = 0.9 + (t - 0.5) * 0.12 + (fine[j] - 0.5) * 0.08;
            var v = 0.985 + (t - 0.5) * 0.16 + (fine[j] - 0.5) * 0.05;
            tint[j * 3] = v; tint[j * 3 + 1] = v * (0.99 + (t - 0.5) * 0.02); tint[j * 3 + 2] = v * 0.98;
          }
        }
      }
      return 2.5;
    },
    concrete: function (rand, height, tint) {                // fine grain, small pits, faint form-panel joints
      var n = SURF_N, grain = fbm(rand, 32, 3, 0.55), low = valueNoise(rand, 6);
      var pits = [];
      for (var q = 0; q < 70; q++) pits.push([rand() * n, rand() * n, 2 + rand() * 3]);
      for (var i = 0; i < n * n; i++) {
        height[i] = 0.5 + (grain[i] - 0.5) * 0.5 + (low[i] - 0.5) * 0.3;
        var t = 0.985 + (grain[i] - 0.5) * 0.05 + (low[i] - 0.5) * 0.05;
        tint[i * 3] = t; tint[i * 3 + 1] = t; tint[i * 3 + 2] = t;
      }
      for (var p = 0; p < pits.length; p++) {
        var px = pits[p][0], py = pits[p][1], pr = pits[p][2];
        for (var y = Math.floor(py - pr); y <= py + pr; y++) for (var x = Math.floor(px - pr); x <= px + pr; x++) {
          var dx = x - px, dy = y - py, dd = 1 - (dx * dx + dy * dy) / (pr * pr);
          if (dd <= 0) continue;
          var j = ((y + n) % n) * n + (x + n) % n;
          height[j] -= dd * 0.4; tint[j * 3] -= dd * 0.03; tint[j * 3 + 1] -= dd * 0.03; tint[j * 3 + 2] -= dd * 0.03;
        }
      }
      for (var k = 0; k < n; k++) {                          // two joints each way, one pixel wide
        [n >> 1, n - 1].forEach(function (e) {
          height[e * n + k] -= 0.3; height[k * n + e] -= 0.3;
          tint[(e * n + k) * 3] -= 0.03; tint[(e * n + k) * 3 + 1] -= 0.03; tint[(e * n + k) * 3 + 2] -= 0.03;
          tint[(k * n + e) * 3] -= 0.03; tint[(k * n + e) * 3 + 1] -= 0.03; tint[(k * n + e) * 3 + 2] -= 0.03;
        });
      }
      return 3;
    },
    wood: function (rand, height, tint) {                    // six vertical planks a tile, grain streaks along them
      var n = SURF_N, planks = 6, pw = n / planks, wob = valueNoise(rand, 8), fine = valueNoise(rand, 64);
      var tone = []; for (var q = 0; q < planks; q++) tone.push(rand());
      for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
        var c = Math.floor(x / pw), lx = x - c * pw, j = y * n + x;
        var streak = Math.sin((x * 0.55 + (wob[j] - 0.5) * 40) + y * 0.02) * 0.5 + 0.5;
        var seam = lx < 2 ? 1 : 0;
        height[j] = 0.7 + (streak - 0.5) * 0.18 + (fine[j] - 0.5) * 0.1 - seam * 0.6;
        var v = 0.975 + (tone[c] - 0.5) * 0.12 + (streak - 0.5) * 0.06 + (fine[j] - 0.5) * 0.03 - seam * 0.08;
        tint[j * 3] = v; tint[j * 3 + 1] = v * 0.99; tint[j * 3 + 2] = v * 0.97;
      }
      return 2.5;
    },
    asphalt: function (rand, height, tint) {                 // dense fine grain with a few pale chips
      var n = SURF_N, grain = fbm(rand, 64, 2, 0.6), low = valueNoise(rand, 5);
      for (var i = 0; i < n * n; i++) {
        height[i] = 0.5 + (grain[i] - 0.5) * 0.7;
        var t = 0.98 + (grain[i] - 0.5) * 0.08 + (low[i] - 0.5) * 0.04;
        if (rand() < 0.004) t += 0.12;
        tint[i * 3] = t; tint[i * 3 + 1] = t; tint[i * 3 + 2] = t;
      }
      return 2.5;
    }
  };
  var SURF_SEED = { plaster: 101, brick: 202, concrete: 303, wood: 404, asphalt: 505 };
  C.surface = function (name) {
    if (surfaces[name]) return surfaces[name];
    var recipe = RECIPES[name];
    if (!recipe) return null;
    var height = new Float32Array(SURF_N * SURF_N), tint = new Float32Array(SURF_N * SURF_N * 3);
    var S = C.SURFACE_STRENGTH || 1;
    var k = recipe(C.rand(SURF_SEED[name]), height, tint) * S;
    for (var i = 0; i < tint.length; i++) tint[i] = 1 + (tint[i] - 1) * S;
    var map = tintTexture(tint); map.userData.tile = C.TILE;
    surfaces[name] = { map: map, normalMap: normalTexture(height, k) };
    return surfaces[name];
  };

  // ---------------------------------------------------------------
  // C.group(...objects)：建立 THREE.Group 並把傳入物件全部加入
  // ---------------------------------------------------------------
  C.group = function () {
    var g = new THREE.Group();
    for (var i = 0; i < arguments.length; i++) g.add(arguments[i]);
    return g;
  };

  // 內部工具：取 >= n 的最小 2 次方（貼圖尺寸對齊用）
  function pow2(n) {
    var p = 1;
    while (p < n) p *= 2;
    return p;
  }

  // ---------------------------------------------------------------
  // C.textTexture(text, opts?)：文字轉 CanvasTexture（支援中文直式）
  // opts: {
  //   fontSize=64, color='#ffffff', bg=null(透明) 或色碼,
  //   vertical=false（true 時逐字直排）, fontWeight='bold', padding=24,
  //   fontFamily="'Noto Sans TC','Microsoft JhengHei',sans-serif"
  // }
  // 回傳的 texture.userData.aspect = 內容寬/高，供 textPlane 保持比例。
  // ---------------------------------------------------------------
  C.textTexture = function (text, opts) {
    opts = opts || {};
    var fontSize = opts.fontSize !== undefined ? opts.fontSize : 64;
    var color = opts.color || '#ffffff';
    var bg = opts.bg !== undefined ? opts.bg : null;
    var vertical = !!opts.vertical;
    var fontWeight = opts.fontWeight || 'bold';
    var padding = opts.padding !== undefined ? opts.padding : 24;
    var fontFamily =
      opts.fontFamily || "'Noto Sans TC','Microsoft JhengHei',sans-serif";
    var font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = font;

    var chars = String(text).split('');
    var contentW, contentH;
    var lineGap = Math.round(fontSize * 0.15); // 直式每字間距

    if (vertical) {
      // 直式：寬 = 最寬字元，高 = 字數 * (字高 + 間距)
      var maxW = fontSize;
      for (var i = 0; i < chars.length; i++) {
        var w = ctx.measureText(chars[i]).width;
        if (w > maxW) maxW = w;
      }
      contentW = maxW + padding * 2;
      contentH = chars.length * (fontSize + lineGap) - lineGap + padding * 2;
    } else {
      contentW = ctx.measureText(String(text)).width + padding * 2;
      contentH = fontSize * 1.3 + padding * 2;
    }

    // 貼圖尺寸取 2 的次方；繪製時把內容拉伸填滿整張 canvas，
    // 比例交由 textPlane 依 userData.aspect 還原。
    canvas.width = pow2(Math.ceil(contentW));
    canvas.height = pow2(Math.ceil(contentH));
    ctx = canvas.getContext('2d');

    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.scale(canvas.width / contentW, canvas.height / contentH);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (vertical) {
      // 逐字直排，水平置中
      var startY = padding + fontSize / 2;
      for (var j = 0; j < chars.length; j++) {
        ctx.fillText(chars[j], contentW / 2, startY + j * (fontSize + lineGap));
      }
    } else {
      ctx.fillText(String(text), contentW / 2, contentH / 2);
    }
    ctx.restore();

    // app.js 在手機上設 C.shrink：交給 GPU 的是半尺寸副本（畫的時候仍是原尺寸）
    var texture = new THREE.CanvasTexture(C.shrink ? C.shrink(canvas) : canvas);
    texture.needsUpdate = true;
    texture.userData = { contentW: contentW, contentH: contentH, aspect: contentW / contentH };
    return texture;
  };

  // ---------------------------------------------------------------
  // C.textPlane(text, widthMeters, opts?)：透明文字平面 Mesh
  // 平面長寬比與文字內容比例一致；MeshBasicMaterial + transparent。
  // ---------------------------------------------------------------
  C.textPlane = function (text, widthMeters, opts) {
    var tex = C.textTexture(text, opts);
    var aspect = tex.userData.aspect || 1;
    var h = widthMeters / aspect;
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(widthMeters, h),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    return mesh;
  };

  // ---------------------------------------------------------------
  // C.poster(text, opts?)：有邊框的直式海報（底部原點，面向 +Z）
  // opts: { w=0.8, h=1.1, bg='#f5ead6', fg='#222', frame='#8a6b3f', subtitle }
  // 版權紅線：角色/藝人只用文字 + 抽象色塊呈現，不建模長相。
  // ---------------------------------------------------------------
  C.poster = function (text, opts) {
    opts = opts || {};
    var w = opts.w !== undefined ? opts.w : 0.8;
    var h = opts.h !== undefined ? opts.h : 1.1;
    var bg = opts.bg || '#f5ead6';
    var fg = opts.fg || '#222';
    var frame = opts.frame || '#8a6b3f';
    var t = 0.03; // 海報厚度

    var g = new THREE.Group();

    // 外框（略大的薄箱體）
    var frameBox = C.box(w + 0.06, h + 0.06, t, frame, { roughness: 0.7 });
    frameBox.position.set(0, (h + 0.06) / 2, 0);
    g.add(frameBox);

    // 海報底板
    var board = C.box(w, h, t, bg, { roughness: 0.9 });
    board.position.set(0, (h + 0.06) / 2, t * 0.35);
    g.add(board);

    // 主標題：直排置中
    var title = C.textPlane(text, w * 0.32, {
      vertical: true,
      color: fg,
      fontSize: 96
    });
    title.position.set(0, (h + 0.06) / 2, t * 0.75 + 0.002);
    g.add(title);

    // 副標題（可選）：橫排放底部
    if (opts.subtitle) {
      var sub = C.textPlane(opts.subtitle, w * 0.7, {
        color: fg,
        fontSize: 48
      });
      sub.position.set(0, 0.12 + 0.03, t * 0.75 + 0.002);
      g.add(sub);
    }
    return g;
  };

  // ---------------------------------------------------------------
  // C.verticalSign(text, opts?)：直式招牌（薄箱體 + 雙面直式文字 + 上方掛架）
  // opts: { h=2.4, w=0.55, bg='#b3261e', fg='#fff', lit=false }
  // lit=true 時文字帶 emissive 亮感（夜景霓虹味）。底部原點。
  // ---------------------------------------------------------------
  C.verticalSign = function (text, opts) {
    opts = opts || {};
    var h = opts.h !== undefined ? opts.h : 2.4;
    var w = opts.w !== undefined ? opts.w : 0.55;
    var bg = opts.bg || '#b3261e';
    var fg = opts.fg || '#fff';
    var lit = !!opts.lit;
    var t = 0.12; // 招牌厚度

    var g = new THREE.Group();

    // 招牌箱體
    var body = C.box(w, h, t, bg, lit
      ? { emissive: bg, emissiveIntensity: 0.35, roughness: 0.5 }
      : { roughness: 0.75 });
    body.position.set(0, h / 2, 0);
    g.add(body);

    // 邊框收邊（上下兩條）
    var trimTop = C.box(w + 0.04, 0.05, t + 0.02, C.PALETTE.steel, { metalness: 0.5, roughness: 0.4 });
    trimTop.position.set(0, h - 0.025, 0);
    g.add(trimTop);
    var trimBottom = C.box(w + 0.04, 0.05, t + 0.02, C.PALETTE.steel, { metalness: 0.5, roughness: 0.4 });
    trimBottom.position.set(0, 0.025, 0);
    g.add(trimBottom);

    // 雙面直式文字
    var texOpts = { vertical: true, color: fg, fontSize: 96 };
    var front = C.textPlane(text, w * 0.7, texOpts);
    front.position.set(0, h / 2, t / 2 + 0.005);
    g.add(front);
    var back = C.textPlane(text, w * 0.7, texOpts);
    back.position.set(0, h / 2, -t / 2 - 0.005);
    back.rotation.y = Math.PI;
    g.add(back);

    // 上方掛架（兩根斜撐 + 橫桿）
    var bar = C.cyl(0.025, 0.025, w + 0.3, C.PALETTE.steel, 8);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, h + 0.15, 0);
    g.add(bar);
    var hangL = C.cyl(0.02, 0.02, 0.18, C.PALETTE.steel, 8);
    hangL.position.set(-w * 0.35, h + 0.07, 0);
    g.add(hangL);
    var hangR = C.cyl(0.02, 0.02, 0.18, C.PALETTE.steel, 8);
    hangR.position.set(w * 0.35, h + 0.07, 0);
    g.add(hangR);

    return g;
  };

  // ---------------------------------------------------------------
  // C.neonText(text, opts?)：霓虹感文字板（亮色文字 + 深色背板 + 微光暈）
  // opts: { w=2, color='#ff4fd8', backing='#141414' }。底部原點，面向 +Z。
  // ---------------------------------------------------------------
  C.neonText = function (text, opts) {
    opts = opts || {};
    var w = opts.w !== undefined ? opts.w : 2;
    var color = opts.color || '#ff4fd8';
    var backing = opts.backing || '#141414';

    var g = new THREE.Group();

    // 主文字貼圖（估比例決定背板高度）
    var textMesh = C.textPlane(text, w * 0.9, { color: color, fontSize: 128 });
    var aspect = textMesh.geometry.parameters.width / textMesh.geometry.parameters.height;
    var h = (w * 0.9) / aspect + 0.2;

    // 深色背板（薄箱體）
    var board = C.box(w, h, 0.08, backing, { roughness: 0.6, metalness: 0.2 });
    board.position.set(0, h / 2, 0);
    g.add(board);

    // 光暈平面（同字樣、放大、半透明，做出 glow 感）
    var glow = C.textPlane(text, w * 1.0, { color: color, fontSize: 128 });
    glow.material.opacity = 0.35;
    glow.material.transparent = true;
    glow.position.set(0, h / 2, 0.045);
    g.add(glow);

    // 主文字（略亮於背板）
    textMesh.position.set(0, h / 2, 0.055);
    g.add(textMesh);

    // 邊框細管（上下）
    var tubeTop = C.cyl(0.015, 0.015, w, color, 8);
    tubeTop.rotation.z = Math.PI / 2;
    tubeTop.position.set(0, h - 0.03, 0.05);
    tubeTop.material = C.mat(color, { emissive: color, emissiveIntensity: 0.8, roughness: 0.3 });
    g.add(tubeTop);
    var tubeBottom = C.cyl(0.015, 0.015, w, color, 8);
    tubeBottom.rotation.z = Math.PI / 2;
    tubeBottom.position.set(0, 0.03, 0.05);
    tubeBottom.material = C.mat(color, { emissive: color, emissiveIntensity: 0.8, roughness: 0.3 });
    g.add(tubeBottom);

    return g;
  };

  // ---------------------------------------------------------------
  // C.awning(width, depth, colorA, colorB)：條紋帆布雨棚
  // 交錯條紋薄箱 + 前緣波浪垂布 + 兩側斜撐桿。底部原點在牆面接點。
  // ---------------------------------------------------------------
  C.awning = function (width, depth, colorA, colorB) {
    var g = new THREE.Group();
    var stripes = Math.max(4, Math.round(width / 0.3));
    var stripeW = width / stripes;
    var tilt = -0.28; // 前低後高的傾斜角

    var canopy = new THREE.Group();
    for (var i = 0; i < stripes; i++) {
      var s = C.box(stripeW, 0.03, depth, i % 2 === 0 ? colorA : colorB, {
        roughness: 0.95,
        side: THREE.DoubleSide
      });
      s.position.set(-width / 2 + stripeW * (i + 0.5), 0, depth / 2);
      canopy.add(s);

      // 前緣垂布（每條一小片）
      var flap = C.box(stripeW * 0.96, 0.12, 0.02, i % 2 === 0 ? colorA : colorB, {
        roughness: 0.95
      });
      flap.position.set(-width / 2 + stripeW * (i + 0.5), -0.07, depth);
      canopy.add(flap);
    }
    canopy.rotation.x = tilt;
    g.add(canopy);

    // 兩側斜撐桿
    var strutLen = Math.sqrt(depth * depth + 0.5 * 0.5);
    var strutL = C.cyl(0.02, 0.02, strutLen, C.PALETTE.steel, 8);
    strutL.rotation.x = Math.PI / 2 + tilt;
    strutL.position.set(-width / 2 + 0.05, Math.sin(-tilt) * depth * 0.5, Math.cos(tilt) * depth * 0.5);
    g.add(strutL);
    var strutR = C.cyl(0.02, 0.02, strutLen, C.PALETTE.steel, 8);
    strutR.rotation.x = Math.PI / 2 + tilt;
    strutR.position.set(width / 2 - 0.05, Math.sin(-tilt) * depth * 0.5, Math.cos(tilt) * depth * 0.5);
    g.add(strutR);

    return g;
  };

  // 暴露核心庫
  window.NostalgiaCore = C;
})();
