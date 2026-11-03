# 05 three.js 風格化渲染與效能技術：同類作品怎麼做，以及給本專案的改進

研究日期：2026-11-03。研究範圍：2024 到 2026 年在網頁上做「風格化、可在手機上跑的即時 3D」的主流做法，並逐項對照本專案的限制（three.js r149 UMD、沒有 build step、靜態託管、必須能在手機上跑）。

**關於來源的說明。** 這次的環境只放行 `github.com` / `raw.githubusercontent.com` 的直接讀取；`threejs.org`、`discourse.threejs.org`、`discoverthreejs.com`、`80.lv`、`awwwards.com`、`tympanus.net`（Codrops）、`ics.media`、`commarts.com`、`ggxrd.com`、`cdn.jsdelivr.net` 都無法解析。所以下文分兩種證據：標「原始碼直讀」的，是我在 GitHub 上逐行讀過的檔案；標「搜尋摘要」的，是搜尋引擎回傳的頁面摘要，我看到了網址與摘錄，但沒能讀全文。沒有證據的部分會直接寫「未能驗證」。要補讀全文，需要在 session 的網路設定裡放行上述網域。

## 總覽

這一輪最有價值的發現是：**Bruno Simon 的 2025 新版作品集（folio-2025）整個原始碼都公開在 GitHub 上**，而它要解的問題幾乎就是本專案的問題：一個在 Blender 裡做的風格化小世界、可以自由移動的角色、黃昏日夜色調、霧、葉叢與草、環境音，要在手機上也跑得動。讀它的原始碼得到的做法相當具體：用 UA 判斷手機、只有兩個畫質等級；手機上 shadow map 512、高畫質 2048；陰影框跟著鏡頭前的「最佳區域」移動（Bruno 原本寫了把位置取整，但那幾行已註解停用）；葉叢是約 80 張卡片合併成一團、法線往外拉成球；草是固定數量的 GPU 草葉，跟著玩家環繞；物件在 Blender 裡擺好再自動轉成 InstancedMesh；Howler 做環境音，按距離線性衰減；KTX2（ETC1S）壓縮貼圖。另一個標竿是 Abeto 的 **Messenger**（2025），它證明不用遊戲引擎、只用 three.js + `three-mesh-bvh` 就能做出走路手感好、手機上也順的小星球。本專案已經做對了不少事（meshopt 壓縮 glb、InstancedMesh、葉卡片的彎法線、`renderer.compile` 暖機、手機 pixel ratio 1.5、手機 shadow 1024），**差距主要在三處：沒有在真手機上量過（HANDOFF.md 自己寫了「Not measured on a phone」）、陰影框固定 120 單位太大、貼圖還是 PNG/JPG 而非 GPU 壓縮格式**。另一個重要事實：r149 的 UMD `examples/js` 裡**沒有 `KTX2Loader.js`**（我在 r147 tag 直接查到 404），BatchedMesh 要 r159、`three-mesh-bvh` 新版要 r159 以上、UMD 檔在 r161 被移除。所以「升級 three.js」不是小事，下文把每條建議需要的版本與成本都標出來。

---

## 1. Bruno Simon — folio-2025（bruno-simon.com 2025 新版）

**是什麼。** Bruno Simon（Three.js Journey 的作者）的作品集，開一台小車在 Blender 做的島上探索，2019 版的重製。原始碼以 MIT 授權公開，含 Blender 檔。

