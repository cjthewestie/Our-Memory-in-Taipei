# 類似作品研究與改進報告：《Our Memory in Taipei》

2026-11-03。這份是「類似作品研究」的總結，把 7 份章節檔濃縮成一份可以照著做的改進計畫。

| 章節 | 內容 |
|---|---|
| [00 現況盤點](00-current-state.md) | 我們自己的專案現在長什麼樣子（commit `c7f8e02`，行號對應此版本） |
| [01 網頁 3D 敘事](01-web-3d-narrative.md) | Bruno Simon 兩代作品集、Abeto《Messenger》與 Igloo Inc、Lusion、Merci-Michel、Active Theory、NYT、neal.fun、M+ NEONSIGNS.HK |
| [02 懷舊與記憶類遊戲](02-memory-games.md) | Edith Finch、Unpacking、Florence、Before Your Eyes、A Short Hike、Old Man's Journey、Venba、Gone Home、Kind Words、Shenmue、ぼくのなつやすみ、還願、Dordogne |
| [03 集體記憶與共創平台](03-collective-memory.md) | 國家文化記憶庫、香港記憶、irememberSG、OldNYC、sMapshot、Historypin、City of Memory、Fremantle Map of Memories、Queering the Map、Museum of Broken Relationships、HONY、Kind Words、Cities and Memory、Before I Die、Unsent Project |
| [04 歷史城市重建](04-historical-cities.md) | Rome Reborn、AC Discovery Tour、Unity 聖母院與 Paris 3D、Venice／Amsterdam Time Machine、OldNYC、Smapshot、Historypin、JuxtaposeJS、中研院臺北百年歷史地圖、《天橋上的魔術師》、九龍城寨、Foreseen Property Agency、Gwulo |
| [05 three.js 渲染與效能](05-threejs-craft.md) | folio-2025 原始碼、Messenger、three-mesh-bvh、ecctrl、烘焙光照、meshopt／KTX2、Migration Guide、Codrops、Utsubo、Guilty Gear Xrd、Wolfire、A Short Hike、量測工具、Web Audio |
| [06 台灣與東亞在地懷舊](06-taiwan-nostalgia.md) | 返校（遊戲與電影）、還願、天橋上的魔術師、俗女養成記、廖添丁、港詭實錄、Shenmue、人中之龍 0、綾部和夏休み系列、昭和情景模型、鄭開翔、張哲生、台灣招牌字體與霓虹 |

> **證據等級，請先讀。**這次研究的雲端環境只能直接讀 `github.com`／`raw.githubusercontent.com`。標「原始碼直讀」的內容（主要是 Bruno Simon folio-2025、three-mesh-bvh、meshoptimizer、three.js Migration Guide）是逐行讀過的；其他內容都來自 WebSearch 的摘要與節錄，沒有讀過原文全文，各章已逐條標明。本報告沒有做新的網路研究，所有說法都可以回溯到章節檔裡的來源。標「推算」的是從程式碼推出、還沒有實際跑過驗證的結論。

### 讀前小詞彙

- **draw call**：CPU 請 GPU「畫一次東西」。手機上這個次數越少越順，一般建議每幀約 100 次以內。
- **P95**：把最近 100 幀的耗時排序，第 95 慢的那一幀。它比平均值更能反映「偶爾卡一下」。
- **texel**：貼圖或陰影圖上的一個像素。
- **render target（離屏畫面）**：先畫到一張看不見的圖上，處理完（例如加描邊、色調）再貼到螢幕。
- **InstancedMesh／instance 矩陣**：同一個形狀一次畫很多份，每一份只記自己的位置、旋轉、大小（這組數字叫矩陣）。
- **光源空間**：從太陽的方向看過去的座標系。陰影圖是在這個座標系裡算的。
- **RLS（列級安全）**：資料庫規則，決定訪客能讀、能寫哪幾列。我們目前的規則是訪客只讀得到「已核准」的列。
- **SECURITY DEFINER**：讓資料庫函式用建立者的權限執行，所以它看得到訪客看不到的列（例如還在審核中的投稿）。

「◐」「○」「●」的意思見第 4 節表格上方的說明。

---

## 1. 摘要：五個最重要的結論

1. **我們和同類作品差最多的，是「聲音」和「進門的那一分鐘」，而且兩件都不用升級引擎。**
   - 聲音：Bruno Simon 的環境音跟著日夜、天氣和距離變化，視窗失焦就靜音（[01§2](01-web-3d-narrative.md)、[05§1](05-threejs-craft.md)，原始碼直讀）；《還願》用台灣田野錄音加 foley 打底（[06§2](06-taiwan-nostalgia.md)）；Unpacking 有一萬四千個音效（[02§2](02-memory-games.md)）。我們只有 YouTube 歌，而且會插廣告（[00 B.24](00-current-state.md)）。
   - 進門：Bruno 用一次點擊同時揭幕、解鎖聲音、交出控制權（原始碼直讀）。我們的入口是英文歡迎卡，泡泡上還印著觸控使用者看不懂的「E」鍵帽（[00 A.14、B.17](00-current-state.md)）。
   - 要注意：手機預設靜音是 CJ 已經定下的規則（`music.js:85-92`），所以我們的「進門」要讓訪客自己選「有聲音」或「安靜」，不能一點就放出聲音（見第 5 節第 3 項）。
   - 「不玩遊戲的人也能上手」目前只有搜尋摘錄等級的旁證：《Messenger》團隊說看到爸媽玩得沒問題很開心、Venba 有很多 YouTuber 和媽媽一起玩（[01§3](01-web-3d-narrative.md)、[02§7](02-memory-games.md)，都是搜尋摘錄，未查證原文）。真正的證據要靠我們自己找長輩來試。

2. **作品的核心承諾「大家的記憶」還沒有成立；同類平台都說明，審核和提示語要先設計好。**
   - 現況：正式站的 Supabase 設定是空的，每位訪客只看得到 2 盞種子燈籠（[00 C.32](00-current-state.md)）。
   - 審核：Fremantle Map of Memories 和我們幾乎是同一款，它在送出前就講明「先審後發」；Queering the Map 是爆紅被攻擊之後才補上審核；Kind Words 說最大的審核難題是「善意的離題」（[03§8、§9、§12](03-collective-memory.md)）。
   - 提示語：會讓人寫出好故事的，都是具體的填空，例如 Before I Die 和 HONY（[03§11、§14](03-collective-memory.md)）。
   - 所以先把系統接上線、做好防灌爆和審核清單、改寫提示語，比做任何新玩法都重要。

3. **走路模式需要敘事結構，不然最強的情緒弧線只存在於很少人會看的導覽裡。**
   - 現況：走路模式把大字全部藏起來，而 101 的高潮推算起來在走路模式裡看不到（[00 B.19–22](00-current-state.md)）。
   - 同類作品的三種做法：AC Discovery Tour 用顯眼的「站點」串起自由漫遊（[04§2](04-historical-cities.md)）；Bruno 的 `Zones.js` 只在進出時觸發事件（[01§2](01-web-3d-narrative.md)）；NYT 的聖母院在最重要的時刻放棄自由漫遊，改用固定鏡頭（[01§8](01-web-3d-narrative.md)）。

4. **「40 年」要靠同一件東西的變化來說，而不是三組不相干的佈景。**
   - 同類作品：《還願》讓同一間公寓出現在四個年份，只換擺設，值錢的東西逐年消失；Unpacking 讓物品隨年紀改變，也留下一些舊物；人中之龍 0 用「少了一棟地標」標出 1988 年；張哲生拿老照片回原地重拍做今昔對照（[06§2、§9、§13](06-taiwan-nostalgia.md)、[02§2](02-memory-games.md)）。
   - 現況：女孩 40 年都是小孩，三段街各自封閉，廣場在「時間之外」，1985 年的招牌也用電腦黑體（[00 B.21、B.30](00-current-state.md)、[06§14](06-taiwan-nostalgia.md)）。這些都可以改。

5. **技術上留在 three.js r149、不加 build step；先在真手機上量，再優化。**
   - 為什麼不升級：r159 以上才有 BatchedMesh、新版 three-mesh-bvh 和 `compileAsync`；超過 r160 必須改成 ES modules；r152 和 r155 的色彩管理與光照單位改動，會讓所有手調的顏色和曝光失準（[05§7](05-threejs-craft.md)，Migration Guide 直讀）。
   - 可以照做的：folio-2025 的手機對策在 r149 裡都做得到：只分兩級畫質、手機陰影圖 512、陰影框跟著「最佳區域」移動（[05§1](05-threejs-craft.md)，原始碼直讀）。Bruno 原本寫了把位置取整的程式，但那幾行已經註解掉、沒有啟用；要消除陰影閃爍，我們得自己在光源空間做對齊（第 5 節第 7 項）。
   - 先量測：我們從來沒有在真手機上量過（[00 A.7](00-current-state.md)），所以第一步是量測。

   風格與定位：NYT 說「We didn't want to create a photorealistic model」（[01§8](01-web-3d-narrative.md)，Storybench 摘錄，已查證有此句）；Merci-Michel 也說「real-time 3D doesn't have to look like 3D」（[01§6](01-web-3d-narrative.md)，Codrops 摘錄，未查證原文）。兩者都支持我們的粉彩低多邊形路線。04 章也查到，一個可以自由走動的 1985–1999 西門町網頁 3D 街景，在公開網路上幾乎找不到（[04 附記](04-historical-cities.md)），這是我們的定位優勢。

---

## 2. 同類作品總覽

挑出跟本專案最相關的 30 件作品。「怎麼做」只寫章節檔裡有證據的部分。

| 作品 | 類型 | 最強的地方 | 怎麼做（重點） | 詳見 |
|---|---|---|---|---|
| Bruno Simon folio-2025 | 網頁 3D 探索作品集 | 一次點擊揭幕；聲音是主要功能；手機也順 | three r183 + TSL/WebGPU、Rapier、Howler、Vite；`Reveal`／`Quality`（兩級）／`Zones`／`DayCycles`／`Audio`／`Whispers` 模組；手機陰影 512、陰影框跟著鏡頭前的「最佳區域」走（取整的程式碼已註解停用）；KTX2 壓縮（原始碼直讀） | [01§2](01-web-3d-narrative.md)、[05§1](05-threejs-craft.md) |
| Bruno Simon folio-2019 | 網頁 3D 開車 | 用第一次碰撞教會玩法 | three + Cannon；簡化碰撞形狀；物理物件要睡眠；Draco；`#debug` | [01§1](01-web-3d-narrative.md) |
| Abeto《Messenger》 | 瀏覽器小星球走路遊戲 | 沒有隱形牆；不玩遊戲的人也能上手 | three.js + three-mesh-bvh，沒有遊戲引擎；Houdini／Blender；WebSocket 多人；四到五個月 | [01§3](01-web-3d-narrative.md)、[05§2](05-threejs-craft.md) |
| Igloo Inc | 捲動 3D 形象網站 | 捲動導覽好操作，每段主物件都不同 | three + three-mesh-bvh + Svelte + GSAP；原型測試後讓每個冰塊各自設計 | [01§4](01-web-3d-narrative.md) |
| Lusion Oryzo | WebGL 品牌敘事 | 連續性比炫技重要 | Houdini 渲染後拆成 Gaussian splat；靜態網站產生器 | [01§5](01-web-3d-narrative.md) |
| Merci-Michel Coastal World | 3D 網頁世界 | 風格化舞台；會保存進度 | 先做體驗原型，再圍繞體驗蓋世界 | [01§6](01-web-3d-narrative.md) |
| NYT 聖母院之聲 | 新聞 3D + 空間音訊 | 敢於收窄鏡頭；聲音跟著鏡頭朝向 | 極簡模型；放棄自由漫遊，改用捲動路徑；自製 ambisonic 播放器 | [01§8](01-web-3d-narrative.md) |
| neal.fun Internet Artifacts | 依時間排列的網路博物館 | 懷舊展品可以直接互動 | 先做最小可動版本；手機和桌機分別驗證 | [01§10](01-web-3d-narrative.md) |
| Questopia | three.js 房間 diorama | 烘焙光影加日夜混合 | Blender 烘兩套貼圖，用 `uNightMix` 混合；刪掉看不到的面（18→3 MB） | [01§11](01-web-3d-narrative.md) |
| M+ NEONSIGNS.HK | 群眾霓虹地圖 | 三個月收到超過 4,000 張照片 | 網站上傳，或 Instagram `#HKNEON` 加地點 | [01§12](01-web-3d-narrative.md) |
| What Remains of Edith Finch | 敘事遊戲 | 一段記憶一種操作 | 13 個以上原型、約 30 種操作方式，不需要教學 | [02§1](02-memory-games.md) |
| Unpacking | 物件敘事遊戲 | 靠物品講完一生 | 出箱順序、物品隨年紀改變、保留舊物；1.4 萬個音效，依「物件 × 表面」分類 | [02§2](02-memory-games.md) |
| Before Your Eyes | 眨眼控制敘事 | 時間跳躍前先給預告 | 節拍器出現時眨眼才會跳，避免速通 | [02§4](02-memory-games.md) |
| A Short Hike | 小型開放世界 | 小範圍靠密度；低解析度本身就是風格 | 先渲染到小 render texture 再放大；可調像素大小；配樂依位置分層 | [02§5](02-memory-games.md)、[05§12](05-threejs-craft.md) |
| Old Man's Journey | 2D/3D 旅行遊戲 | 「坐下」就觸發回憶 | 回憶是休息時才播放的動畫場景 | [02§6](02-memory-games.md) |
| Venba | 移民家庭料理遊戲 | 年代音樂放進場景裡的收音機 | 料理 1:1 重現自家經驗；不評分 | [02§7](02-memory-games.md) |
| Gone Home | 環境敘事 | 平凡的紙類物件講時代 | 不能動的限制（整個家不放鞋） | [02§8](02-memory-games.md) |
| Kind Words | 匿名互助信 | 沒有按讚，回應像儀式 | 審內容不審人；花大量時間做審核後台；回禮是貼紙，貼紙會變成房間裡的物件 | [02§9](02-memory-games.md)、[03§12](03-collective-memory.md) |
| Shenmue | 1986 年橫須賀開放城鎮 | NPC 有作息；天氣照史實 | 訪談還在世的居民；1986 年天氣資料 | [02§10](02-memory-games.md)、[06§8](06-taiwan-nostalgia.md) |
| 還願 Devotion | 1980 年代台北公寓 | 同一空間 × 多個年份；在地物件清單 | 南機場公寓取材、成員家中老照片；台灣田野錄音加新加坡棚內 foley | [02§12](02-memory-games.md)、[06§2](06-taiwan-nostalgia.md) |
| 返校 Detention | 1960 年代校園 2D 遊戲 | 文化元素壓成一眼就懂的物件 | 拼貼風格源於人力限制；神桌就是存檔點；老三台黃色字幕 | [06§1](06-taiwan-nostalgia.md) |
| 天橋上的魔術師 | 中華商場實景片廠 | 雜亂是資產，但要整理顏色 | 照原方位在汐止搭景；比對老照片；招牌因商標權改字 | [04§11](04-historical-cities.md)、[06§4](06-taiwan-nostalgia.md) |
| 人中之龍 0 | 1988 年神室町 | 用「少了地標」標示年代 | 1988 年沒有 Millennium Tower | [06§9](06-taiwan-nostalgia.md) |
| 綾部和 夏休み系列 | 小學生的懷舊夏天 | 卡通角色 × 懷舊背景 | 先畫精確的 2D 地圖當骨架 | [02§11](02-memory-games.md)、[06§10](06-taiwan-nostalgia.md) |
| AC Discovery Tour | 遊戲改成的博物館 | 自由漫遊加上顯眼的站點 | 站點 + 旁白 + 卡片，由角色擔任導覽員 | [04§2](04-historical-cities.md) |
| Rome Reborn | 學術城市重建 | 誠實區分「確定」和「推測」 | 選資料最多的年份當錨點；推測部分用程序化生成 | [04§1](04-historical-cities.md) |
| OldNYC | 老照片地圖 | 點一個地方，看到那裡所有年代 | 路口文字地理編碼、OCR；接受不完美的定位 | [03§4](03-collective-memory.md)、[04§6](04-historical-cities.md) |
| Smapshot / Historypin | 照片定位與古今疊圖 | 站在老照片的攝影機位置上 | 六自由度相機還原；淡入淡出疊圖 | [04§7、§8](04-historical-cities.md) |
| Fremantle Map of Memories | 市政府記憶地圖 | 和我們同一款，而且把審核講白 | pin + 短文 + 選填照片，先審後發 | [03§8](03-collective-memory.md) |
| Museum of Broken Relationships | 物件 + 匿名故事 | 固定的展品標籤格式 | 標題／地點／時長／故事；線上版可以「鎖起來」不公開 | [03§10](03-collective-memory.md) |
| Before I Die / HONY | 參與式牆面／街頭人像 | 一句具體的填空就是最強的提示 | 固定開頭模板；「What is your biggest challenge right now?」 | [03§11、§14](03-collective-memory.md) |

