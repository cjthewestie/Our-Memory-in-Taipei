# 04 — 歷史城市重建與時間旅行

> 研究範圍：數位重建歷史城市、穿越時間的介面、老照片古今對照、臺北與香港的舊城重建。
> 研究日期：2026-11-03。
> **資料限制（請先讀）**：這次工作環境的 WebFetch 對所有外部網站都被擋（`ENOTFOUND`，包括 oldnyc.org、ubisoft.com、bigthink.com、gis.sinica.edu.tw），所以下面所有事實都來自 WebSearch 回傳的搜尋摘要，沒有逐頁讀原文。每一條都附上搜尋結果裡實際出現的網址；摘要裡標成「來源不可靠」或「無法確認」的內容，我也照樣標出來。引文是搜尋摘要裡引用的句子，正式引用前最好回原文核對一次。

## 概述

這一類作品大致分成三種。第一種是**學術型重建**（Rome Reborn、Venice / Amsterdam Time Machine、Paris 3D）：先選一個「資料最多的年份」，再把史料依可信度分級，確定的部分精細建模，推測的部分用程序化（procedural）方式批量補上。第二種是**遊戲與影視型重建**（Assassin's Creed Discovery Tour、Unity 的聖母院、《天橋上的魔術師》片場、九龍城寨 Minecraft）：大方承認有「為了符合大眾記憶而刻意不準確」的地方，例如 Unity 的聖母院放上了 1789 年還不存在的尖塔，因為「大多數人想到聖母院就會想到它」。第三種是**老照片與社群記憶平台**（OldNYC、Smapshot、Historypin、Gwulo、中研院臺北百年歷史地圖、JuxtaposeJS）：做法是把舊照片釘回它拍攝的位置和年份，再讓人拖動滑桿或淡入淡出，對照「當時」和「現在」，並靠社群補資料、修正錯誤。對 Our Memory in Taipei 這種「風格化、重氛圍」的作品來說，最值得學的不是追求毫米級的精準，而是這些作品**怎麼誠實標示什麼是真的、什麼是想像的**，怎麼**把真實照片放回它的時空座標**，以及怎麼**讓觀眾先找到「自己的那一格」**。

---

## 1. Rome Reborn（Bernard Frischer，1996/97 起）

**是什麼**：公元 320 年羅馬城的 3D 重建，可以在瀏覽器或 VR 中飛越全城，也可以停在個別地點。版本演進：1.0（2007）、2.0（2008）、3.0（2018）、4.0（2023 年 11 月，與 Flyover Zone 合作的重製版）。

**怎麼做的**
- **起點是實體模型**：團隊掃描了 Italo Gismondi 製作的 1:250 石膏模型「Plastico di Roma Antica」，用原本量測噴射機零件的雷射設備掃描，精度到十分之一公釐。但 Frischer 說，模型從 1:250 放大到 1:1 時所有瑕疵都浮現了，連模型上的灰塵放大後都「看起來很可笑」，所以後來改用程序化建模。
- **知識分級**：Digital Classicist wiki 寫道，可信度較低的「Class II」元素是用 ESRI **CityEngine** 程序化生成的。Stinson 的論文指出，模型中「確定的知識」其實很少，大部分是推論出來的。我沒找到 Rome Reborn 自己用顏色標示可信度的圖例。
- **為什麼選 320 年**：Frischer 對 AFP 說，「We chose AD 320 because we have the most information for that period so we can be as accurate as possible」，而且之後首都遷到君士坦丁堡，正好是一個自然的終點。
- 研究資料來源：保存良好的古建築、Plastico 的 3D 資料、古代文獻；Frischer 把這種方法稱為「simpirical」（simulation + empirical）。

**可借鏡**：選定「資料最多的那一刻」當錨點；確定的地標精細手工做，推測的街廓用程序化生成，而且要能說清楚哪些是哪一類。