**怎麼做的（原始碼直讀）。**
- **技術棧**：`package.json` 列出 `three ^0.183.2`、`@dimforge/rapier3d ^0.17.3`（物理）、`howler ^2.2.4`（音效）、`camera-controls`、`gsap`、`stats-gl`、`vite ^7.2.4`、`@gltf-transform/*`。也就是：最新版 three.js、要 Vite build、要 WASM（Rapier）。
- **渲染器**：`Rendering.js` 用 `THREE.WebGPURenderer`（`forceWebGL: false`），不支援 WebGPU 時由 three.js 自己回退 WebGL。`antialias: this.game.viewport.pixelRatio < 2`——**高密度螢幕不開 MSAA**，因為像素已經夠密。後處理只有 bloom（threshold 1、strength 0.25）和一個 `cheapDOF`；高畫質 bloom 5 個 mip，低畫質 2 個，低畫質不做景深。`sortObjects = false`，用 `renderOrder` 手動排序。網址加 `#stats` 會顯示 draw call、三角形、幾何體與貼圖數量。
- **畫質分級**：`Quality.js` 只有兩級。判斷方式就一行：`const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)`，`this.level = isMobile ? 1 : 0`。其他模組監聽 `change` 事件各自降級。
- **陰影**：`Ligthing.js`（原檔名就拼錯）只有一盞 `DirectionalLight` 投影。`this.mapSize = this.game.quality.level === 0 ? 2048 : 512`——**手機只有 512**。陰影相機不是固定的：光源與 target 每一幀跟著 `view.optimalArea.position` 移動。變數雖然叫 `optimalRoundedPosition`，但取整的那幾行（`// optimalRoundedPosition.x = Math.round(...)`）已經註解掉，**實際上沒有取整**；跟的也是鏡頭前的最佳區域，不是玩家本身（更正：初稿誤寫成「用取整後的位置避免閃爍」）。陰影框的大小等於最佳區域的半徑。`shadowBias = -0.001`、`shadowNormalBias = 0.1`。
- **葉叢**（`World/Foliage.js`）：每一團是 80 張 `PlaneGeometry(0.8, 0.8)` 隨機撒在球殼上（半徑偏向外側，`1 - Math.pow(rng(), 3)`），`mergeGeometries` 合成一個幾何體；法線 `position.lerp(normal, 0.85)` 往球心外拉，讓一堆平面像一個圓的體積一樣受光；用貼圖紅色通道做 alpha cutout；陰影也用同一張貼圖遮罩，所以樹下是斑駁的葉影；**亮面與暗面兩個顏色依法線與光的夾角 `smoothstep` 混合**（不是寫實光照）；所有樹叢一個 InstancedMesh。
- **草**（`World/Grass.js`）：`subdivisions = 280` 的格子，78,400 根草，每根一個三角形；網格中心每幀跟著玩家，超出範圍的草用取模繞回另一邊，所以草的數量固定但看起來無限；只有草尖受風；草根壓暗當假陰影；地形貼圖的綠色通道決定哪裡有草。
- **擺放→Instancing**（`InstancedGroup.js`）：在 Blender 擺好的同款物件，載入後自動轉成每個子網格一個 `THREE.InstancedMesh`，每個實例只是一個變換矩陣；只有在 dirty 時才重寫矩陣。
- **材質**（`Materials.js`）：大量物件共用一張「調色盤貼圖」（`colorNode: texture(paletteTexture)`），README 也提醒在 Blender 匯出前要把調色盤節點 mute，由 three.js 在材質上指定。發光材質關掉霧（`material.fog = false`）。
- **音效**（`Audio.js`）：Howler；環境聲（蟲鳴、雨、風、浪）用 `loop: true`，音量每幀依天氣與時間計算，蟲鳴用 GSAP 在 15 秒內淡入淡出；營火等「有位置的聲音」取最近的聲源，音量隨距離線性衰減（`remapClamp(closestDistance, 0, item.distanceFade, 1, 0)`），太小就直接 mute；撞擊音每次隨機 `rate = 0.9 + Math.random() * 0.2`；視窗失焦自動靜音；L 鍵切換靜音並存進 localStorage。在使用者互動之前 `play()` 直接 return。
- **資產管線**（README）：`npm run compress` 用 glTF-Transform 與 KTX-Software，把 glb 內嵌貼圖和獨立 PNG/JPG 轉成 **KTX2 ETC1S（quality 255）**，UI 圖轉 WebP；Blender 匯出時不要壓縮，交給 compress 腳本。
- **遊戲迴圈**：README 列出一個從 0 到 999 的固定順序（Time、Inputs → Player → Physics → View → 視覺 → Audio → Rendering 998 → Monitoring 999）。

**搜尋摘要補充。** Awwwards 上他自己寫的 case study 說整個世界在 Blender 裡做、靠命名規則決定物件行為；並說因為用 TSL，有 WebGPU 時就自動用 WebGPU。他在 X 上發了 15 集 devlog，其中一集講「怎麼把作品集的 frame rate 翻倍」，內容我未能讀到。

**值得借的。** 兩級畫質就夠；手機 shadow 512 + 陰影框跟著最佳區域走（若要防閃爍，需自己在光源空間對齊 texel，Bruno 的取整已停用）；高 DPR 關 MSAA；葉叢「亮暗兩色混合」；草跟著玩家繞；Blender 擺放自動轉 instancing；環境音依距離衰減、失焦靜音。**不能直接照搬的**：TSL、WebGPURenderer、Rapier 都需要升級到 r16x 以上加 Vite build。

**來源**
- https://github.com/brunosimon/folio-2025 （README，原始碼直讀）
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/package.json
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Rendering.js
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Quality.js
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Ligthing.js
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/World/Foliage.js
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/World/Grass.js
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/InstancedGroup.js
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Materials.js
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Audio.js
- https://www.awwwards.com/brunos-portfolio-case-study.html （搜尋摘要）
- https://x.com/bruno_simon/status/1849448601367335032 、https://x.com/bruno_simon/status/1862105274514878528 （devlog 公告，搜尋摘要）

---

## 2. Abeto — Messenger（2025）

**是什麼。** 一個在小星球上走路送信的瀏覽器遊戲，2025 年 9 月推出，Vicente Lucendo 與 Michael Sungaila 開發、Abeto 發行，多人同時在線。氣氛和本專案非常接近：安靜、懷舊、黃昏、走路。

**怎麼做的（全部為搜尋摘要）。**
- WebGPU.com 的 showcase 與 Hacker News 留言都說：**沒有用遊戲引擎**，three.js + `three-mesh-bvh`（碰撞），Houdini 與 Blender 建模，WebSocket 做多人。
- Commarts 訪談中 Lucendo 說，做成星球是為了**讓玩家永遠不會撞到看不見的牆**——一直走就會繞回原點；另一個目標是自製可容納上千人同時在線的多人技術。
- 在 2026 年 9 月首屆 Three.js Conf Paris 的開場演講「From 3D to Feeling」裡，他講了參考來源（1980 年代亞洲影像、動畫、自己的旅行照片），**先談構圖與聲音，最後才談程式碼**；ICS Media 的報導說他認為 frame rate 掉到 30 fps 就會打破沉浸感，並說整個專案花了四到五個月。
- Hacker News 有人稱讚手機上很流暢（軼事，非量測）。

**值得借的。** (a) 自由走動的碰撞不一定要物理引擎：BVH + 膠囊體就夠（見第 3 節）。(b)「沒有看不見的牆」是設計目標，本專案的方形廣場與街道兩側都有邊界，至少要讓邊界看起來是真的牆（騎樓柱、攤車、圍牆），不要是空氣牆。(c) 聲音與構圖先於技術。

