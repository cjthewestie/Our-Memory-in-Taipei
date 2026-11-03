# Music and sound credits

CJ, 2026-11-03: 「不要用youtube了選適合的無版權音樂」 — no YouTube any more; choose suitable copyright-free music.
Everything the page plays is now one of its own files, and every one of them is **public domain** or **CC0 1.0**:
free to copy, change and publish, with no credit required. The credits below (also shown on the page, in the
Credits panel) are a courtesy, and so anyone can find the originals.

## How the music was chosen

The originals come from the SoundSafari corpus, <https://github.com/SoundSafari/CC0-1.0-Music>, which collects
public-domain and CC0 music by the site that published it. Every track here is from its `freepd.com/` folder:
FreePD (<https://freepd.com/>) publishes its whole catalogue as public domain.

**Nobody listened to these during the selection.** It was made from metadata and measurement only: the title, the
genre and comment tags (`ffprobe`), the length, the integrated loudness and loudness range (`ffmpeg ebur128`), and
how much of the energy sits above 4 kHz or below 150 Hz (a rough "harsh / boomy" check), against a mood per place:
retro synth and boogie for 1980s 西門町, warm and wistful for the 1990s, festive with an East-Asian flavour for
2000s 大稻埕 at Lunar New Year, calm modern lo-fi for 信義, gentle for the square at golden hour. Where a file's own
tags state the dedication, that is noted. Two candidates were left out because their tags name a different licence
(Alexander Nakarada's "Relaxing Ballad" and "Piña Colada" carry "CC BY Attribution 4.0" in their album tag), and one
("Shenzhen Nightlife") because it was by far the brightest and loudest of the set. CJ should listen once and swap
anything that does not fit: change the table in `music.js` and the list in `gen/encode.sh`.

Every track was re-encoded by `gen/encode.sh`: leading and trailing silence trimmed, loudness-normalised to about
-18 LUFS (true peak -1.5 dBTP), 44.1 kHz stereo MP3 at 96 kbps. "Kalimba Relaxation Music" (7 min 8 s) is cut to its
first 3 min 30 s with an 8 s fade. 10 files, 21 MB in all; only the track playing is downloaded, and nothing at all
while the page is muted.

| Place | File | Title | Composer | Licence | Tags in the original | Corpus path | Length |
|---|---|---|---|---|---|---|---|
| 1980s | `80s-1-starcourt-mall.mp3` | Soundtrack From the Starcourt Mall | Bryan Teoh | Public domain | "This piece was composed and dedicated to the Public Domain in 2020." | `freepd.com/Soundtrack From the Starcourt Mall.mp3` | 3:37 |
| 1980s | `80s-2-downtown-boogie.mp3` | Downtown Boogie | Bryan Teoh | Public domain | the same dedication | `freepd.com/Downtown Boogie.mp3` | 2:10 |
| 1990s | `90s-1-martini-sunset.mp3` | Martini Sunset | Kevin MacLeod | Public domain (FreePD) | light jazz ("Oh! The LIGHT JAZZ!!!") | `freepd.com/Martini Sunset.mp3` | 2:52 |
| 1990s | `90s-2-nostalgic-piano.mp3` | Nostalgic Piano | not named in the file | Public domain (FreePD) | none | `freepd.com/Nostalgic Piano.mp3` | 3:13 |
| 2000s | `00s-1-coy-koi.mp3` | Coy Koi | Kevin MacLeod | Public domain (FreePD) | "Chinese thing? Sure." | `freepd.com/Coy Koi.mp3` | 0:48 |
| 2000s | `00s-2-celebration.mp3` | Celebration | Alexander Nakarada | Public domain (FreePD) | no licence named; album "Complete Discography", a link to the composer's Bandcamp (the FreePD copy is the public-domain one; his Bandcamp releases are CC BY, so credit him if this file is ever taken from there instead) | `freepd.com/Celebration.mp3` | 2:21 |
| 2010s–2020s | `10s-1-study-and-relax.mp3` | Study and Relax | Kevin MacLeod | Public domain (FreePD) | — | `freepd.com/Study and Relax.mp3` | 3:37 |
| 2010s–2020s | `10s-2-be-chillin.mp3` | Be Chillin | Alexander Nakarada | Public domain (FreePD) | "source: freepd.com" | `freepd.com/Be Chillin.mp3` | 3:18 |
| the square | `sq-1-slice-of-life.mp3` | Slice of Life | Bryan Teoh | Public domain | the same dedication as above | `freepd.com/Slice of Life.mp3` | 2:20 |
| the square | `sq-2-kalimba-relaxation.mp3` | Kalimba Relaxation Music | Kevin MacLeod | Public domain (FreePD) | genre "Ambient" | `freepd.com/Kalimba Relaxation Music.mp3` | 3:30 (cut) |

The scroll year picks the decade (1980s up to 1989, 1990s, 2000s, 2010s from 2010 on, the 信義 tower chapter
included); the square plays its own pair. A decade's two tracks run on into each other with the player's 1.5 s
crossfade.

## Ambience (`asset/ambience/`, played by `ambience.js`, item #8)

Three street beds and one firecracker are cut from CC0 recordings in the corpus's `freesound.org/` folder by
`asset/ambience/gen/make-beds.py`: a steady stretch picked by its short-term loudness, band-limited to 120 Hz–2.6 kHz
(a crowd a little way off, no single voice standing out), made into a seamless loop, normalised to -23 LUFS, mono
MP3 at 48 kbps. 455 KB in all.

| File | Used for | Original | Recordist | Licence | Corpus path |
|---|---|---|---|---|---|
| `bed-ximen.mp3` | 西門町 crowd; the square's distant murmur | Century Square, Shanghai, at night (0:20–0:46) | timsc | CC0 1.0 | `freesound.org/186676__timsc__century-square-shanghai-at-night.flac` |
| `bed-xinyi.mp3` | 信義 crowd | the same recording (2:58–3:26) | timsc | CC0 1.0 | as above |
| `bed-dadao.mp3` | 大稻埕 New Year market | China market (1:14–1:42) | nikitralala | CC0 1.0 | `freesound.org/139951__nikitralala__china_market.aiff` |
| `crack.mp3` | 大稻埕 firecracker strings, a few streets away | Firecracker (one crack) | genel | CC0 1.0 | `freesound.org/197044__genel__firecracker.mp3` |

Synthesised in `ambience.js` (no file, CC0 like the rest of the code): the cicadas in the banyan, chess pieces,
tea cups, the shrine's 磬, the sausage cart's sizzle, the pigeons, the karaoke stand's little tune (an original
pentatonic line), the metro's rumble and a generic two-note door chime, her footsteps on brick, terrazzo and
asphalt, and now and then in 西門町 and 信義 the garbage truck going by a block away playing 給愛麗絲 (Beethoven's
Für Elise, 1810, public domain; the opening phrase, played by oscillators through a 'horn speaker' filter).

## CJ's own copies

`private/` (git-ignored) can still hold CJ's bought copies of real songs for his own machine; see the README there.
They are never committed and never served from a public URL.