**來源**
- https://bigthink.com/the-past/rome-reborn-model/
- https://diglib.eg.org/items/3867b659-0db6-406c-8952-5b6fb26c2082/full
- https://wiki.digitalclassicist.org/Rome_Reborn
- https://ctvnews.ca/sci-tech/virtual-reality-resurrects-ancient-rome-bit-by-bit-1.4187595
- https://ansa.it/amp/english/news/2023/11/08/new-edition-of-rome-virtual-aerial-tour-released_2758e2ac-ba17-4585-99e4-9a1dd4c5e4c7.html
- https://studenttheses.universiteitleiden.nl/access/item%3A2626254/view （可信度分級的一般性討論）

## 2. Assassin's Creed Discovery Tour（Ubisoft，2018 起：埃及、希臘、維京、巴格達）

**是什麼**：把開放世界遊戲拿掉戰鬥和主線劇情，變成一座可以自由漫遊的「博物館」，由歷史學家和埃及學家策劃導覽路線。

**怎麼做的**
- 歷史學家 Maxime Durand 說，最初的想法「really just to remove conflict and narrative from the game」；這個點子可以追溯到 2009 年《AC II》的 Animus Database。它和《Origins》本體在三到四年的開發期間同時製作；預算是「we took the budget out of the main game to do this」。
- **準確 vs. 藝術**：Durand 以人面獅身像為例，團隊一開始試了幾個比較藝術化的版本，最後才定案為比較貼近史實的造型。
- **導覽結構**：埃及版有 75 條導覽；希臘版有 300 多個「站點」（stations）、30 條導覽、分布在 29 個區域，由歷史人物擔任導覽員，結束後有小測驗；維京版改成更偏敘事的形式，25 個幕後站點都由現代線角色 Shaun Hastings 旁白。
- 設計原則：操作要非常簡單，導覽在地圖上要非常顯眼；這個工具「不是要取代老師」。

**可借鏡**：拿掉「任務」之後，用「站點 + 旁白 + 小卡片」把世界變成博物館；站點在地圖上要一眼看得到；導覽員可以是一個「角色」，而不只是一段文字。

**來源**
- https://news.ubisoft.com/en-us/article/46PlC3yAeikjDI652TayLm/assassins-creed-origins-discovery-tour-qa-with-historian-maxime-durand
- https://www.thesixthaxis.com/2018/02/14/interview-quizzing-maxime-durand-on-discovery-tour-by-assassins-creed/
- https://www.mcvuk.com/explore-ancient-egypt-with-the-assassins-creed-discovery-tour/
- https://primagames.com/gaming/assassins-creed-odyssey-discovery-tour-ancient-greece-now-available
- https://www.ubisoft.com/it-it/game/assassins-creed/news/6WpV6SBWGb59fcnYhT2KBb/assassins-creed-discovery-tour-viking-age-out-now

## 3. 巴黎重建：Assassin's Creed Unity 的聖母院，與 Dassault Systèmes《Paris 3D》

**是什麼**：同一座城市的兩種重建邏輯。Unity（2014）的聖母院是遊戲場景；Dassault 的 Paris 3D 則以「準確而非娛樂」為定位，呈現巴黎兩千年的變化。

**怎麼做的**
- **Unity**：資深關卡美術 Caroline Miousse 說，「80 percent of my time was spent on the Notre Dame」，前後大約兩年，並和歷史學家合作。但她刻意放上 1789 年還不存在的尖塔，因為「most people, when thinking about Notre Dame, represent them」（The Verge 的轉述）。她也證實，因為著作權問題，有些部分無法完全照實複製。
- **Paris 3D**：二十位專家花兩年製作，使用舊地圖、城市紀錄和考古圖面，並設立科學委員會來裁決有爭議的部分（這是 Dassault 自己的說法，沒有看到獨立的評估）。
- 對照組：Andrew Tallon 2015 年的雷射掃描，從 50 多個位置收集了超過十億個點，誤差「often fewer than five millimeters」。

