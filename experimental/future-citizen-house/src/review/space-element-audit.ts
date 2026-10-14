/**
 * Inspect actual buildHouse elements and explicit population member identities.
 * Five authored facade bands, 17 plate and 311 cassette counts, numeric member
 * bounds, foundation datums and approach endpoint contacts are the finite oracle;
 * distances use 1e-7 tolerance. ID patterns locate geometry, not prose to be graded.
 * AABB/identity agreement does not prove complete topology, overlap freedom,
 * continuous passage, current material appearance or a rendered screen.
 * Construction and assertions run synchronously in process memory and throw on
 * failure; console output is diagnostic and no browser/native session is acquired.
 */
import assert from "node:assert/strict";
import { builtEnvironmentElementBounds } from "@automovie/engine";
import { buildHouse } from "../house/build";
import { exteriorFrame } from "../house/envelope/facade";
import { datum } from "../house/plan";
import { foundationBottom } from "../house/storeys/ground";
type Bounds = NonNullable<ReturnType<typeof builtEnvironmentElementBounds>>;

const environment: ReturnType<typeof buildHouse> = buildHouse();
const elements: typeof environment.elements = environment.elements;
const elementIds: string[] = elements.map((element: typeof elements[number]): string => element.id);
const populationIds: string[] = (environment.populations ?? []).flatMap(({ set }: NonNullable<typeof environment.populations>[number]): string[] => {
  assert.equal(
    set.layout.kind,
    "explicit",
    `${set.id}: expected explicit transforms`,
  );
  return set.layout.transforms.map(
    (transform: typeof set.layout.transforms[number]): string => `population:${set.id}:${transform.id}`,
  );
});
const ids: Set<string> = new Set([...elementIds, ...populationIds]);
assert.equal(
  ids.size,
  elementIds.length + populationIds.length,
  "duplicate compiled identities",
);
assert.ok(populationIds.length > 0, "compiled population members are present");

