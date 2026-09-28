// Compare every current element and population member with the reviewed
// identity baseline. Geometry checks read the same compiled environment.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { builtEnvironmentElementBounds } = require("@automovie/engine");
const { buildHouse } = require("../house/build.ts");
const { exteriorFrame } = require("../house/envelope/facade.ts");
const { datum } = require("../house/plan.ts");
const { foundationBottom } = require("../house/storeys/ground.ts");
/** @typedef {NonNullable<ReturnType<typeof builtEnvironmentElementBounds>>} Bounds */

const basis = fs.readFileSync(path.join(__dirname, "element-id-baseline.txt"), "utf8")
  .split(/\r?\n/).filter((line) => line && !line.startsWith("#"));
const environment = buildHouse();
const elements = environment.elements;
const elementIds = elements.map((element) => element.id);
const populationIds = (environment.populations ?? []).flatMap(({ set }) => {
  assert.equal(
    set.layout.kind,
    "explicit",
    `${set.id}: baseline needs explicit transforms`,
  );
  return set.layout.transforms.map(
    (transform) => `population:${set.id}:${transform.id}`,
  );
});
const ids = new Set([...elementIds, ...populationIds]);
assert.equal(
  ids.size,
  elementIds.length + populationIds.length,
  "duplicate compiled identities",
);
const expectedSpandrel = basis.filter((id) => id.includes("-spandrel-"));
const observed = process.argv.includes("--drop-spandrel")
  ? new Set([...ids].filter((id) => !id.includes("-spandrel-")))
  : ids;
const missing = basis.filter((id) => !observed.has(id));
if (process.argv.includes("--fixture")) {
  const removed = new Set(expectedSpandrel);
  const mutated = new Set([...ids].filter((id) => !removed.has(id)));
  const detected = basis.filter((id) => !mutated.has(id));
  assert.equal(
    detected.length,
    311,
    "fixture must detect every deleted cassette part",
  );
  assert.ok(detected.every((id) => id.includes("-spandrel-")));
  for (const kind of ["stone-panels", "floor-boards"]) {
    const member = populationIds.find((id) => id.includes(kind));
    assert.ok(member, `${kind}: missing fixture member`);
    const reduced = new Set([...ids].filter((id) => id !== member));
    assert.deepEqual(
      basis.filter((id) => !reduced.has(id)),
      [member],
      `${kind}: one deleted instance must fail`,
    );
  }
  console.log(
    `PASS deletion fixture: ${detected.length} cassette parts and both population kinds detected`,
  );
  process.exit(0);
}
if (missing.length) {
  console.error(
    `FAIL element deletion: ${missing.length} baseline IDs missing`,
  );
  for (const id of missing.slice(0, 20)) console.error(`  removed ${id}`);
  process.exit(1);
}
assert.ok(populationIds.length > 0, "compiled population members are present");
assert.equal(
  expectedSpandrel.length,
  311,
  "baseline retains all cassette parts",
);