---

## 3. 他們怎麼做：跨作品的共同模式

### 3.1 上手與操作

- **入口只給一個動作。**folio-2025 的 `Reveal.js`：載入完成後畫面上只有「click to start」。點下去的那一刻才初始化音訊、播放揭幕音效、讓光圈擴到蓋滿整個場景，然後把輸入切成 `wandering`。另外有 `#skip` 給測試用（[01§2](01-web-3d-narrative.md)，原始碼直讀 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Reveal.js>）。
- **控制做在世界裡，不放在螢幕角落。**folio-2025 的 `Nipple.js` 把手指位置投射到地面，在車子周圍畫一圈光環；在內圈點一下算 tap；手指推離中心越遠走越快，推到 4.5 就是全速（[01§2](01-web-3d-narrative.md)，<https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Inputs/Nipple.js>）。
- **用第一個動作教會玩法。**folio-2019 讓玩家第一下就撞到標題字（[01§1](01-web-3d-narrative.md)）。Edith Finch 約 30 種操作都不需要教學（[02§1](02-memory-games.md)）。
- **以不玩遊戲的人為標準。**《Messenger》團隊說，看到自己的爸媽玩得沒問題，是他們最開心的時刻之一（[01§3](01-web-3d-narrative.md)，<https://www.commarts.com/webpicks/messenger>；**搜尋摘錄，未查證原文**：commarts 在本環境連不上，抽查時 WebSearch 也找不到這句）。Venba 有很多 YouTuber 是和媽媽一起玩的（[02§7](02-memory-games.md)，Game Daily 搜尋摘錄）。兩者都只是方向性的旁證。
- **統一的輸入抽象層，加上真機測試。**Active Theory 的 Hydra 自動處理滑鼠和觸控的差異，團隊在各種測試機上逐一調整（[01§7](01-web-3d-narrative.md)）。
- **讓訪客先找到「自己的那一格」。**中研院《臺北歷史地圖散步》的團隊觀察到，讀者拿到書和 App 的第一步，是先找自己家在哪裡（[04§10](04-historical-cities.md)）。

### 3.2 世界建構與環境敘事

- **小但完整，邊界要看得見。**《Messenger》做成球體，就是為了不要有隱形牆（[01§3](01-web-3d-narrative.md)、[05§2](05-threejs-craft.md)）。A Short Hike 靠密度而不是面積（[02§5](02-memory-games.md)）。
- **用物件說話，並且明確寫下不做什麼。**Gone Home 定下「整部作品只有環境敘事」的限制，時間不夠時整個家都不放鞋（[02§8](02-memory-games.md)）。Unpacking 先訂出 contemplation、discovery、expression 三個支柱，再用減法砍功能（[02§2](02-memory-games.md)）。
- **在地物件清單，只取淺層。**還願的磨石子、紅鐵門、大同電鍋、明星花露水（[02§12](02-memory-games.md)、[06§2](06-taiwan-nostalgia.md)）。返校的製作人說，太複雜的文化元素會「將玩家推開」，所以把元素壓成符號，神桌同時是存檔點（[06§1](06-taiwan-nostalgia.md)）。
- **雜亂要整理顏色，招牌要照年代考據。**《天橋上的魔術師》發現雜亂感本身就是時代特色，但要整理色彩；招牌因商標權改了字（[06§4](06-taiwan-nostalgia.md)）。昭和模型「懐かしの銀座」照當年的設計重製招牌（[06§11](06-taiwan-nostalgia.md)）。justfont 和鄭開翔都說招牌字是時代記憶，手寫字有個性（[06§12、§14](06-taiwan-nostalgia.md)）。
- **沒有人就是空殼。**PC Gamer 評九龍城寨 Minecraft 時說，最缺的是住在那裡的人（[04§12](04-historical-cities.md)）。Shenmue 的 NPC 有作息（[02§10](02-memory-games.md)）。
- **先畫地圖當骨架，地標照真實的相對位置排。**綾部和先做精確的 2D 地圖；《廖添丁》依實景的相對位置做關卡（[06§6、§10](06-taiwan-nostalgia.md)）。

### 3.3 情緒與節奏

- **一段記憶一種互動，而且不分輸贏。**Edith Finch（[02§1](02-memory-games.md)）。Florence 不把它們叫謎題，改叫 interactions，強調「not about 'winning'」（[02§3](02-memory-games.md)）。Dordogne 說「The game will never punish you」（[02§13](02-memory-games.md)）。
- **停下來才回憶。**Old Man's Journey 的回憶只在老人坐下休息時播放（[02§6](02-memory-games.md)）。綾部和最喜歡的一刻是晚上大家在簷廊一起讀繪本（[02§11](02-memory-games.md)）。
- **時間跳躍要先預告，而且不能被速通。**Before Your Eyes 加了節拍器（[02§4](02-memory-games.md)）。
- **敘事的高潮寧可收窄鏡頭。**NYT 聖母院（[01§8](01-web-3d-narrative.md)）。Lusion 把連續性放在炫技之前（[01§5](01-web-3d-narrative.md)）。
- **自由漫遊和策展路線要接起來。**AC Discovery Tour 的站點在地圖上非常顯眼（[04§2](04-historical-cities.md)）。City of Memory 有串好的故事路線「tour」（[03§7](03-collective-memory.md)）。

### 3.4 集體記憶與使用者共創

- **提示語是具體的填空。**Before I Die 的「Before I die I want to ____」、HONY 的「What is your biggest challenge right now?」、Unsent Project 的「給初戀的訊息 + 一個顏色」（[03§11、§14、§15](03-collective-memory.md)）。國家文化記憶庫用「圖 → 脈絡 → 回憶」三層描述引導上傳（[03§1](03-collective-memory.md)，摘要，待查證）。
- **固定的展示格式。**Museum of Broken Relationships 每件展品只有標題、地點、關係持續多久、故事（[03§10](03-collective-memory.md)）。
- **策展內容和使用者內容混著放。**City of Memory 約一半來自策展人（[03§7](03-collective-memory.md)）。Cities and Memory 的創辦人自己錄了大量種子錄音（[03§13](03-collective-memory.md)）。
- **先審後發，把審核講白，並且先想好被灌爆時怎麼辦。**Fremantle 在頁面上寫明送出的內容會先審核（[03§8](03-collective-memory.md)）。Queering the Map 遭到攻擊後才補上審核，檢查項目包含「是否洩漏匿名性」（[03§9](03-collective-memory.md)）。sMapshot 由系統先擋、再交給人看（[03§5](03-collective-memory.md)）。Kind Words 承認人工審核擴不大（[03§12](03-collective-memory.md)）。
- **留言是場景裡的物件，放在當下的位置，走近才看得到。**folio-2025 的 Whispers：送出時記下玩家位置，每則留言是 `InstancedMesh` 裡的一個實例，走到 3 單位內才浮出文字（[01§2](01-web-3d-narrative.md)，原始碼直讀 <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/World/Whispers.js>）。「同時最多 30 則、新的擠掉舊的」和「用 OpenAI moderation 審核」出自 Awwwards 案例的搜尋摘錄（<https://www.awwwards.com/brunos-portfolio-case-study.html>），不在這支原始碼裡：原始碼裡的數量是可設定的環境變數 `VITE_WHISPERS_COUNT`，前端也沒有呼叫 moderation（審核在沒有公開的伺服器端）。
- **回應不計數。**Kind Words 沒有追蹤者也沒有按讚，只有貼紙（[02§9](02-memory-games.md)、[03§12](03-collective-memory.md)）。
- **讓年輕人去問長輩；讓人可以寫下但不公開。**irememberSG 的「The Greatest Gift of a Generation」鼓勵年輕人訪問長輩（[03§3](03-collective-memory.md)）。Brokenships 可以把故事「鎖起來」不公開（[03§10](03-collective-memory.md)）。
- **每則記憶要有時間和地點兩個座標，而且讀得懂。**OldNYC 從路口文字定位照片（[03§4](03-collective-memory.md)、[04§6](04-historical-cities.md)）。M+ 要求投稿加上地點（[01§12](01-web-3d-narrative.md)）。

### 3.5 年代轉場與老照片

- **一個空間 × 多個年份。**還願的同一間公寓、電影《返校》同一座校園的三種狀態（[06§2、§3](06-taiwan-nostalgia.md)）。Venice Time Machine 讓每棟建築都有開始年和結束年（[04§4](04-historical-cities.md)）。
- **用「拿掉」標年代。**人中之龍 0（[06§9](06-taiwan-nostalgia.md)）。
- **選一個錨點年，並且誠實標示哪些是推測的。**Rome Reborn 選公元 320 年，因為那一年的資料最多；推測的部分用程序化生成（[04§1](04-historical-cities.md)）。Unity 的聖母院刻意放上 1789 年還不存在的尖塔，因為大眾記憶裡有它（[04§3](04-historical-cities.md)）。
- **把照片放回它的時空座標。**Smapshot 還原拍攝時的相機姿態；Historypin 把老照片和現場淡入淡出；JuxtaposeJS 的每張圖都有年份標籤和 credit，而且提醒 credit 有 XSS 風險；張哲生做了 500 組以上的今昔對照（[04§7–9](04-historical-cities.md)、[06§13](06-taiwan-nostalgia.md)）。

### 3.6 渲染與效能

- **先量再改。**folio-2025 用 `#stats` 顯示 draw call（CPU 請 GPU 畫一次的次數）等數字（[05§1](05-threejs-craft.md)）；Utsubo 建議手機每幀約 100 個 draw call（[05§9](05-threejs-craft.md)）；Lucendo 說掉到 30 fps 就失去沉浸感（[05§2](05-threejs-craft.md)）。
- **兩級畫質，用事件讓各模組自己降級。**folio-2025 的 `Quality.js` 用一行 UA 判斷（[05§1](05-threejs-craft.md)，原始碼直讀）。
- **陰影只照玩家附近。**手機陰影圖 512、陰影框跟著鏡頭前的「最佳區域」移動（變數叫 `optimalRoundedPosition`，但取整的那幾行已經註解掉，實際沒有取整）；高 DPR 螢幕不開 MSAA（[05§1](05-threejs-craft.md)，原始碼直讀 `Ligthing.js`、`Rendering.js`）。
- **亮暗由美術決定。**folio-2025 葉叢的亮暗兩色用 `smoothstep` 混合；Guilty Gear Xrd 的「表面不是亮就是暗」（[05§1、§10](05-threejs-craft.md)）。
- **烘焙、圖集、減少貼圖數量。**Three.js Journey 的 Portal scene、Questopia 的日夜貼圖、Codrops 的圖集與半 texel 內縮（[05§5、§8](05-threejs-craft.md)、[01§11](01-web-3d-narrative.md)）。
- **降低內部解析度可以是一種風格。**A Short Hike（[05§12](05-threejs-craft.md)）。
- **碰撞不一定要物理引擎。**three-mesh-bvh 的膠囊推出 + 沿牆滑動 + 5 個子步 + delta 上限 0.1（[05§3](05-threejs-craft.md)，原始碼直讀）。

### 3.7 聲音

- **聲音是功能，要等使用者操作才解鎖，失焦就靜音，靜音設定要記住。**folio-2025 `Audio.js`（[01§2](01-web-3d-narrative.md)、[05§1](05-threejs-craft.md)，原始碼直讀）。MDN 的 autoplay 規則（[05§14](05-threejs-craft.md)）。
- **環境音訂閱世界狀態，有位置的聲音依距離衰減。**folio-2025 晚上有蟋蟀、`deepNight` 開始時有狼嚎，營火聲用 `remapClamp` 線性淡出（[01§2](01-web-3d-narrative.md)）。NYT 的聲音隨鏡頭朝向改變（[01§8](01-web-3d-narrative.md)）。A Short Hike 的配樂依位置分層（[02§5](02-memory-games.md)）。
- **foley 依「物件 × 表面」分類，在地錄音打底。**Unpacking 從估計的 75K 個 foley 降到 15K 以下（[02§2](02-memory-games.md)）。還願用台灣田野錄音（[06§2](06-taiwan-nostalgia.md)）。《廖添丁》用台語和唸歌（[06§6](06-taiwan-nostalgia.md)）。
- **音樂放進場景裡。**Venba 的收音機；Florence 一個角色一種樂器（[02§3、§7](02-memory-games.md)）。

---

## 4. 我們的現況對照

依 [00-current-state.md](00-current-state.md)。評分標準：

- 「●」：已經做到同類作品的水準。
- 「◐」：有做，但只做到一部分；或是刻意做了不同的選擇（會在現況欄註明）。
- 「○」：還沒有做。

| 模式 | 現況 | 評 | 主要證據 |
|---|---|---|---|
| 一次點擊揭幕、解鎖聲音 | 英文歡迎卡只出現一次，沒有揭幕；手機預設靜音是 CJ 刻意的決定（Fault 4），一碰聲音開關就會出聲 | ◐（靜音是刻意的決定） | `walk.js:206-242`、`music.js:85-92,268` |
| 操作做在世界裡、適合觸控 | 右下 118 px 搖桿；泡泡本身是按鈕、點了就能用，但印著「E」鍵帽、點擊範圍小、文字是英文；點燈籠和拖曳已用 6 px／500 ms 分開 | ◐ | `walk.css:70-79`、`memories.js:132-136,280-283`、`square.js:900-917` |
| 爸媽也能上手（中文） | `<html lang="en">`，介面以英文為主 | ○ | `index.html:2` |
| 小而完整、邊界看得見 | 廣場有牆，物件用圓形障礙物推開；街段是左右 ±8.4 的隱形邊界 | ◐ | `walk.js:36`、`walk.js:395-416` |
| 在地物件、考據 | 建築有出處、照片有授權，西門段有鐵窗、室外機、頂樓加蓋；但沒有「家」的物件 | ◐ | `scene-red.js:339-448`、[06 對照表](06-taiwan-nostalgia.md) |
| 時代正確的招牌字 | 1985 年的招牌也用系統黑體；1989 年畫面出現 NOKIA，因為 2000s 資產組全程開著（是否切換在等 CJ 決定） | ○ | `scene-red.js:12,383`、`asset/3d/assets-ximen-2000s.js:258`、`HANDOFF.md` |
| 有人在過日子 | 廣場的人只在原地擺動；街上是方塊人群；沒有作息 | ◐ | `square.js:877-883` |
| 走路模式的敘事節拍 | 大字全部隱藏；101 高潮推算看不到；廣場沒有地圖或門口指引 | ○ | `walk.css:8`、`app.js:1548-1549`、`walk.js:420,448` |
| 同一事物跨年代 | 只有信義那塊地在前兩個時代是稻田；女孩永遠是小孩 | ◐ | `scene-tower.js`、`app.js:803-900` |
| 老照片放回時空座標 | 8 個熱點彈出平面面板；交界疊印是為捲動設計的 | ◐ | `photos.js:140-226`、`app.js:1280-1293` |
| 記憶系統上線 | Supabase 設定是空的 | ○ | `memories-config.js:14-15` |
| 提示語、展示格式 | 只有一個開放問題；年份不受所在時代限制 | ○ | `memories.js:216-240` |
| 審核與防濫用 | 只能在後台手動改 `status`；防護全在前端；照片 bucket 任何人都能上傳 | ○ | `docs/MEMORIES.md`、`supabase/schema.sql:42-50` |
| 留言是 instanced、走近才顯示、有上限 | 每盞 6 個以上 mesh 加 1 個 sprite 光暈；貼圖依「年份 × 種類」快取共用，不是每盞一張；上限 500；走近 4.5 單位出現泡泡 | ◐ | `square.js:104-147`、`memories.js:24,83` |
| 不計數的回應、依年代逛 | 只能讀；公布欄只貼最新 8 筆；投稿後沒有回執或自己燈籠的連結 | ○ | `memories.js:70`、`memories.js:171-181` |
| 量測 | 只有桌機 100 Hz 的數字，沒有手機紀錄，沒有 `renderer.info` | ○ | `HANDOFF.md`、`app.js:1596-1604` |
| 畫質分級 | 手機只降 pixel ratio 到 1.5、陰影到 1024；陰影框固定 120 單位 | ◐ | `app.js:174,224-228` |
| 風格化 + 暖機 | 粉彩低多邊形、自訂霧與色調、頂點 AO、`renderer.compile` 暖機、meshopt glb | ● | `app.js:82-195,1511-1518`、`models.js` |
| 環境音、foley | 沒有；只有 YouTube 歌，而且會插廣告 | ○ | `HANDOFF.md`、`music.js:31-36` |
| 音樂在場景裡 | 卡拉OK 會播年代歌曲，人會跟著搖 | ◐ | `square.js:899-939` |

**一句話：**畫面和考據已經接近同類作品的水準，但「進門、聲音、記憶系統、走路時的敘事」這四件同類作品最重視的事，我們大多還是空的。其中手機預設靜音是 CJ 刻意的決定，改進方向是讓訪客自己選擇開聲音，而不是改掉這個預設。