**來源**
- https://webgpu.com/showcase/messenger/ （搜尋摘要）
- https://brianlovin.com/hn/45396441 （HN 討論，搜尋摘要）
- https://www.commarts.com/webpicks/messenger （訪談，搜尋摘要）
- https://ics.media/en/entry/260925/ （Three.js Conf Paris 報導，搜尋摘要）
- https://threejs.paris/schedule （議程，搜尋摘要）
- https://en.wikipedia.org/wiki/Messenger_(video_game) （搜尋摘要）

---

## 3. gkjohnson / three-mesh-bvh 的 `characterMovement` 範例

**是什麼。** Messenger 用的碰撞庫。BVH（bounding volume hierarchy）加速 raycast 與形狀查詢；README 範例「500 條射線對 80,000 面模型仍 60fps」。範例裡有一個第三人稱角色移動 demo。

**怎麼做的（原始碼直讀）。**
- 玩家碰撞是**膠囊體**：`radius: 0.5`，`segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1.0, 0.0))`。
- 每一子步：先加重力（落地時重設，不累積）；WASD 依 `controls.getAzimuthalAngle()` 轉成相機相對方向；用膠囊的 AABB 呼叫 `collider.geometry.boundsTree.shapecast(...)`，對每個候選三角形算 `tri.closestPointToSegment(...)`，距離小於半徑就沿分離方向推出去。
- 判定著地：`playerIsOnGround = deltaVector.y > Math.abs(delta * playerVelocity.y * 0.25)`。空中時移除沿碰撞法線的速度分量，所以會沿牆滑動。
- `const delta = Math.min(clock.getDelta(), 0.1)`，再切成 `physicsSteps = 5` 個子步；`gravity = -30`、`playerSpeed = 10`。
- 相機用 OrbitControls 跟著玩家平移；**程式碼註明相機與幾何的碰撞還沒實作（TODO）**。

**版本成本。** 目前 `package.json` 是 0.9.18，`peerDependencies.three` 為 `>= 0.159.0`，`main` 指向 `build/index.umd.cjs`（有 UMD 建置，但需要 r159 以上）。要配 r149 必須找舊版（未驗證是哪一版開始要求 r159）。不過演算法本身只有幾十行，**可以不引入函式庫，自己用 `THREE.Line3` + 對街道的少數盒子做膠囊對 AABB 的推擠**，本專案的碰撞體大多是方盒子，用不到 BVH。

**值得借的。** 膠囊 + 推出 + 沿牆滑動 + 子步 + delta 上限 0.1。目前 `walk.js` 用 `SIDE = 8.4` 的單一寬度夾住角色，換成膠囊對方盒子就能讓她繞著攤車、榕樹、棋桌走，而不是穿過或被一條看不見的線擋住。

**來源**
- https://github.com/gkjohnson/three-mesh-bvh
- https://raw.githubusercontent.com/gkjohnson/three-mesh-bvh/master/example/characterMovement.js
- https://raw.githubusercontent.com/gkjohnson/three-mesh-bvh/master/package.json

---

## 4. pmndrs / ecctrl（R3F + Rapier 角色控制器）

**是什麼。** pmndrs 維護的物理角色／載具／無人機控制器，給 React Three Fiber + Rapier 用。

**怎麼做的（GitHub README 直讀）。**
- 必要依賴：`three`、`react`、`react-dom`、`@react-three/fiber`（徽章寫 9.4+）、`@react-three/rapier`（2.2+）。
- 角色是「浮在地面上」的剛體：彈簧與阻尼把角色撐在離地一點的高度，會把反作用力推回腳下的物體，會跟著移動平台走。地面偵測預設 `shapeCast`，陡坡時退回中心射線；人多時可改 `groundDetection="rayCast"` 省成本。
- 內建動畫狀態：`IDLE, WALK, RUN, JUMP_START, JUMP_IDLE, JUMP_FALL, JUMP_LAND`，由模型自己播放或混合。
- 內建 DOM 搖桿與虛擬按鈕給觸控。
- 相機 `EcctrlCameraControls` 延伸 drei 的 CameraControls，**不會自動跟隨**，要每幀自己移；README 沒提相機碰撞。

**成本。** 全套要 React、R3F、Rapier（WASM）、bundler，等於整個專案重寫。不建議引入。

**值得借的（只借概念）。** (a)「浮起來」的角色：腳下用一條射線量地面高度、彈簧拉到目標高度，可以讓她走上廣場台階、廟前石階不卡。(b) 把動畫狀態寫成明確列舉（IDLE/WALK/RUN），由速度決定，再混合過渡，比在 `poseGirl` 裡用 if 判斷好維護。

**來源**
- https://github.com/pmndrs/ecctrl
- https://github.com/ErdongChen-Andrew/CharacterControl （浮動膠囊的前身，搜尋摘要）

---

## 5. Three.js Journey — 烘焙光照（Portal scene）與 Blender 匯出

**是什麼。** Bruno Simon 的線上課程裡兩堂課「Creating a scene in Blender」「Baking and exporting the scene」，用 Blender Cycles 把整個場景的光影烘進一張貼圖，three.js 端只用 `MeshBasicMaterial` 顯示。

**怎麼做的（搜尋摘要）。**
- 課程頁說：把渲染結果烘進貼圖並與場景一起匯出；**整個場景一張大貼圖**，物件多時才拆多張。
- 第三方筆記（非官方）：Cycles、bake type Combined、margin 16px（Extend）；Blender 會烘到「目前選取的貼圖節點」。
- three.js 論壇上有人遇到：GLTFLoader 會用第一組 UV 套貼圖，若另有 lightmap 專用 UV 會出問題。

