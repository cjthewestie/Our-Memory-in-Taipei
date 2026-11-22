---
title: Sculpture, statue and installation research for kind (B) event markers
kind: research
date: 2026-11-22
updated: 2026-11-22
---

# Sculpture, statue and installation art: references for event markers

Research for the builders of "Our Memory in Taipei" (three.js r149, global THREE). It covers kind (B) pieces: event markers, showcase headers and gate boards that must never be plain name plates. CJ, 2026-11-22: 「反正這些招牌 字都是要設計過的可以是海報雕像或是裝置藝術攤位 可以去做大量研究要非常豐富就對了這種無聊的招牌絕對不能出現就對了」.

How to read the labels:
- **measured**: the fact comes from a page opened or a search result read during this research on 2026-11-22. The URL is listed.
- **inferred**: my reading of that evidence, for example a typical proportion seen in the photos the source describes.
- **guess**: a design choice for our scene, with no source behind it. Every hex colour is a guess unless marked otherwise, because no source gives hex values.

Rules that still apply to every recipe: no trademarked logos or mascots, no likeness of a real person (a name in text is fine), no political content, and pictures drawn in code (canvas shapes, gradients, pictograms) or taken from `asset/textures/posters/`.

Total references: **49** (20 Taipei and Taiwan plus 10 world in sections 1 to 4; 13 Taiwan plus 6 world added in section 5, with two corrections).

---

## 1. Taipei MRT and station public art (permanent, built into the architecture)

### 1. 相遇時刻 (Moment of Encounter), Taipei 101/World Trade Center station, Huang Hsin-chien
- What it is: a giant mechanical book whose pages turn as travellers pass. Each page shows a traveller's encounter with Taiwan. **measured** (CNA)
- URL: https://www.cna.com.tw/culture/article/20200424w003
- Design recipe: a 3 m wide open book on a low dark plinth, with 8 to 12 thin page planes hinged on a spine (`BoxGeometry(1.4, 2.0, 0.01)`). Animate one page every 4 s with a sine ease. Each page carries a canvas drawing: the event's year in big digits (40% of page height), a pictogram scene, and a one-line caption at 6% height. Rich because the marker moves and every page is a different memory. Colours (guess): page paper `#F4EEDF`, ink `#1F2A44`, spine brass `#B08D57`. **inferred** for size: "giant" is the only size the source gives.

### 2. 舞台、月台 (Stage, Platform), Chiang Kai-shek Memorial Hall station
- What it is: a hanging curtain work (垂簾) in the station. **measured** (CNA)
- URL: https://www.cna.com.tw/culture/article/20200424w003
- Design recipe: a stage curtain made of 40 to 60 hanging vertical strips (`PlaneGeometry(0.12, 4)`) with a slight random sway. Part the strips in the middle to frame the event title like a stage opening. Put the date on a footlight bar at floor level, lit from below with a warm `PointLight`. Colours (guess): curtain `#8E1B2C` to `#C2453A` gradient, footlights `#FFD27A`. Fits a concert or award marker (for example the 2006 金曲獎 one) far better than a plate. **inferred**

### 3. 邂逅 (Encounter), Guting station
- What it is: a suspended hanging sculpture. **measured** (CNA)
- URL: https://www.cna.com.tw/culture/article/20200424w003
- Design recipe: hang 5 to 9 forms from thin cables (`CylinderGeometry(0.004, …)`) at different heights, between 2.5 m and 4 m, so the viewer walks under them. Each form is a cut-out letter or shape from the event. Read from below, together they spell the event. Colours (guess): brushed aluminium `#C9CDD2` with one accent colour per event. **inferred**

### 4. 偷窺 (Peeping), Gongguan station
- What it is: an interactive public artwork. The source says it is interactive but does not say how. **measured** (CNA)
- URL: https://www.cna.com.tw/culture/article/20200424w003
- Design recipe: a peephole box on a post at eye height (1.55 m). When the player walks close (under 1.2 m), a lit diorama inside appears through a round 8 cm hole (a `RenderTarget` or a small inner scene). The event title is engraved around the hole's rim. Rich because the story is hidden and found. **guess** for the mechanism.

### 5. 河道彎彎、花開燦爛、光之穹頂, Songshan station (Songshan Line)
- What it is: a light sculpture over the concourse's elliptical dome. Materials: stainless steel pipes, crystal glass and LED lights, with more than 52,000 LED lamps along the passage. It won the 6th Ministry of Culture Public Art Award. **measured** (search summary of the DORTS journal and Travel Taipei)
- URLs: https://ebook.dorts.gov.taipei/JRTST/ebook/no52/files/basic-html/page150.html · https://www.travel.taipei/en/attraction/details/641 · https://wikiwand.com/en/articles/Songshan_Airport_metro_station
- Design recipe: an ellipse of curved steel tubes (`TubeGeometry` along `CatmullRomCurve3`) like a winding river, studded with `InstancedMesh` glass beads (2,000 to 5,000 instances, emissive). Flower clusters of 6 petal sprites sit at the tube bends. Use it as a ceiling over a gate or showcase entrance, with the gate name formed by the bead pattern itself, not a board. Colours (guess): steel `#D7DBE0`, beads `#FFF6D8`, flower accents `#F7A6C1` and `#7FD3E6`.

### 6. Daniel Buren wall work, Banqiao station (New Taipei)
- What it is: a station wall with vertical stripes, geometric patterns and eight large motifs. **measured** (CNA)
- URL: https://www.cna.com.tw/culture/article/20200424w003
- Design recipe: Buren's stripes are always 8.7 cm wide (**guess**: from general knowledge, not this source). Use alternating 1:1 stripes of white and one colour on a column wrap or a wall. Cut a big geometric window (circle, square or triangle) out of the stripe field, and put the event's illustration in the window. Type sits on a solid colour band at 1/10 of the wall height. Rich because the stripes make a strong rhythm you notice from far away. Colours (guess): `#FFFFFF` with `#E2342F`, `#1F6FB2` or `#F2B705`.

### 7. 雙連．行遠, Shuanglian station (1993)
- What it is: the first public artwork in a Taipei MRT station, installed in 1993. **measured** (CNA, which gives no form)
- URL: https://www.cna.com.tw/culture/article/20200424w003
- Design recipe: none from the source. Use it only as a dating fact: station art in Taipei starts in 1993, so a marker for an event before 1993 should not look like MRT art. **inferred**

---

## 2. Temporary festival installations in Taipei (白晝之夜, 台北燈節, 地景藝術)

