#!/bin/sh
# tools/pack-models.sh [name…] — meshopt-pack the glbs in asset/models/ in place (fault 1, 2026-09-24:
# CJ 「東西太多loading太久」). A raw Blender export is float positions and normals with no compression:
# red-house.glb was 963 KB of vertex data. gltfpack with EXT_meshopt_compression takes the set from
# 3392 KB to 746 KB, and GLTFLoader.js decodes it with meshopt_decoder.js (29 KB, at the repo root).
#
# Run after every Blender rebuild (asset/blender/<name>.py exports raw; this packs it):
#   sh tools/pack-models.sh              # every glb that is not packed yet
#   sh tools/pack-models.sh temple lux   # just these
# Needs node/npx; gltfpack is fetched from npm on first use. A file that is already packed is
# skipped (gltfpack warns that repacking quantized geometry adds error), so this is safe to re-run.
#
# The flags, and why each one is there — the engine reads the geometry raw, so:
#   -vpf   positions stay float32 in the model's own units (MODELS.instance scales the geometry and
#          app.js reads it for the ambient-occlusion bake and the brick UVs; int16 positions would
#          need a node transform the engine does not apply)
#   -vtf   texture coordinates stay float (chunghwa's painted walls tile outside 0..1)
#   -vn 8  normals as 8-bit normalized ints (r149 denormalizes on read; 0.5° error on a flat palette)
#   -kn -km -ke -kv  keep node names (MODELS.node looks them up), material names (the palette colour
#          is matched by name and value), extras, and vertex attributes no material references
#          (chunghwa's UVs carry the painted textures applied at runtime)
#   -cc    the meshopt byte streams, which also gzip well on GitHub Pages
set -e
cd "$(dirname "$0")/.."
GLTFPACK="npx --yes gltfpack@1.2"
if [ $# -gt 0 ]; then names="$*"; else names=$(ls asset/models | sed -n 's/\.glb$//p'); fi
for n in $names; do
  f=asset/models/$n.glb
  [ -f "$f" ] || { echo "no $f"; continue; }
  if head -c 2000 "$f" | grep -q EXT_meshopt_compression; then echo "$n: already packed"; continue; fi
  before=$(wc -c < "$f")
  $GLTFPACK -i "$f" -o "$f.pack.glb" -kn -km -ke -kv -cc -vpf -vtf -vn 8
  mv "$f.pack.glb" "$f"
  echo "$n: $before -> $(wc -c < "$f") bytes"
done
