/** Checks the documented contacts introduced by the wall baseboard and door
 * casings. These are design arithmetic checks, not claims about unbuilt meshes.
 * The values come from the authored H2s on each run. */
const fs = require("node:fs");
const path = require("node:path");

const docs = path.resolve(__dirname, "../../docs/models");
/** @param {string} file @param {string} anchor */
function body(file, anchor) {
  const source = fs.readFileSync(path.join(docs, file), "utf8");
  const section = source.split(/^## /m).find((part) => part.split("\n", 1)[0].includes(`{#${anchor}}`));
  if (!section) throw new Error(`Missing ${file}#${anchor}`);
  return section.replace(/<!--[\s\S]*?-->/g, "");
}
/** @param {RegExp} pattern @param {string} source @param {string} label */
function number(pattern, source, label) {
  const match = pattern.exec(source);
  if (!match) throw new Error(`Missing ${label}`);
  return Number(match[1].replace("−", "-"));
}
/** @type {string[]} */
const failures = [];
let checkedContacts = 0;
/** @param {boolean} result @param {string} label */
const assert = (result, label) => { checkedContacts++; if (!result) failures.push(label); };
const base = body("06-interior-trim.md", "wall-baseboard");
const depth = number(/최대 방 쪽 돌출은\s*(0\.0\d+)\s*m/, base, "wall-baseboard projection");
const height = number(/따라서 높이는\s*(0\.\d+)\s*m/, base, "wall-baseboard height");
const frame = body("00-model-frame.md", "model-furniture-local-frame");
assert(frame.includes("옆면 홈") && frame.includes("걸레받이 벽에 닿으면"), "common side-wall rule");

/** @param {string} source @param {string} marker @param {string} label @param {number} requiredDepth */
function sideContact(source, marker, label, requiredDepth) {
  const sentence = source.split(/\r?\n/).find((line) => line.includes(marker));
  if (!sentence) { assert(false, `${label}: side-wall relief absent`); return; }
  const recess = number(/안쪽\s*(\d+(?:\.\d+)?)\s*m/, sentence, `${label} recess`);
  const y = number(/Y=\[0,(\d+(?:\.\d+)?)\]/, sentence, `${label} relief height`);
  const z = number(/Z=\[0,(\d+(?:\.\d+)?)\]/, sentence, `${label} relief depth`);
  assert(recess >= depth - 1e-8, `${label}: recess ${recess} < baseboard ${depth}`);
  assert(y >= height - 1e-8, `${label}: height ${y} < baseboard ${height}`);
  assert(z >= requiredDepth - 1e-8, `${label}: side relief stops at ${z}, body reaches ${requiredDepth}`);
}
const machine = body("12-service-rooms.md", "laundry-machine");
const bench = body("12-service-rooms.md", "mudroom-bench");
const baseRun = body("10-kitchen-dining.md", "kitchen-base-run");
sideContact(process.argv.includes("--mutate-dryer-side") ? machine.replace(/^.*건조기의 앞벽 쪽.*$/m, "") : machine,
  "건조기의 앞벽 쪽", "dryer", 0.75);
sideContact(bench, "벤치의 앞벽 쪽", "mudroom bench", 0.40);
assert(/직교 도장 벽에 닿는 조각도 국소 X 끝에서 안쪽 0\.015 m·Y=\[0,0\.10\]/.test(baseRun), "kitchen plinth side contact");
assert(baseRun.includes("레인지·냉장고 양옆") && baseRun.includes("45° miter"), "kitchen baseboard run termination");
const closet = body("13-bedrooms.md", "sliding-closet");
assert(closet.includes("벽 **앞**") && closet.includes("벽에 개구부나 벽감을 요구하지 않는다") &&
  closet.includes("Z=[0,0.015]"), "sliding closet wall-front relief");
const coatCasing = body("05-closet-fittings.md", "coat-closet-doors");
const linenCasing = body("05-closet-fittings.md", "linen-closet-fittings");
const slidingCasing = process.argv.includes("--mutate-drop-closet-casing")
  ? closet.replace(/^흰 전면 `casing`.*$/m, "") : closet;
assert(coatCasing.includes("X=[2.02,2.035]") && coatCasing.includes("Y=[0,2.15]") && coatCasing.includes("Y=[2.15,2.20]") && 2.035 < 2.07,
  "coat closet casing reaches the floor and remains inside the corridor limit");
assert(linenCasing.includes("X=[1.92,1.97]") && linenCasing.includes("[2.97,3.02]") &&
  linenCasing.includes("Y=[0,2.20]") && linenCasing.includes("Y=[2.20,2.25]"),
  "linen casing meets around the opening without occupying its width");
assert(slidingCasing.includes("Z=[0.57,0.60]") && slidingCasing.includes("Z≤0.57 m") &&
  slidingCasing.includes("Y=[0,2.17]") && slidingCasing.includes("Y=[2.17,2.20]"),
  "sliding closet casing remains ahead of the moving leaves within the reservation");

const interiorDoor = body("03-interior-doors.md", "interior-door-members");
const casing = interiorDoor.split(/\r?\n/).find((line) => line.includes("차고 공유 벽에서는 열림 쪽 세탁실")) ?? "";
for (const [label, section, snippet] of [
  ["washer", machine, "X=[-0.325,-0.255]"],
  ["folding top", body("12-service-rooms.md", "laundry-folding-top"), "X=[5.485,5.50]"],
  ["upper cabinet", body("12-service-rooms.md", "laundry-upper-storage"), "X=[5.485,5.50]"],
]) assert(casing.includes("X=[5.485,5.50]") && section.includes(snippet), `${label}: laundry garage casing volume not subtracted`);
assert(interiorDoor.includes("팬트리 선반의 가장 가까운 Z=−4.70 m") && interiorDoor.includes("0.30 m 떨어져"), "pantry shelf casing separation");

const front = body("02-exterior-doors.md", "front-entry-door");
const garden = body("02-exterior-doors.md", "garden-door-pair");
for (const [label, original] of [["front", front], ["garden", garden]]) {
  const source = process.argv.includes("--mutate-floating-trim") && label === "front"
    ? original.replace("Y=[0,2.20]", "Y=[0.02,2.20]") : original;
  const line = source.split(/\r?\n/).find((item) => item.startsWith(label === "front" ? "현관문 `exterior-trim`" : "정원문 `exterior-trim`")) ?? "";
  const exterior = line.split(/(?:안쪽|실내) `casing`/)[0];
  const interior = line.slice(exterior.length);
  assert(/Y=\[0,2\./.test(exterior) && /Y=\[0,2\./.test(interior), `${label}: trim and interior casing must reach finished floor`);
  assert(line.includes("두께 0.035 m") && line.includes("0.030 m"), `${label}: trim must clear siding butt at structural weather datum`);
}

const skirt = body("04-stair-members.md", "stair-side-skirt");
const lower = number(/참 연결판의 앞면 Z=(−?\d+\.\d+)/, skirt, "lower skirt end");
const connectorEnd = number(/Z=\[−3\.41,(−?\d+\.\d+)\]/, skirt, "connector front face");
const upper = number(/X=(−?\d+\.\d+) m부터 시작/, skirt, "upper skirt start");
const connectorX = number(/X=\[−0\.65,(−?\d+\.\d+)\]/, skirt, "connector side face");
assert(Math.abs(lower - connectorEnd) < 1e-8 && Math.abs(upper - connectorX) < 1e-8,
  "stair skirts must meet connector by face only");
assert(skirtSafe(skirt), "upper stair skirt must end at the ceiling edge without crossing it");
/** @param {string} source */
function skirtSafe(source) { return source.includes("Y=2.75 m") && source.includes("Y≥2.75 m") && source.includes("X>Xc"); }

console.log(JSON.stringify({ baseboardDepth: depth, baseboardHeight: height, checkedContacts, failures }));
if (failures.length) process.exitCode = 1;