---

## 5. 改進報告

排序原則：(1) 先修「核心承諾」和「第一分鐘」；(2) 不升級 three.js、不加 build step，所有東西都要能在 GitHub Pages／Vercel 靜態託管、在手機上跑；(3) 先量測再優化；(4) 每一項都要對得上同類作品的證據；(5) CJ 已經定下的規則（例如手機預設靜音）照舊，要動的話寫成「請 CJ 決定」。工時以一位熟悉這份程式碼的人估算，單位是「人日」。

**項目編號是固定代號，不代表先後**：為了讓各項互相引用時不亂掉，調整順序時沒有重新編號。實際的先後請看各階段裡的排列，以及本節最後的「優先順序一覽」。

### 立即（幾天內）

#### 1. 讓記憶系統真的上線，並加上伺服器端的防護和緊急開關
- **改什麼：**建立 Supabase 專案並填入 `memories-config.js`。補上四件事：
  - **由前端產生記憶的 id。**現在的 RLS 只讓訪客讀 `status='approved'` 的列，所以 insert 之後用 `Prefer: return=representation` 讀不回剛寫入的 pending 列，會被 RLS 擋下；`grant insert` 也不包含 `id`。改成前端用 `crypto.randomUUID()` 產生 id，把 `id` 加進 `grant insert (...)`，insert 時用 `Prefer: return=minimal`，照片檔名固定為 `<記憶 id>.webp`、`photo_path` 一起寫進去。
  - **照片只能掛在一筆還在審核中的記憶上。**storage 的上傳 policy 呼叫一個 `SECURITY DEFINER` 函式（例如 `memory_photo_ok(name)`），確認檔名裡的 id 對得上一筆存在、仍是 pending、而且還沒有照片的記憶。因為訪客的權限看不到 pending 列，這個函式一定要是 `SECURITY DEFINER`，並用 `set search_path = public, pg_temp` 固定搜尋路徑。這樣照片 bucket 不會變成免費圖床，也不會留下孤兒檔。（更嚴的做法是照片先放 private 的 pending bucket，核准時再搬到公開 bucket；代價是核准流程多一步。）
  - **資料庫端限流。**加一個 `before insert` trigger：全站每分鐘最多 N 筆 pending、內容和最近的投稿重複就拒絕；可以再用 `current_setting('request.headers', true)` 取得請求標頭做粗略的每來源限流。這個 trigger 函式同樣要設成 `SECURITY DEFINER` 並固定 `search_path`，否則它受 RLS 影響，數 pending 筆數、比對重複內容時都會數到 0。
  - **緊急開關。**在 `memories-config.js` 加 `submissionsOpen: true` 旗標，讓作者可以一鍵關閉投稿。
  - 另外加一個 GitHub Actions 排程，每幾天對 REST 端點打一次 `select`，避免免費方案因為沒有活動而被暫停。這是 repo 裡的排程，不是網站的 build step。
- **為什麼不先用 Turnstile：**`docs/MEMORIES.md` 已經寫下「被灌爆時的下一步是 Cloudflare Turnstile」。但 Turnstile 的 token 必須在伺服器端用密鑰驗證，等於要多一個 Supabase Edge Function（伺服器程式）。資料庫 trigger 不需要新的伺服器元件，所以先做 trigger；真的被灌爆時，再照 `docs/MEMORIES.md` 加 Turnstile 和 Edge Function。
- **為什麼：**Queering the Map 是被攻擊之後才補審核（[03§9](03-collective-memory.md)）；sMapshot 讓系統先擋、人再看（[03§5](03-collective-memory.md)）；Kind Words 把審核當成核心工作來做（[02§9](02-memory-games.md)）。目前的防護全在前端（[00 C.38–39](00-current-state.md)）。
- **在哪裡：**`memories-config.js`、`supabase/schema.sql`（`grant insert` 加 `id`、新增 trigger、兩個 `SECURITY DEFINER` 函式、storage policy）、`memories.js` 的 `submit()`（約 106–126 行，改成先產生 id、寫資料列、再上傳照片）與 `openForm()`（關閉投稿時顯示說明）、新增 `.github/workflows/keepalive.yml`、更新 `docs/MEMORIES.md`。
- **工時：**2–3 人日。
- **怎麼算成功：**兩台不同裝置互相看得到對方已核准的燈籠；用 curl 直接打 REST 灌 50 筆，第 N+1 筆被拒；檔名對不上任何 pending 記憶的照片上傳會失敗，同一筆記憶傳第二張也會失敗；把旗標關掉後，表單顯示「暫停收件」。
- **風險：**PostgREST 拿到的來源 IP 可能是代理的位址，限流可能誤傷同一網路的人，所以門檻要寬鬆；前端產生 id 代表訪客可以自己挑 id，所以 id 欄位要是 `uuid` 型別、重複時 insert 直接失敗；`SECURITY DEFINER` 函式要只回傳 true／false，不能把 pending 內容帶出去。

#### 2. 加上 `?stats=1`，並在真手機上做第一次量測
- **改什麼：**畫面角落顯示 `renderer.info.render.calls`（draw call 數）、`triangles`、`memory.textures`、`programs.length`，以及最近 120 幀耗時的中位數與 P95。在廣場中心、三段街的中段、信義段的盡頭各量一次，用一台舊 iPhone 和一台中階 Android，結果寫進 `HANDOFF.md`。
- **為什麼：**folio-2025 用 `#stats`；Utsubo 建議手機約 100 個 draw call；Active Theory 有真機測試櫃；Lucendo 說 30 fps 是沉浸感的底線（[05§1、§2、§9、§13](05-threejs-craft.md)、[01§7](01-web-3d-narrative.md)）。目前從來沒有手機數字（[00 A.7](00-current-state.md)）。
- **在哪裡：**`app.js` 的 `frame()`（1522 行起），可以和現有的 `window.__fog` 探針（1596–1604 行）放在一起；新增一小段 DOM 疊層。
- **工時：**1 人日（量測另需半天）。
- **怎麼算成功：**`HANDOFF.md` 有一張「位置 × 裝置 × draw calls／P95」的表，並訂出預算（建議先訂 P95 ≤ 33 ms，也就是最慢的那 5% 幀也維持在 30 fps 左右）。後面的效能項目都拿這張表當基準。
- **風險：**Android 用 `chrome://inspect`、iPhone 用 Mac Safari 遠端除錯都需要實體裝置和線（[05§13](05-threejs-craft.md) 註明這是一般做法，沒有另找來源）。

#### 3. 介面改成中文優先，入口改成「一次點擊揭幕」，並讓訪客自己選要不要聲音
- **先講清楚 CJ 的既定規則：**手機每次進站都從靜音開始，存下來的設定在手機上不採用（`music.js:85-92` 的 Fault 4：「手機幫我default msuic off」；註解寫明「a page that starts a phone's speaker on the first swipe is the thing this rule exists to stop」）。這一項不改這條規則。
- **改什麼：**
  - `<html lang="zh-Hant">`。歡迎卡、按鈕、表單、提示都改成中文主、英文副。
  - 第一次和之後的每次進站，都先停在暮色中的大樹公剪影，畫面上只有一行「回到那條街」和兩個一樣大的選項：「有聲音進入」和「安靜進入」。
  - 兩個選項都會讓 `WALK.dusk` 或一個光圈 uniform 從榕樹向外擴、把輸入交給女孩。只有「有聲音進入」會呼叫 `music.js` 的 `setMuted(false)`（以及替之後的環境音解鎖）；「安靜進入」維持靜音，聲音開關留在原位，之後隨時可以打開。這和 `music.js:268` 現有的「Click for sound means sound」是同一個邏輯：明確按下「要聲音」才出聲。
  - 「Guided tour」改成第三個、比較小的選項。
  - 加上 `?skip` 給測試用。
- **為什麼：**folio-2025 的 `Reveal.js` 和 `Audio.js` 都要等使用者操作才初始化（[01§2](01-web-3d-narrative.md)，原始碼直讀）；目標觀眾是記得台北的人，很多是長輩（[00 B.17](00-current-state.md)）。
- **在哪裡：**`index.html`；`walk.js` 的 `showWelcome()`、`closeWelcome()`、`startWalk()`（206–242、315 行），以及 173–174 行的面板文字；`memories.js` 的表單字串；`music.js` 的 `setMuted()`（258 行）和 `gesture()`（218 行）。
- **工時：**2 人日。
- **怎麼算成功：**請一位不玩遊戲的長輩在不講解的情況下進站：30 秒內開始走路；選了「安靜進入」的人，之後能自己找到並打開聲音。
- **風險：**`font-display: block`（`style.css:10-15`）會讓中文在字型下載完之前看不見，入口的那一行字應該改用系統字，或把字型設成 `swap`。兩個選項並排時，「安靜進入」不能做得比較小或比較淡，否則等於繞過 CJ 的規則；這個版面請 CJ 看過再定。

#### 4. 觸控提示：拿掉「E」鍵帽、改成「點一下」、放大點擊範圍
- **現況其實比原先描述的好：**燈籠泡泡和卡拉OK 泡泡本來就是 `<button>`，有 click handler，點下去就能讀或換歌（`memories.js:132-136`、`square.js:900-917`）；`walk.js:171` 已經有 `touch` 變數，用來切換提示文字；點燈籠和拖曳轉鏡頭也已經用 6 px／500 ms 的門檻分開（`memories.js:280-283`），泡泡是 DOM 元素，不會觸發 canvas 的拖曳。真正缺的只有三件：E 鍵帽、點擊範圍、中文。
- **改什麼：**沿用 `walk.js` 現有的 `touch` 判斷（不要再新增一套），在 touch 為真時隱藏 `.mem-b-key`，換成「點一下」；把泡泡的點擊範圍放到 44 px 以上；提示文字改中文。
- **為什麼：**Bruno 的 Nipple 在內圈點一下就算互動（[01§2](01-web-3d-narrative.md)）；Active Theory 統一處理觸控輸入（[01§7](01-web-3d-narrative.md)）。
- **在哪裡：**`memories.js:135`（燈籠泡泡的鍵帽）、`square.js:902`（卡拉OK 泡泡）、`walk.js:171-175`（`touch` 與提示文字）、`walk.css`。
- **工時：**0.5 人日。
- **怎麼算成功：**在 390×844 的實機上，泡泡上沒有「E」，不用鍵盤就能讀燈籠、換歌、打開公布欄。
- **風險：**同時有觸控和滑鼠的筆電會被判成其中一種，所以兩種提示都要能用。如果之後實測發現手勢互搶，再另外列一項，不在這裡預設有問題。

#### 5. 重寫投稿表單：按段落的填空提示、講明審核、年份跟著所在時代、標明是誰的記憶、手機鍵盤不擋表單
- **改什麼：**
  - 提示語依 `WALK.where` 換成具體的填空，例如西門町「你第一次自己去西門町，是去……」、大稻埕「那年過年，家裡……」、信義「你在 101 下面等誰？」、廣場「那年在這裡，我……」。
  - 加一個「這是誰的記憶：我的／爸媽的／阿公阿嬤的」選項，旁邊一句「回家問問他們」。
  - 年份的預設值和可選範圍，鎖在所在段落的 `YEARS` 內；廣場維持 1950 年起。
  - 送出前寫明「作者會先讀過，才會掛上街」，以及「不要寫出別人的全名或聯絡方式」。
  - 補上一段隱私說明：收集什麼、放在哪、怎麼要求下架。也寫出照片會經 canvas 重新編碼，所以會去掉 EXIF 定位資訊。
  - 手機鍵盤：用 `visualViewport` 的 `resize` 事件調整表單位置，讓輸入框和送出鈕留在鍵盤上方；表單套用 `env(safe-area-inset-*)` 避開瀏海和底部橫條（[00 A.16](00-current-state.md)）。
- **為什麼：**Before I Die、HONY 的具體提示（[03§11、§14](03-collective-memory.md)）；Fremantle 把審核講白（[03§8](03-collective-memory.md)）；irememberSG 讓年輕人訪問長輩（[03§3](03-collective-memory.md)）；Queering the Map 會審「有沒有洩漏身分」（[03§9](03-collective-memory.md)）；現況的年份錯置問題（[00 B.27](00-current-state.md)）、個資告知的缺口（[00 C.40](00-current-state.md)），以及表單是固定定位、沒處理鍵盤彈出（[00 A.16](00-current-state.md)）。投稿是核心承諾，手機上送不出去等於沒有。
- **在哪裡：**`memories.js` 的 `openForm()`（216 行）、表單 DOM（190–240 行）、`YEARS`（26 行）、`fetchApproved()` 的 select 欄位清單（`memories.js:83`，要加上 `whose`，否則新欄位讀不回來）；表單的 CSS。`schema.sql` 新增 `whose text check (whose in ('me','parents','grandparents'))`，並在 `grant insert (...)` 裡加上這個欄位。
- **工時：**2 人日。
- **怎麼算成功：**站在信義段打開表單時，年份預設是 2020 年代，不能選 1962；試用者能說出「送出以後要等作者看過」；在 iPhone 上鍵盤彈出時，送出鈕看得到。上線一個月後，比較新舊提示收到的平均字數和離題比例。
- **風險：**提示太具體會限制某些人想寫的東西，所以保留「或者，寫你想寫的」這個出口。

#### 6. 寫 8–10 則作者的種子記憶，讓公布欄一開始就不空
- **改什麼：**`SEEDS` 從 2 則擴充到 8–10 則，每段 2–3 則，示範好的寫法（一句標題、具體的年份和地點、第一人稱），並標明是作者寫的。內容可以從家中長輩的口述來（見第 24 項）。
- **為什麼：**City of Memory 大約一半內容來自策展人；Cities and Memory 先自己錄種子；空的公布欄不會有人寫（[03§7、§13](03-collective-memory.md)）。目前公布欄寫著「Leave the first memory here」（[00 C.32](00-current-state.md)）。
- **在哪裡：**`memories.js` 的 `SEEDS`（30–35 行）。
- **工時：**0.5 人日寫程式，內容另計。
- **怎麼算成功：**第一次來的訪客打開公布欄就看到 8 則以上；之後收到的投稿，在長度和格式上接近種子記憶。
- **風險：**種子寫得太完美，反而會讓人不敢寫。最好長短都有，有一則只寫一句話。

### 短期（1–2 週）

#### 9. 走路模式的「站點」：一次性觸發區找回大字；信義段結尾接手鏡頭看 101；廣場的門口指引
- **改什麼：**
  - 每段街放 3 個站點，地上一圈淡光加一個小標。走進去時（只在進入時觸發一次），浮出 `DATA` 裡那一段的大字，配合音樂淡入，3–4 秒後收起。
  - 信義段的盡頭加一個「結尾站」，在 `walk.js` 加一個 `st.cutscene` 狀態：
    - 進行時跳過 `walk.js:418-420` 每幀用 `uAtZ(st.z+18)` 重算 `WALK.u` 的那段（不然直接改的值下一幀就被蓋掉）。
    - 把 `WALK.u` 從目前的值補間到 `BOUNDS[2] + 0.98 × (1 − BOUNDS[2])`。注意 `CLIMB_TOP = 0.93`（`app.js:370`）是信義章節內的比例，不是整條路的 progress；上面的式子換算後，章節比例約 0.98，超過 `CLIMB_TOP`，男人會登頂揮手。
    - 鏡頭沿一條寫好的曲線從女孩身後抬到 101 頂端。
    - progress 推近 1 時，`closingParts` 的結尾句會依 progress 淡入（`app.js:1560`）。這是刻意的：結尾句就讓它跟著這個鏡頭一起出現，不另外寫一套。
    - 最後把控制權交回來，`st.cutscene` 結束後恢復 `uAtZ` 的計算。
  - 廣場的門口指引：三道門上方各掛一個看得見的門牌（「往西門町 1985–1999」等），地上用燈籠或地磚排出通往門口的動線；或在角落放一張可點開的小地圖。這是 [00 B.18](00-current-state.md) 指出的缺口，AC Discovery Tour 的「站點顯眼」原則同樣適用在廣場，不只街段。
  - 已經觸發過的站點存在 `localStorage`（只是方便，不可靠也沒關係）。
- **為什麼：**folio-2025 `Zones.js` 只在 enter／leave 時發事件（[01§2](01-web-3d-narrative.md)）；AC Discovery Tour 的站點很顯眼（[04§2](04-historical-cities.md)）；NYT 在高潮處收窄鏡頭（[01§8](01-web-3d-narrative.md)）。這一項同時解決 [00 B.18、B.19、B.20、B.22](00-current-state.md)，也是摘要第 3 點的主要對策，所以排在短期的第一個。
- **在哪裡：**`walk.js` 的 `update()`（街段的分支，404–421 行）加觸發區判斷和 `st.cutscene`；`app.js` 的 `updateWords(u)`（982 行）要能在走路模式下被呼叫，`walk.css:8` 對大字的隱藏要改成由 class 控制；`updateMan(u)`（375 行）讀的是同一個 progress，不用改；文字內容放在 `data.js`；廣場門牌放在 `square.js`。
- **工時：**4–5 人日。
- **怎麼算成功：**只走路、從不捲動的訪客，也能看到全部 9 句大字裡的至少 6 句，並看到男人揮手和結尾句（這是 [00 B.22](00-current-state.md) 要求的實測）；第一次進廣場的試用者，不用說明就能說出三道門各通往哪裡。
- **風險：**大字擋住走路的視線，所以要放在畫面上方、短時間顯示；結尾接手鏡頭要可以點一下跳過，跳過時 `WALK.u` 要回到女孩位置對應的值。