**本專案的對照。** HANDOFF.md 寫明 2026-09-24 起「no textures, no UVs 的限制取消」，`asset/blender/stylized.py` 已經用腳本產生 glb，所以有條件烘焙。烘焙最划算的是**靜態、不隨年代變化的東西**：廣場的地面與圍牆、榕樹根、土地公廟、騎樓柱廊。它們的 AO 與「黃昏暖光 + 冷色陰影」可以烘進頂點色或一張小貼圖，然後在手機上關掉這些物件的即時陰影接收。注意本專案用 `MeshStandardMaterial` + 自訂 tone mapping，烘焙貼圖要以 `toneMapped`/色彩空間一致的方式處理（r149 用 `texture.encoding = THREE.sRGBEncoding`，r152 起改名 `colorSpace`）。

**來源**
- https://www.threejs-journey.com/lessons/creating-a-scene-in-blender （搜尋摘要）
- https://chanjunren.github.io/docs/zettelkasten/threejs/baking_and_exporting （第三方筆記，搜尋摘要）
- https://discourse.threejs.org/t/how-to-bake-light-with-textures/52076 （論壇，搜尋摘要）
- https://svilenkovic.com/3d/how-to-bake-lighting-for-web （第三方，搜尋摘要）

---

## 6. meshoptimizer / gltfpack 與 KTX2（以及 r149 的實際限制）

**是什麼。** zeux 的 meshoptimizer 與它的命令列工具 gltfpack；KTX2 + Basis Universal 是「在 GPU 上仍維持壓縮」的貼圖格式。本專案 `tools/pack-models.sh` 已經用 meshopt 壓縮 glb（`models.js` 載入 `meshopt_decoder.js`）。

**怎麼做的（GitHub 直讀）。**
- meshopt 與 Draco 的差別：Draco 類壓縮率高，但常打亂頂點／索引順序，讓 GPU 渲染效率變差，載入後還要重新量化；meshopt 保留 GPU 友善順序、解碼很快（README 寫頂點解碼約 3-6 GB/s，壓縮比約 2-4 倍）。
- gltfpack 旗標：`-c` meshopt 壓縮、`-cc` 額外壓縮（搭配 gzip 更小）、`-tc` 轉 KTX2（KHR_texture_basisu）、`-si R` 簡化到比例 R（可做 LOD）、`-mi` 對重複網格用 `EXT_mesh_gpu_instancing`、`-kn`/`-km` 保留命名節點與材質。three.js 自 r122 起支援 meshopt（需 `setMeshoptDecoder`），r111 起支援量化。**貼圖壓縮要用原生 binary，npm 版功能較少。**
- **r149 沒有 UMD 版 KTX2Loader。** 我直接查 `https://raw.githubusercontent.com/mrdoob/three.js/r147/examples/js/loaders/KTX2Loader.js` 是 404；r147 的 `examples/js/loaders` 只有 `KTXLoader.js` 和舊的 `BasisTextureLoader.js`。r149 的 `examples/jsm/loaders/KTX2Loader.js` 存在，但它 `import ... from 'three'` 並引入 `WorkerPool`、`ktx-parse.module.js`、`zstddec.module.js`。

**KTX2 為什麼重要（搜尋摘要）。** PNG/JPG 在 GPU 上會解成未壓縮 RGBA（每像素 4 位元組，含 mipmap 約再多三分之一）；KTX2 轉碼後的格式在 VRAM 裡仍是壓縮的。第三方文章舉例：一張貼圖 JPG 解開 64MB，ETC1S 約 8MB、UASTC 約 16MB（這是第三方的示例數字，未能驗證）。一般建議 ETC1S 用在大部分顏色貼圖，UASTC 用在法線與要求品質的貼圖。

**成本。** 在不升級、不加 build 的前提下要用 KTX2，只有兩條路：(1) 用 `<script type="importmap">` 把 `'three'` 映射到一個小 shim 模組（`export default window.THREE` 並逐一再匯出需要的類別），再以 `<script type="module">` 載入 r149 的 jsm KTX2Loader 與 basis transcoder（wasm），掛到 `window.THREE.KTX2Loader`。可行但脆弱，要自己測試。(2) 先不做 KTX2，改成**縮小貼圖尺寸、能用 canvas 畫的就畫、合併成圖集**，並用 `renderer.info.memory.textures` 監看數量。HANDOFF.md 記錄暖機時有 165 張貼圖，**數量本身比格式更值得先處理**。

**來源**
- https://github.com/zeux/meshoptimizer
- https://raw.githubusercontent.com/zeux/meshoptimizer/master/gltf/README.md
- https://github.com/mrdoob/three.js/tree/r147/examples/js/loaders
- https://raw.githubusercontent.com/mrdoob/three.js/r147/examples/js/loaders/KTX2Loader.js （404，直讀）
- https://raw.githubusercontent.com/mrdoob/three.js/r149/examples/jsm/loaders/KTX2Loader.js
- https://salivity.github.io/three.js/article/how-ktx2loader-and-basis-universal-reduce-vram-in-three-js （第三方，搜尋摘要）
- https://discourse.threejs.org/t/estimate-ktx2-texture-memory-size/45793 （論壇，搜尋摘要）

---

## 7. three.js 官方 Migration Guide：每條「新技術」對應的版本成本

**是什麼。** three.js GitHub wiki 的版本遷移紀錄。這一節不是作品，而是讓其他建議能標上成本的依據。