**可借鏡**：「大眾記憶中的樣子」本身就是一種合理的設計目標，但要自己清楚、也最好讓觀眾知道，哪裡是為了記憶而改動的。遇到爭議時，由一位「裁決者」（科學委員會；在我們的專案裡就是作者 CJ）拍板定案，並把決定記錄下來。

**來源**
- https://www.destructoid.com/one-dev-spent-two-years-making-the-notre-dame-in-assassins-creed-unity/
- https://stevivor.com/news/copyright-means-assassins-creed-unitys-couldnt-replicate-paris-notre-dame
- https://thenextweb.com/gaming/2019/04/16/assassins-creed-unity-notre-dame/
- https://www.engineering.com/?p=39718
- https://gadling.com/?p=35101
- https://www.gpsworld.com/3d-mapping-of-notre-dame-will-help-restoration/

## 4. Venice Time Machine（EPFL，Frédéric Kaplan、Isabella Di Lenardo）

**是什麼**：目標是做出「任何年份」的威尼斯 2D / 3D 地圖，一種「過去的 Google Map」，資料來自威尼斯國家檔案館（Archivio di Stato）的大規模數位化。

**怎麼做的**
- 2015 年的 DH 論文提出一套方法：重建一個涵蓋一千年社會與城市演變的歷史 GIS。
- 2023 年 Remote Sensing 論文（Vaienti、Petitpierre、Di Lenardo、Kaplan）：在 GIS 框架裡結合程序化建模和機器學習，寫了一個開源 Python 模組，能補齊 2D GIS 資料的缺漏，並從 GIS 檔直接生成到 LOD 2.1 的 3D 模型。
- 2025 年 Heritage 論文：聖馬可廣場的 4D 重建，用現今的點雲來校驗重建結果，並附上不確定程度的評估。
- **教訓**：2019 年 9 月，檔案館以開放資料和方法上的爭議為由暫停合作（Nature 報導）；EPFL 後來改和 Ca' Foscari 等其他機構繼續合作。

**可借鏡**：把「時間」當成資料的一個維度（每棟建築都有開始年和結束年），而不是做幾個分開的場景；和資料來源方的授權關係要先談清楚，因為它可能讓整個計畫停擺。

**來源**
- https://infoscience.epfl.ch/record/214895
- https://graphsearch.epfl.ch/publication/214895
- https://media.nature.com/original/magazine-assets/d41586-019-03240-w/d41586-019-03240-w.pdf
- https://www.swissinfo.ch/eng/archive-banking-fintech/surprise-move-_epfl-booted-from-venice-time-machine-project/45252134
- https://www.timemachine.eu/venice-time-machine-project-current-state-of-affairs

## 5. Amsterdam Time Machine 與 Virtual Interiors（阿姆斯特丹大學 CREATE、4D Research Lab）

**是什麼**：2017 年起，受 Venice Time Machine 啟發的「阿姆斯特丹時空探索」公共研究基礎設施，由 Julia Noordegraaf 和 Claartje Rasterhoff 主持。

**怎麼做的**
- 目標之一是在歷史地圖上放滿不同時期的建築 3D 模型；2022 年和 4D Research Lab 舉辦 data sprint，要建立「從建模到發布」的固定流程。範例是 Warmoesstraat 上一間 16 世紀的畫家工作室。
- Virtual Interiors（NWO 資助）專門重建 17 世紀阿姆斯特丹的住宅「室內」，作為 Time Machine 的概念驗證。

**可借鏡**：除了街景，還要重建「一間店的內部」，因為人的記憶常常是室內的（家裡的客廳、唱片行的櫃台）。先把建模到上線的流程標準化，之後再擴充模型。

**來源**
- https://timemachine.eu/events/data-sprint-on-historical-3d-amsterdam
- https://www.create.humanities.uva.nl/?p=2168
- https://create.humanities.uva.nl/?p=3255
- https://www.aka.fi/globalassets/vanhat/32akatemiaohjelmat/digihum/avajaisseminaari-2020/noordegraaf.pdf

