/** In-memory design relations, with independent arithmetic and negative twins. */
require(require.resolve("tsx/cjs"));
const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyStairLanding, verifyCurtainStrip } = require("./space-design.ts");
const { verifyRoofInternalFaces } = require("./roof-overlap.ts");
const { block } = require("../spaces/solids.ts");

void test("stair turn follows landing centre and eighth rise", () => {
  const opening = { west: -1.8, turnX: -0.65, back: -4.56, turnZ: -3.41 };
  const turn = { x: -1.225, y: 3.16 * 8 / 18, z: -3.985 };
  const route = [turn, turn, turn];
  assert.doesNotThrow(() => verifyStairLanding([...route, turn], opening, 3.16 / 18));
  assert.throws(() => verifyStairLanding([...route, { ...turn, y: 1.36 }], opening, 3.16 / 18), /eighth rise/);
  assert.throws(() => verifyStairLanding([...route, { ...turn, x: -1.2 }], opening, 3.16 / 18), /landing centre/);
  assert.throws(() => verifyStairLanding([...route, { ...turn, z: -4 }], opening, 3.16 / 18), /landing centre/);
  assert.throws(() => verifyStairLanding([], opening, 3.16 / 18), /stair connector turn/);
});

void test("curtain strip follows window span, floor, head, and inward depth", () => {
  const window = { from: 0.4, to: 1.4, top: 2.3 };
  /** @type {import("./space-design").Box} */
  const strip = { x: [0.3, 1.5], y: [0.1, 2.42], z: [-0.37, -0.25] };
  assert.doesNotThrow(() => verifyCurtainStrip("sample", strip, window, 0, "x", -0.25, -1));
  assert.throws(() => verifyCurtainStrip("sample", { ...strip, y: /** @type {[number, number]} */ ([0.1, 2.6]) }, window, 0, "x", -0.25, -1), /sample: curtain/);
  assert.throws(() => verifyCurtainStrip("sample", { ...strip, x: /** @type {[number, number]} */ ([0.2, 1.5]) }, window, 0, "x", -0.25, -1), /sample: curtain/);
  assert.throws(() => verifyCurtainStrip("sample", { ...strip, z: /** @type {[number, number]} */ ([-0.4, -0.25]) }, window, 0, "x", -0.25, -1), /sample: curtain/);
  assert.throws(() => verifyCurtainStrip("sample", undefined, window, 0, "x", -0.25, -1), /sample: curtain/);
  assert.doesNotThrow(() => verifyCurtainStrip("other", { x: [-5.5, -5.38], y: [3.16, 5.43], z: [-5.6, -4.1] }, { from: -5.5, to: -4.2, top: 5.31 }, 3.06, "z", -5.5, 1));
});

void test("a roof closure buried inside a touching roof is refused", () => {
  const left = { id: "left", mesh: block([0, 0, 0], [1, 1, 1]) };
  const right = { id: "right", mesh: block([1, 0, 0], [2, 1, 1]) };
  assert.throws(() => verifyRoofInternalFaces([left, right]), /internal roof closure faces/);
  assert.doesNotThrow(() => verifyRoofInternalFaces([left, { ...right, mesh: block([1.02, 0, 0], [2.02, 1, 1]) }]));
});