#### 8. 環境音層和腳步聲（不靠 YouTube）
- **改什麼：**新增 `ambience.js`，用 Web Audio：一個 `AudioContext`，每個聲源一個 `GainNode`。
  - 廣場有位置的聲源：蟬聲、象棋落子、茶杯、土地公廟的磬、香腸攤的油聲、鴿子。
  - 每段街有一層底噪：西門町是戲院人潮和叫賣，大稻埕是年貨大街和遠處鞭炮，信義是捷運和人潮。全台都認得的垃圾車音樂可以當彩蛋。
  - 腳步聲分三種地面：紅磚、磨石子騎樓、柏油，依 `WALK.where` 和位置切換，步頻跟著 `poseGirl` 的 gait。
  - 音量依距離線性遞減：在範圍外是 0、貼近聲源是 1（folio-2025 用 `remapClamp` 做這件事），太小就 mute；每次播放隨機 0.9–1.1 的速率；`visibilitychange` 時淡出。
  - 靜音沿用 `music.js` 現在的規則，不另外存一份：手機每次都從靜音開始，不讀 `localStorage`；桌機才採用存下來的選擇。做法是讓 `ambience.js` 訂閱 `music.js` 的 `setMuted()`，兩個模組共用同一個開關狀態。
  - 素材用 CC0 或自己錄的，壓成 48–64 kbps 的 Opus 或 AAC，總量控制在 1.5 MB 內。
- **為什麼：**folio-2025 `Audio.js`、Bruno 的「sound as a feature」（[01§2](01-web-3d-narrative.md)、[05§1](05-threejs-craft.md)）；Unpacking 的「物件 × 表面」分類（[02§2](02-memory-games.md)）；還願的田野錄音（[06§2](06-taiwan-nostalgia.md)）；現況完全沒有環境音（[00 B.24](00-current-state.md)）。手機預設靜音是 CJ 的規則（`music.js:85-92`，見第 3 項）。
- **在哪裡：**新檔 `ambience.js`，在 `index.html` 裡排在 `music.js` 之後；解鎖掛在第 3 項的「有聲音進入」和聲音開關上；`walk.js` 的 `update()` 每幀把女孩位置交給它；`square.js` 匯出聲源的座標；`music.js` 匯出一個靜音狀態的訂閱點。
- **工時：**4–5 人日（找素材和混音占一半）。
- **怎麼算成功：**關掉音樂後，廣場仍然「聽得出是廟口」；試用者在第 3 項的長輩測試裡打開聲音後，主動提到環境音；手機上沒有破音，也不會掉幀；手機重新整理後仍然是靜音。
- **風險：**iOS 的靜音開關會讓 Web Audio 沒有聲音，要在 UI 上提示；素材授權要列進 credits。

#### 10. 兩級畫質，加上低內部解析度和動態解析度
- **改什麼：**建立 `window.QUALITY = { level, on('change') }`。手機預設 level 1。level 1 的內容：
  - 離屏 render target 以 0.65–0.75 倍解析度渲染，由現有的 post pass 放大（post pass 本來就有紙張和底片顆粒，`uPrint`、grain，不用另外加）；
  - 榕樹葉片卡從手機現在的 1200（40×30；桌機是 2090）再減到約 600；
  - 卡拉OK 螢幕從每 0.12 秒重畫改成每 0.5 秒；
  - 遠處的 sprite 光暈減半。
  
  P95 連續 2 秒超過 33 ms，就再降一次 render target 的比例，只降不升。
- **決定 level 時要注意：**`IS_PHONE` 也把寬度小於 768 px 的桌機視窗算成手機，所以縮小視窗的桌機會被誤判成 level 1。決定 level 時要另外看觸控或 UA，或接受這個誤判並寫進文件。
- **為什麼：**folio-2025 `Quality.js` 只有兩級，用事件讓各模組自己降級（[05§1](05-threejs-craft.md)）；A Short Hike 的低解析度是一種風格（[05§12](05-threejs-craft.md)、[02§5](02-memory-games.md)）；樹冠 alpha-test 的過繪和卡拉OK 螢幕重畫是現況已知的成本（[00 A.3、A.4](00-current-state.md)）。
- **在哪裡：**`app.js` 的 `resize()`（1458 行）、離屏 render target 和 post 的 uniforms（1168–1240 行）、`IS_PHONE`（174 行附近）；`square.js` 的葉片數量（256–280 行）與 `update()` 裡的螢幕重畫（895–897 行）。
- **工時：**3 人日。
- **怎麼算成功：**第 2 項的表在兩台手機上都達到 P95 ≤ 33 ms；桌機畫面沒有任何改變。
- **風險：**
  - 解析度太低時，canvas 招牌上的小字會糊掉，所以招牌的材質要保留 mipmap，必要時把字加大；只降不升，避免畫質來回跳。
  - 描邊會變粗：post pass 的描邊是用 `px = 1.0 / uRes` 取樣（`app.js:1186`），也就是固定偏移 1.5 個 render target 像素。render target 縮小後，同樣的偏移放大到螢幕上就變粗，色階的觀感也會跟著變。要另外加一個依縮放比例補償的參數，不能只靠 `uRes`，並用截圖比對三個時代。

#### 7. 陰影框跟著女孩走、縮小，並在光源空間對齊 texel；手機陰影圖改 512 到 1024
- **先更正一件事：**folio-2025 `Ligthing.js` 的陰影框跟的是 `view.optimalArea`（鏡頭前的「最佳區域」），不是玩家；變數雖然叫 `optimalRoundedPosition`，但取整的那幾行（`// optimalRoundedPosition.x = Math.round(...)`）已經註解掉，實際上沒有取整。所以「跟著走」是照 Bruno 的做法，「對齊消除閃爍」是我們自己加的。
- **改什麼：**在走路模式下，把 `SUN_BOX` 從 120 縮到約 40，光源和 target 跟著女孩移動。因為我們的太陽是斜照的（`key.position` 為 18, 26, 12），只在世界座標的 x／z 上取整沒有效果。要做的是：
  1. 把框的中心點用光源的 view 矩陣轉到光源空間；
  2. 在光源空間的 x／y 上，對齊到「一個 texel 的寬度」（框寬 ÷ `mapSize`）的倍數；
  3. 再轉回世界座標，設定光源和 target 的位置。

  手機的 `mapSize` 依第 2 項的量測結果降到 512 或 768。導覽模式維持現在的大框。
- **為什麼：**folio-2025 `Ligthing.js` 讓陰影框跟著最佳區域走、手機用 512（[05§1](05-threejs-craft.md)，原始碼直讀）。現在手機 1024 的陰影圖每單位不到 9 個 texel（[05 啟示 2](05-threejs-craft.md)）。這是畫質與效能的打磨，所以和第 10 項一起做、一起用第 2 項的表驗收。
- **在哪裡：**`app.js` 的 `sunFollow()`（235–238 行）和 `SUN_BOX`／`mapSize`（224–231 行）。**不要改 `walk.js` `update()` 的回傳值**：它在 `app.js` `frame()` 裡是 `camZ`，除了給 `sunFollow(camZ)`，也拿來算 `frontier = Math.min(frontier, camZ - FOG_LEAD)`，還傳給 `updateOpening(progress, camZ)`（`app.js:1536-1550`），改成 {x, z} 會讓霧和開場出錯，導覽模式的 `placeCamera` 也得跟著改。改成另外匯出 `WALK.shadowCenter = { x, z }`（或在 `RIG` 加一個 `sunFollowXZ(x, z)`），只在走路模式（`W` 為真）時改用它。目前在廣場時 `sunFollow` 只動 z、x 固定是 0，也要一起處理。
- **工時：**1–1.5 人日。
- **怎麼算成功：**同一位置的截圖裡，陰影邊緣比較清楚；手機 P95 下降（和第 2 項的表比對）；走路時陰影邊緣不閃——用手機錄一段改前、改後同一條路線的影片並排比較。
- **風險：**框變小以後，遠處的建築沒有陰影，可能需要靠第 21 項的頂點 AO 和亮暗兩色補立體感；捲動導覽一定要維持大框；霧、開場、導覽鏡頭都不能受影響（見「在哪裡」）。

#### 11. 記憶燈籠改成 instanced，掛在「讀得懂的地點」，走近才顯示文字，同時亮著的數量有上限
- **現況更正：**每盞燈籠由 6 個以上不同材質的 mesh 組成（紙身、三個金色蓋／環、流蘇、拉線），光暈是一個 `THREE.Sprite`；`lanternMaterial()` 用 `text|body` 當 key 快取（`square.js:104-106`），所以貼圖數量是「年份 × 種類」，不是每盞一張。
- **改什麼：**
  - 每個子零件一個 `InstancedMesh`（紙身、金色零件、流蘇、拉線，每段一組），光暈改成一個用 instance 屬性做 billboard（永遠面向鏡頭）的平面，要自己寫一小段 shader，因為 `Sprite` 不能直接放進 `InstancedMesh`。draw call 是「約 5–6 個 InstancedMesh × 段數」，仍然遠少於現在的每盞 6 個以上。
  - 年份字改成走近 4.5 單位以內時，由一個共用的 DOM 泡泡顯示；或用 instance 的 UV 偏移去讀一張年份圖集。
  - 每段同時最多亮 30 盞。超過的話，依「最新 + 隨機」輪替，或依附近的地標分配。
  - 新增一個選填欄位 `place`，從約 10 個地標裡選一個（紅樓前、霞海城隍廟口……），沒選的話，用 x、z 自動對應到最近的地標名稱。
  - 新燈籠點亮時淡入，配一聲點燈的音效（有第 8 項更好）。
  - 廣場的記憶目前不會掛在原地，只進公布欄（[00 B.35](00-current-state.md)），但表單寫的是「留在這裡」。順便決定：掛在榕樹上，或把表單文字改掉。
- **為什麼：**folio-2025 Whispers（instanced、記下當下的位置、走近才顯示，[01§2](01-web-3d-narrative.md)）；OldNYC 用讀得懂的地名（[03§4](03-collective-memory.md)、[04§6](04-historical-cities.md)）；現況的 mesh 和物件數（[00 A.5、C.34](00-current-state.md)）。
- **在哪裡：**`memories.js` 的 `lantern()`、`addLantern()`、`tick()`（45–63、295–324 行）與 `fetchApproved()` 的 select 欄位清單（`memories.js:83`，加上 `place`）；`square.js` 的 `makeLantern()` 和 `lanternMaterial()`（104–147 行），抽出共用的幾何與材質；`schema.sql` 加 `place text`，並加進 `grant insert (...)`。
- **工時：**5–6 人日（原估 4 人日低估了子零件和光暈 shader）。
- **怎麼算成功：**用假資料塞 500 筆時，`renderer.info.render.calls` 只比 0 筆時多約 6 × 段數以內，貼圖數不變；燈籠外觀和現在的截圖對得上；每盞燈籠的卡片上都顯示地名。
- **風險：**instanced 以後，個別燈籠的擺動要寫進 instance 矩陣，每幀更新 30 盞 × 每盞數個零件的矩陣，成本可以接受；billboard shader 要記得接上我們自訂的霧。可以先用種子和假資料開工，不必等第 1 項上線。

#### 12. 公布欄變成「依年代、依地點逛」的記憶展覽，每則都能「帶我去那裡」，也能分享自己的燈籠
- **改什麼：**
  - 公布欄的清單加上「1985–1999／2000–2019／2020–」分頁，以及依 `place` 篩選。
  - 卡片固定成展品標籤的格式：一句標題（新增欄位，40 字以內）、地點、年份、故事、署名（含「轉述媽媽的記憶」）。
  - 每張卡片有「帶我去那裡」，呼叫 `walk.js` 的 `enter()` 加上一個座標，把女孩傳送到那盞燈籠旁邊。
  - **找我家附近：**公布欄加一個「我家在……」的地標選單，選了就列出附近的記憶並帶過去。中研院《臺北歷史地圖散步》觀察到讀者的第一步是先找自己家在哪裡（[04§10](04-historical-cities.md)、本報告 §3.1）。
  - **分享我的燈籠：**每則記憶有一個 `?m=<記憶 id>` 連結，打開就把女孩帶到那盞燈籠下並打開卡片。送出成功的畫面直接給投稿者這個連結，當作回執：「核准後，這個連結就會帶你到你的燈籠」（[00 B.36](00-current-state.md)）。因為第 1 項改成前端產生 id，送出當下就有 id。尚未核准時打開連結，顯示「還在等作者讀過」。
  - 點 `photos.js` 的建築熱點時，同一個面板下方列出附近的已核准記憶，依年份排序。
- **為什麼：**Museum of Broken Relationships 的固定標籤（[03§10](03-collective-memory.md)）；OldNYC「一個地點 → 所有年代」（[03§4](03-collective-memory.md)）；neal.fun 依時間排列的博物館（[01§10](01-web-3d-narrative.md)）；Henry Heffernan 的「3D 外殼加 2D 介面」（[01§11](01-web-3d-narrative.md)）；Gwulo 的年份篩選（[04§14](04-historical-cities.md)）；《臺北歷史地圖散步》的「先找自己家」（[04§10](04-historical-cities.md)）。
- **在哪裡：**`memories.js` 的 `fillList()`、`openList()`、`openRead()`（150–181 行），以及 `fetchApproved()` 的 select 欄位清單（`memories.js:83`，加上 `title`）；`walk.js` 的 `enter(k, instant)`（299 行），擴充成可以接受目標座標；啟動時讀 `?m=` 參數；`photos.js` 的 `open()`（140 行）；`schema.sql` 加 `title text check (char_length(title) <= 40)`，並加進 `grant insert (...)`。所有使用者文字都用 `textContent` 或 `photos.js` 的 `esc()` 處理（JuxtaposeJS 的 XSS 警告，[04§9](04-historical-cities.md)）。
- **工時：**4–5 人日。
- **怎麼算成功：**從公布欄點一則 1990 年的記憶，3 秒內站到西門町那盞燈籠下；建築面板列出附近的記憶；投稿者拿到的連結在核准後打開，會直接帶到自己的燈籠。
- **風險：**記憶數量少的時候，分頁會顯得空，所以在數量超過某個門檻之前，先只顯示「全部」。分享連結會讓 pending 的 id 外流，但第 1 項的 RLS 讓別人讀不到 pending 內容，只會看到「還在等」。

#### 13. 西門町段（1985–1999）的招牌換成手寫／字帖風格；年代錯置的資產組請 CJ 決定
- **改什麼：**
  - 選 1–2 套授權可用、風格接近楷書、隸書或綜藝體的字型，或把最常出現的幾十個字做成 SVG 或圖集。在 `scene-red.js` 的字型常數依年代選字；黑體留給 2000 年以後。
  - 加入紅底白字、壓克力燈箱、霓虹管描邊三種招牌材質。
  - 真實品牌一律改字，照《天橋上的魔術師》的做法。
- **請 CJ 決定（年代錯置）：**1989 年畫面出現 NOKIA，是因為西門町的 1980s、1990s、2000s 三套隊友資產（`asset/3d/assets-ximen-*.js`）全部同時開著，NOKIA／Sony Ericsson 的字串在 `asset/3d/assets-ximen-2000s.js:258` 的 `phone-shop-window`，由 `scene-red.js:383` 放上街。`HANDOFF.md` 待辦第 3 項和 `docs/RUBRIC.md` 都把這件事寫成「Waiting on CJ」，選項是：
  - (a) 依捲動年份切換三套資產的可見性：約一小時，但 1985 年的街會變空；
  - (b) 為了密度三套全開，接受年代錯置，用第 15 項的「記憶的疊層」標示回應。
  
  這不是單純的清除工作，是密度和考據之間的取捨。