## 6. OldNYC（Dan Vanderkam × NYPL Labs，2015）

**是什麼**：把紐約公共圖書館 Milstein 收藏的大量舊照片（報導常說 8 萬多張）放到地圖上，點一個街角就能看到那裡在 1870–1970 年代的樣子。

**怎麼做的**
- 和 OldSF「先抓照片、後問授權」不同，這次他從 2013 年起就和 NYPL Labs 合作；圖書館提供照片清單、標題和描述。
- **地理編碼**：照片的位置是十字路口的文字（例如「9th Street and Avenue A」）。現代的地理編碼器只認得現在的街道，所以他利用曼哈頓棋盤街道「直線」的特性，自己擬合交叉點。2026 年 3 月的更新說，原本送給 Google Geocoding API 時，一些已經不存在的布魯克林路口被誤放到曼哈頓，現在改用 NYPL 的歷史街道資料和 OpenStreetMap，大約 87% 有位置資訊的照片可以被定位。
- **影像處理**：寫程式偵測照片背後的褐色裱紙，把一張卡上的多張照片切開；用 OCR 讀出卡片背面的說明文字。

**可借鏡**：老照片的價值在於「時間 + 地點」這兩個座標都對；而且要接受「定位不完美」，並開放讓使用者回報錯誤。

**來源**
- https://www.oldnyc.org/about.html
- https://mapsplatform.googleblog.com/2015/07/new-life-for-old-photos-mapping-oldnyc.html
- https://www.danvk.org/2016/01/19/oldnyc-update.html
- https://danvk.org/2026/03/08/oldnyc-updates.html
- https://vice.com/en/article/oldsf-oldnyc-photo-maps

## 7. Smapshot（HEIG-VD，源自 EPFL 博士論文）

**是什麼**：群眾協作把歷史照片在 3D 中「定位」：志工在有貼圖的 3D 地形上點出至少 6 組照片與模型之間的對應點，演算法再算出拍攝當時相機的位置和朝向（六個自由度）。

**怎麼做的**
- 由 Timothée Produit 在 EPFL GIS 實驗室的博士研究（2015 年完成）延伸而來；超過 700 位參與者、15 萬張以上的照片完成 3D 定位；管理員用預先計算的指標審核志工的成果；有開放 API。合作單位包括 ETH Zurich 影像檔案館、Swisstopo。

**可借鏡**：老照片不只是一張圖，它有「當年攝影師站在哪裡、朝哪個方向拍」。如果把真實照片的相機位置還原到 3D 街上，訪客走到那個點，視角就和老照片重疊。

**來源**
- https://actu.epfl.ch/news/archival-photos-offer-research-value
- https://talks.osgeo.org/foss4g-2022-academic-track/talk/YXFEWL/
- https://arodes.hes-so.ch/record/2380/files/Produit_2018_3Dgeoreferencinghistoricalphotos.pdf?version=1

## 8. Historypin（Nick Stanhope / We Are What We Do，2010 起）

**是什麼**：使用者依照「地點 + 日期」把老照片「釘」到 Google 地圖上，有街景的地方可以把老照片疊在現在的街景上，做古今對照；也可以附上故事和回憶。

**怎麼做的**
- 早期的 iOS app 能把老照片疊在手機相機畫面上，在老照片和現場之間淡入淡出。
- 社群計畫（例如英國 Reading）由志工訪談居民，蒐集照片和回憶。

**可借鏡**：「回憶」和「照片」放在同一個釘點上，讓陌生人在同一個地方留下各自的故事，這和本專案的燈籠、公布欄是同一種模式；淡入淡出是成本最低的古今轉場方式。

