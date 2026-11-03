# Private songs (never in the repo)

This folder holds CJ's own bought copies of the real songs, so the page can play them on his machine. Everything in it is git-ignored except this README and `manifest.example.js`; nothing here reaches GitHub or the public page. Lead's follow-up, 2026-09-23: CJ buys the six songs on the iTunes Store as DRM-free `.m4a` and drops them here.

## How to set it up

1. Buy the songs on the iTunes Store (Music app → iTunes Store). Purchased files are DRM-free AAC `.m4a`; they land under `~/Music/Music/Media.localized/Music/<Artist>/<Album>/`.
2. Copy the files into this folder. `.m4a` and `.mp3` both work. Rename freely; only the manifest has to match.
3. Copy `manifest.example.js` to `manifest.js` in this folder and edit the `file` names to match. Keep one entry per song; repeat a decade to give it a list, played in that order.
4. Optional `start` and `end`, in seconds: the song begins at `start` (its chorus; CJ, 2026-09-23: 「use chorus」) and at `end` jumps back to `start`, a chorus loop, instead of playing on. Leave both out to play the whole file. To find a chorus without listening, a loudness curve works: `ffmpeg -i song.mp3 -af ebur128=peak=none -f null -` prints momentary loudness per 100 ms; average it per 2 s and take the first sustained loud stretch after about a third of the track, then cross-check against an LRC lyric file when one exists.
5. Serve the folder on your own machine (`python3 -m http.server`, then open `http://localhost:8000/`). The control reads "your songs" and plays your list for each decade it names; click once for sound.

## What plays when

- **On your own machine (localhost, or a double-clicked `file://` page):** `music.js` looks for `manifest.js` here, and each decade it names plays your songs through the page's own two-`<audio>` crossfade instead of its public-domain tracks, following the scroll year. Pressing the button of the decade already playing steps to its next song.
- **On the public page (GitHub Pages, Vercel):** the folder is never there and the page does not even ask for it; the public-domain tracks play (`asset/music/CREDITS.md`). Since 2026-11-03 nothing plays from YouTube (CJ: 「不要用youtube了選適合的無版權音樂」).
- **No `manifest.js`:** the public-domain tracks play, as on the public page.

The example manifest lists 鄧麗君 望春風, 王芷蕾 台北的天空 (1985), 張雨生 我的未來不是夢 (1988), 張學友 吻別 (1993), 周杰倫 七里香 (2004), 五月天 後來的我們 (2016). Bought copies are licensed for personal listening only: they must never be committed, uploaded or served from a public URL.