- **為什麼：**justfont 字型散步、鄭開翔說招牌和人的共鳴最大、昭和模型照年代重製招牌（[06§11、§12、§14](06-taiwan-nostalgia.md)）；《天橋上的魔術師》因為商標權改了招牌（[06§4](06-taiwan-nostalgia.md)）；人中之龍 0 用「拿掉」標年代（[06§9](06-taiwan-nostalgia.md)）；[00 B.31、C.41](00-current-state.md)。
- **在哪裡：**字型：`scene-red.js:12` 的 `CJK` 常數，以及它的 `font()` 和 `fit()`（526 行附近）；`asset/fonts/`。資產組切換（選 a 時）：`scene-red.js` 的 `libGroup()`／`front()`（286–300 行）在放置時記下每件資產屬於哪一套，再依年份切換可見性；`scene-red.js:383` 的 `phone-shop-window`。`docs/RUBRIC.md` 要重評。
- **工時：**3 人日（含字型授權確認）；選 (a) 另加約 0.5 人日。
- **怎麼算成功：**請幾位 1980 年代就在台北的人看 1990 年西門町的截圖，沒有人指出「這個字太新」。選 (a) 時：在 1985–1999 的捲動區間裡，2000s 資產組不可見，用 `window.__fog` 探針旁邊加一個可見性檢查來驗證（不用 grep，因為 2000s 資產檔本來就會留在 repo 裡）。
- **風險：**中文字型檔很大，只要子集化成用到的字（用 `pyftsubset` 在本機先做好再放進 repo，網站本身仍然沒有 build step）；字型授權要寫進 credits；選 (a) 時 1985 年的街會變空，可能要補第 24 項清單裡的 1980 年代物件。

#### 14. 合併三條 rAF 迴圈；更新過時的文件
- **改什麼：**`memories.js` 的 `tick()` 和 `photos.js` 的 `frame()` 改成註冊到 `app.js` 主迴圈的 hook（`SCENE.onFrame.push(fn)`），DOM 泡泡的投影和主渲染用同一幀的鏡頭。`HANDOFF.md` 的「no free camera」「one verb: scroll」，以及 `walk.js:5` 的舊角色名稱，都改成符合現況。
- **為什麼：**folio-2025 的遊戲迴圈依編號分階段，每一幀的順序是固定的（[01§2](01-web-3d-narrative.md)、[05§1](05-threejs-craft.md)）；[00 A.6、A.13](00-current-state.md)。
- **在哪裡：**`app.js` 的 `frame()`（1522–1573 行）、`memories.js:323-329`、`photos.js:191-192`、`HANDOFF.md`、`walk.js:5`。
- **工時：**1.5 人日。
- **怎麼算成功：**快速轉鏡頭時，泡泡不再落後一幀；Performance 面板裡每幀只有一個 rAF callback。
- **風險：**載入順序依賴（[00 A.9](00-current-state.md)）。hook 陣列要在 `app.js` 先建立，後面的模組如果找不到，要在 console 印警告，而不是像現在這樣靜默地 return。

#### 15. 誠實標示「依實景」和「依記憶創作」，並給每段一個錨點年
- **改什麼：**
  - 在 PHOTO CREDITS 面板加一節「這條街哪些是真的」：8 棟有授權照片的建築標成「依實景建模」，其他招牌、攤位標成「依記憶與風格創作」；混年代的招牌說明是「記憶的疊層」。
  - 每段進入時的章節標題除了年代範圍，再加一個錨點年，例如西門町 1992（中華商場拆除那年）。
- **為什麼：**Rome Reborn 的分級和選錨點年（[04§1](04-historical-cities.md)）；Unity 聖母院為了大眾記憶刻意不準確（[04§3](04-historical-cities.md)）；Venice Time Machine 的不確定度評估（[04§4](04-historical-cities.md)）。
- **在哪裡：**`photos.js` 的 credits DOM 和 `openCredits()`（163 行）；`app.js` 的 `swapEraLabel()`（1304 行），以及 `data.js` 的時代資料。
- **工時：**1 人日。
- **怎麼算成功：**rubric 裡「年代錯置」的扣分可以用這份標示回應；觀眾問「這是真的嗎？」時，畫面上找得到答案。
- **風險：**錨點年要和第 13 項的招牌、第 16 項的天際線一致，最好由 CJ 一次拍板，並記錄下來。

#### 26. 捲動導覽換年代前先預告，大字段落加停駐點
- **改什麼：**
  - 導覽在年代交界前，先出現一個小預告，例如年份數字開始翻頁、燈籠微閃，再切換年代。
  - 在大字段落加一點阻尼或停駐點，快速捲動時不會直接跳過最重要的句子。
- **為什麼：**Before Your Eyes 用節拍器預告時間跳躍，並避免玩家速通過故事（[02§4](02-memory-games.md)、02 章改進建議第 6 條）；本報告 §3.3 也列了這個模式。
- **在哪裡：**`app.js` 的 `setEra()`（1004 行）與 `swapEraLabel()`（1304 行）、`updateWords(u)`（982 行）附近的 progress 阻尼（`DAMP`，`frame()` 裡的捲動分支）。
- **工時：**約 1 人日。
- **怎麼算成功：**試用者用力捲過一個年代交界時，說得出「剛才換到 2000 年代了」；9 句大字在快速捲動下仍然每句至少停留約 1 秒。
- **風險：**停駐點太強會讓捲動感覺卡住，所以只在大字段落加，而且要能用力捲過去。

### 中期（1–2 個月）

#### 16. 「同一件東西跨越三個年代」，以及會隨年份變化的天際線
- **改什麼：**
  - 選 2–3 件會在三段街都出現的物件，例如一張藤椅、一根電線桿和上面的小廣告、一台機車。寫一個共用的 builder，依年代傳參數，讓它變舊、換位置，或被收起來。
  - 從廣場和西門段往東看的天際線依年份出現或消失：101 要到 2004 年才亮起，新光三越大樓在 1993 年之後出現。這兩個年份 06 章註明是常識、沒有另外查證，動手前要核對。
- **為什麼：**Unpacking 的保留物件（[02§2](02-memory-games.md)）；還願同一空間四個年份（[06§2](06-taiwan-nostalgia.md)）；人中之龍 0 用「拿掉」標年代（[06§9](06-taiwan-nostalgia.md)）；Venice Time Machine 讓每件東西有開始年和結束年（[04§4](04-historical-cities.md)）。
- **在哪裡：**新的共用 builder 放在 `app.js` 的 `SCENE` 工具（例如 `SCENE.heirloom(kind, era)`），由 `scene-red.js`、`scene-dadao.js`、`scene-tower.js` 呼叫；天際線用現有的 `setEra()`（1004 行）和 `instSet` 的高度動畫。
- **工時：**5–7 人日。
- **怎麼算成功：**試用者走完三段以後，主動說出「那張椅子變舊了」或「101 是後來才有的」。
- **風險：**物件太小沒人注意，太大又搶戲。要放在每段的第一個站點附近（第 9 項），並且讓鏡頭會自然看到。

#### 17. 讓女孩「長大」：三段街三個年紀
- **改什麼：**西門町是小學生，大稻埕是高中生或大學生（換制服、背包），信義是大人（換外套、拿手機）。關節人偶的比例、衣服顏色和步伐參數都依 `WALK.where` 漸變；回到廣場時，依剛才所在的段落決定她的年紀。
- **為什麼：**Unpacking 讓衣著和物品隨年紀改變（[02§2](02-memory-games.md)）；標語「Three generations」和大字「We grow older」需要一個看得到的成長（[00 B.21](00-current-state.md)）；綾部和證明卡通角色 × 懷舊背景可以很有感（[06§10](06-taiwan-nostalgia.md)）。
- **在哪裡：**`app.js` 的女孩建構與 `poseGirl()`（803–917 行），把尺寸寫成參數；`walk.js` 的 `SPEED`、`CAM_D`、`CAM_LOOK_Y`（31–32 行），依年紀調整。
- **工時：**4–5 人日。
- **怎麼算成功：**三段街的截圖並排時，不用說明就看得出是同一個人在不同年紀。
- **風險：**兩項都會動 `poseGirl()`，建議和第 18 項的步伐修正排在同一段時間做，以免重工；這不是硬依賴，先做哪一項都可以。碰撞和鏡頭高度會跟著年紀改變。

#### 18. 碰撞改成膠囊體對方盒子，邊界改用實物；步伐跟速度綁定
- **改什麼：**
  - 照 three-mesh-bvh `characterMovement` 的演算法，自己寫一個不依賴函式庫的「膠囊對方盒子（AABB）」推出加沿牆滑動：5 個子步，每幀時間差上限 0.1 秒。碰撞體只需要廣場的榕樹、棋桌、攤車、廟、柱廊，以及街上的攤位和機車陣。
  - 街段 ±8.4 的隱形邊界改成看得見的騎樓柱、攤車和機車。
  - 女孩每走一個步長完成半個步態週期；IDLE、WALK、RUN 用權重平滑混合；停步時加一點過衝；轉身時頭先轉、身體跟著傾斜。
- **為什麼：**three-mesh-bvh 範例（[05§3](05-threejs-craft.md)，原始碼直讀）；《Messenger》的「沒有隱形牆」（[05§2](05-threejs-craft.md)）；David Rosen 的程序化動畫（[05§11](05-threejs-craft.md)）；ecctrl 的狀態列舉（[05§4](05-threejs-craft.md)，只借概念）。
- **在哪裡：**`walk.js` 的 `update()`（障礙與邊界，367–421 行）、`square.js` 的 `obstacles`、各 `scene-*.js` 匯出碰撞盒；`app.js` 的 `poseGirl()`（873 行）。
- **工時：**5 人日。
- **怎麼算成功：**沿著攤車走會順著滑過去，不會卡住，也不會穿過去；慢速推搖桿時看不出滑步。
- **風險：**碰撞盒和視覺不一致時，看起來像空氣牆，所以要有一個 `?debug` 模式畫出碰撞盒。

#### 19. 廣場活起來：人物跟著黃昏作息，加上「坐下」觸發回憶
- **改什麼：**
  - 不做排程系統，只依 `WALK.dusk` 和停留時間設幾個門檻：下棋的阿伯收棋盤、香腸攤點燈、卡拉OK 換一首慢歌、土地公前的香變短。
  - 在榕樹下的長凳或茶桌加一個「坐下」互動：女孩坐下以後，鏡頭慢慢拉遠，公布欄上的一則記憶以字幕的方式淡入。
- **為什麼：**Shenmue 的 NPC 作息（[02§10](02-memory-games.md)）；Old Man's Journey 坐下才回憶、綾部和的簷廊時刻（[02§6、§11](02-memory-games.md)）；九龍城寨「沒有人就是空殼」（[04§12](04-historical-cities.md)）。
- **在哪裡：**`square.js` 的 `update()`（866 行）、`chess()`、`tea()`、`cart()`、`karaokeStand()`；`walk.js` 加一個 `st.sitting` 狀態；`memories.js` 提供「隨機一則」。
- **工時：**5 人日。
- **怎麼算成功：**在廣場停留超過 2 分鐘的比例上升（可以用第 25 項的匿名計數，或試用觀察）；試用者在沒有提示的情況下坐下過。
- **風險：**廣場的黃昏係數目前只有「在廣場就是 1」（`walk.js:349`），要先改成會隨停留時間慢慢推進。「坐下」的字幕可以先用種子記憶做，有第 1 項的真實投稿更好，但不必等。

#### 20. 每段一個專屬的小互動，以及「燒一張紙送出記憶」的儀式
- **改什麼：**每段一個只用點擊或拖曳、不需要教學的動作：西門町撕一張電影票根，大稻埕把歪掉的春聯貼正，信義用手機拍 101，定格成拍立得。在廣場的金爐，把表單的「送出」做成把一張紙放進金爐的動畫。
- **為什麼：**Edith Finch 一段記憶一種互動（[02§1](02-memory-games.md)）；Florence 無字、不分輸贏的互動（[02§3](02-memory-games.md)）；返校讓神桌當存檔點，在地物件有功能（[06§1](06-taiwan-nostalgia.md)）。
- **在哪裡：**新增各段的互動物件到 `scene-red.js`、`scene-dadao.js`、`scene-tower.js`，用第 9 項的觸發區啟動；`square.js` 的 `goldFurnace()`（725 行）加送出動畫；`memories.js` 的 `submit()` 成功後觸發。
- **工時：**6–8 人日（每個互動 1.5–2 天）。
- **怎麼算成功：**試用者說得出每段「我做了什麼」；送出記憶的人看到燒紙動畫後，不會再按第二次送出。
- **風險：**互動不能擋住走路的主線，全部都可以跳過；燒紙的意象要保持溫和，不要和喪葬聯想太重（請 CJ 決定）。

#### 21. 亮暗兩色的光照、廣場烘焙，以及招牌圖集
- **改什麼：**
  - 在 `lit()` 的 `onBeforeCompile` 裡，把受光程度（N·L）經 `smoothstep` 壓成柔和的兩到三階：亮面黃昏暖橘，暗面偏藍紫。頂點色可以手動標記「永遠在陰影」的區域（騎樓內側、榕樹下）。要設定 `customProgramCacheKey`，以免 shader 數暴增。
  - 靜態的廣場（地面、圍牆、榕樹根、廟、柱廊），在 Blender 用 `asset/blender/stylized.py` 烘焙 AO 和黃昏光到頂點色，手機上關掉它們的即時陰影接收。
  - 同一段的 canvas 招牌畫進 2–4 張 2048 的圖集，UV 內縮半個 texel。**圖集維持和現有 canvas 貼圖一樣的 encoding，不要設成 sRGB**：現在 `renderer.outputEncoding` 是 `LinearEncoding`，gamma 在 post pass 最後才套（`app.js:175`、post 的 `pow(1/2.2)`），`walk.js` 的 `sign()`、`square.js` 的 `canvasTex()` 和各段的 canvas 招牌都沒有設 encoding（整個 repo 只有 `app.js:1257` 的照片設了 sRGB）。把圖集設成 `sRGBEncoding` 會讓所有招牌變暗、飽和度改變。
- **為什麼：**folio-2025 葉叢的兩色混合（[05§1](05-threejs-craft.md)）；Guilty Gear Xrd 的「亮暗由美術決定」（[05§10](05-threejs-craft.md)）；Three.js Journey 和 Questopia 的烘焙（[05§5](05-threejs-craft.md)、[01§11](01-web-3d-narrative.md)）；Codrops 的圖集（[05§8](05-threejs-craft.md)）。HANDOFF 記錄暖機時有 165 張貼圖（[05§6](05-threejs-craft.md)）。
- **在哪裡：**`app.js` 的 `lit`（159 行）和霧的 `onBeforeCompile`（115 行）；`asset/blender/stylized.py`、`tools/pack-models.sh`；`scene-*.js` 裡的招牌產生函式，以及 `walk.js` 的 `sign()`（82 行）和 `square.js` 的 `canvasTex()`（44 行），這兩個重複的工具可以順便合併（[00 A.11](00-current-state.md)）。
- **工時：**8–10 人日，可以分三次做。
- **怎麼算成功：**`memory.textures` 減少一半以上；手機在關掉陰影的 level 1 仍然有立體感（截圖比較）；program 數不增加；招牌合併成圖集前後各截一張圖，顏色看不出差別。
- **風險：**改 `lit()` 會影響所有材質，必須用截圖比對三個時代和廣場。如果將來想把整個專案改成正規的色彩管理（sRGB 貼圖 + sRGB 輸出），那是另一個項目，會影響全部的手調色，要單獨評估，不要夾在這一項裡做。

#### 22. 老照片「站在攝影師的位置」，加上今昔對照
- **改什麼：**
  - 每張授權照片多記一組 `cameraPos` 和 `lookAt`。在走路模式點開熱點時，先把鏡頭平滑移到那個視角，再讓照片從 0 淡入到約 60% 不透明度，疊在 3D 場景上，最後才變成全幅面板。
  - 有「現在」照片的地點，在面板裡加一個拖動對照滑桿：每張圖都要有年份標籤和 credit，而且 credit 用純文字處理。老照片的來源參考國家文化記憶庫、Wikimedia Commons「Taipei in the 1980s」。
  - 時代交界的疊印照片，在走路模式改成由站點觸發（第 9 項），不再依 progress。
- **為什麼：**Smapshot 的相機還原、Historypin 的淡入淡出（[04§7、§8](04-historical-cities.md)）；JuxtaposeJS 的 API 和 XSS 警告（[04§9](04-historical-cities.md)）；張哲生的今昔對照（[06§13](06-taiwan-nostalgia.md)）；[00 B.23](00-current-state.md)。
- **在哪裡：**`photos.js` 的照片資料（27 行起）、`open()`、`frame()`；`walk.js` 加一個「鏡頭被借走」的狀態，和第 9 項的 `st.cutscene` 共用；`app.js` 的 `updatePhoto()`（1280 行）。
- **工時：**5 人日，另加找照片和確認授權的時間。
- **怎麼算成功：**8 張照片裡至少 5 張，在鏡頭停住時的構圖和 3D 場景大致重疊；每張都有完整的 credit。
- **風險：**風格化的街道和真實的比例不同，重疊不會完美，所以用淡入淡出，不要做硬切的比對；新照片的授權要逐張確認。

#### 23. 溫和、不計數的回應：「我也記得」或一個小小的心意（請 CJ 決定用哪一種）
- **改什麼：**讀一則記憶時，可以留下一個小心意。燈籠會稍微亮一點，或在下方多一個小物件，**但不顯示任何數字**。每個瀏覽器對每則記憶只能回應一次。候選的形式：
  - 在燈籠下繫一條紅繩；
  - 放一顆糖；
  - 按一個「我也記得」。
