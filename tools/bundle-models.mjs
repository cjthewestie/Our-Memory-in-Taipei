// Merge the per-model glbs into one bundle per load group, so the page makes three requests
// instead of eighteen. Each source file's roots are re-parented under a node named after the
// file, so MODELS.node(root, name) still finds what it always found.
//
//   node tools/bundle-models.mjs                       # every model from asset/models/src/<name>.glb
//   node tools/bundle-models.mjs --from-head a,b       # a and b from the last commit instead (a model
//                                                      # whose Blender rebuild is still in progress)
// Every source must already be meshopt-packed (sh tools/pack-models.sh); a raw export is refused.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { mergeDocuments, unpartition, dedup, prune } from '@gltf-transform/functions';

const GROUPS = {
  'bundle-core':     ['bollard','chunghwa','girl','lamp','lux','props','red-house','shopfront','tree'],
  'bundle-dadao':    ['dihua-min','dihua-yang','dihua-baroque','dihua-zone2','dadao-entrance','stall','temple','yongle'],
  'bundle-tower':    ['tower101','skywalk','a11','cityhall'],
};

const fh = process.argv.indexOf('--from-head');
// --only bundle-square[,bundle-core]: rebuild just these bundles (others' sources may be mid-rebuild)
const oi = process.argv.indexOf('--only');
const ONLY = oi > 0 ? new Set(process.argv[oi + 1].split(',')) : null;
const FROM_HEAD = new Set(fh > 0 ? process.argv[fh + 1].split(',') : []);

function source(name) {
  const path = `asset/models/src/${name}.glb`;
  let bytes;
  if (FROM_HEAD.has(name)) bytes = execFileSync('git', ['show', `HEAD:${path}`], { maxBuffer: 1 << 28 });
  else { if (!existsSync(path)) { console.error(`missing ${path}`); process.exit(1); } bytes = readFileSync(path); }
  const jsonLen = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLen).toString('utf8'));
  if (!(json.extensionsUsed || []).includes('EXT_meshopt_compression')) {
    console.error(`${path} is a raw export: run sh tools/pack-models.sh on it first`); process.exit(1);
  }
  return new Uint8Array(bytes);
}

await MeshoptDecoder.ready;   // meshoptimizer 1.3 decodes nothing until its wasm is in
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

for (const [out, names] of Object.entries(GROUPS)) {
  if (ONLY && !ONLY.has(out)) continue;
  let doc = null;
  for (const name of names) {
    const d = await io.readBinary(source(name));
    // wrap this file's scene roots under one node carrying the file's name
    const scene = d.getRoot().listScenes()[0];
    const wrap = d.createNode(name);
    for (const child of scene.listChildren()) { scene.removeChild(child); wrap.addChild(child); }
    scene.addChild(wrap);
    if (!doc) { doc = d; doc.getRoot().listScenes()[0].setName(out); }
    else {
      mergeDocuments(doc, d);
      // merge brings a second scene; move its children into the first and drop it
      const scenes = doc.getRoot().listScenes();
      const first = scenes[0];
      for (const s of scenes.slice(1)) {
        for (const c of s.listChildren()) { s.removeChild(c); first.addChild(c); }
        s.dispose();
      }
    }
  }
  // no dedup(): the three dihua styles share node names (main, storey, crest) and dedup
  // collapses them, so yang and baroque lose their children.
  await doc.transform(unpartition());
  await io.write(`asset/models/${out}.glb`, doc);
  const kb = Math.round(readFileSync(`asset/models/${out}.glb`).length / 1024);
  console.log(`${out}.glb  ${names.length} models  ${kb} KB`);
}
