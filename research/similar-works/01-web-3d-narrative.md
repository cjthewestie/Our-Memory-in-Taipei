# 01 · 網頁 3D 敘事與可探索網站：類似作品怎麼做

研究日期：2026-11-03。範圍：在瀏覽器裡「逛」或「捲動」的 3D 作品，包括 Bruno Simon 兩代作品集、Abeto 的《Messenger》與 Igloo Inc、Lusion、Merci-Michel、Active Theory、NYT 的 3D／空間音訊報導、neal.fun、房間型 diorama 作品集，以及群眾投稿的城市記憶地圖（M+ NEONSIGNS.HK）。

**資料來源怎麼來的，先講清楚。**這次的雲端環境只有 `github.com` 和 `raw.githubusercontent.com` 能直接打開。medium.com、awwwards.com、80.lv、commarts.com、tympanus.net（Codrops）、wikipedia、bruno-simon.com、deepwiki.com 都連不上（DNS 被擋）。所以：
- 標 **【原始碼】** 的內容，是我直接讀 GitHub 上的程式碼或 README 得到的，可信度最高。
- 標 **【搜尋摘錄】** 的內容，是我在 WebSearch 結果裡看到、由該網址提供的摘錄。網址是真的、我有看到，但整篇原文我沒讀過，細節可能有遺漏。
- 沒查到的就寫「未查證」。所有作品、數字、引言都沒有自己編。

## 總覽

這一類作品裡做得好的，有幾個共同點。第一，**入口只給一個動作**：Bruno 2025 一開始只有一句「click to start」，按下去的同時解鎖聲音、播放揭幕動畫、把控制權交給玩家。第二，**把控制做在世界裡**：觸控搖桿是一圈畫在車子周圍地面上的光環，不是螢幕角落的 HUD。第三，**聲音是主要功能**：空間化、跟著日夜和天氣變，視窗失焦就暫停，靜音設定會記住。第四，**世界小，但完整**：《Messenger》是一顆十五分鐘走得完的小行星，沒有隱形牆。第五，**訪客留下的東西會變成場景裡的物件**：Bruno 的 Whispers 是地上的火苗，走近才看得到字，同時最多三十則。第六，**刻意不追寫實**：Merci-Michel 說「real-time 3D doesn't have to look like 3D」，NYT 的聖母院模型也刻意不做照片級寫實。第七，**敘事型 3D 常常收窄鏡頭**：NYT 原本想讓讀者在聖母院裡自由漫遊，後來改成受限的捲動路徑。這幾點都對得上 Our Memory in Taipei 現在的弱點（參見 `00-current-state.md`）：英文歡迎卡、泡泡上的「E」鍵帽、沒有環境音、燈籠沒有 instancing、走路模式沒有敘事節拍。

---

## 1. Bruno Simon — folio-2019（開車逛作品集）

**是什麼。**2019 年 10 月上線的作品集。你開一台紅色小車在 3D 世界裡撞東西，每個作品是場景裡的一個區域。做了約三個月，拿過 Awwwards Site of the Month、FWA of the Month（2019 年 11 月），訪客超過四十萬。【搜尋摘錄】 <https://usepastel.com/blog/how-a-design-portfolio-got-the-attention-of-400-000-visitors>、<https://thefwa.com/cases/bruno-simon-portfolio>

**怎麼做的。**
- 技術組合：Three.js 渲染、Cannon.js 物理、Blender 建模。目前 repo 的 `package.json` 列出 `three ^0.164.1`、`cannon ^0.6.2`、`howler ^2.2.4`、`gsap`、`dat.gui`，用 Vite 打包。這是後來更新過依賴的版本，不一定是 2019 年原始的版本。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2019/master/package.json>
- 物理和畫面分開：為細緻的模型另外做簡化的碰撞形狀，交給物理引擎計算，每一幀再把可見物件同步到物理形狀的位置。【搜尋摘錄，出自 Bruno 的 Medium case study】 <https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b>
- 效能：玩幾分鐘後掉幀，原因是物理物件一直沒進入「睡眠」。其他手段還有拿掉模糊、限制 pixel ratio、關掉 Three.js 物件的 `matrixAutoUpdate`。他說 Draco 壓縮是「a real game changer」。【搜尋摘錄，同上】
- 上手設計：車子一開始的位置是刻意安排的。玩家第一下就會撞到「BRUNO SIMON」標題字，藉此明白場景裡的東西會動。網址加 `#debug` 會打開除錯模式。【搜尋摘錄，同上】

**值得借的。**用第一個碰撞來教玩法，不用說明文字。物理物件要睡眠。網址旗標拿來除錯。

---