**重點（GitHub wiki 直讀）。**
- r150：`build/three.js`、`build/three.min.js` 標為 deprecated；`physicallyCorrectLights` 改名 `useLegacyLights = false`。
- r152：`outputEncoding` → `outputColorSpace`，`Texture.encoding` → `colorSpace`，`ColorManagement.enabled` 預設 true（**升級會讓顏色整體變化，本專案的暖色調色盤要重調**）。
- r155：`useLegacyLights` 預設 false（**光強度單位改變，所有燈的 intensity 要重調**）；inline tone mapping 只在畫到螢幕時套用，後處理要用 `OutputPass`（本專案用 `CustomToneMapping` + 自己的 post shader，會受影響）。
- r159：BatchedMesh 的 `applyGeometry()` 改為 `addGeometry()`（BatchedMesh 在這一帶加入）；r166 起新增幾何體後要呼叫 `addInstance`。
- r161：UMD 建置檔被移除，只剩 ES modules。
- r163：`WebGLRenderer` 不再支援 WebGL 1。
- 另：`examples/js` 目錄在 r148 移除（`GLTFLoader.js` 檔頭註明是從 r147 的 `examples/js` 拿的）；`examples/js/utils/BufferGeometryUtils.js`、`examples/js/postprocessing/*`（EffectComposer、UnrealBloomPass、SMAAPass 等）在 r147 都還有 UMD 版，**這些是本專案不升級也能用的現成工具**。

**結論。** 要用 BatchedMesh、新版 three-mesh-bvh、WebGPU/TSL、`compileAsync`，最低要到 r159 以上；一旦超過 r160 就必須改成 ES modules（可用 importmap 而不用 bundler，但每個 `window.SCENE`/IIFE 模組都要改寫成 import），且 r152/r155 的色彩與光照改動會讓目前所有手調的顏色和強度失準。依本專案規模（約 1.1 萬行、手調色盤與曝光），估計是**數天到一週的遷移加重新調色**，而換來的多數東西（BatchedMesh、TSL）對一個 draw call 已經控制得不錯的場景不是剛需。**建議維持 r149，把力氣花在本報告其他不需升級的項目。**

**來源**
- https://github.com/mrdoob/three.js/wiki/Migration-Guide
- https://github.com/mrdoob/three.js/tree/r147/examples/js/utils
- https://github.com/mrdoob/three.js/tree/r147/examples/js/postprocessing
- https://github.com/mrdoob/three.js/blob/dev/docs/pages/BatchedMesh.html.md （搜尋摘要：一個 BatchedMesh 只能一種材質）

---

## 8. Codrops — 「Building Efficient Three.js Scenes」（2025）與 Three.js Conf 網站（2026）

**是什麼。** Codrops 上兩篇做法文章：Niccolò Fanton 2025 年 2 月的效能文，以及 2026 年 2 月首屆 Three.js 大會官網的製作記。

**怎麼做的（搜尋摘要）。**
- 2025 文：靜態物件在不變的光照下，用烘焙把光影預先算進貼圖；用 **spector.js**（瀏覽器擴充）擷取一幀的每一個 draw call 來找浪費；示範把重複物件合成單一 draw call。文章基於 R3F + drei。
- 2026 大會網站：法線、粗糙度、顏色貼圖烘進**貼圖圖集**，壓成 KTX2（ETC1S 與 UASTC），並用**半個 texel 的內縮**避免雙線性取樣時相鄰格子的顏色滲過來。
- 大會報導提到另一場講裝置展的效能演講：以毫秒為單位量渲染成本，逐步減少 draw call 與深度處理。

**值得借的。** (a) 用 spector.js 在真機或桌機抓一幀，看看廣場一幀到底多少 draw call、哪些是同材質可合併的。(b) 本專案的招牌都是 canvas 畫的獨立貼圖，**把同一區的招牌畫進一張 canvas 圖集**、UV 內縮半 texel，可以同時減少貼圖數與材質數。

**來源**
- https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/ （搜尋摘要）
- https://tympanus.net/codrops/2026/02/28/when-community-becomes-ui-building-the-website-for-the-first-three-js-conference/ （搜尋摘要）
- https://tympanus.net/codrops/2026/09/10/inside-the-first-three-js-conference-in-paris/ （搜尋摘要）

---

## 9. Utsubo — 「100 Three.js Tips That Actually Improve Performance (2026)」與 Discover three.js tips

**是什麼。** 兩份常被引用的效能清單。Utsubo 是日本的 three.js 工作室；Discover three.js 是 Lewy Blue 的免費書。

**重點（搜尋摘要）。**
- Utsubo：手機上大約以**每幀 100 個 draw call** 為目標，用 `renderer.info.render.calls` 監看（WebGPURenderer 是 `render.drawCalls`）。其他來源數字從 50 到數百不等，應視為粗略目標。
- Discover three.js：作者自己註明「不是每一條都實驗驗證過，尤其效能那些」；建議部署前把相機 frustum（far）縮小、`powerPreference: "high-performance"`、重用材質與幾何、迴圈內不要 new 物件、場景靜止時可以按需渲染。

**本專案的對照。** `app.js` 已經用 `powerPreference: 'high-performance'`、`antialias: false`。但 HANDOFF.md 的量測都是 1440×900 桌機 headed、在 100Hz 上限（100.0-100.6 fps），**從來沒有記錄 draw call 數、也沒有在手機上量**；`window.__` 除錯物件裡有陰影統計但沒有 `renderer.info`。應該先把 `renderer.info.render.calls / triangles / memory.textures / programs` 曝露出來，在廣場、三段街各取一點記錄，訂下手機預算。

