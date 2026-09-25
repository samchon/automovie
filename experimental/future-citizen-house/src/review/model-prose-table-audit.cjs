// Cross-check numeric statements in model H2 prose against their measured
// @part rows. This is independent of the part contact and envelope audit.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const names = fs.readdirSync(path.join(root, "docs/models"))
  .filter((name) => /^(?!000)\d{3}-.+\.md$/.test(name)).sort((a, b) => a.localeCompare(b))
  .map((name) => name.slice(0, -3));
/** @param {Map<string,string>} [overrides] */
function audit(overrides = new Map()) {
/** @type {Map<string,{text:string,parts:Map<string,{x:number[],y:number[],z:number[]}>,envelopes:Map<string,{x:number[],y:number[],z:number[]}>}>} */
const sections = new Map();
for (const name of names) {
  const source = overrides.get(name) ?? fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
  let anchor = "";
  for (const line of source.split(/\r?\n/)) {
    const h = /^## .*\{#([^}]+)\}/.exec(line);
    if (h) { anchor = h[1]; sections.set(anchor, { text: "", parts: new Map(), envelopes: new Map() }); continue; }
    if (!anchor) continue;
    const section = sections.get(anchor);
    if (!section) throw Error(`${anchor}: section not initialized`);
    section.text += `${line}\n`;
    const cells = line.startsWith("| @") ? line.split("|").slice(1, -1).map((cell) => cell.trim()) : [];
    if (cells.length !== 8) continue;
    const bounds = {
      x: cells[4].replaceAll("−", "-").split("..").map(Number),
      y: cells[5].replaceAll("−", "-").split("..").map(Number),
      z: cells[6].replaceAll("−", "-").split("..").map(Number),
    };
    if (cells[0] === "@part") section.parts.set(`${cells[1]}/${cells[2]}`, bounds);
    if (cells[0] === "@envelope") section.envelopes.set(cells[1], bounds);
  }
}
const errors = [];
let comparisons = 0;
const crossCompared = new Set();
/** @param {string} anchor @param {RegExp} pattern @param {number} [group] */
function claim(anchor, pattern, group = 1) {
  const text = sections.get(anchor)?.text.replaceAll("−", "-").replaceAll("×", "*") || "";
  const match = pattern.exec(text);
  if (!match) { errors.push(`${anchor}: missing prose measure ${pattern}`); return NaN; }
  return Number(match[group]);
}
/** @param {string} anchor @param {string} state @param {string} id */
function part(anchor, state, id) {
  const found = sections.get(anchor)?.parts.get(`${state}/${id}`);
  if (!found) { errors.push(`${anchor}/${state}/${id}: missing table part`); return { x: [NaN, NaN], y: [NaN, NaN], z: [NaN, NaN] }; }
  return found;
}
/** @param {number} actual @param {number} expected @param {string} label @param {number} [tolerance] */
function equal(actual, expected, label, tolerance = 0.000002) {
  comparisons++;
  if (!Number.isFinite(actual) || !Number.isFinite(expected) || Math.abs(actual - expected) > tolerance)
    errors.push(`${label}: prose/table ${actual} != ${expected}`);
}
/** @param {string} anchor @param {string} state @param {string} id */
function has(anchor, state, id) { return sections.get(anchor)?.parts.has(`${state}/${id}`) || false; }
/** @param {string} anchor @param {string} state @param {"x"|"y"|"z"} axis @param {number} prose @param {string} label */
function envelopeSpan(anchor, state, axis, prose, label) {
  const pair = sections.get(anchor)?.envelopes.get(state)?.[axis];
  crossCompared.add(anchor);
  equal(pair ? pair[1] - pair[0] : NaN, prose, `${anchor}/${state}: ${label}`);
}
/** @param {string} anchor @param {string} state @param {"x"|"y"|"z"} axis @param {number} prose @param {string} label */
function envelopeMax(anchor, state, axis, prose, label) {
  crossCompared.add(anchor);
  equal(sections.get(anchor)?.envelopes.get(state)?.[axis]?.[1] ?? NaN, prose, `${anchor}/${state}: ${label}`);
}

const sofaX = claim("living-sofa", /중심 x=±([\d.]+),z=±[\d.]+/);
const sofaZ = claim("living-sofa", /중심 x=±[\d.]+,z=±([\d.]+)/);
equal((part("living-sofa", "straight", "leg-0").x[0] + part("living-sofa", "straight", "leg-0").x[1]) / 2, -sofaX, "sofa rear-left leg x");
equal((part("living-sofa", "straight", "leg-0").z[0] + part("living-sofa", "straight", "leg-0").z[1]) / 2, -sofaZ, "sofa rear-left leg z");

const chairThickness = claim("dining-chair", /등판은 폭 [\d.]+m·두께 ([\d.]+)m/);
const base = claim("dining-chair", /중앙선 z\(y\)=(-[\d.]+)/);
const linear = claim("dining-chair", /중앙선 z\(y\)=-[\d.]+-([\d.]+)t/);
const bulge = claim("dining-chair", /중앙선 z\(y\)=-[\d.]+-[\d.]+t-([\d.]+)\*4t/);
const vertexT = (linear + 4 * bulge) / (8 * bulge);
const vertexZ = base - linear * vertexT - 4 * bulge * vertexT * (1 - vertexT);
equal(part("dining-chair", "default", "back").z[0], vertexZ - chairThickness / 2, "dining chair curved back minimum", 0.000003);
equal(part("dining-chair", "default", "back").z[1], base + chairThickness / 2, "dining chair curved back maximum");

const flexTopMin = claim("work-desk", /flex 상판은 두께 [\d.]+m로 y=([\d.]+)\.\.[\d.]+/);
const flexTopMax = claim("work-desk", /flex 상판은 두께 [\d.]+m로 y=[\d.]+\.\.([\d.]+)/);
equal(part("work-desk", "folded", "top").y[0], flexTopMin, "flex desk top underside");
equal(part("work-desk", "folded", "top").y[1], flexTopMax, "flex desk top upper");

const bedText = sections.get("fixed-bed")?.text || "";
const twoPillows = /fixed-bed\/1800[^\n]*베개 둘/.test(bedText);
const onePillow = /fixed-bed\/1000[^\n]*베개 하나/.test(bedText);
comparisons += 2;
if (!twoPillows || !has("fixed-bed", "1800", "pillow-1")) errors.push("fixed-bed/1800: prose pillow count differs from inventory");
if (!onePillow || has("fixed-bed", "1000", "pillow-1")) errors.push("fixed-bed/1000: prose pillow count differs from inventory");
const foldIsFace = bedText.includes("`duvet/fold-edge` 표면 영역") && !has("fixed-bed", "1800", "fold-edge");
comparisons++;
if (!foldIsFace) errors.push("fixed-bed: duvet fold-edge must remain a face, not an extra solid part");

const pivotY = claim("murphy-bed", /pivot은 양쪽 x=±[\d.]+, y=([\d.]+), z=/);
const hinge = part("murphy-bed", "guest", "hinge-left");
equal((hinge.y[0] + hinge.y[1]) / 2, pivotY, "murphy guest pivot y");

const toiletSeatFront = claim("toilet", /seat는 x=±[\d.]+,z=-[\d.]+\.\.\+([\d.]+)/);
equal(part("toilet", "lid-open", "seat").z[1], toiletSeatFront, "toilet seat front z");

const showerRiserZ = claim("shower", /riser는 x=-[\d.]+,z=(-[\d.]+),y=/);
const riser = part("shower", "default", "riser");
equal((riser.z[0] + riser.z[1]) / 2, showerRiserZ, "shower riser center z");

const ovenHandleWidth = claim("cooking-appliances", /오븐 손잡이는 ([\d.]+)\*[\d.]+\*[\d.]+m/);
const ovenHandle = part("cooking-appliances", "oven", "handle");
equal(ovenHandle.x[1] - ovenHandle.x[0], ovenHandleWidth, "oven handle width");
const laundryControlX = claim("laundry-appliances", /controls 판은 [^\n]*중심 x=\+([\d.]+),y=/);
const control = part("laundry-appliances", "washer", "controls-panel");
equal((control.x[0] + control.x[1]) / 2, laundryControlX, "laundry controls center x");
const laundryProse = sections.get("laundry-appliances")?.text || "";
for (const state of ["washer", "dryer"]) {
  comparisons += 2;
  for (const id of ["hinge-barrel", "hinge-tongue"]) if (!has("laundry-appliances", state, id) || !laundryProse.includes(`\`${id}\``))
    errors.push(`laundry/${state}: prose hinge ${id} differs from inventory`);
}

const fridgeText = sections.get("refrigerator")?.text || "";
const fridgeHandleHeight = claim("refrigerator", /손잡이는 문마다 [\d.]+\*([\d.]+)\*[\d.]+m/);
equal(part("refrigerator", "default", "handle-upper").y[1] - part("refrigerator", "default", "handle-upper").y[0],
  fridgeHandleHeight, "refrigerator handle height");
for (const id of ["handle-lower", "handle-upper"]) {
  comparisons++;
  if (!has("refrigerator", "default", id) || !fridgeText.includes(`\`${id.replace("handle-", "handle-upper/lower")}`) &&
    !fridgeText.includes("`handle-upper/lower/")) errors.push(`refrigerator: ${id} absent from prose or inventory`);
}

const stemTopRatio = claim("potted-plant", /줄기는 흙에서 ([\d.]+)H까지/);
for (const height of [180, 280, 600, 800, 1100])
  equal(part("potted-plant", String(height), "stem").y[1], height / 1000 * stemTopRatio,
    `potted-plant/${height}: stem top`);

const handleInset = claim("cabinet-and-shelf", /문 손잡이는 각 leaf의 힌지 반대 세로 edge에서 ([\d.]+)m 안쪽/);
const cabinetDoor = part("cabinet-and-shelf", "bench-base/1150x440x480/closed", "door-0");
const cabinetHandle = part("cabinet-and-shelf", "bench-base/1150x440x480/closed", "handle-0");
equal(cabinetDoor.x[1] - (cabinetHandle.x[0] + cabinetHandle.x[1]) / 2, handleInset, "cabinet door handle inset");
const islandHingeTop = claim("cabinet-and-shelf", /섬 문은 y=[\d.]+과 ([\d.]+)에/);
const serviceHinge = part("cabinet-and-shelf", "island-base/880x870x2650/closed", "service-hinge-1");
equal((serviceHinge.y[0] + serviceHinge.y[1]) / 2, islandHingeTop, "island door upper hinge y");
const kitchenFixedFront = part("cabinet-and-shelf", "kitchen-base/2900x870x620/closed", "fixed-front");
const kitchenStrip = claim("cabinet-and-shelf", /상단 ([\d.]+)m 구조 띠/);
equal(kitchenFixedFront.y[1] - part("cabinet-and-shelf", "kitchen-base/2900x870x620/closed", "drawer-2").y[1] - 0.003,
  kitchenStrip, "kitchen cabinet upper strip");
const wallBottom = claim("cabinet-and-shelf", /하단 ([\d.]+)m의 고정 프레임/);
equal(part("cabinet-and-shelf", "wall/2900x980x360/closed", "fixed-front-bottom").y[1], wallBottom,
  "wall cabinet bottom frame");

const pieceLine = sections.get("desk-chair")?.text.match(/^@piece default: upholstery, [^,]+, 0\.415\.\.0\.45, (-[\d.]+)\.\./m);
const rearAtSeam = -0.10 - 0.17 * (0.035 / 0.415) - 0.02 * 4 * (0.035 / 0.415) * (1 - 0.035 / 0.415) + 0.026;
equal(Number(pieceLine?.[1]), rearAtSeam, "desk chair upholstery piece rear bound", 0.0001);

// The earlier part-specific comparisons above cover these owners. Each owner
// below adds a prose-to-table measurement rather than trusting a textual token.
for (const owner of ["living-sofa", "dining-chair", "work-desk", "desk-chair", "fixed-bed",
  "murphy-bed", "toilet", "shower", "cooking-appliances", "laundry-appliances",
  "refrigerator", "potted-plant", "cabinet-and-shelf"]) crossCompared.add(owner);

for (const [owner, state, pattern, axes] of [
  ["dining-table", "default", /X 폭 ([\d.]+), Z 깊이 ([\d.]+), Y 높이 ([\d.]+)m/, "xzy"],
  ["coffee-table", "default", /X 폭 ([\d.]+), Z 깊이 ([\d.]+), 높이 ([\d.]+)m/, "xzy"],
  ["storage-basket", "default", /폭 ([\d.]+), 깊이 ([\d.]+), 높이 ([\d.]+)m/, "xzy"],
  ["entry-charger", "default", /폭 ([\d.]+), 깊이 ([\d.]+), 높이 ([\d.]+)m/, "xzy"],
  ["wall-art", "default", /폭 ([\d.]+), 높이 ([\d.]+), 전체 깊이 ([\d.]+)m/, "xyz"],
  ["living-display", "default", /폭 ([\d.]+), 높이 ([\d.]+), 깊이 ([\d.]+)m/, "xyz"],
  ["entry-bench", "default", /폭 ([\d.]+), 외함 깊이 [\d.]+, 방석 앞 돌출을 포함한 전체 깊이 ([\d.]+), 전체 높이 ([\d.]+)m/, "xzy"],
]) {
  const anchor = /** @type {string} */ (owner);
  const variant = /** @type {string} */ (state);
  for (let i = 0; i < 3; i++) envelopeSpan(anchor, variant,
    /** @type {"x"|"y"|"z"} */ (String(axes)[i]),
    claim(anchor, /** @type {RegExp} */ (pattern), i + 1), `prose extent ${String(axes)[i]}`);
}

envelopeSpan("island-stool", "default", "x", claim("island-stool", /좌판 지름 ([\d.]+), 상면 y=/), "seat diameter");
envelopeMax("island-stool", "default", "y", claim("island-stool", /상면 y=([\d.]+)/), "seat top");
envelopeSpan("work-equipment", "display", "x", claim("work-equipment", /`work-display`의 전체 화면판은 폭 ([\d.]+)/), "display width");
envelopeSpan("work-equipment", "keyboard", "x", claim("work-equipment", /`work-keyboard`는 폭 ([\d.]+)/), "keyboard width");
envelopeSpan("entry-charging-shelf", "default", "x", claim("entry-charging-shelf", /폭 ([\d.]+), 깊이/), "board width");
envelopeSpan("entry-charging-shelf", "default", "z", claim("entry-charging-shelf", /깊이 ([\d.]+), 몸판/), "board depth");
envelopeMax("entry-charging-shelf", "default", "y", claim("entry-charging-shelf", /몸판 두께 ([\d.]+)m/), "board upper face");
envelopeSpan("basin", "800", "x", claim("basin", /`basin\/800`은 폭 ([\d.]+)m/), "powder width");
envelopeSpan("basin", "1000", "x", claim("basin", /`basin\/1000`은 폭 ([\d.]+)m/), "upper width");
envelopeSpan("bathtub", "default", "z", claim("bathtub", /바닥 점유 ([\d.]+)\*/), "tub length");
envelopeSpan("bathtub", "default", "x", claim("bathtub", /바닥 점유 [\d.]+\*([\d.]+)m/), "tub width");
const islandWidth = claim("kitchen-island", /X 폭 ([\d.]+), Z 길이/);
const islandLength = claim("kitchen-island", /Z 길이 ([\d.]+), 상면/);
equal(part("kitchen-island", "default", "counter").x[1] - part("kitchen-island", "default", "counter").x[0], islandWidth, "kitchen-island counter width");
equal(part("kitchen-island", "default", "counter").z[1] - part("kitchen-island", "default", "counter").z[0], islandLength, "kitchen-island counter length");
crossCompared.add("kitchen-island");

for (const [state, dimension] of [["180x30x120", [0.03, 0.18, 0.12]],
  ["240x35x160", [0.035, 0.24, 0.16]], ["300x50x200", [0.05, 0.30, 0.20]]]) {
  const text = sections.get("books")?.text || "";
  if (!text.includes(`\`${state}\``)) errors.push(`books/${state}: variant absent from prose`);
  for (const [i, axis] of ["x", "y", "z"].entries()) envelopeSpan("books", /** @type {string} */ (state),
    /** @type {"x"|"y"|"z"} */ (axis), /** @type {number[]} */ (dimension)[i], `variant token ${axis}`);
}
for (const [state, group] of [["80", 1], ["120", 2], ["160", 3]])
  envelopeSpan("folded-towels", /** @type {string} */ (state), "y",
    claim("folded-towels", /허용 전체 높이는 ([\d.]+), ([\d.]+), ([\d.]+)m/, /** @type {number} */ (group)), "folded height");
envelopeSpan("rugs", "living", "x", claim("rugs", /`living-rug`는 폭 ([\d.]+)/), "living rug width");
envelopeSpan("rugs", "living", "z", claim("rugs", /`living-rug`는 폭 [\d.]+, 깊이 ([\d.]+)/), "living rug length");
envelopeSpan("rugs", "bedroom1600x2200", "x", claim("rugs", /`bedroom-rug\/1600x2200`은 폭 ([\d.]+)/), "bedroom rug width");
envelopeSpan("tabletop-props", "bowl", "x", claim("tabletop-props", /`decor-bowl`은 외경 ([\d.]+)/), "bowl diameter");
envelopeSpan("tabletop-props", "tray", "x", claim("tabletop-props", /`decor-tray`는 전체 폭 ([\d.]+)/), "tray width");
envelopeSpan("recessed-light", "default", "x", claim("recessed-light", /`recessed-light`는 외경 ([\d.]+)/), "trim diameter");
envelopeSpan("recessed-light", "default", "y", claim("recessed-light", /전체 깊이 ([\d.]+)m/), "assembly depth");
envelopeSpan("dining-pendant", "default", "y", claim("dining-pendant", /전체 하향 길이 ([\d.]+)m/), "pendant drop");
envelopeSpan("portable-lamps", "reading", "y", claim("portable-lamps", /`portable-lamp\/reading`의 전체 점유는 폭·깊이 [\d.]+, 높이 ([\d.]+)m/), "reading height");
envelopeSpan("portable-lamps", "bedside-globe", "y", claim("portable-lamps", /`portable-lamp\/bedside-globe`의 전체 점유는 폭·깊이 [\d.]+, 높이 ([\d.]+)m/), "globe height");
envelopeMax("portable-lamps", "desk-task", "y", claim("portable-lamps", /`portable-lamp\/desk-task`의 전체 점유는 x=±[\d.]+,y=0\.\.([\d.]+)/), "task height");

for (const [anchor, section] of sections) {
  const representative = /첫 변종 `([^`]+)`의 대표 국소 상면은 y=([\d.]+)/.exec(section.text);
  if (representative) envelopeMax(anchor, representative[1], "y", Number(representative[2]), "representative height");
}
if (crossCompared.size !== sections.size) {
  for (const anchor of sections.keys()) if (!crossCompared.has(anchor)) errors.push(`${anchor}: no prose/table cross comparison`);
}

return { h2: sections.size, crossComparedH2: crossCompared.size, comparisons, errors };
}

function fixture() {
  const changes = [
    ["living-sofa", "중심 x=±1.21,z=±0.34", "중심 x=±1.25,z=±0.34"],
    ["dining-table", "X 폭 1.80, Z 깊이 0.92", "X 폭 1.85, Z 깊이 0.92"],
    ["coffee-table", "X 폭 0.90, Z 깊이 1.25", "X 폭 0.95, Z 깊이 1.25"],
    ["dining-chair", "등판은 폭 0.46m·두께 0.025m", "등판은 폭 0.46m·두께 0.035m"],
    ["island-stool", "좌판 지름 0.36, 상면 y=0.63", "좌판 지름 0.38, 상면 y=0.63"],
    ["work-desk", "flex 상판은 두께 0.04m로 y=0.70..0.74", "flex 상판은 두께 0.06m로 y=0.68..0.74"],
    ["desk-chair", "0.415..0.45, -0.0945..0.26", "0.415..0.45, -0.074..0.26"],
    ["work-equipment", "`work-display`의 전체 화면판은 폭 0.50", "`work-display`의 전체 화면판은 폭 0.55"],
    ["cabinet-and-shelf", "문 손잡이는 각 leaf의 힌지 반대 세로 edge에서 0.055m 안쪽", "문 손잡이는 각 leaf의 힌지 반대 세로 edge에서 0.075m 안쪽"],
    ["entry-bench", "`entry-bench`는 폭 1.15", "`entry-bench`는 폭 1.25"],
    ["entry-charging-shelf", "`entry-charging-shelf`는 폭 0.32", "`entry-charging-shelf`는 폭 0.35"],
    ["fixed-bed", "`fixed-bed/1800`은 1.80m 매트리스와 베개 둘", "`fixed-bed/1800`은 1.80m 매트리스와 베개 하나"],
    ["murphy-bed", "pivot은 양쪽 x=±0.625, y=0.32, z=0.205", "pivot은 양쪽 x=±0.625, y=0.36, z=0.205"],
    ["basin", "`basin/800`은 폭 0.80m", "`basin/800`은 폭 0.85m"],
    ["toilet", "seat는 x=±0.21,z=−0.21..+0.36", "seat는 x=±0.21,z=−0.21..+0.40"],
    ["shower", "riser는 x=−0.85,z=−0.705", "riser는 x=−0.85,z=−0.60"],
    ["bathtub", "바닥 점유 1.62×0.76m", "바닥 점유 1.72×0.76m"],
    ["kitchen-island", "X 폭 1.20, Z 길이 2.82", "X 폭 1.30, Z 길이 2.82"],
    ["cooking-appliances", "오븐 손잡이는 0.36×0.025×0.028m", "오븐 손잡이는 0.46×0.025×0.028m"],
    ["refrigerator", "손잡이는 문마다 0.022×0.28×0.025m", "손잡이는 문마다 0.022×0.38×0.025m"],
    ["laundry-appliances", "중심 x=+0.10,y=0.74,z=0.307", "중심 x=+0.05,y=0.74,z=0.307"],
    ["potted-plant", "줄기는 흙에서 0.84H까지", "줄기는 흙에서 0.90H까지"],
    ["books", "허용 조합은 `180x30x120`", "허용 조합은 `181x30x120`"],
    ["folded-towels", "허용 전체 높이는 0.08, 0.12, 0.16m", "허용 전체 높이는 0.09, 0.12, 0.16m"],
    ["storage-basket", "폭 0.40, 깊이 0.65, 높이 0.28m", "폭 0.45, 깊이 0.65, 높이 0.28m"],
    ["entry-charger", "폭 0.07, 깊이 0.12, 높이 0.015m", "폭 0.08, 깊이 0.12, 높이 0.015m"],
    ["rugs", "`living-rug`는 폭 2.80", "`living-rug`는 폭 2.90"],
    ["wall-art", "`wall-art/600x420`은 폭 0.60", "`wall-art/600x420`은 폭 0.65"],
    ["tabletop-props", "`decor-bowl`은 외경 0.22", "`decor-bowl`은 외경 0.23"],
    ["living-display", "`living-display`는 폭 1.43", "`living-display`는 폭 1.53"],
    ["recessed-light", "`recessed-light`는 외경 0.12", "`recessed-light`는 외경 0.13"],
    ["dining-pendant", "전체 하향 길이 1.00m", "전체 하향 길이 1.10m"],
    ["portable-lamps", "`portable-lamp/reading`의 전체 점유는 폭·깊이 0.25, 높이 1.24m", "`portable-lamp/reading`의 전체 점유는 폭·깊이 0.25, 높이 1.34m"],
  ];
  let caught = 0;
  for (const [anchor, before, after] of changes) {
    const name = names.find((candidate) => fs.readFileSync(path.join(root, "docs/models", `${candidate}.md`), "utf8").includes(`{#${anchor}}`));
    if (!name) throw Error(`${anchor}: fixture owner file absent`);
    const source = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    const begin = source.indexOf(`{#${anchor}}`), end = source.indexOf("\n## ", begin);
    const section = source.slice(begin, end < 0 ? undefined : end);
    if (!section.includes(before)) throw Error(`${anchor}: fixture source absent: ${before}`);
    const changed = source.slice(0, begin) + section.replace(before, after) + source.slice(end < 0 ? source.length : end);
    const result = audit(new Map([[name, changed]]));
    if (!result.errors.length) throw Error(`${anchor}: prose mutation remained green`);
    caught++;
  }
  // Remove a part from its inventory, row, and other rows' contact lists as a
  // single edit. Geometry validation alone can accept this smaller assembly;
  // the prose claim must still make the deletion red.
  for (const [anchor, state, partId] of [
    ["refrigerator", "default", "handle-upper"],
    ["fixed-bed", "1800", "pillow-1"],
    ["laundry-appliances", "washer", "hinge-barrel"],
    ["laundry-appliances", "washer", "hinge-tongue"],
  ]) {
    const name = names.find((candidate) => fs.readFileSync(path.join(root, "docs/models", `${candidate}.md`), "utf8").includes(`{#${anchor}}`));
    if (!name) throw Error(`${anchor}: deletion fixture owner absent`);
    const source = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    const begin = source.indexOf(`{#${anchor}}`), end = source.indexOf("\n## ", begin);
    const section = source.slice(begin, end < 0 ? undefined : end);
    let inventoryChanged = false, rowRemoved = false;
    const lines = section.split(/\r?\n/).flatMap((line) => {
      if (line.startsWith(`@inventory ${state}: `)) {
        const beforeList = line.slice(line.indexOf(": ") + 2).split(", ").filter((item) => item !== partId);
        inventoryChanged = beforeList.length !== line.slice(line.indexOf(": ") + 2).split(", ").length;
        return [`@inventory ${state}: ${beforeList.join(", ")}`];
      }
      if (line.startsWith(`| @part | ${state} | ${partId} |`)) { rowRemoved = true; return []; }
      if (line.startsWith(`| @part | ${state} |`)) {
        const cells = line.split("|");
        const contacts = cells[cells.length - 2].trim().split(",").filter((item) => item !== partId);
        cells[cells.length - 2] = ` ${contacts.join(",")} `;
        return [cells.join("|")];
      }
      return [line];
    });
    if (!inventoryChanged || !rowRemoved) throw Error(`${anchor}/${state}/${partId}: deletion fixture source absent`);
    const changed = source.slice(0, begin) + lines.join("\n") + source.slice(end < 0 ? source.length : end);
    const result = audit(new Map([[name, changed]]));
    if (!result.errors.length) throw Error(`${anchor}/${state}/${partId}: consistent deletion remained green`);
    caught++;
  }
  return { mutations: caught, caught };
}

if (require.main === module) {
  const result = audit();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
  if (process.argv.includes("--fixture")) console.log(JSON.stringify(fixture(), null, 2));
}
module.exports = { audit, fixture };