## 2. Bruno Simon — folio-2025（重製版，現在的 bruno-simon.com）

**是什麼。**同一個開車概念，重新做成 WebGPU 時代的版本。他在 Awwwards case study 說目標是「ten times better」。原始碼和 Blender 檔以 MIT 授權公開。【搜尋摘錄】 <https://www.awwwards.com/brunos-portfolio-case-study.html>、<https://news.hada.io/topic?id=24963>

**怎麼做的（大多是我直接讀的原始碼）。**
- **技術組合**：`three ^0.183.2`（TSL 著色器，有 WebGPU 就跑 WebGPU）、`@dimforge/rapier3d` 物理、`howler` 音效、`gsap`、`camera-controls`、`tweakpane` 除錯面板、`stats-gl`、`msgpack-lite`（伺服器通訊）、`seedrandom`。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/package.json>
- **資產管線**：`npm run compress` 會掃描 `static/` 裡的 GLB，用 gltf-transform 把內嵌貼圖壓成 KTX2 ETC1S，PNG/JPG 也壓成 KTX2，UI 圖轉成 WebP，原檔都保留。Blender 匯出時把調色盤貼圖節點靜音，調色盤改在 Three.js 端直接套上材質。【原始碼 README】 <https://github.com/brunosimon/folio-2025>
- **模組切分**：`sources/Game/` 下有 `Achievements`、`Audio`、`Fog`、`Quality`、`Respawns`、`Reveal`、`Server`、`Weather`、`Wind`、`Zones`、`Cycles/DayCycles`、`Inputs/{Gamepad,Keyboard,Nipple,Pointer,Wheel}`、`World/{Whispers,Lanterns,Grass,…}`。遊戲迴圈依編號分階段執行：0 是時間和輸入，3 是物理，8–10 是畫面，14 是音訊和 UI，998 是渲染，999 是監控。【原始碼】 <https://github.com/brunosimon/folio-2025/tree/main/sources/Game>
- **開場揭幕（Reveal.js）**：載入圈收起後，用 GSAP 把一個 `distance` uniform 從 0 補間到 3.5（2 秒，`back.out`），同時把鏡頭拉近，顯示「click to start」和聲音按鈕。玩家點擊、hover 那顆球，或按手把／鍵盤鍵之後，**這時才初始化音訊並播放揭幕音效**，光圈擴到 30，然後設為 99999 蓋滿整個場景，輸入模式切成 `wandering`。網址加 `#skip` 會把所有時間除以 4，並跳過等待點擊。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Reveal.js>
- **畫質（Quality.js）**：只有兩級。用 UA 判斷 `/Mobi|Android|iPhone|iPad|iPod/i`，手機預設 level 1，桌機 level 0。切換時發出 `change` 事件，由各模組自己決定要降什麼。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Quality.js>
- **觸控搖桿（Nipple.js）**：**不是螢幕角落的搖桿**。它是放在世界座標裡的一圈光環：手指的位置從畫面投射到地面平面，用 `atan2` 算方向，推出量從內半徑 2 到外半徑 4.5 正規化。手指在內圈按下又放開就算 `tap`。偏離目前朝向超過 135° 視為倒車。光環本身用 shader 畫出方向和推出量。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Inputs/Nipple.js>
- **觸發區（Zones.js）**：球形或圓柱形的區域，只在狀態改變時發出 `enter`／`leave` 事件，不會每幀觸發。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Zones.js>
- **重生點（Respawns.js）**：在 Blender 裡放名為 `respawnXxx` 的空物件，程式讀進來變成具名的重生點，並提供「找最近的重生點」。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Respawns.js>
- **日夜（DayCycles.js）**：一天 4 分鐘，有 day／dusk／night／dawn 四個 preset，每個 preset 定義光色、光強、霧的兩個顏色和遠近、陰影色等，放在 0–1 的關鍵影格上插值。另外有具名區間 `night`（0.25–0.70）和 `deepNight`（0.35–0.60）供音效等模組訂閱。環境變數可以把時間固定在某一點，方便測試。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Cycles/DayCycles.js>
- **聲音（Audio.js）**：用 Howler 做一個註冊表。`init()` 前所有 `play()` 都不會出聲，也就是要等使用者操作解鎖。音樂播放清單的起始曲目由 `Date.now()` 每 3 分鐘換一次，換曲時有「換唱片」音效，停 3 秒，再跳出通知。靜音存在 `localStorage('soundToggle')`，按 L 切換。**視窗失焦就靜音並暫停音樂**，回來時如果使用者沒有手動靜音就恢復。空間音效會取離焦點最近的位置，轉成鏡頭座標餵給 `howl.pos()`，依距離淡出，音量低於 0.01 就直接靜音。環境音跟世界狀態連動：晚上有蟋蟀，30–90 秒隨機出現貓頭鷹，`night` 結束時雞啼，`deepNight` 開始時狼嚎；雨、雪、風、海浪則跟天氣值和離海岸的距離連動。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Audio.js>
- **Whispers（訪客留言，第一個多人功能）**：在 Devlog 6 推出【搜尋摘錄】 <https://x.com/bruno_simon/status/1900166330210259261>。按 T 開輸入框，送出時把**玩家當下的位置**和國家代碼傳給伺服器。每則留言是 `InstancedMesh` 裡的一個實例，形狀是一團用噪聲扭動的火苗，出現和刪除時用 GSAP 淡入淡出。**走到 3 單位內，頭上才浮出字和國旗泡泡**，最近那一團還帶著噼啪的火聲。輸入會即時去掉 emoji 並截斷長度。【原始碼】 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/World/Whispers.js> 同時最多 30 則，新的擠掉舊的，每人一則，用 OpenAI 的免費 moderation 模型審核，伺服器程式沒有公開。【搜尋摘錄】 <https://www.awwwards.com/brunos-portfolio-case-study.html>
- **製作過程公開**：在 YouTube 做了 15 集 devlog。【搜尋摘錄】 <https://news.hada.io/topic?id=24963>
- **他在台上的七條規則**（2026-09 Three.js Conf Paris 的閉幕演講）：動畫、流暢、一個招牌互動、快速迭代、娛樂性、把聲音當功能、開工前先找靈感。ICS MEDIA 的報導還提到兩個數字：點擊／hover 的回饋要在 0.3 秒內出現；掉到 30 fps，使用者就會失去沉浸感。【搜尋摘錄】 <https://ics.media/en/entry/260925/>、<https://muz.li/blog/threejs-conf-paris-2026/>、<https://tympanus.net/codrops/2026/09/10/inside-the-first-three-js-conference-in-paris/>