**來源**
- https://en.wikipedia.org/wiki/Historypin
- https://www.smithsonianmag.com/history/q-a-with-nick-stanhope-creator-of-historypin-66516490/
- https://www.messynessychic.com/2013/03/05/historypin-an-online-time-machine/
- https://www.urbanrealm.com/news/2010/07/15/budding-historians-pin-hopes-on-google-street-view/

## 9. JuxtaposeJS（Northwestern Knight Lab）

**是什麼**：開源的 before / after 圖片滑桿，是新聞媒體做古今對照的標準工具。

**怎麼做的**：可以從 CDN 載入，也有 npm 套件；每張圖可以設 `data-label`（例如年份）和 `data-credit`（版權）；可以設定滑桿的起始位置，讓它一打開就停在差異最明顯的地方；可以關掉動畫。維護者警告：credit 文字會被當成 HTML 渲染，有 XSS 風險，所以讓別人產生的內容必須先消毒。

**可借鏡**：就算不直接用這個函式庫，也可以照它的 API 設計：每張圖都要有年份標籤和版權欄位；而使用者上傳的文字一律當純文字處理（本專案的 memories.js 也是讓訪客上傳內容）。

**來源**
- https://github.com/NUKnightLab/juxtapose
- https://www.npmjs.com/package/juxtaposejs

## 10. 中研院《臺北百年歷史地圖》WMTS 與《臺北歷史地圖散步》App（2016）

**是什麼**：中研院人社中心 GIS 專題中心提供臺北歷代古地圖、舊航照的 WMTS 圖磚服務（`https://gis.sinica.edu.tw/taipei/wmts`），可以接 QGIS、ArcGIS、OpenLayers；2022 年新增 1964、1968、2003 年的舊航照（1964、1968 年只涵蓋臺北市局部地區）。另外有 1945 年美軍繪製的城市地圖、舊地籍圖等圖層。數位文化中心 2016 年出版《臺北歷史地圖散步》，搭配免費 App「臺北歷史地圖」。

**怎麼做的**
- App 精選 12 張、最早回溯到 1895 年的古地圖，和今日的 Google 地圖、街景對照；書上的 QR code 掃描後直接跳到 App 上的對應地點，「老照片與現有街景立即對照」。
- 團隊觀察到：**很多讀者拿到書和 App 的第一步，是先找自己家在哪裡**；也坦承街景偶爾會偏移，老照片的定位也會有誤差。

**可借鏡**：這是臺北最權威、也最容易接上的「時間底圖」。可以把 1945 年美軍地圖或 1960 年代航照，當成方塊廣場地面或公布欄旁的一張「老地圖」貼圖（使用前要先確認授權）。「先找自己家」說明訪客最想找的是自己的座標。

**來源**
- https://gis.sinica.edu.tw/taipei
- https://gis.rchss.sinica.edu.tw/mapdap/archives/9590/
- https://evoread.ascdc.sinica.edu.tw/detail_7.html
- https://smiletaiwan.cw.com.tw/article/3161
- https://ticket.apps.sinica.edu.tw/pdfs/351/05T-1050530_ch.pdf

## 11. 《天橋上的魔術師》（公視，2021）的中華商場片場與 VR 展

**是什麼**：中華商場（1961–1992，忠孝仁愛信義和平八棟三層樓）已經拆除，目前沒有找到公開上線、可以自由漫遊的 3D 重建。公視曾考慮用數位建模，最後選擇在汐止約兩公頃的空地上搭實景，重建一到三樓約 50 間店面和住家；之後另外推出 VR 展重現劇中場景。

**怎麼做的**
- 美術指導王誌成：先做資料蒐集和田野調查，再和導演反覆溝通後才搭景；「搭景如跟時間賽跑」。
- 他們發現，當年外國攝影師拍下的中華商場保留了那個年代「獨特的雜亂氣味」，所以調整了取景和色彩的處理方式。
- 細節：書報攤的道具報紙印著舊日期、唱片行的卡帶陳列、鐵捲門的鏽斑、磁磚牆上的陳年廣告。片場顧不到的部分，導演楊雅喆說要靠特效把當時的建築「一棟棟種回去」。
- 預算數字各家報導不一（8000 萬或 2 億）。