**來源**
- https://www.utsubo.com/blog/threejs-best-practices-100-tips （搜尋摘要）
- https://discoverthreejs.com/tips-and-tricks/ （搜尋摘要）
- https://discourse.threejs.org/t/how-to-improve-performance-on-my-site/52039 （論壇，搜尋摘要）

---

## 10. Arc System Works — 「GuiltyGearXrd's Art Style: The X Factor Between 2D and 3D」（GDC 2015）

**是什麼。** Junya Motomura 在 GDC 2015 的演講，3D 模型做出 2D 動畫感的經典案例。

**怎麼做的（搜尋摘要）。**
- 官方講義說畫風嚴格以日本動畫為準，**由自訂的賽璐珞著色器加上「專為這個著色器做」的 3D 模型共同完成**；賽璐珞著色裡「表面不是亮就是暗，沒有中間值」。
- 二手摘要：美術在著色器裡細緻地管理表面法線；貼圖多半只是查找表，資訊大多存在網格本身。社群分析說是 2-3 階的賽璐珞著色，用頂點色控制明暗門檻，美術可以逐頂點調整陰影（非官方）。
- 講義 PDF 在 ggxrd.com，未能讀取，細節未驗證。

**值得借的。** 本專案不需要硬邊卡通，但「**亮暗不是物理算出來的，而是美術決定的**」這個原則很關鍵：在 `lit()` 的 `onBeforeCompile` 裡，把 N·L 經過 `smoothstep` 壓成兩、三階（亮面暖、暗面偏冷的藍紫），和 Bruno Simon 葉叢的「兩色混合」是同一招，r149 就能做，不需升級。r149 也有現成 `MeshToonMaterial` + `gradientMap`（一張 3×1 的小貼圖決定階數），可以先在人物與招牌上試。並且用頂點色作為「這裡永遠在陰影」的手動遮罩（騎樓內側、榕樹下），等於手繪 AO。

**來源**
- https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The （搜尋摘要）
- https://www.arcsystemworks.com/guilty-gear-xrd-art-talk-at-game-developers-conference-2015/ （搜尋摘要）
- https://www.ggxrd.com/Motomura_Junya_GuiltyGearXrd.pdf （講義，未能讀取）
- https://gamedeveloper.com/art/see-i-guilty-gear-xrd-i-s-striking-2d-3d-art-deconstructed-at-gdc-2015 （搜尋摘要）

---

## 11. Wolfire Games / David Rosen — 「Animation Bootcamp: An Indie Approach to Procedural Animation」（GDC 2014）

**是什麼。** 30 分鐘的 GDC 演講，示範用極少的關鍵影格加程式內插做出流暢、會回應的角色動畫（Overgrowth、Receiver、Black Shades）。

**怎麼做的（搜尋摘要）。** 會議頁說重點是「用很少的關鍵影格，以簡單的程序化技巧做出互動且流暢的動畫」。Unity 論壇有人轉述 Overgrowth 的角色總共只用了 13 個關鍵影格（二手說法，未驗證）；另一位轉述為「先把反應性寫進物理，再把動畫疊上去」。演講內容細節（例如步伐如何與速度同步）我未能讀到逐字稿。

**本專案的對照。** 女孩是一個手寫關節人偶（`app.js` 的 `seg()`、`poseGirl`），**本來就是程序化動畫**，沒有關鍵影格。可以借的是這個演講的核心精神：(a) 步頻要跟實際移動速度綁定（每走一個步長完成半個週期），否則腳會滑；(b) 從 IDLE 到 WALK、WALK 到 RUN 用權重平滑混合而不是切換；(c) 停下時加一點過衝與回彈，轉向時身體先傾斜、頭先轉。這些都是幾行三角函數加阻尼插值。

**來源**
- https://gdcvault.com/play/1020583/Animation-Bootcamp-An-Indie-Approach （搜尋摘要）
- https://www.gamedeveloper.com/design/video-an-indie-approach-to-procedural-animation （搜尋摘要）
- https://discussions.unity.com/t/an-indie-approach-to-procedural-animation-gdc-video-talk/538228 （搜尋摘要）
- https://www.gameanim.com/2018/03/04/indie-approach-procedural-animation/ （搜尋摘要）

---

## 12. Adam Robinson-Yu — A Short Hike（GDC 2020 postmortem 與 PlayStation Blog）

**是什麼。** 一人開發、Unity 製作的小島登山遊戲，被大量拿來當「溫暖、懷舊、小世界」的參考。

**怎麼做的（搜尋摘要）。**
- 招牌的像素感來自**把主相機畫到一張縮小的 render texture，再不做反鋸齒地放大到螢幕**。
- 他說低解析度有一種「印象派」效果，讓腦袋自己補細節；因為有人不喜歡，所以提供像素大小的選項（評論說有四個預設）。
- **調色盤直接從秋天加拿大地盾的照片取色**。
- 一人做、美術能力有限，靠大像素與簡單模型擴大範圍。
- GDC 2020 演講「Crafting A Tiny Open World」是一手來源，我未能讀到逐字稿。

**值得借的。** (a) 對手機來說，「降低內部解析度」是最大的效能槓桿，而且可以是**風格選擇**而不是妥協：本專案已有自訂 post shader（`app.js` 的 `post` ShaderMaterial），可以讓手機在 render target 上以 0.6-0.75 倍解析度畫、再由 post pass 放大（並加一點紙張顆粒），比固定 `setPixelRatio(1.5)` 更彈性，還能做動態解析度（fps 掉了就降）。(b) 調色盤從真實照片取色：本專案已有 8 棟建築的授權照片（`photos.js`），可以從這些照片的黃昏時段取樣，作為各年代的 haze/fog 與陰影色，讓「懷舊」有根據。