**值得借的。**用一次點擊同時做到揭幕、解鎖聲音和交出控制權。觸控控制畫在角色腳下。訪客留言放在留言者當時的位置、做成 instanced 物件，走近才顯示。設定有上限、有淡入淡出。環境音訂閱世界狀態。

---

## 3. Abeto — 《Messenger》（小行星送信遊戲）

**是什麼。**2025-09-25 推出的免費瀏覽器遊戲。你扮演一個小孩，在一顆很小的星球上送信、認識居民，可以用 emoji 和其他真人玩家打招呼。開發者是 Vicente Lucendo 和 Michael Sungaila，lo-fi 配樂是 Kevin Colombin。【搜尋摘錄】 <https://en.wikipedia.org/wiki/Messenger_(video_game)>、<https://aftermath.site/messenger-browser-game-abeto/> 一篇評論說十五分鐘玩得完。【搜尋摘錄】 <https://bo3.gg/games/articles/messenger-abeto-co-crafted-interactive-experiences-the-free-browser-game-you-can-finish-in-15-minutes> 上過 Hacker News 首頁，標題是「A WebGL game where you deliver messages on a tiny planet」。【搜尋摘錄】 <https://brianlovin.com/hn/45396441>

**怎麼做的。**
- 前端用 three.js。Lucendo 說設計目標是營造一種「混合陌生感與平靜」的氛圍，靈感來自某些亞洲國家；另一個目標是做出能支撐大型共享多人空間的技術。他也說同時在線人數其實可以做到數百甚至上千。【搜尋摘錄】 <https://www.commarts.com/webpicks/messenger>
- **為什麼是小星球**：他們不想要隱形邊界，所以做成球體，一直直走就會繞世界一圈。【搜尋摘錄，同上】
- **給不玩遊戲的人**：團隊希望不熟悉遊戲的人也能輕鬆移動，**看到自己的爸媽玩得沒問題**，是他們最開心的時刻之一。【搜尋摘錄，同上】
- 視覺是 cel-shading，被拿來和 Jet Set Radio 比較；可以在手機上玩，使用 WebGL2。【搜尋摘錄】 <https://boingboing.net/2025/10/27/messenger-is-the-coolest-browser-game-ive-ever-played.html>、<https://fortcade.com/game/messenger/>
- 社群整理的技術組合有 three-mesh-bvh、Houdini、Blender、Substance、WebSocket/Node.js 多人連線；整包約 5.7 MB 的說法出自社群貼文，**未查證**。【搜尋摘錄】 <https://nbaradar.github.io/the-latent-space/Notes-+-Research/Philosophy-+-Sociology/Messenger---Web-Browser-Game>、<https://x.com/zeuuss_01/status/2066949488682639703>
- Lucendo 在 Three.js Conf Paris 的演講題目是「From 3D to Feeling」，內容是《Messenger》的製作過程，**先講構圖和聲音，才講程式**。【搜尋摘錄】 <https://threejs.paris/schedule>、<https://muz.li/blog/threejs-conf-paris-2026/>、<https://ics.media/en/entry/260925/> 演講全文沒有找到。