const tolerance: number = 1e-7;
const near: (actual: number, expected: number, label: string) => void = (actual: number, expected: number, label: string): void => assert.ok(
  Math.abs(actual - expected) <= tolerance,
  `${label}: ${actual} != ${expected}`,
);
const bandTable: ["front" | "rear" | "left" | "right", string, number, number, number][] = [
  ["front", "front-stair-glazing-upper", -1.24, 1.58, 3],
  ["front", "front-bedroom-glazing", 3.02, 5.26, 2],
  ["rear", "rear-bedroom-glazing", -2.84, 5.26, 7],
  ["left", "left-bedroom-glazing", -5.44, -2.26, 3],
  ["right", "right-bath-glazing", 3.56, 5.44, 2],
];
const placed: (id: string) => Bounds = (id: string): Bounds => {
  assert.ok(ids.has(id), `${id}: absent`);
  const box: Bounds | null = builtEnvironmentElementBounds(environment, id);
  assert.ok(box, `${id}: no bounds`);
  return box;
};
const normalSpan: (box: Bounds, frame: ReturnType<typeof exteriorFrame>) => number[] = (box: Bounds, frame: ReturnType<typeof exteriorFrame>): number[] => [
  (box.min[frame.along === "x" ? "z" : "x"] - frame.plane) * frame.normal,
  (box.max[frame.along === "x" ? "z" : "x"] - frame.plane) * frame.normal,
].sort((a: number, b: number): number => a - b);
const checkSpan: (actual: number[], expected: number[], label: string) => void = (actual: number[], expected: number[], label: string): void => {
  near(actual[0], expected[0], `${label} low`);
  near(actual[1], expected[1], `${label} high`);
};
let plateCount: number = 0;
for (const [face, glazing, start, end, count] of bandTable) {
  const frame: ReturnType<typeof exteriorFrame> = exteriorFrame(face);
  const prefix: string = `${frame.id}-spandrel-${glazing}`;
  const plates: typeof elements = elements.filter((element: typeof elements[number]): boolean => element.id.startsWith(prefix + "-panel-") && /-plate$/.test(element.id))
    .sort((a: typeof elements[number], b: typeof elements[number]): number => Number(a.id.match(/-panel-(\d+)-plate$/)?.[1]) - Number(b.id.match(/-panel-(\d+)-plate$/)?.[1]));
  assert.equal(plates.length, count, `${prefix}: design table plate count`);
  plateCount += plates.length;
  const sideSeals: typeof elements = elements.filter((element: typeof elements[number]): boolean =>
    element.id.startsWith(prefix + "-seal-side-"),
  );
  assert.equal(
    sideSeals.length,
    count + 1,
    `${prefix}: every panel boundary is sealed`,
  );
  for (let j: number = 0; j < plates.length; j++) {
    const panel: string = `${prefix}-panel-${j}`;
    const plate: Bounds = placed(panel + "-plate");
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
    const range: number[] = [plate.min[frame.along], plate.max[frame.along]];
    if (j === 0) near(range[0], start + 0.002, `${panel} band start`);
    if (j === count - 1) near(range[1], end - 0.002, `${panel} band end`);
    if (j > 0) near(
      range[0] - placed(`${prefix}-panel-${j - 1}-plate`).max[frame.along],
      0.004,
      `${panel} joint`,
    );
    for (const edge of ["top", "bottom"]) {
      const seal: Bounds = placed(`${panel}-seal-${edge}`);
      checkSpan(
        [seal.min.y, seal.max.y],
        edge === "top" ? [3.246, 3.25] : [2.84, 2.844],
        `${panel} ${edge} seal`,
      );
    }
    for (let slot: number = 0; slot < 2; slot++) {
      const slotCenter: number = range[0] + (range[1] - range[0]) * (slot === 0 ? 0.25 : 0.75);
      const inner: Bounds = placed(`${panel}-slot-${slot}-inner`);
      const outer: Bounds = placed(`${panel}-slot-${slot}-outer`);
      const clip: Bounds = placed(`${panel}-clip-${slot}`);
      const anchor: Bounds = placed(`${panel}-anchor-${slot}`);
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
    const quarter: number = range[0] + (range[1] - range[0]) * 0.25;
    const threeQuarter: number = range[0] + (range[1] - range[0]) * 0.75;
    const bottomSpans: number[][] = [
      [range[0] + 0.002, quarter - 0.005],
      [quarter + 0.005, threeQuarter - 0.005],
      [threeQuarter + 0.005, range[1] - 0.002],
    ];
    for (let index: number = 0; index < bottomSpans.length; index++) {
      const returnBox: Bounds = placed(`${panel}-return-bottom-${index}`);
      checkSpan(
        [returnBox.min[frame.along], returnBox.max[frame.along]],
        bottomSpans[index],
        `${panel} bottom return ${index}`,
      );
    }
  }
  for (let seam: number = 0; seam <= count; seam++) {
    const seal: Bounds = placed(`${prefix}-seal-side-${seam}`);
    const low: number = seam === 0
      ? start
      : placed(`${prefix}-panel-${seam - 1}-plate`).max[frame.along];
    const high: number = seam === count
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
const spandrel: typeof elements = elements.filter((element: typeof elements[number]): boolean =>
  element.id.includes("-spandrel-"),
);
assert.equal(spandrel.length, 311, "complete cassette element count");
assert.equal(plateCount, 17, "complete design plate count");
assert.ok(
  environment.models.some((model: typeof environment.models[number]): boolean => model.id === "box-seal"),
  "seal material is bound",
);
near(
  placed("ground-foundation-0").min.y,
  foundationBottom,
  "foundation bottom",
);
for (const id of ["house", "ground-storey"]) {
  const space: typeof environment.spaces[number] | undefined = environment.spaces.find((candidate: typeof environment.spaces[number]): boolean => candidate.id === id);
  assert.ok(space, `${id}: missing space`);
  const lowerPlane: typeof space.cells[number]["planes"][number] | undefined = space.cells[0].planes.find(
    (plane: typeof space.cells[number]["planes"][number]): boolean => plane.normal.y === -1,
  );
  assert.ok(lowerPlane, `${id}: missing lower plane`);
  near(lowerPlane.offset, -foundationBottom, `${id} foundation datum`);
}
const tread0: Bounds = placed("approach-tread-0");
const tread1: Bounds = placed("approach-tread-1");
const landing: Bounds = placed("approach-landing");
near(tread0.max.z, tread1.min.z, "approach tread joint");
near(tread1.max.z, landing.min.z, "approach landing joint");
near(landing.max.z, datum.minZ, "approach meets facade");
console.log(
  `PASS ${elementIds.length} elements, ${populationIds.length} population members; spandrel ${spandrel.length}; bands ${bandTable.length}; plates ${plateCount}`,
);
