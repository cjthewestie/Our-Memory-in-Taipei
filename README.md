# Our Memory in Taipei

> **Address: https://cjthewestie.github.io/Our-Memory-in-Taipei/**
> This address goes live once GitHub Pages is turned on for the repo. It is not on yet. Until then, run the page locally (see [Run it locally](#run-it-locally)).

Started at Claude Code Build Day, 2026-09-20, and still being built.

We wanted this to be a page that could carry everyone's memory of Taipei. From the ten dollars our mothers gave us in Ximending when we were small, all the way to the day we could finally build something of our own — and we look up at Taipei 101, and the man high on the tower is waving at us.

**Let's climb higher, together.**

So every building here has a real one behind it: the eight blocks of 中華商場, the hand-painted billboards of 樂聲戲院, the octagon of the Red House, the three gable styles of Dihua Street, the swallowtail ridge of 霞海城隍廟, the red sign of 永樂市場. Not a backdrop — a street you may have actually walked down.

## The square and the gates

The page opens in a square with lanterns strung over it. Three gates stand where their districts are in the real city: 西門町 to the **west** (西門 means "the west gate"), 大稻埕 to the **north**, 信義 to the **east**.

Walk into a gate and you arrive in that part of Taipei, in its decade. You steer the girl in red wherever you like. Each section has an arch at both ends. One leads back to the square, the other on to the next section. 信義 ends at the foot of Taipei 101, where you can look up at the man climbing it. The **⌂ Square** button takes you back to the square from any section.

## Controls

| | Keyboard and mouse | Phone |
|---|---|---|
| Walk | `W` `A` `S` `D` or the arrow keys | The stick, bottom right |
| Run | Hold `Shift` | Push the stick to its edge |
| Look around | Drag | Drag anywhere |
| Read a memory | Walk up to a lantern and press `E`, or click the lantern | Tap the bubble over the lantern |
| Close a memory, the form or a photo | `Escape`, or the × button | The × button |

In the Guided tour the page scrolls instead. Use the mouse wheel, `↑` `↓`, `Page Up` `Page Down`, `Space`, `Home` and `End`.

## Guided tour

The **▶ Guided tour** button plays the original film. Scrolling moves you down one street and forward through forty years. The big words surface as you go, and it ends on the man climbing Taipei 101. The **Walk freely** button takes you back to the square.

Two links open the tour directly:

- `?tour=1` opens the Guided tour from the start.
- `?year=1993` opens the Guided tour at that year.

> *Keep climbing, just like the man on Taipei 101*

## Three chapters

| Chapter | Years | Place | What is there |
|---|---|---|---|
| **When We Were Young** | 1985–1999 | Ximending 西門町 | The eight 中華商場 blocks, 樂聲戲院 and its painted billboards, record shops, comic rental, arcades, phone booths, the Red House octagon, market stalls |
| **Spring Festival** | 2000–2019 | Dadaocheng 大稻埕 | Dihua Street's brick arcades, 霞海城隍廟, lantern strings, 恭喜發財 banners, the 年貨大街 stalls |
| **Into the Future** | 2020–2027 | Xinyi 信義 | Taipei 101 in glass, the lit office towers, the man climbing, the closing words |

## Your memories

Anyone can leave a memory where it happened: a line or two, a year, an optional name and an optional photo. Press **+ Leave a memory** wherever you stand. It hangs there as a paper lantern for the next visitor to find.

Every memory is read by the makers before it appears. A visitor's photo stays private until its memory is approved. A gallery of the approved photos is being built now and is not on the page yet.

Until the page is connected to Supabase, a memory you leave is kept in your own browser only, and the form says so. Setup and approving memories: [`docs/MEMORIES.md`](docs/MEMORIES.md).

## The photographs

Eight of the buildings carry a marker you can click. It opens a real photograph of the real place — 中華商場 on its opening day in 1961, Taipei 101 with the cranes still on its crown. In the Guided tour, at each change of era one photograph fades across the street, faint and brief.

Every photograph is licensed, and every one is credited on the page. Some carry share-alike terms. The credits panel names each photographer, holder and licence.

## Sound

Eight songs from the 1980s to the 2010s, each played from its chorus and chosen for the years it belongs to. The player sits bottom left. On a phone the music starts off, and one tap on the player turns it on. On a computer, browsers keep it silent until your first click on the page.

## Run it locally

There is no build step. Serve the folder and open it in a browser:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open http://127.0.0.1:8000/ for the square, or http://127.0.0.1:8000/?tour=1 for the Guided tour. Serve it rather than opening `index.html` from disk: browsers usually block the 3D models from loading over `file://`.

One console error is expected: a 404 for `asset/music/private/manifest.js`. That file is a private, git-ignored music list.