**值得借的。**世界小、走得完、沒有隱形牆。用「爸媽玩不玩得來」當可用性標準。輕量的社交互動（emoji 揮手）比複雜的多人功能更溫暖。

---

## 4. Abeto（與 Bureaux）— Igloo Inc 官網

**是什麼。**Pudgy Penguins 母公司的形象網站，拿下 Awwwards 2024 Site of the Year 和 Developer Site of the Year。評審稱讚它把沉浸式 3D 和容易操作的捲動導覽結合在一起。【搜尋摘錄】 <https://www.awwwards.com/annual-awards-2024/site-of-the-year>

**怎麼做的。**
- 技術組合：Three.js、three-mesh-bvh、Svelte、GSAP、Vite、vanilla JS；聲音在 DaVinci Resolve 裡製作。【搜尋摘錄，出自 Awwwards case study】 <https://awwwards.com/igloo-inc-case-study.html>
- 原本打算每個專案都用同一個冰塊，但原型測試發現捲動經過時太像，所以改成每個冰塊各有自己的設計。他們寫了一個模擬冰晶在容器內生長的程序生成演算法，從立方體或圓柱等基本形狀開始長。【搜尋摘錄，同上】 <https://webgpu.com/showcase/igloo-inc-procedural-crystals/>
- 第三方整理說，包含 UI 文字在內全部都在 WebGL 裡畫；整站是一個冰凍場景，鏡頭隨捲動穿過；頁尾的粒子使用從 VDB 轉來的體積資料。【搜尋摘錄】 <https://webgpu.com/showcase/igloo-inc-procedural-crystals/>

**值得借的。**用原型測試「捲過去時看起來會不會都一樣」。每段要有一個辨識度高、彼此不同的主物件。捲動導覽的操作要簡單。

---

## 5. Lusion — Oryzo 與工作室作品

**是什麼。**Lusion 是英國的 WebGL 工作室。Oryzo（oryzo.ai）是他們做了一年的內部專案，替一個軟木杯墊編出一場「高級產品發表」，並寫成七篇幕後系列。【搜尋摘錄】 <https://blog.lusion.co/oryzo-bts-part-1-7-concept-and-creative-direction>

**怎麼做的。**
- 第一篇說他們**優先考慮連續性，而不是炫技瞬間**：即使版面和 3D 構圖差很多，場景之間的轉場也要盡量無縫，這讓 RWD 和轉場設計變得更難。【搜尋摘錄，同上】
- 第二篇說場景主要在 Houdini 裡搭建、用 Redshift 渲染，然後拆成多個 Gaussian splat 在網頁裡合成。他們一開始照網站的鏡頭路徑去渲染，結果品質變差，後來改成從 Houdini 匯出相機資料，經 COLMAP 送進 Postshot。【搜尋摘錄】 <https://blog.lusion.co/oryzo-bts-part-2-7-3d-design-and-motion-graphics>
- 更早的工作室官網 case study 說，他們用 Node.js 寫了自己的網站產生器，網站是純靜態的。【搜尋摘錄】 <https://awwwards.com/case-study-for-lusion-by-lusion-winner-of-site-of-the-month-may.html>
- Lusion 的 Edan Kwan 在 Three.js Conf 講的是「一串組合得好的便宜技巧」，muz.li 把它和 Merci-Michel 的演講一起歸為「克制」。【搜尋摘錄】 <https://muz.li/blog/threejs-conf-paris-2026/>
- 第四篇「WebGL/ThreeJS Tricks」在搜尋時還沒有上線，**未查證**。

**值得借的。**連續性比單點特效重要。便宜的技巧組合得好，勝過一個昂貴的效果。靜態網站也可以做到頂級作品。

---

## 6. Merci-Michel — Coastal World 與「不必看起來像 3D」

**是什麼。**法國工作室，作品包括 Red Bull、Microsoft 365、Hermès 的互動世界。Coastal World 是為 Coastal Community Bank 做的 3D 網頁平台，用任務推進，任務裡有小遊戲，完成後解鎖配件，**進度會保存**，下次回來還在同一個狀態。【搜尋摘錄】 <https://gang-website-2024.web.app/works/coastal-bank-coastal-world>

