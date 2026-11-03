#!/usr/bin/env bash
# encode.sh — rebuilds the page's music from the public-domain / CC0 originals (2026-11-03).
#
# CJ, 2026-11-03: 「不要用youtube了選適合的無版權音樂」. The originals come from the SoundSafari corpus
# (https://github.com/SoundSafari/CC0-1.0-Music), which mirrors FreePD (public domain). Clone it partially
# (git clone --filter=blob:none --no-checkout …) and pass its folder; each original is pulled on its own
# with `git show HEAD:<path>`, so only these few blobs are ever downloaded.
#
#   asset/music/gen/encode.sh /path/to/CC0-1.0-Music
#
# Every track: leading and trailing silence trimmed, loudness-normalised to about -18 LUFS (one pass of
# loudnorm, true peak -1.5 dBTP), 44.1 kHz stereo MP3 at 96 kbps. A long piece is cut short with a fade so the
# whole set stays near 20 MB. Needs ffmpeg with libmp3lame.
set -euo pipefail
SRC="${1:?path to a clone of SoundSafari/CC0-1.0-Music}"
OUT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# out-file | corpus path | max seconds (0 = whole piece)
TRACKS=(
  "80s-1-starcourt-mall.mp3|freepd.com/Soundtrack From the Starcourt Mall.mp3|0"
  "80s-2-downtown-boogie.mp3|freepd.com/Downtown Boogie.mp3|0"
  "90s-1-martini-sunset.mp3|freepd.com/Martini Sunset.mp3|0"
  "90s-2-nostalgic-piano.mp3|freepd.com/Nostalgic Piano.mp3|0"
  "00s-1-coy-koi.mp3|freepd.com/Coy Koi.mp3|0"
  "00s-2-celebration.mp3|freepd.com/Celebration.mp3|0"
  "10s-1-study-and-relax.mp3|freepd.com/Study and Relax.mp3|0"
  "10s-2-be-chillin.mp3|freepd.com/Be Chillin.mp3|0"
  "sq-1-slice-of-life.mp3|freepd.com/Slice of Life.mp3|0"
  "sq-2-kalimba-relaxation.mp3|freepd.com/Kalimba Relaxation Music.mp3|210"
)
TRIM='silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.3,areverse'
for row in "${TRACKS[@]}"; do
  IFS='|' read -r out path max <<<"$row"
  (cd "$SRC" && git show "HEAD:$path") > "$TMP/in.mp3"
  af="$TRIM"
  if [ "$max" != "0" ]; then af="$af,atrim=0:$max,afade=t=out:st=$((max - 8)):d=8"; fi
  af="$af,loudnorm=I=-18:TP=-1.5:LRA=11,aresample=44100"
  ffmpeg -hide_banner -loglevel error -y -i "$TMP/in.mp3" -map_metadata -1 -af "$af" -ac 2 \
    -c:a libmp3lame -b:a 96k -metadata comment="Public domain (FreePD). Re-encoded for Our Memory in Taipei." "$OUT/$out"
  echo "$out  $(du -k "$OUT/$out" | cut -f1) KB"
done