### 8. 福蛇豆豆 (Blessing Snake Doudou), main lantern, 2025 Taipei Lantern Festival, Zhongshan Hall plaza
- What it is: a main lantern over 13 m tall. Auspicious clouds wrap a snake, mixed with Ximending graffiti and street style. It rotates 360 degrees, has smoke effects and moving eyes, and plays a show every half hour from 18:00 to 22:00. Its motifs include DJ music symbols, the bell of the Nishi Hongan-ji temple and the Taipei 101 silhouette. A graffiti artist, 祁孟含 (阿奈), co-designed it. **measured** (CNA, search summary of CW and others)
- URLs: https://www.cna.com.tw/news/aloc/202501020272.aspx · https://www.cw.com.tw/article/5133593 · https://news.pts.org.tw/article/731848
- Design recipe: a coiled body made of 6 to 8 stacked torus segments (`TorusGeometry`) rising up a central column on a round 1:4 (height to width) drum base. Each segment carries a canvas texture of graffiti-style tags (thick outline 6% of letter height, drop shadow, spray dots). Cloud scrolls are flat extruded `Shape`s around the base. Slow `rotation.y` (one turn per 60 s) and a timed light show (emissive pulse). Colours (guess): body `#F5C518` and `#E8453C`, graffiti outline `#1A1A1A`, cloud `#FFFFFF` edged `#2BB3C0`. Rich because it has layers: base, clouds, body, motifs and a show.

### 9. 城現光龍, main lantern, 2024 Taipei Lantern Festival, Ximen Red House plaza
- What it is: a gold "dragon king of light" about three storeys, around 10 m tall, with a light show every half hour. Sources disagree on the material: one says pure metal, another says paper art by paper artist 杜清祥 ("一紙成型", one sheet into one form). The festival had 123 lantern sets from Ximen to Beimen. **measured** (search summary, Taiwan News)
- URLs: https://www.taiwannews.com.tw/zh/news/5096599 · https://www.businessweekly.com.tw/style/blog/3014669 · https://www.cw.com.tw/article/5129321
- Design recipe: "one sheet folded" means faceted planes. Build the body from a low-poly `ExtrudeGeometry` with `flatShading: true`, so each facet catches light like folded paper or plate metal. Scales are an `InstancedMesh` of small triangles. Mount it on a stepped octagon plinth (3 steps, each 0.3 m tall). Colours (guess): gold `#D4A437` with metalness 0.8, roughness 0.35, facet edges `#FFF1B8`. **inferred**

### 10. 龍來台灣 (Dragon Comes to Taiwan), main lantern, 2024 Taiwan Lantern Festival, Tainan high-speed rail area
- What it is: a gold dragon 18 m tall, 22 m with its base. It was made of carbon-60 and recycled EVA film and was solar powered. Designer Peng Li-chen drew on the stone dragon pillars of a Tainan temple (sources disagree which temple). It took about three months to build. **measured** (search summary)
- URLs: https://taipeitimes.com/News/taiwan/archives/2024/01/04/2003811603 · https://focustaiwan.tw/society/202401030019 · https://philstar.com/arts-and-culture/2024/02/26/2336271/photos-taiwans-lantern-festival-comes-tainan
- Design recipe: the ratio matters: a base 4 m out of 22 m (about 18%). The figure coils round a pillar, like temple dragon columns. Use a `TubeGeometry` spiral around a `CylinderGeometry` column, with a carved-stone texture on the column and glowing translucent film on the body (`MeshPhysicalMaterial` with `transmission: 0.4`). Colours (guess): body `#E9B83B`, glow `#FFE28A`, column `#8A8378`.

### 11. Moon Haze, 2016 Nuit Blanche Taipei
- What it is: a 10 m inflatable moon by Feng Jiacheng and Huang Yuanbei. The 2016 edition ran from the North Gate to 228 Peace Memorial Park. **measured** (search summary, Taipei Times / LTN)
- URLs: https://news.ltn.com.tw/amp/news/focus/breakingnews/2570096 · https://www.taipeitimes.com/News/taiwan/archives/2016/10/02/2003656369
- Design recipe: a 10 m sphere (`SphereGeometry(5, 64, 32)`) floating 1.5 m off the ground on short tethers. A canvas crater texture, emissive, lit from within. People sit on the grass under it, so add low cushions or a ring of mats. Put the event name on a small cast plate at the tether anchor, never on the moon. Colours (guess): `#F3EBD3` glowing, shadow craters `#C9BFA6`, night sky `#0E1330`.

### 12. Lily, WERC, 2016 Nuit Blanche Taipei, 228 Peace Memorial Park pond
- What it is: small microprocessor "organisms" spread over the pond that talk by radio and make their own choices. **measured** (Taipei Times)
- URL: https://www.taipeitimes.com/News/feat/archives/2016/09/29/2003656147
- Design recipe: 30 to 80 small floating lily-pad discs (`CircleGeometry(0.3)`) on a water plane, each with a blinking LED dot. Make the blink spread from neighbour to neighbour (a simple contagion rule each frame), so light ripples across the pond when the player arrives. Event title carved into a stone edge of the pond at 0.6 m height. Colours (guess): pads `#2E6B3F`, LEDs `#9BFFCF`, water `#0D2430`.

### 13. 角演論 (Unicorn of Evolution and Ethics), Ponga Huang, and Cycling Wheel: The Orchestra, Keith Lam, 2017 Nuit Blanche Taipei
- What it is: Huang's piece stood in 228 Peace Memorial Park. Lam's was a street work built around bicycle wheels. **measured** (search summary, LTN / Taipei Times)
- URLs: https://news.ltn.com.tw/news/focus/breakingnews/2570096 · https://www.taipeitimes.com/News/taiwan/archives/2017/10/08/2003679953
- Design recipe (wheels): a row of 6 to 12 upright bicycle wheels on stands, each spinning, with light strips on the rims and spokes casting moving shadows. The wheel hubs carry the date digits, one digit per wheel. Colours (guess): rim light `#FF3FA4`, `#3FD0FF`, spokes `#C0C0C0`. **inferred** for the light strips: the name "Orchestra" says sound, the source gives no form detail.