**怎麼做的。**
- Antoine Ménard 在 Three.js Conf 介紹他們的流程：很早就做原型，實驗構圖和互動，**圍繞體驗去建世界**。他說「real-time 3D doesn't have to look like 3D」，3D 可以是一種舞台手法，在使用者周圍搭出一個世界。【搜尋摘錄】 <https://tympanus.net/codrops/2026/09/10/inside-the-first-three-js-conference-in-paris/>、<https://muz.li/blog/threejs-conf-paris-2026/>
- Coastal World 用的引擎和技術組合，我在搜尋結果裡**沒有找到原始出處**。

**值得借的。**先做體驗原型，再蓋世界。保存進度讓人願意回來。風格化比寫實更能承載情緒。

---

## 7. Active Theory — Hydra 引擎與跨裝置調校

**是什麼。**洛杉磯的老牌 WebGL 工作室，有自己的框架和 Hydra 3D 引擎，也做虛擬活動平台 Dreamwave。

**怎麼做的。**
- 他們自建 Hydra 來取代工作流程裡的 three.js，取代 Electron 的則是 Aura，目的是榨出裝置效能。文章點名瀏覽器的兩個主要成本：WebGL 轉 OpenGL 時的安全檢查，以及 WebGL canvas 和周圍 HTML 的合成。【搜尋摘錄】 <https://medium.com/active-theory/the-story-of-technology-built-at-active-theory-5d17ae0e3fb4>
- Mira 專案：同一個粒子體驗要跑在網頁、原生 App、Apple TV 和 Kinect 上。Hydra 會自動處理桌機滑鼠和觸控的差異，團隊再依裝置能力和效能，在辦公室的各種測試機上逐一調整。【搜尋摘錄】 <https://medium.com/@activetheory/mira-exploring-the-potential-of-the-future-web-e1f7f326d58e>
- Dreamwave 的虛擬活動可以在多種裝置上一鍵進入；一場 Porter Robinson 領銜的線上音樂節有 162,000 名不重複訪客。【搜尋摘錄】 <https://www.mux.com/case-studies/active-theory>、<https://www.casestudies.com/company/mux/case-study/how-active-theory-builds-living-digital-festivals-with-muxs-video-infrastructure>

**值得借的。**準備一個真機測試櫃。輸入抽象層要統一處理滑鼠和觸控。少讓 HTML 疊在 WebGL canvas 上面。

---

## 8. The New York Times —「The Quest to Restore Notre Dame's Glorious Sound」

**是什麼。**用 3D 視覺加互動聲景重建大火前的聖母院聲響，拿下 Online Journalism Award 的沉浸式與新興技術敘事獎。【搜尋摘錄】 <https://awards.journalists.org/entries/a-cathedral-of-sound/>

**怎麼做的。**
- 建築師團隊協助圖像編輯，從照片和精細掃描做出一個**準確但極簡**的模型。編輯說「We didn't want to create a photorealistic model」，只把棋盤格大理石地板這類關鍵特徵的材質修細。【搜尋摘錄】 <https://www.storybench.org/how-the-new-york-times-used-space-and-sound-to-revive-notre-dame-after-the-fire/>
- 聲學研究者在火災前做過的量測，讓他們能在虛擬模型裡做出一條連續的路徑。視覺加空間音訊非常吃資源，還出了意想不到的 bug，**最後放棄原本「室內自由漫遊」的目標，改成限制較多的鏡頭路徑**。【搜尋摘錄，同上】 <https://www.storybench.org/?p=22115>
- 自製的 ambisonic 空間音訊播放器：**讀者捲動時，聲音會依虛擬鏡頭的朝向改變**。【搜尋摘錄】 <https://awards.journalists.org/entries/a-cathedral-of-sound/>
- three.js 有沒有被使用：只有社群在 three.js 論壇上的觀察（指的是 2019 年的另一篇圖解），NYT 沒有官方說法，**未查證**。 <https://discourse.threejs.org/t/new-york-times-notre-dame-visualization/7144>

**值得借的。**敘事型 3D 要勇敢收窄鏡頭。極簡模型只保留記憶點。聲音跟著鏡頭的方向走。

---

## 9. NYT R&D — 攝影測量與「空間敘事」

**是什麼。**NYT R&D 實驗室和圖像部門用攝影測量（photogrammetry）把真實場景掃成 3D，讓讀者在報導裡穿行；他們也發表了用手機拍攝做攝影測量和用 glTF 發布 3D 的指南。【搜尋摘錄】 <https://www.niemanlab.org/reading/how-the-new-york-times-uses-photogrammetry-to-allow-readers-to-experience-journalistic-scenes-in-3d/>、<https://www.khronos.org/news/permalink/new-york-times-rd-lab-offers-guides-to-photogrammetry-and-3d-publishing-using-gltf>