- **為什麼：**Kind Words 沒有按讚，只有貼紙，而貼紙會變成房間裡的物件（[02§9](02-memory-games.md)、[03§12](03-collective-memory.md)）。
- **在哪裡：**`schema.sql` 新增 `offerings` 表（只能 insert，有 `memory_id` 外鍵），再做一個只回傳彙總等級（0、1、2、3）的 view，讓 anon 讀；`memories.js` 的 `openRead()`；`square.js` 的燈籠材質加一個亮度參數，或第 11 項的 instance 屬性。
- **工時：**3 人日。
- **怎麼算成功：**上線後，有回應的記憶比例；訪客說得出「我給過那盞一條紅繩」。
- **風險：**
  - 文化上：原本的構想是「拜一下」或「點一炷香」，但拜和上香是對神明和往生者做的事。對著別人（多半還在世）的個人記憶上香，聯想和第 20 項的燒紙一樣重，所以改用上面三個候選，請 CJ 決定。
  - 這是第二個可以被灌的寫入口，要套用第 1 項的限流；不顯示數字是原則，以後不要改。

#### 24. 內容流程：記憶地圖、在地物件清單、兩三段家族口述
- **改什麼：**
  - 為三段街各畫一張平面圖：每 10 公尺有什麼店、什麼聲音、哪件在地物件、哪個站點、哪盞種子燈籠。大稻埕照霞海城隍廟、永樂市場、迪化街的真實先後順序排；西門段照紅樓、電影街、中華商場的順序排。
  - 列一份「台灣人一眼就認得」的物件清單（磨石子、紅鐵門、鐵窗花、大同電鍋、綠色郵筒、老月曆、紅白塑膠袋……），分配到三個年代。
  - 找家中長輩做兩三段口述，成為種子記憶和站點文字，並寫進 credits。
  - 可以順便加一個「家」的角落：一扇開著的騎樓後門，看得見 2×3 公尺的客廳。
- **為什麼：**綾部和先畫地圖當骨架、《廖添丁》照實景的相對位置（[06§6、§10](06-taiwan-nostalgia.md)）；還願和《俗女養成記》的物件（[06§2、§5](06-taiwan-nostalgia.md)）；Shenmue 訪談還在世的人（[02§10](02-memory-games.md)）；香港記憶的口述歷史（[03§2](03-collective-memory.md)）。
- **在哪裡：**新增 `research/similar-works/` 以外的內容文件，例如 `docs/memory-map.md`；實作會分散在第 6、8、9、16、20 項。
- **工時：**4–6 人日（不全是寫程式）。
- **怎麼算成功：**第 8、9、16、20 項的擺放都對得上這份地圖；種子記憶有一半以上來自口述。
- **風險：**口述的個資和同意要比照第 5 項處理。

#### 25. 自動化煙霧測試，以及隱私友善的使用數據
- **改什麼：**
  - 用 GitHub Actions 加 Playwright，在 PR 上跑：載入首頁、`?tour=1`、`?year=1990`，三種模式各截一張圖，檢查 console 沒有錯誤，並從 `?stats=1` 讀 draw calls，超過預算就標記。
  - 使用數據只記「有沒有走進每一道門、有沒有觸發結尾站、有沒有打開表單」這種彙總計數（可以寫進 Supabase 一張只能 insert 的表），不收集識別資訊。
- **為什麼：**現況沒有 CI，靠手動截圖測試（[00 A.12](00-current-state.md)）；第 9、19 項的「怎麼算成功」需要數據；neal.fun 和 Igloo 都靠原型測試修正方向（[01§4、§10](01-web-3d-narrative.md)）。
- **在哪裡：**`.github/workflows/smoke.yml`、`tools/`；`walk.js` 的 `enter()`、第 9 項的觸發區。
- **工時：**3 人日。
- **怎麼算成功：**一個讓 `walk.js` 少一塊的載入順序錯誤，會在 PR 上失敗；每週可以看到「走到 101 結尾的比例」。
- **風險：**headless Chrome 的 WebGL 用軟體渲染，數字只能看相對變化；數據收集要寫進隱私說明。

### 優先順序一覽

依實際先後排列（編號是固定代號）。「依賴」欄的「硬」表示沒有它就做不了；「軟」表示有它更好，但不擋開工。

| 順序 | # | 項目 | 階段 | 工時（人日） | 依賴 |
|---|---|---|---|---|---|
| 1 | 1 | 記憶系統上線與伺服器端防護 | 立即 | 2–3 | — |
| 2 | 2 | `?stats=1` 與真機量測 | 立即 | 1 | — |
| 3 | 3 | 中文優先、一次點擊揭幕、自選聲音 | 立即 | 2 | — |
| 4 | 4 | 觸控提示（鍵帽、點擊範圍、中文） | 立即 | 0.5 | — |
| 5 | 5 | 投稿表單重寫與手機鍵盤 | 立即 | 2 | 硬：1 |
| 6 | 6 | 作者種子記憶 8–10 則 | 立即 | 0.5 | 軟：24 |
| 7 | 9 | 走路模式站點、101 結尾、廣場門口指引 | 短期 | 4–5 | — |
| 8 | 8 | 環境音與腳步聲 | 短期 | 4–5 | 硬：3 |
| 9 | 10 | 兩級畫質與動態解析度 | 短期 | 3 | 硬：2 |
| 10 | 7 | 陰影框跟人走、光源空間對齊 | 短期 | 1–1.5 | 硬：2；和 10 一起做 |
| 11 | 11 | instanced 燈籠、地名、上限 | 短期 | 5–6 | 軟：1、8（可先用種子和假資料） |
| 12 | 12 | 公布欄依年代和地點逛、分享燈籠、找我家附近 | 短期 | 4–5 | 硬：1、5；軟：11 |
| 13 | 13 | 1985–1999 招牌字體；資產組切換請 CJ 決定 | 短期 | 3（+0.5） | CJ 決定 |
| 14 | 14 | 合併 rAF 與更新文件 | 短期 | 1.5 | — |
| 15 | 15 | 真實與想像的標示、錨點年 | 短期 | 1 | 軟：13 |
| 16 | 26 | 導覽換年代預告與大字停駐 | 短期 | 1 | — |
| 17 | 16 | 跨年代物件與天際線 | 中期 | 5–7 | 軟：9 |
| 18 | 18 | 膠囊碰撞與步伐 | 中期 | 5 | — |
| 19 | 17 | 女孩長大 | 中期 | 4–5 | 和 18 一起排程（非硬依賴） |
| 20 | 19 | 廣場作息與坐下回憶 | 中期 | 5 | 軟：1（可先用種子記憶） |
| 21 | 20 | 每段專屬互動與燒紙送出 | 中期 | 6–8 | 硬：9；燒紙請 CJ 決定 |
| 22 | 21 | 亮暗兩色、烘焙、招牌圖集 | 中期 | 8–10 | 硬：2；軟：10 |
| 23 | 22 | 照片相機位置與今昔對照 | 中期 | 5 | 硬：9 |
| 24 | 23 | 不計數的回應 | 中期 | 3 | 硬：1；軟：11；形式請 CJ 決定 |
| 25 | 24 | 記憶地圖、物件清單、口述 | 中期 | 4–6 | — |
| 26 | 25 | 煙霧測試與使用數據 | 中期 | 3 | 硬：2 |

立即的部分合計約 8–9 人日，短期約 28–33 人日，中期約 48–58 人日。

**和上一版相比的調整：**第 7 項（陰影框）是畫質與效能的打磨，從「立即」移到「短期」，和第 10 項一起做；第 9 項（站點與 101 結尾）是摘要第 3 點的主要對策，提到短期的第一個；第 11、19 項改成「有第 1 項更好，但不擋開工」；第 17 項改成和第 18 項一起排程，不是硬依賴；新增第 26 項。

---

## 6. 不建議做的事

| 同類作品的做法 | 為什麼不適合這裡 | 證據 |
|---|---|---|
| 升級到最新的 three.js，改用 WebGPU／TSL、BatchedMesh、`compileAsync` | 超過 r160 必須改 ES modules；r152 和 r155 會讓手調的色彩和光照全部失準；估計要數天到一週的遷移和重新調色，換來的功能對我們不是剛需 | [05§7](05-threejs-craft.md)（Migration Guide 直讀） |
| 引入 Rapier、ecctrl 等物理或角色控制框架 | 需要 WASM、React、R3F 和 bundler，等於整個專案重寫；我們的碰撞體大多是方盒子，幾十行就夠了 | [05§3、§4](05-threejs-craft.md) |
| 現在就做 KTX2 貼圖 | r149 沒有 UMD 版的 `KTX2Loader`，只能用 importmap shim 繞過，很脆弱；貼圖「數量」（165 張）比格式更值得先處理 | [05§6](05-threejs-craft.md)（r147 路徑 404，直讀） |
| 即時多人（Messenger 的 WebSocket、同場看到其他玩家） | 靜態託管沒有常駐伺服器；即時互動也需要即時審核，而我們的人工審核已經是瓶頸；用留下的燈籠就能營造「有人來過」的感覺 | [01§3](01-web-3d-narrative.md)、[03§9、§12](03-collective-memory.md) |
| 按讚數、排行榜、追蹤者 | 會把記憶變成比賽；Kind Words 刻意不做；sMapshot 的排行榜適合「定位照片」這種任務型參與，不適合私人記憶 | [03§5、§12](03-collective-memory.md) |
| 照片級寫實、攝影測量、Gaussian splat | 檔案大、手機跑不動；Merci-Michel、NYT、Lusion 的「便宜技巧」都支持風格化；我們的強項是粉彩和考據 | [01§5、§6、§8、§9](01-web-3d-narrative.md) |
| 在前端直接呼叫 AI 自動審核（據 Awwwards 摘錄，Bruno 在伺服器端用 OpenAI moderation） | 靜態頁面藏不住 API key；要做，也只能放在 Supabase Edge Function 裡，等投稿量證明人工審不完再說 | [01§2](01-web-3d-narrative.md)（Awwwards 搜尋摘錄）、[03§12](03-collective-memory.md) |
| 擴大地圖：加更多街道、做開放世界 | A Short Hike 和《Messenger》都證明小而密比大而空好；在第 16、19、20、24 項把密度做出來之前，不要加面積 | [02§5](02-memory-games.md)、[05§2](05-threejs-craft.md) |
| 1:1 照搬真實品牌招牌 | 有商標問題；《天橋上的魔術師》也改了字 | [06§4](06-taiwan-nostalgia.md)、[00 C.41](00-current-state.md) |
| 分支劇情、任務與解鎖系統（Coastal World） | Unpacking 說工具很鈍，故事節拍要簡單，刻意不做分支；我們的訪客多半只來一次，保存進度只需要「去過哪道門」這種輕量的 localStorage | [02§2](02-memory-games.md)、[01§6](01-web-3d-narrative.md) |
| 為了史實完整，把大量文化細節寫成說明文字 | 返校的製作人說，太複雜的文化元素會把玩家推開；用物件和動作表達就好 | [06§1](06-taiwan-nostalgia.md) |
| 靠 Instagram hashtag 大量匯入投稿（M+ 的做法） | 我們只有一個人審核，匯入的內容授權和個資不明；等站內投稿穩定之後，再考慮少量手動策展 | [01§12](01-web-3d-narrative.md)、[03§9](03-collective-memory.md) |

---

## 7. 參考資料

下面是 01–06 章引用的全部來源，已去除重複（包括有沒有 `www.`、結尾有沒有斜線的差異），依「第一次出現在哪一章」分組。每一條在章節檔裡都標了證據等級（原始碼直讀或搜尋摘錄）；本報告沒有新增來源。正式引用前，請回原文核對。

### 本次抽查結果（12 條來源）

| 說法 | 來源 | 抽查結果 | 本報告的處理 |
|---|---|---|---|
| Reveal：點擊後才 `audio.init`、輸入切成 `wandering`、`#skip` | folio-2025 `Reveal.js` | 屬實（原始碼） | 照用 |
| Audio：失焦靜音、`localStorage`、`remapClamp` 距離衰減 | folio-2025 `Audio.js` | 屬實（原始碼） | 照用 |
| 兩級畫質加 UA 判斷 | folio-2025 `Quality.js` | 屬實（原始碼） | 照用 |
| 陰影圖 2048／512 | folio-2025 `Ligthing.js` | 屬實（原始碼） | 照用 |
| 陰影框位置取整 | folio-2025 `Ligthing.js` | **不屬實**：取整的程式碼已註解掉，跟的是 `view.optimalArea` | §1、§2、§3.6、第 7 項、05 章已更正 |
| 膠囊推出、5 個子步、delta 上限 0.1 | three-mesh-bvh `characterMovement.js` | 屬實（原始碼） | 照用 |
| Whispers「最多 30 則」「OpenAI moderation」 | 原本掛在 `Whispers.js` 原始碼下 | **出處錯置**：原始碼裡數量是 `VITE_WHISPERS_COUNT`，沒有呼叫 moderation；兩點都出自 Awwwards 摘錄 | §3.4、§6 改引 Awwwards |
| 《Messenger》「爸媽玩得沒問題」 | commarts | **未能查證**：WebSearch 找不到，commarts 連不上 | §1、§3.1 標「搜尋摘錄，未查證原文」，不再當核心證據 |
| Merci-Michel「real-time 3D doesn't have to look like 3D」 | Codrops／muz.li | **未能查證**：WebSearch 找不到，Codrops 連不上 | §1 標「摘錄，未查證原文」 |
| Unpacking 1.4 萬音效、foley 從 75K 降下來 | Kotaku、Audiokinetic | 屬實 | 照用 |
| Fremantle 先審後發 | fremantle.wa.gov.au | 屬實 | 照用 |
| Queering the Map 事後補審核、檢查是否洩漏全名和地址 | CityLab、Wikipedia | 屬實 | 照用 |
| Rome Reborn 選公元 320 年 | bigthink 等 | 屬實 | 照用 |
| NYT「We didn't want to create a photorealistic model」 | Storybench | 屬實 | 照用 |
| 人中之龍 0 的 1988 年空地 | SEGA、gematsu | 屬實 | 照用 |

（表中把同一來源的多個說法分開列，所以列數多於 12。）

### 首次出現於 [01 網頁 3D 敘事](01-web-3d-narrative.md)（67 筆）

- <https://usepastel.com/blog/how-a-design-portfolio-got-the-attention-of-400-000-visitors>
- <https://thefwa.com/cases/bruno-simon-portfolio>
- <https://raw.githubusercontent.com/brunosimon/folio-2019/master/package.json>
- <https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b>
- <https://www.awwwards.com/brunos-portfolio-case-study.html>
- <https://news.hada.io/topic?id=24963>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/package.json>
- <https://github.com/brunosimon/folio-2025>
- <https://github.com/brunosimon/folio-2025/tree/main/sources/Game>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Reveal.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Quality.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Inputs/Nipple.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Zones.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Respawns.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Cycles/DayCycles.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Audio.js>
- <https://x.com/bruno_simon/status/1900166330210259261>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/World/Whispers.js>
- <https://ics.media/en/entry/260925/>
- <https://muz.li/blog/threejs-conf-paris-2026/>
- <https://tympanus.net/codrops/2026/09/10/inside-the-first-three-js-conference-in-paris/>
- <https://en.wikipedia.org/wiki/Messenger_(video_game>
- <https://aftermath.site/messenger-browser-game-abeto/>
- <https://bo3.gg/games/articles/messenger-abeto-co-crafted-interactive-experiences-the-free-browser-game-you-can-finish-in-15-minutes>
- <https://brianlovin.com/hn/45396441>
- <https://www.commarts.com/webpicks/messenger>
- <https://boingboing.net/2025/10/27/messenger-is-the-coolest-browser-game-ive-ever-played.html>
- <https://fortcade.com/game/messenger/>
- <https://nbaradar.github.io/the-latent-space/Notes-+-Research/Philosophy-+-Sociology/Messenger---Web-Browser-Game>
- <https://x.com/zeuuss_01/status/2066949488682639703>
- <https://threejs.paris/schedule>
- <https://www.awwwards.com/annual-awards-2024/site-of-the-year>
- <https://awwwards.com/igloo-inc-case-study.html>
- <https://webgpu.com/showcase/igloo-inc-procedural-crystals/>
- <https://blog.lusion.co/oryzo-bts-part-1-7-concept-and-creative-direction>
- <https://blog.lusion.co/oryzo-bts-part-2-7-3d-design-and-motion-graphics>
- <https://awwwards.com/case-study-for-lusion-by-lusion-winner-of-site-of-the-month-may.html>
- <https://gang-website-2024.web.app/works/coastal-bank-coastal-world>
- <https://medium.com/active-theory/the-story-of-technology-built-at-active-theory-5d17ae0e3fb4>
- <https://medium.com/@activetheory/mira-exploring-the-potential-of-the-future-web-e1f7f326d58e>
- <https://www.mux.com/case-studies/active-theory>
- <https://www.casestudies.com/company/mux/case-study/how-active-theory-builds-living-digital-festivals-with-muxs-video-infrastructure>
- <https://awards.journalists.org/entries/a-cathedral-of-sound/>
- <https://www.storybench.org/how-the-new-york-times-used-space-and-sound-to-revive-notre-dame-after-the-fire/>
- <https://www.storybench.org/?p=22115>
- <https://discourse.threejs.org/t/new-york-times-notre-dame-visualization/7144>
- <https://www.niemanlab.org/reading/how-the-new-york-times-uses-photogrammetry-to-allow-readers-to-experience-journalistic-scenes-in-3d/>
- <https://www.khronos.org/news/permalink/new-york-times-rd-lab-offers-guides-to-photogrammetry-and-3d-publishing-using-gltf>
- <https://theanimatedweb.com/inspiration/reconstructing-journalistic-scenes-in-3d/>
- <https://www.nikokoppel.com/1>
- <https://justin.work/work/documenting-the-world-in-3d-7tdgn>
- <https://brackets.substack.com/p/the-architect-in-the-newsroom>
- <https://en.wikipedia.org/wiki/Neal_Agarwal>
- <https://waxy.org/?p=47826>
- <https://www.smithsonianmag.com/smart-news/you-can-now-visit-a-museum-about-the-history-of-the-internet-on-the-internet-180983197/>
- <https://www.mentalfloss.com/culture/internet/internet-artifacts-online-museum>
- <https://www.creativebloq.com/news/deep-sea-visualisation>
- <https://engagetheirminds.com/2022/09/15/the-deep-sea/>
- <https://blog.glitch.com/post/neal-agarwal-is-keeping-the-weird-web-alive/>
- <https://github.com/GlintonLiao/questopia>
- <https://awesome.ecosyste.ms/projects/github.com%2Fhenryjeff%2Fportfolio-website>
- <https://github.com/henryjeff/portfolio-website>
- <https://www.e-flux.com/announcements/31211/mobile-m-neonsigns-hk>
- <https://www.core77.com/posts/27306/4000-photos-and-more-hightlighting-hong-kongs-iconic-neon-sign-culture-27306>
- <https://mplus.org.hk/en/magazine/collecting-neon-signs-from-hong-kongs-streets>
- <https://www.dcfever.com/news/readnews.php?id=10817>
- <https://googlemapsmania.blogspot.com/2014/03/neon-maps.html>

