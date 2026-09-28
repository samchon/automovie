/** Measures the emitted stair rails against every tread nose in world metres. */
const { strict: assert } = require("node:assert");
const { test } = require("node:test");
const { buildHouse } = require("./house.ts");

const parts = buildHouse().parts;
/** @param {string} id */
const named = (id) => {
  const found = parts.find((part) => part.id === id);
  assert.ok(found, `missing ${id}`);
  return found;
};
/** @param {string} id */
const points = (id) => {
  const position = named(id).mesh.positions;
  const result = [];
  for (let i = 0; i < position.length; i += 3)
    result.push([position[i], position[i + 1], position[i + 2]]);
  return result;
};
/** @param {string} id @param {number} axis */
const bounds = (id, axis) => {
  const values = points(id).map((point) => point[axis]);
  return [Math.min(...values), Math.max(...values)];
};
/** @param {string} id @param {number} axis @param {number} station */
const topAt = (id, axis, station) => {
  const vertices = points(id);
  const [first, last] = bounds(id, axis);
  /** @param {number} end */
  const endTop = (end) =>
    Math.max(
      ...vertices
        .filter((point) => Math.abs(point[axis] - end) < 1e-8)
        .map((point) => point[1]),
    );
  const firstTop = endTop(first);
  return (
    firstTop + ((endTop(last) - firstTop) * (station - first)) / (last - first)
  );
};

void test("both sloped handrails clear every actual tread nose by 0.90 m", () => {
  /** @type {readonly [string, number, number, number][]} */
  const flights = [
    ["lower", 2, 7, 1],
    ["upper", 0, 9, 0],
  ];
  for (const [flight, axis, count, noseEnd] of flights) {
    const rail = `stair-handrail-${flight}`;
    for (let index = 1; index <= count; index++) {
      const tread = `stair-${flight}-tread-${index}`;
      const nose = bounds(tread, axis)[noseEnd];
      const treadTop = bounds(tread, 1)[1];
      assert.ok(
        Math.abs(topAt(rail, axis, nose) - treadTop - 0.9) < 1e-8,
        `${rail} at ${tread}: top ${topAt(rail, axis, nose) - treadTop} m over nose`,
      );
    }
  }
});

void test("landing corner post receives both rail ends", () => {
  const corner = "stair-post-landing-corner";
  const cornerTop = bounds(corner, 1)[1];
  const lowerTop = topAt("stair-handrail-lower", 2, -3.41);
  const upperTop = topAt("stair-handrail-upper", 0, -0.65);
  assert.ok(Math.abs(cornerTop - upperTop) < 1e-8);
  assert.ok(cornerTop >= lowerTop);
  assert.ok(Math.abs(lowerTop - 1.36 - 0.9) < 1e-8);
});

for (const end of ["west", "east"])
  void test(`hall guard ${end} post meets the rail underside without overlapping its finish`, () => {
    const post = `stair-guard-post-${end}`;
    const rail = "stair-guard-top-rail";
    const [postBottom, postTop] = bounds(post, 1);
    const [railBottom, railTop] = bounds(rail, 1);
    assert.ok(postBottom < postTop);
    assert.ok(railBottom < railTop);
    assert.ok(
      Math.abs(postTop - railBottom) < 1e-8,
      `${post}: post top ${postTop}, rail underside ${railBottom}`,
    );
    for (const axis of [0, 2]) {
      const postSpan = bounds(post, axis);
      const railSpan = bounds(rail, axis);
      assert.ok(
        postSpan[0] >= railSpan[0] - 1e-8 && postSpan[1] <= railSpan[1] + 1e-8,
      );
    }
  });