**可借鏡**：中華商場和西門町在記憶裡的質感，是「雜亂」、「疊層」、「舊廣告」，而不是乾淨。本專案的西門町區段可以在暖色調之外，局部加上鏽斑、手寫價目、舊報紙的日期這類「時間證據」。

**來源**
- https://www.taiwannews.com.tw/zh/news/3893644
- https://smiletaiwan.cw.com.tw/article/2911
- https://city.gvm.com.tw/article/71344
- https://news.pts.org.tw/article/466778
- https://news.pts.org.tw/article/514896
- https://www.taipeitimes.com/News/taiwan/archives/2018/06/23/2003695390 （提到 2018 年國家數位資產庫收錄了中華商場數位模型；我沒能讀到原文確認細節）

## 12. 九龍城寨：Sluda Builds 的 Minecraft 重建與城寨公園展覽

**是什麼**：九龍城寨在 1993 年拆除。YouTube 上的建築師 Sluda Builds 以等比例在 Minecraft 重建；城寨公園則有互動展覽室。

**怎麼做的**
- PC Gamer：Sluda 先建一個 3D 模型，確保每條街道和每棟建築的位置都正確，再轉成方塊。影片中有引用歷史照片（Colossal 的截圖），但來源不明。城寨室內的資料「在網路上一向很少」，所以很多室內只能靠想像。
- PC Gamer 的評論者走完整張地圖後的結論是：最缺的是「住在那裡的人」，對關卡設計來說，人比複雜度更重要。
- 城寨公園的互動展覽：觀眾對著螢幕揮手，就會出現城寨的「回憶片段」，還可以透過體感和當年的居民「互動」。
- 參考資料：Greg Girard 和 Ian Lambot 1986–1992 年的攝影，出版成《City of Darkness》（1993）。

**可借鏡**：再精確的空間，沒有人就是空殼。本專案廣場上的下棋、泡茶老人方向是對的，街上也應該有「當年的人」，而且他們的動作要符合那個年代。

**來源**
- https://www.pcgamer.com/games/survival-crafting/this-minecraft-map-that-recreates-one-of-historys-most-notorious-slums-made-me-reconsider-whats-important-in-3d-level-design
- https://www.thisiscolossal.com/2025/09/sluda-builds-minecraft-kowloon-walled-city/
- https://80.lv/articles/take-a-look-at-this-impressive-recreation-of-a-huge-city-in-minecraft
- https://lcsd.gov.hk/en/parks/kwcp/thousand.html
- https://en.wikipedia.org/wiki/Greg_Girard

## 13. Foreseen Property Agency：香港老店 3D 掃描（HKBU 視藝院 Pat Wong、Kachi Chan，2023–2024）

**是什麼**：用 NeRF 掃描香港即將消失的老店（第一期 10 間，例如上環的珠榮記、石硤尾的成興泰米舖、油麻地的美都餐室），轉成點雲模型放進線上檔案庫；再包裝成假的房地產開發商「Foreseen Property Agency」，用「賣樓」的形式販售點雲，部分「銷售收入」用來補貼老店未來的搬遷或結業。

**怎麼做的**：每個模型有兩百萬到四百萬個點；2024 年的第二期還教店主自己使用 3D 掃描設備。

**可借鏡**：「點雲 + 人物故事」的組合；讓當事人（店主）自己參與記錄，就像本專案讓訪客留下回憶。點雲那種半透明、會散開的質感，很適合表現「記憶中的店」，也可以作為燈籠被點開時的視覺效果。