### 14. Thousands of small ice figures, 2023 Nuit Blanche Taipei, Sun Yat-sen Memorial Hall (Xinyi)
- What it is: thousands of 20 cm ice figures about climate change, which visitors helped place. 2023 was the first Xinyi edition, theme "Rise Up", 25 installations, about 400,000 people. **measured** (search summary, Taipei Times)
- URLs: https://taipeitimes.com/News/taiwan/archives/2023/10/06/2003807290 · https://www.bnext.com.tw/article/76972/nuit-blanche-xinyi-district
- Design recipe: an `InstancedMesh` of 500 to 2,000 tiny figures (0.2 m) arranged on stepped risers like an audience, all facing one point. Translucent ice material (`transmission: 0.9`, `roughness: 0.15`). The title is the shape the crowd makes when seen from a raised viewpoint. Rich because scale and repetition tell the story. For a crowd event (北投公園 2016 抓寶人潮), use 300 small figures all looking down at glowing phone rectangles. Colours (guess): ice `#D8F1FF`, light from below `#7FC8FF`.

### 15. 記憶的殘響 (Echoes of Memory), 蔡咅璟, 浮島光景 2025, Expo Park (Yuanshan)
- What it is: rebuilt remains of the old zoo (a ticket booth, animal cages, the elephant house) that play sounds. They are painted with glow paint, so at night people draw on them with phone torches and take photos. It belonged to a set of 5 landscape works round MRT Yuanshan station, 2025-10-17 to 11-09. **measured** (search summary of Smile Taiwan, page itself returned 403)
- URLs: https://smiletaiwan.cw.com.tw/article/8577 · https://wantrich.chinatimes.com/news/20260205900127-420501
- Design recipe: rebuild a real small structure from the place's past (booth, cage, stall) at full scale, in a single colour like a ghost. Glow texture that records "paint" where the player's torch cone touches (a canvas texture updated by a raycast). A short sound loop near it. Colours (guess): ghost body `#E8F0E4`, glow paint `#B6FF5C` and `#5CF2FF`. This is the best model for a "place memory" marker.

### 16. Paper-cut tent (紙雕帳篷), 成若涵, 心中山生活節, Zhongshan linear park
- What it is: a paper-carved tent showing everyday Taiwanese life, set in front of the MRT office in the Zhongshan linear park. **measured** (CNA)
- URL: https://www.cna.com.tw/culture/article/20200424w003
- Design recipe: a tent (cone or ridge shape) whose walls are paper-cut panels: canvas textures with `alphaTest` so the cut-outs are holes. A light inside throws the cut scenes onto the ground. Scenes are pictograms of the event (a stage, scooters, a night market). The title is cut into the door flap at 12% of flap height. Colours (guess): paper `#FFFDF7`, inner light `#FFC86B`, ground shadow pattern from the cut-outs. Rich because it works both as an object and as projected shadow.

### 17. Walking Men Taipei, Maya Barkai, Very Fun Park 2018, Xinyi (Fubon A25 site)
- What it is: over 140 pedestrian-signal figures from cities around the world on a 400 m site fence, 28 of them redone as green-wall plants. **measured** (walking-men.com)
- URLs: https://walking-men.com/?p=1232 · https://artsandculture.google.com/asset/walking-men-taipei-maya-barkai/8AGhhMuLnJwEOA?hl=en
- Design recipe: a long hoarding wall made of square lit panels (1 m by 1 m, black ground), each with one different walking-figure pictogram drawn in code (canvas paths, green or white light). Every 5th panel is a "plant" version (green leaf texture). One panel in the run holds the event title and year in the same pictogram style. Colours (guess): panel `#111111`, walk green `#36E07A`, white `#F2F2F2`. Rich through repetition with variety.

### 18. Giant's Many Chairs and Time Travel Vehicle, Li Cheng Liang, Xinyi 2019; Taipei 101 manhole covers (2013)
- What it is: a giant sculpture of chairs and a huge "extraterrestrial" vehicle installation shown in Xinyi in 2019. Taipei's first custom manhole covers, from 2013, show Taipei 101. **measured** (search summary of Culture Trip; the page itself timed out)
- URLs: https://theculturetrip.com/asia/taiwan/articles/the-best-places-to-see-public-art-in-taipei · https://www.taiwannews.com.tw/en/news/6253345
- Design recipe (chairs): oversize furniture is an easy, strong story. Stack 5 to 7 chairs 3 to 6 m tall in a tower that leans; players walk under the seat. Make the chair type match the event (folding plastic stools for a night market, cinema seats for a film). Design recipe (cover): a round 0.6 m disc set in the floor with a relief pattern drawn from the event; it is a "plate" people step on, so it adds detail without a board. Colours (guess): plastic stools `#E53935`, `#1E88E5`, cast iron `#3A3A3A`.