const tolerance = 1e-7;
/** @param {number} actual @param {number} expected @param {string} label */
const near = (actual, expected, label) => assert.ok(
  Math.abs(actual - expected) <= tolerance,
  `${label}: ${actual} != ${expected}`,
);
/** @type {["front" | "rear" | "left" | "right", string, number, number, number][]} */
const bandTable = [
  ["front", "front-stair-glazing-upper", -1.24, 1.58, 3],
  ["front", "front-bedroom-glazing", 3.02, 5.26, 2],
  ["rear", "rear-bedroom-glazing", -2.84, 5.26, 7],
  ["left", "left-bedroom-glazing", -5.44, -2.26, 3],
  ["right", "right-bath-glazing", 3.56, 5.44, 2],
];
/** @param {string} id @returns {Bounds} */
const placed = (id) => {
  assert.ok(ids.has(id), `${id}: absent`);
  const box = builtEnvironmentElementBounds(environment, id);
  assert.ok(box, `${id}: no bounds`);
  return box;
};
/** @param {Bounds} box @param {ReturnType<typeof exteriorFrame>} frame */
const normalSpan = (box, frame) => [
  (box.min[frame.along === "x" ? "z" : "x"] - frame.plane) * frame.normal,
  (box.max[frame.along === "x" ? "z" : "x"] - frame.plane) * frame.normal,
].sort((a, b) => a - b);
/** @param {number[]} actual @param {number[]} expected @param {string} label */
const checkSpan = (actual, expected, label) => {
  near(actual[0], expected[0], `${label} low`);
  near(actual[1], expected[1], `${label} high`);
};
let plateCount = 0;
for (const [face, glazing, start, end, count] of bandTable) {
  const frame = exteriorFrame(face);
  const prefix = `${frame.id}-spandrel-${glazing}`;
  const plates = elements.filter((element) => element.id.startsWith(prefix + "-panel-") && /-plate$/.test(element.id))
    .sort((a, b) => Number(a.id.match(/-panel-(\d+)-plate$/)?.[1]) - Number(b.id.match(/-panel-(\d+)-plate$/)?.[1]));
  assert.equal(plates.length, count, `${prefix}: design table plate count`);
  plateCount += plates.length;
  const sideSeals = elements.filter((element) =>
    element.id.startsWith(prefix + "-seal-side-"),
  );
  assert.equal(
    sideSeals.length,
    count + 1,
    `${prefix}: every panel boundary is sealed`,
  );
  for (let j = 0; j < plates.length; j++) {
    const panel = `${prefix}-panel-${j}`;
    const plate = placed(panel + "-plate");
    checkSpan(
      [plate.min.y, plate.max.y],
      [2.844, 3.246],
      `${panel} plate height`,
    );
    checkSpan(normalSpan(plate, frame), [0.138, 0.140], `${panel} plate depth`);
    near(
      normalSpan(plate, frame)[1] - frame.depth / 2,
      0.020,
      `${panel} exterior projection`,
    );
    const range = [plate.min[frame.along], plate.max[frame.along]];
    if (j === 0) near(range[0], start + 0.002, `${panel} band start`);
    if (j === count - 1) near(range[1], end - 0.002, `${panel} band end`);
    if (j > 0) near(
      range[0] - placed(`${prefix}-panel-${j - 1}-plate`).max[frame.along],
      0.004,
      `${panel} joint`,
    );
    for (const edge of ["top", "bottom"]) {
      const seal = placed(`${panel}-seal-${edge}`);
      checkSpan(
        [seal.min.y, seal.max.y],
        edge === "top" ? [3.246, 3.25] : [2.84, 2.844],
        `${panel} ${edge} seal`,
      );
    }
    for (let slot = 0; slot < 2; slot++) {
      const slotCenter = range[0] + (range[1] - range[0]) * (slot === 0 ? 0.25 : 0.75);
      const inner = placed(`${panel}-slot-${slot}-inner`);
      const outer = placed(`${panel}-slot-${slot}-outer`);
      const clip = placed(`${panel}-clip-${slot}`);
      const anchor = placed(`${panel}-anchor-${slot}`);
      checkSpan(
        [inner.min.y, inner.max.y],
        [2.844, 2.846],
        `${panel} slot inner`,
      );
      checkSpan(
        [outer.min.y, outer.max.y],
        [2.844, 2.846],
        `${panel} slot outer`,
      );
      checkSpan(
        normalSpan(inner, frame),
        [0.120, 0.122],
        `${panel} slot inner depth`,
      );
      checkSpan(
        normalSpan(outer, frame),
        [0.137, 0.138],
        `${panel} slot outer depth`,
      );
      checkSpan(
        [inner.min[frame.along], inner.max[frame.along]],
        [slotCenter - 0.005, slotCenter + 0.005],
        `${panel} slot width`,
      );
      checkSpan(
        [outer.min[frame.along], outer.max[frame.along]],
        [slotCenter - 0.005, slotCenter + 0.005],
        `${panel} opposite slot width`,
      );
      near(
        (clip.min[frame.along] + clip.max[frame.along]) / 2,
        slotCenter,
        `${panel} clip alignment`,
      );
      near(
        (anchor.min[frame.along] + anchor.max[frame.along]) / 2,
        slotCenter,
        `${panel} anchor alignment`,
      );
      checkSpan([clip.min.y, clip.max.y], [3.05, 3.07], `${panel} clip`);
      near((anchor.min.y + anchor.max.y) / 2, 3.06, `${panel} anchor center`);
    }
    const quarter = range[0] + (range[1] - range[0]) * 0.25;
    const threeQuarter = range[0] + (range[1] - range[0]) * 0.75;
    const bottomSpans = [
      [range[0] + 0.002, quarter - 0.005],
      [quarter + 0.005, threeQuarter - 0.005],
      [threeQuarter + 0.005, range[1] - 0.002],
    ];
    for (let index = 0; index < bottomSpans.length; index++) {
      const returnBox = placed(`${panel}-return-bottom-${index}`);
      checkSpan(
        [returnBox.min[frame.along], returnBox.max[frame.along]],
        bottomSpans[index],
        `${panel} bottom return ${index}`,
      );
    }
  }
  for (let seam = 0; seam <= count; seam++) {
    const seal = placed(`${prefix}-seal-side-${seam}`);
    const low = seam === 0
      ? start
      : placed(`${prefix}-panel-${seam - 1}-plate`).max[frame.along];
    const high = seam === count
      ? end
      : placed(`${prefix}-panel-${seam}-plate`).min[frame.along];
    checkSpan(
      [seal.min[frame.along], seal.max[frame.along]],
      [low, high],
      `${prefix} seam ${seam}`,
    );
    checkSpan(
      [seal.min.y, seal.max.y],
      [2.84, 3.25],
      `${prefix} seam height ${seam}`,
    );
  }
  console.log(`PASS ${prefix}: ${start}..${end}, ${plates.length} plates`);
}
const spandrel = elements.filter((element) =>
  element.id.includes("-spandrel-"),
);
assert.equal(spandrel.length, 311, "complete cassette element count");
assert.equal(plateCount, 17, "complete design plate count");
assert.ok(
  environment.models.some((model) => model.id === "box-seal"),
  "seal material is bound",
);
near(
  placed("ground-foundation-0").min.y,
  foundationBottom,
  "foundation bottom",
);
for (const id of ["house", "ground-storey"]) {
  const space = environment.spaces.find((candidate) => candidate.id === id);
  assert.ok(space, `${id}: missing space`);
  const lowerPlane = space.cells[0].planes.find(
    (plane) => plane.normal.y === -1,
  );
  assert.ok(lowerPlane, `${id}: missing lower plane`);
  near(lowerPlane.offset, -foundationBottom, `${id} foundation datum`);
}
const tread0 = placed("approach-tread-0");
const tread1 = placed("approach-tread-1");
const landing = placed("approach-landing");
near(tread0.max.z, tread1.min.z, "approach tread joint");
near(tread1.max.z, landing.min.z, "approach landing joint");
near(landing.max.z, datum.minZ, "approach meets facade");
console.log(
  `PASS identities ${ids.size} current / ${basis.length} baseline (${elementIds.length} elements, ${populationIds.length} population members); spandrel ${spandrel.length}; bands ${bandTable.length}; plates ${plateCount}`,
);