**來源**
- https://www.hkbu.edu.hk/en/whats-new/discover-hkbu/2023/sep-2023/preserving-old-shops-from-artistic-illustration-to-digital-modelling.html
- https://www.hkbu.edu.hk/en/whats-new/press-release/2023/20230917-HKBUartists-digitise-memories-of-local-old-shops-to-encourage-reflections-on-community-conservation.html
- https://www.hkbu.edu.hk/en/whats-new/press-release/2024/20241106-HKBU-artists-use-art-tech-to-feature-local-shop-stories-and-reflect-on-community-conservation.html
- https://www.thestandard.com.hk/news/article/56204/Old-shops-find-new-life-in-3D-scans-and-AI

## 14. Gwulo: Old Hong Kong（David Bellis，2009 起）

**是什麼**：社群共建的香港老照片和地方史網站（「古老」的粵語音）；超過 6 萬頁、4 萬多張照片。

**怎麼做的**：使用者上傳照片、建立「地點頁」（一棟建築的歷史）、人物頁（常是做家族史的人想找知情者）、論壇主題、回憶錄頁面；頁面之間互相連結；新功能是可以依年份範圍篩選地點的地圖，用來幫老照片斷代；每週發電子報分享照片和故事。

**可借鏡**：「依年份範圍篩選」和「幫照片斷代」本身就是社群參與的理由。本專案的回憶可以讓訪客在別人的回憶下「補充」或「我也記得」，而不是只能各留各的。

**來源**
- https://gwulo.com/about-gwulo
- https://gwulo.com/explore
- https://old.gwulo.com/node/35528
- https://www.scmp.com/lifestyle/arts-culture/article/3266016/hong-kong-historian-behind-gwulocom-his-years-charting-city-and-why-hes-leaving

### 附記：搜尋過但找不到的
- **大稻埕**：只找到政大碩士論文（Unity + Leap Motion 的 VR / AR 歷史導覽）和淡江「數位迪化設計展」，沒有公開可以體驗的 3D 歷史重建。https://thesis.lib.nccu.edu.tw/thesis/detail/7270ab57b2e1ad51763abf680cc2368b/
- **1895 臺北府城 3D 重建**：沒有找到可信的作品；只有 1895 年隨軍攝影的寫真帖被拿來做數位上色的報導。https://www.storm.mg/article/3159574
- **西門町專屬的 3D 重建**：沒有找到。
- 這也表示：**一個可以自由走動的「1985–1999 西門町 / 中華商場時代」網頁 3D 街景，目前在公開網路上幾乎是空白**，這正是本專案的定位優勢。

---

## 給 Our Memory in Taipei 的啟示

1. **每條街段都選一個「錨點年」，並在畫面上寫出來。**（Rome Reborn 選 320 年，因為資料最多。）三個區段的範圍都很長（15–20 年），建議各自選一個資料最多的錨點年（例如西門町選 1992 年中華商場拆除前、大稻埕選某一年的年貨大街、信義選 101 跨年煙火的某一年），讓招牌、車輛、歌曲都對齊那一年，並在進入區段時的大字標題寫出「1992」這樣的年份，而不是只寫「1985–1999」。這樣混合年代的招牌就可以當成「記憶的疊層」來交代，而不會被看成錯誤。

2. **明確區分「真的」和「想像的」，並給觀眾看。**（Rome Reborn 的 Class I / II 分級、Venice 的不確定度評估、Unity 聖母院的尖塔。）在 photos.js 的 PHOTO CREDITS 面板旁加一個「這條街哪些是真的」說明：8 棟有授權照片的建築標成「依實景建模」，其他招牌、攤位標成「依記憶與風格創作」。風格化作品最大的風險是被誤以為在宣稱精確，誠實標示反而會增加可信度。

3. **讓訪客「站在老照片的攝影機位置上」。**（Smapshot 的六自由度相機還原、Historypin 的相機疊圖淡入淡出。）photos.js 現在是點了圓環才跳出平面面板。可以替每張授權照片多記一組 `cameraPos / lookAt`；點開時先把 walk.js 的相機平滑移到那個視角，再讓照片從 0 淡入到約 60% 不透明度，疊在 3D 場景上（像 Historypin 的 fade），最後才變成全幅面板。這是「古今對照」在 3D 網頁裡最自然的轉譯，成本只有每張照片兩個 Vector3。