### 19. Taichi series, Ju Ming (朱銘)
- What it is: bronze figures cast from styrofoam and wood moulds, so they keep a boxy, chopped look. Outdoor pieces are over 2 m; small editions are about 35 to 92 cm. Often shown in public spaces. **measured** (search summary of Taipei Times, Christie's, Ocula)
- URLs: https://taipeitimes.com/News/feat/archives/2001/04/08/0000080922 · https://ocula.com/artists/ju-ming/ · https://www.christies.com.cn/lot/lot-5323007
- Design recipe: the look is "blocks". Build an anonymous figure (never a real person) from 8 to 15 rough `BoxGeometry` pieces at slight angles, with visible saw-cut faces. Bronze material with dark patina `#4A3B2A`, rubbed highlights `#9C7A4B`. Low rough-stone plinth (0.4 m), with a cast bronze plate set flush into the stone: title at 1/3 of plate height, date below at 1/6. Fits a sports or dance moment shown as a pose.

### 20. Dome of Light (光之穹頂), Narcissus Quagliata, Formosa Boulevard station, Kaohsiung
- What it is: a stained-glass dome about 30 m across, 670 m², made by Derix in 16 segments of up to 72 panels (1,137 panels in total; another source says 4,500). It sits at B1 where the Red and Orange lines meet. **measured** (search summary of Derix and Atlas Obscura)
- URLs: https://www.derix.com/us/portfolio-items/stained-glass-dome-at-formosa-boulevard · https://www.atlasobscura.com/places/the-dome-of-light · https://theculturetrip.com/asia/taiwan/articles/the-story-behind-formosa-boulevards-dome-of-light
- Design recipe: a canopy split into 16 radial segments; each segment is a canvas texture of coloured glass cells with lead lines (`#222` strokes 3 px). Segments tell the story in order round the circle, like a clock: before, during, after. Back-light with emissive so colours glow. Colours (guess): `#D7263D`, `#F49D37`, `#1B998B`, `#2E86AB`, `#3F1F69`. Kaohsiung, not Taipei: use it for scale and segment logic only.

---

## 3. World examples: everyday-life bronzes and statues with a story

### 21. Čumil (the "Man at Work"), Viktor Hulík, Bratislava, 1997
- What it is: a bronze man in a hard hat leaning on his arms as he looks out of a manhole, at the corner of Panská and Rybárska brána. Among the city's most photographed sights; people rub his nose for luck. **measured** (search summary of Wikipedia, Visit Bratislava, Laughing Squid)
- URLs: https://en.wikipedia.org/wiki/%C4%8Cumil_(statue) · https://www.atlasobscura.com/places/cumil-the-sewer-worker · https://laughingsquid.com/man-at-work-sculpture-bratislava-slovakia/
- Design recipe: a figure at street level, no plinth, half out of a real object (manhole, scooter seat, ticket booth window). Life size. A shiny worn patch where people touch (lighter bronze `#C89B5A` on dark `#5A4630`). A small round floor plate next to it with the title. Rich because it is funny, low and touchable.

### 22. Fearless Girl, Kristen Visbal, New York, 2017
- What it is: a 130 cm bronze girl, hands on hips, chin up. A plaque at her feet; when she moved, a round bronze plaque with two footprints was left at the old spot saying "stand for her". **measured** (search summary of Wikipedia, CBS, UPI)
- URLs: https://en.wikipedia.org/wiki/Fearless_Girl · https://www.cbsnews.com/amp/newyork/news/fearless-girl-statue-wall-street · https://www.upi.com/Top_News/US/2018/12/10/Fearless-Girl-finds-new-home-at-NYSE/8471544453055/
- Design recipe: the plate idea, not the figure. A round bronze floor plaque (0.6 m) with two footprints cast in it, and the event text running round the rim in a circle. The player stands in the footprints and the camera frames the scene the way the event happened. Colours (guess): bronze `#8C6A3F`, polished letters `#D9B77A`. This turns "a plate" into an action.

### 23. Spoonbridge and Cherry, Claes Oldenburg and Coosje van Bruggen, Minneapolis, 1988
- What it is: a giant spoon with a cherry over a small pond, 9 × 15.7 × 4.1 m, stainless steel and aluminium with polyurethane enamel; water spouts from the cherry stem and the spoon tip; the pond is shaped like a linden seed. **measured** (Wikipedia)
- URL: https://en.wikipedia.org/wiki/Spoonbridge_and_Cherry
- Design recipe: blow up one everyday object from the event to 10 to 20 times its size (a ticket stub, a bowl of beef noodles, a karaoke mic, a phone). Glossy enamel material (roughness 0.2). Set it in a shaped pool or flower bed whose outline repeats a second motif. Colours (measured as names: grey spoon, red cherry, black stem; hex guess): `#9EA3A8`, `#C8102E`, `#111111`.

### 24. Nomade, Jaume Plensa, Antibes, 2007 (permanent 2010)
- What it is: a seated figure about 8 m tall (800 × 550 × 530 cm) made of an open lattice of white painted stainless-steel letters; people walk inside it. **measured** (search summary of Plensa's site, Sculpture Magazine, Art in Context)
- URLs: https://jaumeplensa.com/works-and-projects/public-space/nomade-2010 · https://mymodernmet.com/jaume-piensa-nomade/ · https://artincontext.org/jaume-plensa/
- Design recipe: this is the typographic sculpture. Sample points on a simple hollow shape (a crouching anonymous figure, a cupped hand, a speaker, a hot-spring bucket) and place a 3D letter at each point (`TextGeometry` or extruded canvas-traced glyphs, 0.15 to 0.4 m), mixing Chinese characters from the event's words with Latin letters. Leave gaps so light passes. White `#F7F7F2` steel, warm uplights `#FFE3A3` at night. The words of the event become the body. Rich in detail and in meaning.

### 25. Cloud Gate, Anish Kapoor, Chicago
- What it is: a 10 × 20 × 13 m, about 100 t mirror-polished stainless shell of 168 plates, with a 3.7 m arch to walk under and a concave "omphalos" that multiplies reflections. **measured** (Wikipedia)
- URL: https://en.wikipedia.org/wiki/Cloud_Gate
- Design recipe: a smooth, bean-like blob (`SphereGeometry` scaled and bent in the vertex shader, or a `LatheGeometry`) with `MeshStandardMaterial` metalness 1, roughness 0.05 and a `CubeCamera` env map. Use it as a gate the player walks under. The gate name is never on the mirror: it is set in the floor under the arch, so it shows up in the reflection. Colour: the sky and the city around it.

---

## 4. World examples: light, interactive and giant-lantern installations

### 26. Crown Fountain, Jaume Plensa, Chicago, 2004
- What it is: two 15.2 × 7.0 × 4.9 m glass-block towers (about 22,500 white blocks) facing each other over a 15 × 71 m black granite pool only millimetres deep; LED screens on the inner faces; water spills down and spouts from 3.7 m up; it became a children's water park within hours. **measured** (Wikipedia)
- URL: https://en.wikipedia.org/wiki/Crown_Fountain
- Design recipe: two towers facing each other across a thin mirror pool. **Do not show faces** (the real piece shows real people, which our rules forbid). Instead, the screens show the event's own graphics: date digits counting up, pictograms, colour fields. A water sheet down each face (scrolling alpha texture). Glass-block texture as a grid of 1:2 cells with faint rims. Colours (guess): blocks `#EEF3F5`, pool `#0B0B0D`, screen content in event colours.

### 27. Impulse, Lateral Office with CS Design, Montréal, 2015-16
- What it is: 30 seesaws of different sizes in Place des Festivals that give off light and music when used, together acting as one instrument; nine light projections around them. It has toured Lugano, London and New York. **measured** (search summary of Dezeen, ArchDaily, Daniels Faculty)
- URLs: https://www.dezeen.com/2015/12/17/impulse-lateral-office-cs-design-installation-montreal-glowing-seesaws/amp/ · https://mymodernmet.com/impulse-seesaw-installation · https://daniels.utoronto.ca/news/2016-03-07/lateral-office-transforms-montreals-art-district-playful-installation
- Design recipe: a field of 12 to 30 seesaw beams (`BoxGeometry(3, 0.1, 0.4)` on a pivot). Each one rocks when the player steps on it and its ring of LEDs changes colour and plays one note. The event title is spelt across the seesaws, one character on the side of each. Colours (guess): beams `#FFFFFF`, LED rings cycling `#FF2E63`, `#08D9D6`, `#FFD460`. Rich because the player plays it.

### 28. Field of Light, Bruce Munro
- What it is: thousands of acrylic stems with fibre-optic cable, each topped with a glass or frosted sphere, lit by projectors or solar power: 6,000 at Eden Project 2008, 18,000 at Longwood, 50,000 at Uluru (380 km of fibre, 36 solar panels). **measured** (search summary of Dezeen, Smithsonian, Longwood)
- URLs: https://www.dezeen.com/2008/11/12/field-of-light-by-bruce-munro-2/amp/ · https://www.smithsonianmag.com/smart-news/field-light-surrounds-iconic-australian-rock-180964906/ · https://longwoodgardens.org/blog/2022-06-10/shedding-light-light
- Design recipe: an `InstancedMesh` of 2,000 to 8,000 thin stems (0.6 to 1 m) with small spheres, emissive colour drifting slowly through a palette with a noise function. A path runs through the field. Seen from one raised spot, the colours form the event's year or a symbol. Colours (guess): `#7A5CFF`, `#FF6FB5`, `#59E3FF`, `#FFFFFF`.

### 29. Umbrella Sky Project, Sextafeira, Águeda (Portugal), from 2011
- What it is: colourful umbrellas hung over Rua Luís de Camões and other narrow streets each summer for the ÁgitÁgueda festival, white lit ones at Christmas; it was made to bring people to shopping streets. Copied in more than 60 cities. **measured** (search summary of PPS, Colossal, Komoot)
- URLs: https://www.pps.org/places/umbrella-sky-project · https://www.thisiscolossal.com/2012/08/a-canopy-of-colorful-umbrellas-spotted-in-portugal/ · https://www.archpaper.com/2012/08/festival-floats-hundreds-of-umbrellas-over-the-street-of-a-portuguese-town/
- Design recipe: a canopy over an alley, 5 to 6 m up: 100 to 300 open umbrellas (a cone of 8 segments with a handle) on cables, random tilt of ±15°, casting coloured shadows (`transparent` with low opacity so the light tints the ground). Swap umbrellas for the event's own object: paper lanterns for a temple fair, glow sticks for a concert, folded paper fans. One "plate" hangs among them as a hanging banner. Colours (guess): `#FF595E`, `#FFCA3A`, `#8AC926`, `#1982C4`, `#6A4C93`.

### 30. Nebuta floats, Aomori Nebuta Matsuri (Japan)
- What it is: giant lit float lanterns, now on wire frames (once bamboo) lit with bulbs from generators (once candles), showing warriors, gods and figures from stories; they parade on 2-7 August and are kept all year at the Wa Rasse museum. **measured** (Wikipedia)
- URLs: https://en.wikipedia.org/wiki/Nebuta_Matsuri · https://en.wikipedia.org/wiki/Taiwan_Lantern_Festival
- Design recipe: a wide, low lantern on a wheeled cart (about 9 m wide × 5 m tall × 7 m deep: **guess**, the source gives no size). Body is a wire frame (dark lines drawn on the texture) over translucent paper painted with bold black outlines and flat strong colours, lit from inside. The subject is the event told as a scene, with anonymous figures. A painted name board on the front of the cart in brush lettering. Colours (guess): outline `#111`, red `#D7263D`, blue `#1E5AA8`, skin `#F4D2A5`, glow `#FFEFC2`.

---

## 5. Second pass (2026-11-22): more Taiwan pieces, more world pieces, two corrections

Added by a second research run. Same label rules as above. Numbering continues from #30.

### Corrections to earlier entries
- **#11 Moon Haze is 2018, not 2016.** The Taipei Times feature on the third edition (2018) lists *Moon Haze* (馮嘉城, 黃苑倍), a 10 m inflatable moon near Nanjing E Rd and Linsen N Rd whose brightness follows the PM2.5 level in the air. **measured** (page opened). URL: https://www.taipeitimes.com/News/feat/archives/2018/10/04/2003701684 . Recipe addition: tie the moon's emissive intensity to a slow sine or to a scene value, so it visibly "breathes".
- **#30 Nebuta has a size after all.** Floats are about 9 m wide, 7 m deep, 5 m high and weigh about 4 t; washi is pasted over a wire frame and outlined with sumi ink; 400 to 1,500 bulbs or LEDs sit inside, placed so the frame casts no shadow outward. **measured** (search summary of nippon.com, National Geographic, MLIT). URLs: https://nippon.com/en/guide-to-japan/gu008001 · https://www.nationalgeographic.com/travel/article/nebuta-festival-aomori-lanterns-japan-summer · https://www.mlit.go.jp/tagengo-db/en/R1-01048.html . Recipe addition: the ratio is 9 : 7 : 5 (width : depth : height), so it reads wide and low, not tall.

### 31. 玉兔壯彩 (robot jade rabbit), main lantern, 2023 Taiwan Lantern Festival, Sun Yat-sen Memorial Hall (Xinyi), AKIBO 李明道
- What it is: a 22 m rabbit in a space suit, a "robot" form with digital effects, turning 360° on a mechanical turntable. The festival drew 12.56 million visits. **measured** (search summary of TVBS, CommonWealth)
- URLs: https://news.tvbs.com.tw/travel/2034010 · https://city.gvm.com.tw/article/99171 · https://www.cw.com.tw/article/5124449?template=fashion
- Design recipe: a big character built from simple rounded solids (capsules, spheres, a visor torus), about 3 to 4 heads tall, on a round turntable plinth (diameter 0.6 × figure height) that rotates at 1 turn per 40 s. Panel lines on the suit as dark grooves on a canvas texture; emissive strips along the seams. The year's animal must be our own anonymous design, never a known mascot. The event text runs round the turntable rim in a ring, cap height 4% of figure height. Colours (guess): suit `#F4F6FA`, seam light `#4FD8FF`, visor `#1B2340`, accent `#FF5E7E`.

### 32. Paradise (infinity), main lantern, 2025 Taiwan Lantern Festival, Taoyuan, AKIBO 李明道
- What it is: an 18 m abstract infinity symbol shaped like a roller-coaster track, combined with spheres and geometric shapes, inspired by theme parks. **measured** (search summary of Taipei Times, Taiwan News)
- URLs: https://www.taipeitimes.com/News/front/archives/2025/01/04/2003829625 · https://www.taiwannews.com.tw/en/news/6006607 · https://focustaiwan.tw/culture/202501030016
- Design recipe: an abstract marker with no figure at all. A `TubeGeometry` along a lemniscate curve (x = a·cos t / (1+sin² t), y = a·sin t·cos t / (1+sin² t)), tilted 20° and lifted on 3 to 4 thin columns; 6 to 10 spheres of different sizes threaded on it. Run a light pulse along the tube (a moving band in a shader or scrolling emissive texture), like a coaster car. Good for a "night that never ended" type of event. Colours (guess): tube `#FF3D7F` to `#FFB300` gradient, spheres `#7C4DFF`, `#00E5FF`, `#FFFFFF`.

### 33. 世人皆可成龍, 2024 Taipei Lantern Festival, North Gate area, 小松美羽 with curator 劉治良
- What it is: an outdoor immersive lantern set based on the artist's own painting of the same name, in the North Gate area. The same festival's main lantern 城現光龍 (#9) was pure metal, 10 m tall, with a 3-minute light and sound show every 30 minutes. **measured** (search summary of Mirror Media)
- URLs: https://www.mirrormedia.mg/story/amp/20240104cnt003 · https://www.cw.com.tw/article/5129321
- Design recipe: turn a flat painting into walk-in space. Cut one painting (drawn in code: bold brush strokes on canvas) into 4 to 6 layered planes set 1.5 to 3 m apart, largest at the back, so the picture only lines up from one standing spot (mark that spot with a floor disc). Back-light every layer. Add a timed show: every 60 s all layers dim, then light up front to back over 3 s. Colours (guess): ink `#141414`, vermilion `#D93A2B`, gold `#E8B54A`, night blue `#0F1B3D`.

### 34. Cycle-90° 與風對話 (Dialogue with the Wind), 松本薰, Fuxing Social Housing, Wanhua
- What it is: a wind-driven kinetic sculpture, 633.5 cm high with a 445 cm turning diameter, in stainless steel, titanium and bearings, on the site of the old Zhongxing Elementary School; it is about wind carrying soil and messages, linking past pupils with new residents. **measured** (page opened)
- URL: https://artsh.gov.taipei/base/1971/
- Design recipe: a tall thin mast (height : turning width ≈ 1.4 : 1) carrying 2 to 3 arms that rotate slowly on different axes, each arm ending in a curved blade. Rotation speeds 0.1 to 0.3 rad/s, out of phase, so the shape keeps changing. Brushed steel (metalness 1, roughness 0.35) with one titanium arm tinted `#8FA3B8`. The event text is laser-cut through one blade, so it only reads when that blade faces you. Plinth: a low round concrete drum, 0.3 m high.

### 35. 流亭, 梁豫漳 with 禾磊設計, 廣慈博愛園區 (Xinyi)
- What it is: a weathering-steel sculpture that oxidises over time to form its own protective rust skin. **measured** (search summary of the Taipei public art platform)
- URL: https://artsh.gov.taipei/base/1815/
- Design recipe: a pavilion-like form (流亭 = "flowing pavilion") of 6 to 10 bent weathering-steel sheets, curved like a ribbon, that you can step under. Rust texture: a canvas noise from `#6B2F14` to `#B5541E` with darker streaks running down. The text is cut out of the steel as a stencil, so light makes the letters on the ground. Rich because the material itself shows time passing.

### 36. 大力助手 (The Great Assistant), Marco Casagrande, Cathay (忠泰) campus, Shimin Blvd × Jianguo S Rd
- What it is: a figure that mixes a Finnish snowman with Japanese bonsai: a wood head, a stone body, a copper base, white water-wood shrubs growing on its arms, arms open in welcome. For New Year the team 溫度物所 dressed it all over in green foliage dotted with pink and yellow flowers. **measured** (page opened)
- URL: https://www.taiwannews.com.tw/zh/news/4394323
- Design recipe: a three-part stacked figure, each part a different material (wood sphere head, rough stone body, green copper drum base `#4E8C7A`), with real plants (instanced leaf cards) growing from the arms. Give it a seasonal costume layer that changes per event: foliage and flowers for spring, knitted scarf for winter, festival ribbons for a fair. One figure, many dressings, is how a site marker can change for each event without becoming a plate. The plate is a copper band round the base, text in raised capitals at 25% of band height.

### 37. 西門印象, MRT Ximen exit 4 (2014)
- What it is: an installation that "rebuilds" the lost West Gate of the old Taipei city wall, made for the city's 130th anniversary in 2014. **measured** (search summary of The News Lens)
- URL: https://www.thenewslens.com/article/84422
- Design recipe: the ghost outline of a building that is gone. Draw the gate tower's silhouette (base, gate arch, two-tier roof with upturned eaves) as a frame of thin steel members only, no walls, at full scale; people walk through the arch. Light the outline edges at night. The date of the lost building and the date of the event sit on a cast plate set into the threshold. Colours (guess): frame `#2B2B2B` by day, edge light `#FFD08A` at night. This is the best gate recipe for a place whose history is gone.

### 38. Let us hug each other today!, 蔡潔莘 (Tsai Chieh-hsin), 2018 Nuit Blanche Taipei, Shuangcheng Children's Park
- What it is: a large fibreglass sculpture in a children's park. The Taipei Times names material and site only. **measured** (page opened); the form, two figures embracing, is **inferred** from the title.
- URL: https://www.taipeitimes.com/News/feat/archives/2018/10/04/2003701684
- Design recipe: a giant soft-looking pair of anonymous rounded figures, 4 to 6 m, glossy fibreglass (roughness 0.25, clearcoat 1) in candy colours, low enough for children to sit on its feet. Seams between parts as thin dark grooves. Colours (guess): `#FF8FB1`, `#FFD166`, `#7BDFF2`.

### 39. Inside Out Project, JR, 2023 Nuit Blanche Taipei
- What it is: over 1,000 large paper portraits of people photographed the month before, pasted on the façade of Taipei City Hall and at sites across the city. **measured** (page opened)
- URL: https://taipeitimes.com/News/taiwan/archives/2023/10/06/2003807290
- Design recipe: the paste-up wall, not the faces. Our rules forbid real likenesses, so fill the grid with anonymous things from the event: hands holding tickets, shoes in a queue, backs of heads watching a stage, phone screens. Black-and-white halftone canvas textures, each poster 1 : 1.4, pasted slightly crooked with torn edges (alpha noise) and overlapping by 2 to 5%. One poster in the grid, printed larger (3 × 3 cells), carries the event title in bold sans. Colours: `#111111` ink on `#F2EEE6` paper, glue stains `#D9CFB8`.

### 40. On Blank Page, Luzinterruptus, 2022 Nuit Blanche Taipei (Shilin)
- What it is: a large light piece by the Spanish collective where visitors added messages that were then projected onto the work. Twenty installations across four sites that year. **measured** (search summary of Taipei Times)
- URL: https://taipeitimes.com/News/taiwan/archives/2022/09/18/2003785516
- Design recipe: a field or wall of glowing blank sheets (100 to 400 `PlaneGeometry(0.21, 0.30)`, A4 ratio) hung on strings or stacked like a paper drift, lit from inside. On a few of them, short handwritten-style lines appear and fade, like visitors' notes about the event (we write them, generic, never real names). Colours: paper glow `#FFF8E7`, shadow `#C8BFA8`, handwriting `#2A3550`.

### 41. Rubber Duck, Florentijn Hofman, Kaohsiung (Sept 2013) and Keelung (Dec 2013)
- What it is: an inflatable yellow duck about 18 m tall floating in the harbour (Wikipedia lists 25 × 18 × 18 m); the Keelung duck burst during its run, which became news. **measured** (search summary of Wikipedia, NPR, Taipei Times)
- URLs: https://en.wikipedia.org/wiki/Rubber_Duck_(sculpture) · https://www.npr.org/sections/thetwo-way/2013/12/31/258660950/how-deflating-huge-rubber-duck-goes-flat-in-taiwan · https://www.taipeitimes.com/News/taiwan/archives/2013/07/25/2003568125
- Design recipe: the lesson is "one toy, blown up, on water". Do not copy the duck itself (it is the artist's work); pick the event's own everyday object (a bubble-tea cup, a paper boat, a red envelope) and float it 15 to 20 m tall on a water plane with a slow bob (y = 0.2·sin(t·0.6)) and a small tilt. Inflatable look: smooth normals, soft specular, visible seams. The title is on a small floating buoy or the pier railing, never on the object.

### 42. LOVE and 1-0, Robert Indiana, Taipei 101
- What it is: a red LOVE letter sculpture outside Taipei 101 where tourists pose, and the multicoloured number piece *1-0* (aluminium, 2002) in the lobby. **measured** (search summary of Waymarking, Focus Taiwan, Wikipedia list)
- URLs: https://www.waymarking.com/waymarks/wmB55N_LOVE_by_Robert_Indiana_Taipei_Taiwan · https://focustaiwan.tw/photos/20261102ENP0001m · https://en.wikipedia.org/wiki/List_of_Love_sculptures
- Design recipe: the idea is "the word is the sculpture", not this word. Never copy LOVE or its tilted O (it is a protected artwork). Make our own 2 × 2 stacked block of 4 Chinese characters or digits from the event (for example a year), extruded 0.3 × letter height, each glyph a different colour, one glyph turned 10 to 20°. Polychrome painted metal. Base: a low black plinth 0.15 × block height. People pose in front, so leave a 3 m clear apron.

### 43. 流水行雲‧龍遊千里, Yang Hui-chiang (江洋輝), Songshan MRT concourse (extra facts for #5)
- What it is: more than 52,000 LEDs and crystal-glass pieces on stainless-steel pipes in the oval dome; the light changes with the 24 solar terms; Ministry of Culture 6th Public Art Award; NT$15 million; chosen from 45 entries. **measured** (search summary of Taipei City Government PDF and Travel Taipei)
- URLs: https://www-ws.gov.taipei/001/Upload/388/relfile/19519/7999454/021239f5-0a80-459c-a42d-9b39ff03cc1b.pdf · https://www.travel.taipei/en/attraction/details/641
- Design recipe addition: give a ceiling piece a calendar. 24 colour presets, one per solar term; the scene picks the preset from the event's date, so each event's ceiling glows differently. Hanging pipes as `InstancedMesh` of thin cylinders with a glass bead at the tip.

### 44. Hachikō, Shibuya, Tokyo (1934, recast 1948)
- What it is: a bronze dog about 162 cm on a 180 cm plinth, paid for by public donations; the 1934 original was melted down in the war and recast in 1948; the city's best-known meeting spot. **measured** (search summary of Wikipedia, Go Tokyo, nippon.com)
- URLs: https://en.wikipedia.org/wiki/Statue_of_Hachik%C5%8D · https://www.gotokyo.org/en/spot/86/index.html · https://www.nippon.com/en/japan-glances/jg00137/hachiko-the-faithful-dog.html
- Design recipe: the plinth is the point. A plinth slightly taller than the figure (ratio about 1.1 : 1) in rough granite `#7D7A73` with a smooth panel; the figure is a small, everyday subject (an animal, a bag, an umbrella), not a hero. The plate is a polished granite inset with incised characters, title at 12% of panel height, story lines at 4%. Put a low railing or a ring of benches around it, because people wait there.

### 45. El Alma del Ebro (Soul of the Ebro), Jaume Plensa, Zaragoza, Expo 2008
- What it is: an 11 m seated figure of stainless-steel letters lacquered white, made for the Expo on water; the letters stand for cells of a body that is mostly water; people walk inside. **measured** (search summary of Plensa's site and Zaragoza tourism)
- URLs: https://jaumeplensa.com/works-and-projects/public-space/el-alma-del-ebro-2008 · https://www.zaragoza.es/sede/portal/turismo/servicio/monumento/482?locale=en
- Design recipe addition to #24: placing it on a riverbank or plaza edge for an Expo or Flora event (花博 2010) works because the form says "a person sitting and watching". Letters from the event's words, white `#FAFAF7`, joined at contact points so the shell holds; inside, a floor disc carries the title.

### 46. I amsterdam letters, Amsterdam (2004 to 2018 at the Rijksmuseum)
- What it is: red-and-white block letters about 2 m tall that people climbed for photos; the city removed the main set in 2018 for drawing too big a crowd; a touring set still goes to events. **measured** (search summary of Dezeen, Dutch Review, Smithsonian)
- URLs: https://www.dezeen.com/2018/12/05/i-amsterdam-sign-removed-council-mass-tourism/ · https://dutchreview.com/cities/i-amsterdam-letters/ · https://www.smithsonianmag.com/legacy_blog/rebranding-amsterdam-and-what-it-means-to-rebrand-a-city/
- Design recipe: walk-on, climb-on letters as a gate or plaza piece, but never that slogan (it is a city brand). Spell our own words in 1.6 to 2 m extruded letters set 0.2 m apart on the ground, deep enough to sit on (depth 0.35 × height). Two-colour scheme where one word is a different colour. Note the lesson: letters alone become a selfie prop; add a second layer (lights inside the letters, a pattern on the top faces) so it is more than a name.

### 47. Spring, Claes Oldenburg and Coosje van Bruggen, Cheonggye Plaza, Seoul (2006)
- What it is: a spiral shell about 20 m tall (sources give 20 to 22 m) in red and blue ribbons, modelled on a freshwater snail that lives in clean water, marking the restored Cheonggyecheon stream. **measured** (search summary of Seoul Media Hub, The Seoul Guide)
- URLs: https://mediahub.seoul.go.kr/archives/155551 · https://www.theseoulguide.com/sights/public-spaces/cheonggye-plaza/ · https://www.koreatimes.co.kr/lifestyle/arts-theater/20121123/oldenburg-turns-things-upside-down
- Design recipe: two flat ribbons (`TubeGeometry` with a flat cross-section, width 0.6 m) spiralling up a cone, one red `#D7263D`, one blue `#1F4E9E`, crossing each other; stand it beside water. It marks a place that was remade: right for "the day this street reopened" events. Title on a low stone kerb at the pool edge.

### 48. Kobe Luminarie Galleria, Kobe
- What it is: a corridor of stacked light arches about 10 m high and 70 to 81 m long along Naka-machi-dori, made from Italian-style designs, all LED since the 21st edition; a covered version (Galleria Coperta) surrounds visitors with light on four sides; the route is one-way. **measured** (search summary of Wikipedia, Have a Good Holiday, Feel Kobe)
- URLs: https://en.wikipedia.org/wiki/Kobe_Luminarie · https://haveagood-holiday.com/en/articles/kobe-luminarie-2027-32nd-overview-and-theme · https://www.feel-kobe.jp/explore/en.html
- Design recipe: the best gate-board replacement. 8 to 14 arches in a row, 1.5 to 2 m apart, each arch a lacy pattern of points (`Points` or instanced small spheres) along curves: an outer arch, an inner arch, rosettes and a top crest. Repeat the same pattern so it reads as a tunnel from the front. The event title is a crest panel at the top of the first arch, letters made of the same light points. Colours (guess): warm white `#FFE9B8`, gold `#FFC35A`, accents `#FF6A3D`, `#5AB4FF`.

### 49. Fête des Lumières 2023, Lyon: giant kaleidoscope (Guillaume Marmin), Evanescent (Atelier Sisu), Kernel (projection on Saint-Jean cathedral)
- What it is: people stood inside a giant kaleidoscope; *Evanescent* filled Place Bellecour with soap-bubble forms and won the public prize; *Kernel* was projection mapping on the cathedral front. **measured** (search summary of Euronews, Lyon Capitale)
- URLs: https://www.euronews.com/2023/12/08/a-moment-of-conviviality-lyon-shines-brightly-in-centuries-old-light-festival · https://www.lyoncapitale.fr/?p=365667 · https://www.france.fr/en/article/festival-of-lights-soak-up-these-8-amazing-installations/
- Design recipe (kaleidoscope): a triangular tunnel of 3 mirror walls (`MeshStandardMaterial` metalness 1, roughness 0.02 plus `CubeCamera`) 2.5 m high and 6 m long, with a back-lit pattern disc at the far end that slowly turns. The disc pattern is made of the event's pictograms. Design recipe (bubbles): 10 to 30 large spheres (1 to 4 m) with a thin-film iridescent material (`MeshPhysicalMaterial` with `iridescence: 1`, `transmission: 1`) drifting slowly above a plaza.

Total after this pass: **49** references (30 in sections 1 to 4, 19 here).

---

## Quick map: which recipe fits which kind of marker (guess, for builders to choose from)

| Marker kind | Best recipes |
|---|---|
| Concert or award night (for example 金曲獎 2006) | #2 curtain stage, #26 facing towers with counting digits, #27 seesaw instrument |
| Crowd or game event (for example 北投公園 2016) | #14 crowd of small figures, #28 field of light, #22 footprint plaque |
| Festival, temple or lantern event | #8 / #9 / #10 main lantern, #30 float, #29 canopy |
| Place memory (a closed shop, old zoo, old cinema) | #15 ghost rebuild, #16 paper-cut tent, #21 figure half out of an object |
| Photo-topic showcase header (家人 FAMILY and others) | #1 turning book, #24 letter figure made of the topic words, #3 hanging letters |
| Gate boards | #25 mirror arch with the name in the floor, #5 light-river ceiling, #6 stripe column wraps |

---

## Do not do

These are the faults of the three rejected plates in `docs/signage/rejected/` (purple 金曲獎 plate on posts, 家人 FAMILY header with two camera icons, teal 北投公園 plate):

- **A rectangle on two posts.** If the first thing you would build is `BoxGeometry` plus two `CylinderGeometry` legs, stop and pick a recipe above.
- **One title line and one date line in a single font,** same weight, centred, and nothing else. Real pieces have a hierarchy: one huge element (digits, a figure, a shape) at 30 to 50% of the height, and small text at 5 to 10%.
- **A thin border as the only design.** A frame is not a design. The shape of the piece itself must tell the story.
- **Clip-art icons placed either side of the text** (the two cameras). An icon must be part of the composition (inside the letters, forming the figure, cast in the plinth), never decoration on the side.
- **One flat colour field** (all purple, all teal). Use a palette of 3 to 5 colours, material contrast (bronze against stone, glass against steel, light against dark), and light (emissive, back-light, a cast shadow).
- **Nothing to do with the body.** Each piece should give the player something: walk under it, step on it, see it change, find a hidden part, read it from one special spot.
- **The same template with new words.** Every marker must use a different recipe, scale and material. Two markers that differ only in text count as a failure.
- **Text on the main object as a label.** Put the name where a real artwork puts it: a cast plate flush in the plinth, a ring round a floor plaque, letters that make up the form, or a stage footlight bar.
- **Flat lighting.** A piece that looks the same by day and night is missing its best layer. Give each piece at least one light behaviour.
- **Letters alone as the whole piece** (the lesson of #46). Big block letters with nothing else become a selfie prop and still read as a name plate. Letters need a second layer: light inside, pattern on the faces, the letters forming a body (#24, #45), or people sitting in them.
- **Printing the title on the big object** (a balloon, a lantern, a giant toy). Real giant pieces carry no text; the name lives on a buoy, a kerb, a turntable rim or a floor disc.
- **Real faces, logos, mascots or politics.** Figures are anonymous, objects are generic, and nothing copies a brand.
