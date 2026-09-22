#!/bin/bash
# One state-corrective round on the shipped census's findings, then a full
# census, editor re-verification and the review sheets. Run from anywhere:
#   bash test/scripts/body-review/rounds/state-round.sh
# Needs ~3 GB of memory per shard (9 shards) and about 3 hours; the census
# receipt must belong to the shipped basis or an incremental round of it.
# Every generator process must be gone before the merge reads the shards.
cd "$(dirname "$0")/../../../.." && mkdir -p .shots/body-probe
export NODE_OPTIONS=--max-old-space-size=12288
X="pnpm exec ttsx -P test/tsconfig.scripts.json"
S=test/scripts/body-review
alive() { powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { \$_.CommandLine -match '$1' }).Count" | tr -d '
 '; }
echo "== state round start $(date)"
G=.shots/body-review/state-round; rm -rf $G; mkdir -p $G
for i in 0 1 2 3 4 5 6 7 8; do $X $S/generate-state-correctives.ts -- $i/9 --set traits,shapes,combos $G > .shots/body-probe/state-round-$i.log 2>&1 & done
wait
until [ "$(alive generate-state-correctives)" = "0" ]; do sleep 20; done
echo "== state-round generated $(date)"
$X $S/merge-pose-correctives.ts -- $G --incremental --write > .shots/body-probe/merge-state-round.log 2>&1 || { echo "merge state-round FAILED"; exit 1; }
echo "== state-round merged $(date)"
C=.shots/body-review/census-round; rm -rf $C; mkdir -p $C
$X $S/census-crossings.ts -- rest 0/1 $C > .shots/body-probe/census-round-rest.log 2>&1 || { echo "census-round rest FAILED"; exit 1; }
$X $S/census-crossings.ts -- channels 0/2 $C > .shots/body-probe/census-round-channels-0.log 2>&1 &
$X $S/census-crossings.ts -- channels 1/2 $C > .shots/body-probe/census-round-channels-1.log 2>&1 &
for i in 0 1 2; do $X $S/census-crossings.ts -- joints $i/3 $C > .shots/body-probe/census-round-joints-$i.log 2>&1 & done
$X $S/census-crossings.ts -- combos 0/2 $C > .shots/body-probe/census-round-combos-0.log 2>&1 &
$X $S/census-crossings.ts -- combos 1/2 $C > .shots/body-probe/census-round-combos-1.log 2>&1 &
$X $S/census-crossings.ts -- traits 0/1 $C > .shots/body-probe/census-round-traits.log 2>&1 &
wait
for i in 0 1 2 3 4 5 6 7; do $X $S/census-crossings.ts -- shapes $i/8 $C > .shots/body-probe/census-round-shapes-$i.log 2>&1 & done
wait
until [ "$(alive census-crossings)" = "0" ]; do sleep 20; done
$X $S/merge-census.ts -- $C --write > .shots/body-probe/merge-census-round.log 2>&1 || { echo "merge-census-round FAILED"; exit 1; }
$X $S/measure-girth.ts -- .shots/body-review/girth-after > .shots/body-probe/girth-after.log 2>&1
echo "== census-round merged $(date)"
$X $S/build-body.ts -- folds > .shots/body-probe/build-folds.log 2>&1
node $S/render-body.mjs folds --focus leftLowerArm,leftLowerLeg,leftUpperLeg,leftUpperArm --distance 0.6 > .shots/body-probe/render-folds.log 2>&1
(cd packages/human && pnpm run build > ../../.shots/body-probe/human-build.log 2>&1) || { echo "human build FAILED"; exit 1; }
(cd packages/playground && pnpm run build > ../../.shots/body-probe/playground-build.log 2>&1) || { echo "playground build FAILED"; exit 1; }
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { \$_.CommandLine -match 'serve -l 5188' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }" 2>/dev/null
npx serve -l 5188 packages/playground/dist > .shots/body-probe/serve.log 2>&1 &
until curl -s -o /dev/null http://127.0.0.1:5188/; do sleep 2; done
node $S/verify-editor.mjs > .shots/body-probe/verify-editor.log 2>&1 || echo "verify-editor FAILED"
$X $S/verify-editor-export.ts > .shots/body-probe/verify-export.log 2>&1 || echo "verify-export FAILED"
node $S/capture-editor.mjs population > .shots/body-probe/capture-population.log 2>&1 || echo "capture FAILED"
bash test/scripts/body-review/rounds/sheets.sh
echo "== state round done $(date)"