4. **回憶燈籠要有「時間 + 地點」兩個座標，並且接受不完美的定位。**（OldNYC 的十字路口地理編碼、約 87% 定位率、回報錯誤的機制。）memories.js 已經有 year 欄位；可以再加一個選填的「在哪裡」（從三個區段或約 10 個地標中選一個），燈籠就掛在對應的建築旁，而不是隨機排列。審核時 CJ 可以順手修正位置，就像 OldNYC 的人工校正。

5. **讓訪客先找到「自己的那一格」。**（中研院團隊觀察到讀者第一件事是找自己家；Gwulo 的依年份篩選。）在公布欄或進入流程加一個「你是哪一年來到臺北的？」的年份選擇，選了之後，直接把訪客帶到那一年對應的街段位置，並亮起同一年的燈籠。這比讓訪客在 40 年中盲目走動更快產生情感連結。

6. **用「站點」式的導覽，把自由走動和電影式導覽接起來。**（Discovery Tour 的 stations、地圖上非常顯眼、角色擔任導覽員。）自由走動模式（walk.js）目前沒有結構。可以把 app.js 導覽電影中的幾個關鍵段落做成街上的 6–10 個「站點」（地上一圈光加一個小標），走進去就播放那一段的大字和音樂（music.js 對應年代的歌）。導覽員可以就是那個小女孩角色，或公布欄前的一位老人。

7. **加入「時間證據」級的細節，而不是全面寫實。**（《天橋上的魔術師》美術：舊日期報紙、卡帶陳列、鐵捲門鏽斑、舊廣告；外國攝影師照片中的「雜亂氣味」。）在保持低多邊形和粉彩風格的前提下，每個區段只挑 3–5 個「一眼就認出年代」的道具，用 canvas 畫出來：西門町的報紙頭版日期、錄音帶架、手寫價目板；大稻埕的年貨價格牌；信義的悠遊卡感應機。這些比提高模型精度更能喚起記憶，成本也低。

8. **讓街上有「當年的人」。**（PC Gamer 評九龍城寨 Minecraft：最缺的是人；城寨公園展覽讓觀眾和居民的「回憶片段」互動。）廣場已經有老人，但三個街段可能還很空。可以每段放 2–4 個會循環做動作的低模人物，動作要符合年代：西門町的騎機車少年、排隊看電影的人；大稻埕挑年貨的人；信義拿手機自拍的人。不需要寫實，只要姿勢對。

9. **年代轉場用「同一個地點、不同時間」的疊化，而不是只換場景。**（JuxtaposeJS / Historypin 的古今對照、Venice Time Machine 把時間當成資料維度。）在區段交界處，選一個三個年代都存在的元素（例如一根電線桿、一棵行道樹、一塊路牌），讓它在轉場時保持不動，周圍的建築淡出再淡入；或在那個點放一個可拖動的 before / after 滑桿，用 two-pass render 或 clipping plane 切開兩個年代。這會把「同一條街走過 40 年」這個核心概念講得更清楚。

10. **把中研院的歷史地圖當成真實底圖彩蛋，並先確認授權和資料關係。**（中研院 WMTS；Venice Time Machine 因資料授權爭議而被暫停。）可以在廣場的公布欄旁放一張「臺北舊地圖」立牌，用 1945 年美軍地圖或 1960 年代航照的圖磚截圖做貼圖，點擊後在地圖上標出三個區段的位置。使用前要先寫信確認授權條款，並像 photos.js 一樣列入 PHOTO CREDITS；訪客上傳的文字一律當純文字渲染（JuxtaposeJS 的 XSS 警告），避免 credit 或回憶欄位被注入 HTML。