**怎麼做的。**
- 一旦空間被 3D 化，編輯就能從任何角度呈現它，並且**決定讀者怎麼穿過它**。展示案例是讀者一邊捲動、鏡頭一邊飛過 3D 環境。【搜尋摘錄】 <https://www.niemanlab.org/reading/how-the-new-york-times-uses-photogrammetry-to-allow-readers-to-experience-journalistic-scenes-in-3d/>、<https://theanimatedweb.com/inspiration/reconstructing-journalistic-scenes-in-3d/>
- 他們發展出可以在突發新聞時程內使用的拍攝方法和流程。【搜尋摘錄】 <https://www.nikokoppel.com/1>、<https://justin.work/work/documenting-the-world-in-3d-7tdgn>
- 視覺記者 Anjali Singhvi 是建築師出身，推薦用 Blender 建模和做動畫，曾用它重建敘利亞化學攻擊的現場（Emmy 獲獎作品「One Building, One Bomb」）。【搜尋摘錄】 <https://brackets.substack.com/p/the-architect-in-the-newsroom>
- SIGGRAPH 有一場「Spatial Storytelling in the Newsroom」演講，講三篇使用電腦視覺、空間音訊和 3D tiles 的報導。【搜尋摘錄，同上頁所引】

**值得借的。**真實照片可以掃成 3D 物件，例如用手機掃一個舊招牌或一台機車。由編者決定動線。

---

## 10. neal.fun — Internet Artifacts、The Deep Sea

**是什麼。**Neal Agarwal 的個人網站，他靠網站的廣告收入全職做這些小玩具。【搜尋摘錄】 <https://en.wikipedia.org/wiki/Neal_Agarwal> 《Internet Artifacts》（2023-10）是一座「網路博物館」，從 1977 年依時間排列，展出第一個笑臉、最初的 Yahoo、Numa Numa 等，很多網站都重建成可以互動的版本。【搜尋摘錄】 <https://waxy.org/?p=47826>、<https://www.smithsonianmag.com/smart-news/you-can-now-visit-a-museum-about-the-history-of-the-internet-on-the-internet-180983197/>、<https://www.mentalfloss.com/culture/internet/internet-artifacts-online-museum> 《The Deep Sea》是一頁往下捲到海底的作品，生物放在牠們通常出現的深度，沿途有小知識。【搜尋摘錄】 <https://www.creativebloq.com/news/deep-sea-visualisation>、<https://engagetheirminds.com/2022/09/15/the-deep-sea/>

**怎麼做的。**
- 他在 Glitch 的訪談說，會先做一個能動的最小版本來測點子，再決定要不要投入。也常遇到點子在大螢幕上成立、到手機上不成立（或反過來），只好轉向。【搜尋摘錄】 <https://blog.glitch.com/post/neal-agarwal-is-keeping-the-weird-web-alive/>
- 技術組合在搜尋結果裡**沒有查到**。

**值得借的。**「按時間排列的懷舊博物館」和可以互動的重建，正好對應我們的四十年街道。每一頁只做一個動作。手機和桌機要分別驗證點子是否成立。

---

## 11. 房間型 diorama 作品集（Questopia、Henry Heffernan）

**是什麼。**用 three.js 做成可以點、可以看的小房間作品集，是「可探索的小場景」最常見的形式。

**怎麼做的。**
- **Questopia（GlintonLiao）**：光影全部在 Blender 裡烘焙成貼圖，場景裡沒有即時光。日、夜各烘一套貼圖，用自訂 `ShaderMaterial` 的 `uNightMix` 混合；螢幕、檯燈、書架燈各佔光照圖的一個色版，各有自己的強度 uniform。因為鏡頭活動範圍有限，看不到的面（書背、床底）都刪掉，**模型從 18 MB 降到 3 MB**。【原始碼 README】 <https://github.com/GlintonLiao/questopia>
- **Henry Heffernan**：一台 3D 的老電腦，螢幕裡是另一個 repo 做的 2D 作業系統。從構想到上線約 10 週，最難的是讓圖形元素對齊瀏覽器裡的 3D 模型，鏡頭動畫用了 React-Spring。【搜尋摘錄】 <https://awesome.ecosyste.ms/projects/github.com%2Fhenryjeff%2Fportfolio-website> repo 本身只確認用 Express 提供正式版建置。【原始碼 README】 <https://github.com/henryjeff/portfolio-website>