**來源**
- https://blog.playstation.com/2021/08/05/crafting-a-tiny-open-world-a-look-behind-the-scenes-at-the-creation-of-a-short-hike/ （搜尋摘要）
- https://j-red.github.io/arcadeflight （第三方復刻說明，搜尋摘要）
- https://itch.io/post/2065934 （社群討論，搜尋摘要）

---

## 13. 量測工具：stats-gl、spector.js、`renderer.info`

**是什麼。** stats-gl 是 pmndrs 生態圈常用的效能面板（Bruno Simon 的 folio-2025 也用它）；spector.js 是擷取 WebGL 一幀所有呼叫的工具。

**怎麼做的（GitHub README 直讀 stats-gl）。** 顯示 FPS、CPU 與 **GPU 時間**（`trackGPU`，需要 timer query 擴充；Safari 要在 feature flags 開啟 WebGL Timer Queries）、刷新率偵測（`trackHz`）。`stats.init(renderer)` 後每幀 `stats.update()`。README 只寫 npm 安裝，未提 UMD/CDN，與 r149 的相容性未驗證。

**值得借的。** 本專案不必引入 stats-gl：用 r149 自帶的 `renderer.info` 加一個 `?stats=1` 參數顯示 draw calls、三角形、貼圖數、programs，再加一個簡單的 frame-time 中位數與第 95 百分位。重點是**在真手機上看**：Android 用 Chrome 的 `chrome://inspect` 遠端除錯，iPhone 用 Mac Safari 的「開發」選單連線（這是一般做法，本次未另找來源）。Bruno Simon 的做法（網址 hash 開 `#stats`）可直接照抄。

**來源**
- https://github.com/RenaudRohlinger/stats-gl
- https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/ （spector.js，搜尋摘要）
- https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Rendering.js （`#stats`，直讀）

---

## 14. Web Audio 的自動播放規則與著色器暖機

**是什麼。** 兩個「首次進入體驗」的技術細節：聲音何時能響、第一幀為何卡。

**怎麼做的（搜尋摘要）。**
- MDN best practices：在使用者手勢內建立或 `resume()` AudioContext，並先檢查 `state === 'suspended'`。Chrome 的 Intent to Ship 文件說，未被允許時 context 以 suspended 開始；Chrome Android 與 iOS Safari 的 Web Audio 自動播放政策相近。
- `renderer.compileAsync()`：PR 於 2023-10-14 合併（約 r158），利用 `KHR_parallel_shader_compile` 非阻塞地查詢編譯狀態；MDN 標示這個擴充不是 Baseline。Khronos 郵件列表指出，若同步查詢編譯狀態仍會等待，抵消好處。

**本專案的對照。** `music.js` 已經處理了手勢限制（HANDOFF 寫第一次點擊才 `playVideo()`）。可以再加的是**環境音層**：廣場的蟬聲、遠處的機車、茶杯與棋子聲、廟裡的木魚或線香氣氛，用 Web Audio `GainNode` 交叉淡化，按女孩到聲源的距離調整（照 Bruno Simon 的線性 `distanceFade`），進入不同年代段落時換一組環境聲。著色器暖機方面，r149 沒有 `compileAsync`，目前的 `warmUp()`（`renderer.compile` + 一次離屏繪製，HANDOFF 記錄 331ms、30 programs）是 r149 下的正確做法；可以把它放在載入畫面還在的時候，並**減少 program 數量**（同樣的 `onBeforeCompile` 程式碼要回傳相同的 `customProgramCacheKey`，才不會一材質一 program）。

**來源**
- https://docs.w3cub.com/dom/web_audio_api/best_practices （MDN 鏡像，搜尋摘要）
- https://groups.google.com/a/chromium.org/g/blink-dev/c/5Y1BqbGauEs （搜尋摘要）
- https://github.com/mrdoob/three.js/pull/19752 （compileAsync PR，搜尋摘要）
- https://developer.mozilla.org/docs/Web/API/KHR_parallel_shader_compile （搜尋摘要）
- https://www.khronos.org/webgl/public-mailing-list/public_webgl/1904/msg00033.php （搜尋摘要）

---

## 給 Our Memory in Taipei 的啟示

以下依「不必升級 three.js、不加 build step」優先排列；需要升級的另列在最後。

1. **先在真手機上量，再優化任何東西。**（Bruno Simon `#stats`、Utsubo、Codrops/spector.js）加一個 `?stats=1`，在畫面角落顯示 `renderer.info.render.calls`、`triangles`、`memory.textures`、`programs.length` 和 frame time 中位數與 P95。在廣場中心、三個段落的中段、Taipei 101 結尾各記一次，寫進 HANDOFF.md。目標先訂為手機上約 100 draw calls、P95 frame time 在 33ms 以內（Lucendo 說掉到 30fps 就破壞沉浸感）。HANDOFF.md 目前只有桌機 100Hz 的數字，連一次手機紀錄都沒有，這是最大的盲點。