### 首次出現於 [02 懷舊與記憶類遊戲](02-memory-games.md)（74 筆）

- <https://gdconf.com/news/gdc-2018-see-edith-finchs-devs-weaved-13-prototypes-1-game>
- <https://www.gamedeveloper.com/design/video-weaving-13-prototypes-into-1-game-for-i-what-remains-of-edith-finch-i->
- <https://gdcvault.com/play/1025016/Weaving-13-Prototypes-into-1>
- <https://gamedeveloper.com/design/creating-the-30-different-control-schemes-of-i-edith-finch-i->
- <https://en.wikipedia.org/wiki/What_Remains_of_Edith_Finch>
- <https://gamesbeat.com/the-story-behind-the-haunting-what-remains-of-edith-finch/>
- <https://gamedeveloper.com/design/learn-learn-learn-storytelling-tips-from-the-director-of-i-what-remains-of-edith-finch-i->
- <https://gamingtrend.com/feature/interviews/interview-ian-dallas-talks-about-ambiguity-cut-features-and-magic-in-what-remains-of-edith-finch>
- <https://www.thedailystar.net/shout/overclock/mansion-has-many-roomsand-stories-1439071>
- <https://www.gamedeveloper.com/gdc2022/gdc-2022-unpacking-a-narrative-through-1-000-household-items>
- <https://gdcvault.com/play/1027694/Independent-Games-Summit-Unpacking-a>
- <https://gamedeveloper.com/design/unpacking-the-design-pillars-of-a-chill-puzzle-game>
- <https://gamedeveloper.com/design/intimacy-from-the-inanimate-in-house-moving-puzzler-unpacking>
- <https://kotaku.com/hit-puzzle-game-unpacking-features-14-000-audio-fil-1848000220>
- <https://www.audiokinetic.com/en/blog/unpacking-the-fun-behind-the-foley>
- <https://gdcvault.com/play/1027728/-Unpacking-The-Fun-Behind>
- <https://www.asoundeffect.com/unpacking-game-audio/>
- <https://www.engadget.com/2018/02/14/florence-game-ios-love-ken-wong-interview-mobile/>
- <https://gamesbeat.com/florence-uses-clever-interactions-to-create-a-relatable-mobile-game-about-romance/>
- <https://80.lv/articles/the-lead-designer-of-monument-valley-discusses-florence>
- <https://apps.apple.com/gb/story/id1385422482>
- <https://gameinformer.com/gdc-2019/2019/03/20/florence-started-development-as-3d-rubiks-cube-of-human-heads>
- <https://80.lv/articles/gdc-a-florence-postmortem>
- <https://gdcvault.com/play/1025694/Letting-Go-A-Florence>
- <https://apps.apple.com/al/story/id1371611263>
- <https://gamedeveloper.com/design/gone-before-you-blink-the-webcam-driven-gameplay-of-before-your-eyes>
- <https://gdcvault.com/play/1029123/Game-Narrative-Summit-Learning-From>
- <https://www.gamedeveloper.com/marketing/a-seven-year-blink-of-an-eye-before-your-eyes-s-dev-woes-deconstructed>
- <https://recapio.com/digest/learning-from-loss-designing-the-experimental-narrative-of-before-your-eyes-by-game-developers-confe>
- <https://gdcvault.com/play/1026613/Independent-Games-Summit-Crafting-A>
- <https://gamedeveloper.com/design/video-a-postmortem-look-at-the-making-of-i-a-short-hike-i->
- <https://blog.playstation.com/2021/08/05/crafting-a-tiny-open-world-a-look-behind-the-scenes-at-the-creation-of-a-short-hike/>
- <https://itch.io/t/847700/gdc-presentation-by-adam-on-how-he-made-the-game>
- <https://www.pressreader.com/australia/edge/20200813/281556588171738>
- <https://uppercutcrit.com/how-a-short-hike-captures-the-feeling-of-fall/>
- <https://daily.bandcamp.com/high-scores/high-scores-mark-sparling>
- <https://www.gamedeveloper.com/disciplines/road-to-the-igf-adam-robinson-yu-s-i-a-short-hike-i->
- <https://gamecenter.nyu.edu/?p=13853>
- <https://www.gamedeveloper.com/design/road-to-the-igf-broken-rules-i-old-man-s-journey-i->
- <https://apps.apple.com/dk/story/id1456072648>
- <https://gdcvault.com/play/1024236/Happy-Inside-the-Box-The>
- <https://GamaSutra.com/design/how-venba-uses-food-to-explore-connections-and-disconnections-with-culture-for-immigrants>
- <https://mobilesyrup.com/2023/07/17/venba-visai-games-toronto-cooking-game-preview/>
- <https://www.avclub.com/venba-shows-us-food-doesnt-have-to-just-be-a-power-up-or-a-commodity-in-games>
- <https://blog.playstation.com/2023/06/12/the-story-of-venbas-culinary-and-cultural-roots-from-creative-director-abhi/>
- <https://en.wikipedia.org/wiki/Venba_(video_game>
- <https://gamedaily.biz/?p=9815>
- <https://www.pcgamesn.com/indie/interview-fullbrights-steve-gaynor-what-made-gone-home-work>
- <https://www.gamedeveloper.com/design/how-i-gone-home-i-s-design-constraints-lead-to-a-powerful-story>
- <https://www.pcgamer.com/au/the-making-of-gone-home>
- <https://www.killscreen.com/gone-homes-steve-gaynor-how-the-internet-ruined-adventure-games/>
- <https://www.pcgamesn.com/gone-home/steve-gaynor>
- <https://www.gamedeveloper.com/design/video-why-is-i-gone-home-i-a-game->
- <https://www.gamerevolution.com/review/596163-kind-words-review-a-game-for-anyone-who-needs-a-helping-hand>
- <https://www.inverse.com/gaming/kind-words-2-ziba-scott-interview>
- <https://gamesradar.com/kind-words-2-is-a-different-kind-of-social-media-its-a-social-space-where-you-can-share-your-troubles-with-no-followers-or-likes>
- <https://unwinnable.com/?p=76261>
- <https://ensigame.com/games/kind-words-lo-fi-chill-beats-to-write-to>
- <https://www.phantomriverstone.com/2016/12/yu-suzuki-interview-part-1.html>
- <https://pcgamer.com/the-secret-lives-of-shenmues-npcs>
- <https://breezewiki.discard.no/shenmue/wiki/Dobuita>
- <https://en.wikipedia.org/wiki/Boku_no_Natsuyasumi>
- <https://scroll.vg/extras/summer-vacation-confidential/>
- <https://nintendolife.com/features/childs-play-from-bokunatsu-to-natsu-mon-the-kaz-ayabe-interview>
- <https://toucharcade.com/2022/09/21/shin-chan-summer-vacation-interview-kaz-ayabe-millennium-kitchen-neos-corporation-ps4-switch-steam/>
- <https://en.wikipedia.org/wiki/Devotion_(video_game>
- <https://www.thenewslens.com/article/115485>
- <https://www.thenewslens.com/article/114373>
- <https://www.storm.mg/article/1012693>
- <https://www.inside.com.tw/article/15711-why-Devotion-hot>
- <https://generasian.blog/2022/11/02/playing-a-taiwanese-horror-game-with-my-taiwanese-mother>
- <https://en.wikipedia.org/wiki/Dordogne_(video_game>
- <https://connexionfrance.com/news/french-video-game-in-watercolour-plays-like-a-love-letter-to-dordogne/165136>
- <https://gematsu.com/2020/04/3d-watercolor-adventure-game-dordogne-announced-for-switch-pc>

### 首次出現於 [03 集體記憶與共創平台](03-collective-memory.md)（90 筆）

- <https://tcmb.culture.tw/zh-tw/introduction>
- <https://memory.culture.tw/Home/Intro>
- <https://memory.culture.tw/Home/NewsDetail?id=22>
- <https://newtalk.tw/news/view/2020-10-16/480326>
- <https://www.ey.gov.tw/Page/5A8A0CB5B41DA11E/122e0cad-b31b-40c0-ab4e-155d4f117968>
- <https://www.ey.gov.tw/Page/448DE008087A1971/b30de55d-4560-4096-b5fc-05553979a5af>
- <https://news.tvbs.com.tw/life/777309>
- <https://community.culture.taichung.gov.tw/df_ufiles/a/在地知識的轉譯與應用(台中社造110417>
- <https://data.gov.tw/dataset/139285>
- <https://file.moc.gov.tw/001/Upload/OldFiles/AdminUploads/files/202210/586e947c-cf0b-4e81-aedf-6614918e2bb1.pdf>
- <https://www.moc.gov.tw/en/cp.aspx?n=408>
- <https://www.copyrightnote.org/paper/pa0106.pdf>
- <https://ihss.hku.hk/?p=78132>
- <https://www.info.gov.hk/gia/general/200702/14/P200702140204.htm>
- <https://www.hkmemory.hk/Communities/ats/ah/index.html>
- <https://www.news.gov.hk/isd/ebulletin/en/category/healthandcommunity/070214/print/070214en05009.htm>
- <https://newsjunkie.net/entity/hong-kong-memory>
- <https://edition.cnn.com/2012/09/22/world/asia/singapore-memory-project>
- <https://biblioasia.nlb.gov.sg/vol-8/issue-3/oct-dec-2012/singaporean-memories/>
- <https://globalvoices.org/2011/12/24/singapore-memory-project/>
- <https://repository.ifla.org/handle/20.500.14598/5173>
- <https://www.nlb.gov.sg/main/about-us/press-room-and-publications/media-releases/2014/celebrating-the-stories-of-our-pioneers-with-the-greatest-gift-of-a-generation>
- <https://www.nlb.gov.sg/main/about-us/press-room-and-publications/media-releases/2014/singa-memory-proj-iremembersg-fund-awards-37-crea-work-showcasing-mem-of-singa-in-div-med-and-lang>
- <https://mapsplatform.googleblog.com/2015/07/new-life-for-old-photos-mapping-oldnyc.html>
- <https://www.citylab.com/design/2015/05/pictures-map-old-new-york-historical/393944/>
- <https://www.oldnyc.org/about.html>
- <https://vice.com/en/article/oldsf-oldnyc-photo-maps>
- <https://www.danvk.org/2016/01/19/oldnyc-update.html>
- <https://www.danvk.org/2015/06/04/launched-oldnyc.html>
- <https://danvk.org/2026/03/08/oldnyc-updates.html>
- <https://github.qingwei-s.workers.dev/danvk/oldnyc/blob/master/howto.md>
- <https://www.businessinsider.in/this-guy-used-over-80000-old-photographs-to-create-a-google-street-view-map-of-new-york-city-in-the-1800s/amp_articleshow/53157479.cms>
- <https://www.geoawesomeness.com/smapshot-a-participatory-time-machine-for-switzerland/>
- <https://peerj.com/preprints/27204>
- <https://arodes.hes-so.ch/record/2885/files/Ingensand_2018_A_semi_automatic_tool.pdf?version=1>
- <https://books.ub.uni-heidelberg.de/arthistoricum/catalog/view/442/655/83294>
- <https://cesium.com/blog/2017/04/21/smapshot/>
- <https://fc.cab.unipd.it/fedora/objects/o:549341/methods/bdef:Content/get>
- <https://en.wikipedia.org/wiki/Historypin>
- <https://www.nationalgeographic.com/travel/article/pin-your-place-in-history>
- <https://archivesoutside.records.nsw.gov.au/historypin>
- <https://news.unl.edu/article/historypin-project-expands-access-to-university-archives>
- <https://www.shiftcollective.us/casestudies1/historypin>
- <https://docubase.mit.edu/project/city-of-memory>
- <https://localprojects.com/?p=254>
- <https://www.cameronblevins.org/posts/city-of-memory/>
- <https://cartographicperspectives.org/index.php/journal/article/download/cp53-krygier/pdf/1958>
- <https://www.fremantle.wa.gov.au/?p=15659>
- <https://councilnews.com.au/2020/05/10614937-share-your-fremantle-story-on-the-map-of-memories>
- <https://en.wikipedia.org/wiki/Queering_the_Map>
- <https://www.concordia.ca/news/stories/2018/12/11/a-digital-project-crowdsources-27-000-queer-memories-from-around-the-globe.html>
- <https://i-d.co/article/queering-the-map-is-connecting-queer-moments-in-life/>
- <https://www.vice.com/en/article/queering-the-map-google-maps-lgtbq>
- <https://www.citylab.com/life/2018/02/how-to-queer-the-mapand-fend-off-an-attack/552824/>
- <https://koozarch.com/interviews/doing-queer-things-in-conversation-with-lucas-larochelle-and-franco-dupuy>
- <https://www.koreatimes.co.kr/southkorea/20160214/museum-collects-memories-of-broken-relationships>
- <https://www.foxnews.com/travel/mundane-items-ooze-love-loss-at-failed-relationships-museum.amp>
- <https://www.afar.com/magazine/the-museum-of-broken-relationships-is-actually-about-love>
- <https://www.cbsnews.com/losangeles/news/museum-featuring-items-from-failed-relationships-to-open-in-heart-of-hollywood-in-may>
- <https://www.artshelp.com/museum-spotlight-museum-of-broken-relationships/>
- <https://www.kvpr.org/2016-03-05/art-of-breakups-museum-enshrines-relics-of-relationships-past>
- <https://www.prnewswire.co.uk/news-releases/infinum-develops-digital-platform-for-the-museum-of-broken-relationships-607781476.html>
- <https://infinum.com/news/have-you-ever-chopped-up-your-exs-furniture/>
- <https://presentations.thebestinheritage.com/2018/brokenships>
- <https://museum-week.org/magazine/2020/06/26/5-questions-to-charlotte-fuentes-from-the-museum-of-broken-relationships>
- <https://unewsonline.com/2016/10/humans-of-new-york-creator-brandon-stanton-speaks-at-slu/>
- <https://dev.cascadepbs.org/culture/2017/10/humans-of-new-york-brandon-stanton-seattle-instagram-social-media-interviewing/>
- <https://www.complex.com/style/a/susan-cheng/how-on-earth-does-humans-of-new-york-creator-brandon-stanton-get-strangers-to-open-up>
- <https://shrm.org/topics-tools/news/inclusion-diversity/humans-new-york-blogger-shares-interviewing-listening-tips-di-conference>
- <https://www.buffalo.edu/ubnow/stories/2017/05/brandon-stanton-dss-lecture.html>
- <https://medium.com/by-photoshelter/photography-integrity-and-humans-of-new-york-50f3a55303a2>
- <https://www.pcgamer.com/amp/kind-words-is-a-sweet-game-about-supporting-strangers>
- <https://www.indiecade.com/kind-words/>
- <https://technotherapies.substack.com/p/a-conversation-with-ziba-scott-on>
- <https://mcvuk.com/business-news/if-we-released-this-game-now-everyone-would-assume-it-was-about-the-quarantine-why-kind-words-might-be-the-perfect-lockdown-game>
- <https://www.engadget.com/2020-03-28-kind-words-social-network-nice.html>
- <https://en.wikipedia.org/wiki/Cities_and_Memory>
- <https://hyperallergic.com/321470/explore-the-worlds-sounds-through-a-map-of-field-recordings-and-remixes/>
- <https://www.pbs.org/newshour/show/sonic-heritage-project-lets-people-experience-worlds-most-iconic-places-through-sound>
- <https://soundstudiesblog.com/author/stuartfowkes/>
- <https://artsandculture.google.com/asset/臺灣聲音地圖計劃-大安區聲音地圖/VwH4yt-uJB1GdA>
- <https://soundtraces.tw/?p=103076>
- <https://candychang.com/before-i-die>
- <https://instituteforpublicart.org/case-studies/before-i-die>
- <https://americanart.si.edu/node/57969>
- <https://statepress.com/article/2014/09/before-i-die-walls-promote-public-participation-in-making-art>
- <https://colorlines.com/articles/i-die-project-spreads-last-wishes-and-city-love-across-borders>
- <https://theunsentproject.com/about>
- <https://www.bustle.com/articles/138282-unsentproject-on-instagram-by-rora-blue-captures-the-painful-last-messages-people-never-sent-their-first>
- <https://commandlinux.com/statistics/the-unsent-project/>