**值得借的。**用烘焙加日夜混合，取代每幀重畫的即時陰影。刪掉鏡頭永遠看不到的面。3D 外殼裡放一個 2D 介面，例如公布欄打開後就是一張可以讀的 DOM 紙張。

---

## 12. M+ — NEONSIGNS.HK（群眾投稿的城市記憶地圖）

**是什麼。**香港 M+ 博物館在還沒有建築物的時候做的線上專案（2014-03-21 至 06-30）。市民上傳霓虹招牌的照片和故事，釘在「Neon Map」上。三個月收到超過 4,000 張照片，策展人說成果超出預期。【搜尋摘錄】 <https://www.e-flux.com/announcements/31211/mobile-m-neonsigns-hk>、<https://www.core77.com/posts/27306/4000-photos-and-more-hightlighting-hong-kongs-iconic-neon-sign-culture-27306>、<https://mplus.org.hk/en/magazine/collecting-neon-signs-from-hong-kongs-streets>

**怎麼做的。**
- 投稿有兩條路：在網站上傳，或在 Instagram 貼文加上 `#HKNEON` 和地點。M+ 的理由是霓虹「embedded within the fabric of Hong Kong」，所以最好的研究方法就是問市民。【搜尋摘錄】 <https://www.e-flux.com/announcements/31211/mobile-m-neonsigns-hk>、<https://www.dcfever.com/news/readnews.php?id=10817>
- 地圖平台和審核流程**未查證**。上線前一篇部落格描述的是 Google Maps 加霓虹色標記，但沒辦法確認上線版本是不是如此。 <https://googlemapsmania.blogspot.com/2014/03/neon-maps.html>

**值得借的。**投稿門檻降到「用你已經在用的工具」。每則記憶要綁定一個地點。用「要消失的城市元素」當號召。

---

## 給 Our Memory in Taipei 的啟示

1. **把英文歡迎卡換成「一次點擊揭幕」，同時解鎖音樂。**（Bruno folio-2025 `Reveal.js`／`Audio.js`）現在手機預設靜音，歡迎卡只出現一次而且是英文。改成一進廣場就是暮色中的大樹公剪影，加一行中文「點一下，回到那條街」。點下去的那一刻做三件事：從榕樹往外擴一圈光，把廣場「畫」出來；初始化音樂和環境音；把控制權交給女孩。再仿照 `#skip` 加一個 `?skip` 給測試用。這同時解決三個問題：英文門檻、手機沒有聲音、開場沒有儀式感。

2. **記憶燈籠照 Whispers 重做：instanced、放在投稿位置、走近才顯示、設上限。**（Bruno folio-2025 `Whispers.js`）現在每筆記憶是 5–6 個 mesh 加一張 canvas 貼圖，上限 500 筆。改成一個 `InstancedMesh`，畫燈籠本體加光暈，年份字只在走到約 3 單位內時用一個共用的 DOM 泡泡顯示。新燈籠用 GSAP 式的淡入，配一聲輕輕的點燈音效，記住投稿時女孩的位置，讓燈籠掛在她當時站的地方。同時亮著的燈籠可以設上限（例如每段 30 盞，輪替顯示），維持「稀有感」和效能。另外可以加一道自動預審（Bruno 用 OpenAI 的免費 moderation 模型），減輕人工核准的負擔。

3. **觸控操作改成「畫在女孩腳下的光環」，並把「E」換成點擊。**（Bruno `Nipple.js`、《Messenger》「爸媽也能玩」）右下 118 px 的搖桿和泡泡上的「E」鍵帽，對手機使用者都不直覺。改成：手指按在畫面上，就在女孩腳下的地面投出一圈暖色光環，方向和推出量照 Nipple 的「內圈 tap、外圈全速」來做；在內圈點一下等於「互動」（讀燈籠、換卡拉OK歌）。驗收標準直接借 Abeto：找家裡長輩試玩，不用講解就能走到公布欄。

4. **加環境音，而且跟場景狀態連動。**（Bruno `Audio.js`、Bruno 的規則「sound as a feature」、NYT 聖母院依鏡頭朝向改變的空間音訊）HANDOFF 明寫「no sound effects」，這是目前和頂尖作品差距最大的一項。可以用 Howler 或 WebAudio 做幾個位置音源：土地公廟的鐘和誦經、象棋落子、老人茶的杯子、香腸攤的油聲、遠處機車、鴿子。依距離淡出，音量很小時直接靜音。每段街各有底噪：西門町是戲院人聲，大稻埕是年貨大街的叫賣和鞭炮，信義是捷運和人潮。視窗失焦就暫停。靜音設定存到 `localStorage`。這和 YouTube 歌曲分開，所以就算歌被擋或插廣告，場景也不會一片安靜。

