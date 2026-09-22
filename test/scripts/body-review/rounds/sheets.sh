#!/bin/bash
# The review sheets on the shipped basis: archetypes (two contact sheets)
# and individuality frames. Run from anywhere:
#   bash test/scripts/body-review/rounds/sheets.sh
cd "$(dirname "$0")/../../../.." && mkdir -p .shots/body-probe
export NODE_OPTIONS=--max-old-space-size=12288
X="pnpm exec ttsx -P test/tsconfig.scripts.json"
S=test/scripts/body-review
echo "== sheets start $(date)"
$X $S/build-body.ts -- archetypes .shots/body-review/archetypes-final > .shots/body-probe/build-archetypes-final.log 2>&1 || echo "build archetypes FAILED"
node $S/render-body.mjs archetypes-final > .shots/body-probe/render-archetypes-final.log 2>&1 || echo "render archetypes FAILED"
$X $S/build-body.ts -- individuality .shots/body-review/individuality-final > .shots/body-probe/build-individuality-final.log 2>&1 || echo "build individuality FAILED"
node $S/render-body.mjs individuality-final > .shots/body-probe/render-individuality-final.log 2>&1 || echo "render individuality FAILED"
A=.shots/body-review/archetypes-final/frames
python test/scripts/body-review/sheet.py $A .shots/body-review/archetypes-final/sheet-a.png skin slender-woman,small-bust-wide-hips,thin-no-hips,emaciated-man,model-man,bodybuilder
python test/scripts/body-review/sheet.py $A .shots/body-review/archetypes-final/sheet-b.png skin muscular-heavy,potbelly-thin,obese,giant,elderly-woman,elderly-man
echo "== sheets done $(date)"
