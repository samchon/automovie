const test = require("node:test");
const assert = require("node:assert/strict");
const { authoredGeometry, sweep } = require("./segmented-panel-sweep.cjs");

void test("authored panel hinges stay disjoint through the full travel", () => {
  const result = sweep(authoredGeometry(), 80);
  assert.equal(result.failures.length, 0);
  assert.equal(result.panelPairs, 243);
});

void test("moving the hinge to the thickness center causes positive overlap", () => {
  const p = authoredGeometry();
  Object.assign(p, {
    hinge: -0.335,
    pathZ: -0.335,
    center: -0.635,
    topStart: -0.635,
  });
  const result = sweep(p, 80);
  assert.ok(result.maximumOverlap > 0.0001);
  assert.ok(result.failures.some((f) => f.includes("overlap")));
});

void test("open panels outside the reviewed upper band fail", () => {
  const p = authoredGeometry();
  p.reserveMin += 0.03;
  assert.ok(
    sweep(p, 10).failures.some((f) =>
      f.includes("outside reviewed reservation"),
    ),
  );
});