5. **走路模式用「觸發區」找回敘事節拍。**（Bruno `Zones.js`、NYT 收窄鏡頭、Lusion「連續性優先」）現在走路模式把大字全藏起來，101 的高潮可能看不到。可以在每段街放幾個 `enter` 一次性觸發區：走到某個點，畫面浮出那一句大字（「We grow older」等），並且只觸發一次。走到信義段盡頭時，暫時把鏡頭從女孩身上接走，沿一條預先寫好的路徑往上拉到 101 頂端看男人揮手，再交回控制權。NYT 的經驗是：敘事最強的那一刻，寧可用固定鏡頭。

6. **畫質分級做成「事件」，第一步先砍陰影和樹冠。**（Bruno `Quality.js`、Bruno 2019 的 pixel ratio 和物理睡眠、Active Theory 的真機測試、Bruno「掉到 30 fps 就失去沉浸」）照 Quality.js 的做法，手機預設 low 並發出 `change` 事件，讓各模組自己降級：陰影圖從每幀重畫改成只在時代或黃昏係數改變時重畫（或乾脆烘焙進頂點色），榕樹葉片卡在手機上再減半，關掉 alphaTest 的陰影 pass，卡拉OK 螢幕從每 0.12 秒重畫改成每 0.5 秒。之後再加「連續兩秒低於 30 fps 就自動降一級」。最重要的是借 Active Theory：至少用一台舊 iPhone 和一台中階 Android 實測（`00-current-state.md` 第 7 點指出目前從來沒有在真機上量過）。

7. **離線壓縮資產，網站本身照樣維持「無 build step」。**（Bruno folio-2025 `npm run compress`、Questopia 刪看不到的面、Bruno 2019 的 Draco）gltf-transform 可以當成一次性的命令列工具，在 Blender 匯出後跑一次，把 glb 轉成 meshopt 或 Draco 加 KTX2，產出的檔案直接放進 repo，GitHub Pages 和 Vercel 不需要任何建置。專案已經載入 `meshopt_decoder.js`，可以直接用。建模時也照 Questopia 的做法，刪掉走廊外側和屋頂背面這些鏡頭永遠看不到的面。

8. **把「時代」和「黃昏」做成可調的 preset 關鍵影格。**（Bruno `DayCycles.js`）現在三個時代的霧、光、色調散在 `app.js` 和 `WALK.dusk`。可以仿照 DayCycles：每個時代定義一組 preset（光色、光強、霧的兩個顏色和遠近、陰影色、招牌發光量），用 0–1 的 progress 插值；再定義具名區間（例如 `newYear`、`neonOn`），讓音效（鞭炮、霓虹的嗡嗡聲）和燈籠訂閱。加一個網址參數把 progress 固定在某個值，方便截圖比對。這也替將來升級 three.js、改用 TSL 先鋪好路，不用再全域改寫 shader chunk。

9. **讓世界「走得完、沒有隱形牆」，並且記住訪客走過哪裡。**（《Messenger》的小星球、Merci-Michel Coastal World 會保存進度）現在三段街是左右 ±8.4 的封閉走廊。不一定要做成球，但可以讓三段街的盡頭接回廣場，形成一個環。用騎樓柱、攤車、機車陣這些「看得見的理由」擋住邊界，取代看不見的牆。再用 `localStorage` 記住去過哪幾道門、讀過幾盞燈籠，回到廣場時三道門上的小燈對應亮起，提供「我還有哪裡沒去」的動機。

10. **公布欄做成「依年份排列的記憶博物館」，並開第二條投稿管道。**（neal.fun《Internet Artifacts》、M+ NEONSIGNS.HK）公布欄目前只貼最新 8 筆。可以改成按年份 1985 → 2027 排的軟木板，點一下就展開成一張 DOM 紙張（Henry Heffernan「3D 外殼加 2D 介面」的做法），每則記憶都能「帶我去那裡」，讓女孩傳送到那盞燈籠旁邊。投稿參考 M+：除了站內表單，再提供一個 Instagram／Threads hashtag（例如 `#我們的台北記憶`），由製作者手動匯入。M+ 三個月收到 4,000 張的經驗顯示，「城市正在消失的東西」本身就有號召力，而西門町中華商場、舊招牌正是這種題材。

> 風格方面（Merci-Michel「real-time 3D doesn't have to look like 3D」、NYT「We didn't want to create a photorealistic model」、Lusion「便宜的技巧組合得好」）：這些頂尖團隊都在為「風格化、不寫實」背書。現在的低多邊形粉彩路線不必改，資源應該優先投在聲音、上手和效能，而不是更寫實的模型。