### 首次出現於 [04 歷史城市重建](04-historical-cities.md)（61 筆）

- <https://bigthink.com/the-past/rome-reborn-model/>
- <https://diglib.eg.org/items/3867b659-0db6-406c-8952-5b6fb26c2082/full>
- <https://wiki.digitalclassicist.org/Rome_Reborn>
- <https://ctvnews.ca/sci-tech/virtual-reality-resurrects-ancient-rome-bit-by-bit-1.4187595>
- <https://ansa.it/amp/english/news/2023/11/08/new-edition-of-rome-virtual-aerial-tour-released_2758e2ac-ba17-4585-99e4-9a1dd4c5e4c7.html>
- <https://studenttheses.universiteitleiden.nl/access/item%3A2626254/view>
- <https://news.ubisoft.com/en-us/article/46PlC3yAeikjDI652TayLm/assassins-creed-origins-discovery-tour-qa-with-historian-maxime-durand>
- <https://www.thesixthaxis.com/2018/02/14/interview-quizzing-maxime-durand-on-discovery-tour-by-assassins-creed/>
- <https://www.mcvuk.com/explore-ancient-egypt-with-the-assassins-creed-discovery-tour/>
- <https://primagames.com/gaming/assassins-creed-odyssey-discovery-tour-ancient-greece-now-available>
- <https://www.ubisoft.com/it-it/game/assassins-creed/news/6WpV6SBWGb59fcnYhT2KBb/assassins-creed-discovery-tour-viking-age-out-now>
- <https://www.destructoid.com/one-dev-spent-two-years-making-the-notre-dame-in-assassins-creed-unity/>
- <https://stevivor.com/news/copyright-means-assassins-creed-unitys-couldnt-replicate-paris-notre-dame>
- <https://thenextweb.com/gaming/2019/04/16/assassins-creed-unity-notre-dame/>
- <https://www.engineering.com/?p=39718>
- <https://gadling.com/?p=35101>
- <https://www.gpsworld.com/3d-mapping-of-notre-dame-will-help-restoration/>
- <https://infoscience.epfl.ch/record/214895>
- <https://graphsearch.epfl.ch/publication/214895>
- <https://media.nature.com/original/magazine-assets/d41586-019-03240-w/d41586-019-03240-w.pdf>
- <https://www.swissinfo.ch/eng/archive-banking-fintech/surprise-move-_epfl-booted-from-venice-time-machine-project/45252134>
- <https://www.timemachine.eu/venice-time-machine-project-current-state-of-affairs>
- <https://timemachine.eu/events/data-sprint-on-historical-3d-amsterdam>
- <https://www.create.humanities.uva.nl/?p=2168>
- <https://create.humanities.uva.nl/?p=3255>
- <https://www.aka.fi/globalassets/vanhat/32akatemiaohjelmat/digihum/avajaisseminaari-2020/noordegraaf.pdf>
- <https://actu.epfl.ch/news/archival-photos-offer-research-value>
- <https://talks.osgeo.org/foss4g-2022-academic-track/talk/YXFEWL/>
- <https://arodes.hes-so.ch/record/2380/files/Produit_2018_3Dgeoreferencinghistoricalphotos.pdf?version=1>
- <https://www.smithsonianmag.com/history/q-a-with-nick-stanhope-creator-of-historypin-66516490/>
- <https://www.messynessychic.com/2013/03/05/historypin-an-online-time-machine/>
- <https://www.urbanrealm.com/news/2010/07/15/budding-historians-pin-hopes-on-google-street-view/>
- <https://github.com/NUKnightLab/juxtapose>
- <https://www.npmjs.com/package/juxtaposejs>
- <https://gis.sinica.edu.tw/taipei/wmts>
- <https://gis.sinica.edu.tw/taipei>
- <https://gis.rchss.sinica.edu.tw/mapdap/archives/9590/>
- <https://evoread.ascdc.sinica.edu.tw/detail_7.html>
- <https://smiletaiwan.cw.com.tw/article/3161>
- <https://ticket.apps.sinica.edu.tw/pdfs/351/05T-1050530_ch.pdf>
- <https://www.taiwannews.com.tw/zh/news/3893644>
- <https://smiletaiwan.cw.com.tw/article/2911>
- <https://city.gvm.com.tw/article/71344>
- <https://news.pts.org.tw/article/466778>
- <https://news.pts.org.tw/article/514896>
- <https://www.taipeitimes.com/News/taiwan/archives/2018/06/23/2003695390>
- <https://www.pcgamer.com/games/survival-crafting/this-minecraft-map-that-recreates-one-of-historys-most-notorious-slums-made-me-reconsider-whats-important-in-3d-level-design>
- <https://www.thisiscolossal.com/2025/09/sluda-builds-minecraft-kowloon-walled-city/>
- <https://80.lv/articles/take-a-look-at-this-impressive-recreation-of-a-huge-city-in-minecraft>
- <https://lcsd.gov.hk/en/parks/kwcp/thousand.html>
- <https://en.wikipedia.org/wiki/Greg_Girard>
- <https://www.hkbu.edu.hk/en/whats-new/discover-hkbu/2023/sep-2023/preserving-old-shops-from-artistic-illustration-to-digital-modelling.html>
- <https://www.hkbu.edu.hk/en/whats-new/press-release/2023/20230917-HKBUartists-digitise-memories-of-local-old-shops-to-encourage-reflections-on-community-conservation.html>
- <https://www.hkbu.edu.hk/en/whats-new/press-release/2024/20241106-HKBU-artists-use-art-tech-to-feature-local-shop-stories-and-reflect-on-community-conservation.html>
- <https://www.thestandard.com.hk/news/article/56204/Old-shops-find-new-life-in-3D-scans-and-AI>
- <https://gwulo.com/about-gwulo>
- <https://gwulo.com/explore>
- <https://old.gwulo.com/node/35528>
- <https://www.scmp.com/lifestyle/arts-culture/article/3266016/hong-kong-historian-behind-gwulocom-his-years-charting-city-and-why-hes-leaving>
- <https://thesis.lib.nccu.edu.tw/thesis/detail/7270ab57b2e1ad51763abf680cc2368b/>
- <https://www.storm.mg/article/3159574>

### 首次出現於 [05 three.js 渲染與效能](05-threejs-craft.md)（50 筆）

- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Rendering.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Ligthing.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/World/Foliage.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/World/Grass.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/InstancedGroup.js>
- <https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Materials.js>
- <https://x.com/bruno_simon/status/1849448601367335032>
- <https://x.com/bruno_simon/status/1862105274514878528>
- <https://webgpu.com/showcase/messenger/>
- <https://github.com/gkjohnson/three-mesh-bvh>
- <https://raw.githubusercontent.com/gkjohnson/three-mesh-bvh/master/example/characterMovement.js>
- <https://raw.githubusercontent.com/gkjohnson/three-mesh-bvh/master/package.json>
- <https://github.com/pmndrs/ecctrl>
- <https://github.com/ErdongChen-Andrew/CharacterControl>
- <https://www.threejs-journey.com/lessons/creating-a-scene-in-blender>
- <https://chanjunren.github.io/docs/zettelkasten/threejs/baking_and_exporting>
- <https://discourse.threejs.org/t/how-to-bake-light-with-textures/52076>
- <https://svilenkovic.com/3d/how-to-bake-lighting-for-web>
- <https://raw.githubusercontent.com/mrdoob/three.js/r147/examples/js/loaders/KTX2Loader.js>
- <https://github.com/zeux/meshoptimizer>
- <https://raw.githubusercontent.com/zeux/meshoptimizer/master/gltf/README.md>
- <https://github.com/mrdoob/three.js/tree/r147/examples/js/loaders>
- <https://raw.githubusercontent.com/mrdoob/three.js/r149/examples/jsm/loaders/KTX2Loader.js>
- <https://salivity.github.io/three.js/article/how-ktx2loader-and-basis-universal-reduce-vram-in-three-js>
- <https://discourse.threejs.org/t/estimate-ktx2-texture-memory-size/45793>
- <https://github.com/mrdoob/three.js/wiki/Migration-Guide>
- <https://github.com/mrdoob/three.js/tree/r147/examples/js/utils>
- <https://github.com/mrdoob/three.js/tree/r147/examples/js/postprocessing>
- <https://github.com/mrdoob/three.js/blob/dev/docs/pages/BatchedMesh.html.md>
- <https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/>
- <https://tympanus.net/codrops/2026/02/28/when-community-becomes-ui-building-the-website-for-the-first-three-js-conference/>
- <https://www.utsubo.com/blog/threejs-best-practices-100-tips>
- <https://discoverthreejs.com/tips-and-tricks/>
- <https://discourse.threejs.org/t/how-to-improve-performance-on-my-site/52039>
- <https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The>
- <https://www.arcsystemworks.com/guilty-gear-xrd-art-talk-at-game-developers-conference-2015/>
- <https://www.ggxrd.com/Motomura_Junya_GuiltyGearXrd.pdf>
- <https://gamedeveloper.com/art/see-i-guilty-gear-xrd-i-s-striking-2d-3d-art-deconstructed-at-gdc-2015>
- <https://gdcvault.com/play/1020583/Animation-Bootcamp-An-Indie-Approach>
- <https://www.gamedeveloper.com/design/video-an-indie-approach-to-procedural-animation>
- <https://discussions.unity.com/t/an-indie-approach-to-procedural-animation-gdc-video-talk/538228>
- <https://www.gameanim.com/2018/03/04/indie-approach-procedural-animation/>
- <https://j-red.github.io/arcadeflight>
- <https://itch.io/post/2065934>
- <https://github.com/RenaudRohlinger/stats-gl>
- <https://docs.w3cub.com/dom/web_audio_api/best_practices>
- <https://groups.google.com/a/chromium.org/g/blink-dev/c/5Y1BqbGauEs>
- <https://github.com/mrdoob/three.js/pull/19752>
- <https://developer.mozilla.org/docs/Web/API/KHR_parallel_shader_compile>
- <https://www.khronos.org/webgl/public-mailing-list/public_webgl/1904/msg00033.php>

### 首次出現於 [06 台灣與東亞在地懷舊](06-taiwan-nostalgia.md)（69 筆）

- <https://www.kocpc.com.tw/archives/130365>
- <https://kknews.cc/game/q3ae55y.html>
- <https://www.getit01.com/p2018050134384153/>
- <https://www.inside.com.tw/article/8278-interviewing-red-candle-detention-indie-horror-game-taiwan>
- <https://www.isabellearvers.com/2019/08/tour-du-monde-du-jeu-video-disabelle-arvers-seconde-escale-a-taiwan-immersion/>
- <https://storystudio.tw/article/gushi/6th-anniv-red-candle-games>
- <https://en.wikipedia.org/wiki/Detention_(video_game>
- <https://www.mirrormedia.mg/story/20190118gameredcandle>
- <https://www.thenewslens.com/article/150327>
- <https://www.beauty321.com/post/22869>
- <https://rekowiki.org/wiki/%E9%82%84%E9%A1%98>
- <https://zh.wikipedia.org/zh-hant/%E8%BF%98%E6%84%BF_(%E6%B8%B8%E6%88%8F>
- <https://b2b.latam.gamescom.global/companies/2553>
- <https://www.dualshockers.com/devotion-is-both-a-horror-game-and-love-letter-to-1980s-taiwan/>
- <https://www.gameinformer.com/review/devotion/devotion-review-an-exceptional-and-frightening-homecoming>
- <https://www.cna.com.tw/culture/article/20191103w002>
- <https://www.mirrormedia.mg/story/20190911insight011>
- <https://www.thenewslens.com/article/125638>
- <https://news.pts.org.tw/article/469567>
- <https://www.gvm.com.tw/article/78095>
- <https://www.mirrormedia.mg/story/20210217insight011>
- <https://www.eslite.com/product/1001128312681982124007>
- <https://www.mirrormedia.mg/story/20251204insight005>
- <https://www.bella.tw/articles/movies&culture/20686>
- <https://www.mirrormedia.mg/story/20190823insight001>
- <https://www.mirrormedia.mg/story/20211124insight002>
- <https://newtalk.tw/news/view/2021-09-03/630636>
- <https://news.pts.org.tw/article/547351>
- <https://www.4gamers.com.tw/news/detail/51943/donotnow-feat-liauthiamtinggame>
- <https://store.steampowered.com/app/1178490/ParanormalHK/>
- <https://gnn.gamer.com.tw/detail.php?sn=191053>
- <https://game.gnlore.com/paranormalhk-overview/>
- <https://www.hk01.com/%E9%81%8A%E6%88%B2%E5%8B%95%E6%BC%AB/417212/>
- <https://en.wikipedia.org/wiki/Shenmue_(video_game>
- <https://www.phantomriverstone.com/2022/12/yu-suzukis-visit-to-dobuita-street-with.html?m=1>
- <https://egmnow.com/it-feels-like-home-the-shenmue-tourists-making-the-yokosuka-pilgrimage/>
- <https://games.sega.com/yakuza0/world.html>
- <https://gematsu.com/2014/08/yakuza-0-set-1988-tokyo-osaka>
- <https://en.wikipedia.org/wiki/Yakuza_0>
- <https://www.famitsu.com/news/202107/25227952.html>
- <https://game.watch.impress.co.jp/docs/interview/1336893.html>
- <https://www.famitsu.com/news/202307/10308874.html>
- <https://www.4gamer.net/games/685/G068503/20230627031/>
- <https://game.watch.impress.co.jp/docs/interview/1511576.html>
- <https://www.tokyo-sports.co.jp/articles/-/274648?page=1>
- <https://renote.net/articles/6155>
- <https://sakatsuglobal.com/products/9996002>
- <https://sakatsuglobal.com/products/99920230621002>
- <https://haveagood-holiday.com/en/articles/nostalgic-ginza-diorama-partwork-launch>
- <https://hlj.com/old-days-but-good-days-takuji-yamada-s-diorama-wo-hbj25755>
- <https://smiletaiwan.cw.com.tw/article/1741>
- <https://smiletaiwan.cw.com.tw/article/3387>
- <https://www.eslite.com/product/1001116172859304>
- <https://www.thenewslens.com/article/139238>
- <https://www.thenewslens.com/article/16739>
- <https://edh.tw/article/9821>
- <https://smiletaiwan.cw.com.tw/article/1307>
- <https://www.storm.mg/lifestyle/620206?mode=whole>
- <https://blog.justfont.com/2013/11/typewalk-searching-for-vintage-r/>
- <https://blog.justfont.com/?p=5089>
- <https://www.thenewslens.com/article/72274>
- <https://www.inside.com.tw/article/3555-a-font-walk-with-kobayashi-akira>
- <https://www.inkl.com/news/photo-story-the-neon-lights-that-once-lit-up-taiwan>
- <https://www.taiwanplus.com/shows/documentary/culture/402/invisible-taiwan/s1/231207005/how-lighting-and-latitude-shape-the-taiwanese-culture-invisible-taiwan-ep6>
- <https://www.taipeitimes.com/News/feat/archives/2021/12/16/2003769675>
- <https://www.nownews.com/news/6860181>
- <https://kmweb.moa.gov.tw/redirect_files.php?id=161031>
- <https://www.shashasha.co/en/book/lee-ming-tiao-photography-retrospective>
- <https://download.osmand.net/wiki/Category:Taipei_in_the_1980s>

共 411 筆（已去除重複，含 www 與結尾斜線差異）。