2. **陰影框跟著女孩走、縮小並在光源空間對齊 texel，手機改 512 或 1024 但框小三倍。**（Bruno Simon `Ligthing.js`）目前 `SUN_BOX = 120`，手機 1024 的 map 等於每單位不到 9 個 texel。自由走路模式下，把框縮到她周圍約 40 單位、光源與 target 跟著她，並把中心對齊到 texel 大小的倍數（避免陰影邊緣閃爍）。因為我們的太陽是斜照的（`key.position` 18, 26, 12），對齊必須在光源的 view 空間做：中心點轉到光源空間、對 x／y 取 texel 倍數、再轉回世界座標；只在世界座標的 x／z 取整沒有效果。這一步是我們自己加的，Bruno 的版本已停用取整。這樣同樣解析度下陰影清晰三倍，或用 512 得到與現在相近的品質但只要四分之一的填充成本。導覽模式可以維持現在的大框。

3. **把「亮暗兩色混合」寫進 `lit()`，取代部分寫實光照。**（Bruno Simon `Foliage.js` 的 `smoothstep` 兩色混合、Guilty Gear Xrd 的「亮暗由美術決定」）在 `onBeforeCompile` 裡把 N·L 經 `smoothstep` 壓成柔和的兩、三階，亮面用黃昏暖橘、暗面用偏藍紫的冷色，並讓頂點色可以手動標記「永遠在陰影」的區域（騎樓內側、榕樹下、廟裡）。這會讓整體更像插畫，也讓手機在關掉即時陰影時仍保有立體感。r149 可做，記得設定 `customProgramCacheKey` 以免 program 數暴增。

4. **用膠囊體碰撞取代單一寬度夾邊，並讓邊界「看得見」。**（three-mesh-bvh `characterMovement`、Messenger「沒有看不見的牆」）照範例寫一個膠囊對方盒子的推出與沿牆滑動（子步 5、delta 上限 0.1），碰撞體只需廣場的榕樹、棋桌、攤車、廟、柱廊和街上的攤位。這比引入 Rapier 或 ecctrl 便宜得多（那些要 React/WASM/bundler）。所有不能走過去的地方都放實物：攤車、機車、盆栽、圍牆，不要有空氣牆。

5. **女孩的步伐與速度綁定，加上狀態混合。**（David Rosen GDC 2014、ecctrl 的 IDLE/WALK/RUN 狀態）每走一個步長完成半個步態週期，避免滑步；IDLE↔WALK↔RUN 用 0-1 權重阻尼插值；停步加一點過衝、轉身時身體先傾頭先轉。這是 `poseGirl` 裡的幾十行改動，對「被操控的人物有沒有生命」影響最大。

6. **靜態的廣場在 Blender 裡烘 AO 與黃昏光到頂點色或一張小貼圖，手機上關掉它們的即時陰影接收。**（Three.js Journey Portal scene、Codrops 2025）地面、圍牆、榕樹根、土地公廟、騎樓柱廊不隨年代變化，最適合烘焙。`stylized.py` 已經是腳本化產生 glb，加一個 bake 步驟即可；注意 GLTFLoader 用第一組 UV 的問題，烘焙貼圖放在第一組 UV 或改用頂點色。

7. **減少貼圖「數量」：把同區的 canvas 招牌畫進同一張圖集，UV 內縮半 texel。**（Codrops 大會網站的圖集與半 texel 內縮、Bruno Simon 的單一調色盤貼圖）HANDOFF.md 記錄暖機時 165 張貼圖。招牌、公布欄紙條、燈籠的文字都是 canvas 畫的，按段落合併成 2-4 張 2048 的圖集，材質也能合併，draw call 與記憶體同時下降。這比導入 KTX2 更直接，也不需升級。

8. **手機用低內部解析度 + 動態解析度，把它當成風格。**（A Short Hike 的縮小 render texture、Bruno Simon 高 DPR 不開 MSAA）既然已經有自訂 post pass，就讓手機先畫到 0.6-0.75 倍大小的 render target，再由 post pass 放大並加紙張顆粒；監測 P95 frame time，超標時再往下降一級。只要兩級畫質（照 Bruno Simon 的 `Quality.js`），不要做複雜的自動分級。

9. **環境音層，按距離淡入淡出，失焦自動靜音。**（Bruno Simon `Audio.js`、MDN autoplay 規則）在廣場放蟬聲、茶杯與棋子聲、廟裡的木魚；每個聲源有位置，音量照 `remapClamp(距離, 0, 範圍, 1, 0)` 計算，太小就 mute；每次播放隨機 0.9-1.1 的 rate，避免重複感；視窗失焦時靜音。全部在第一次點擊後才啟動，和 `music.js` 的年代歌曲共用同一個靜音開關。

10. **榕樹的葉卡片已經用對招，下一步是讓葉影與亮暗兩色跟上。**（Bruno Simon `Foliage.js`）`square.js` 已經是約 800 張 alpha-cut 葉卡片、一個 InstancedMesh、彎法線、alpha 遮罩陰影，與 folio-2025 同一做法。可以再借的是：法線混合比例（他用 0.85）、球殼半徑偏向外側（`1 - rng()^3`）讓樹冠邊緣更蓬，以及亮暗兩色混合。風只動 UV 旋轉而不動頂點，也比較省。

**需要升級或加 build step 的建議（目前不建議做）。** BatchedMesh（r159+）、新版 three-mesh-bvh（r159+）、`compileAsync`（約 r158+）、WebGPU/TSL（Bruno Simon 用 r183 + Vite）、Rapier/ecctrl（WASM + React + bundler）、官方 KTX2Loader 的 UMD 用法（r149 沒有，只能用 importmap shim 繞過）。超過 r160 必須改 ES modules，r152/r155 的色彩管理與光照單位改動會讓目前手調的暖色調色盤和曝光全部失準。以本專案的規模估計是數天到一週的遷移加重新調色，換來的功能對目前的場景不是剛需。
