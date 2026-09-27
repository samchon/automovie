/** A missing part sentence blocks every building family, while an authored
 * sentence or a rough furniture face remains outside this exactness gate. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { isBuildingFaceMissing } = require("./building-face-gate.cjs");

void test("building faces without measured part sentences fail", () => {
  assert.equal(isBuildingFaceMissing({ file: "01-windows.md", candidate: false }), true);
  assert.equal(isBuildingFaceMissing({ file: "06-interior-trim.md", candidate: false }), true);
});

void test("measured building faces pass", () => {
  assert.equal(isBuildingFaceMissing({ file: "04-stair-members.md", candidate: true }), false);
});

void test("rough furniture and props stay as reported review candidates", () => {
  assert.equal(isBuildingFaceMissing({ file: "10-kitchen-dining.md", candidate: false }), false);
  assert.equal(isBuildingFaceMissing({ file: "19-room-accents.md", candidate: false }), false);
});

void test("fixed fittings and exterior cladding use building exactness", () => {
  for (const [file, anchor] of [
    ["10-kitchen-dining.md", "kitchen-base-run"],
    ["11-living.md", "fireplace-insert-mantel"],
    ["12-service-rooms.md", "pantry-l-shelf"],
    ["13-bedrooms.md", "sliding-closet"],
    ["14-bathrooms.md", "sliding-shower-booth"],
    ["15-outdoor.md", "eave-gutter-downspout"],
  ]) assert.equal(isBuildingFaceMissing({ file, anchor, candidate: false }), true);
  assert.equal(isBuildingFaceMissing({ file: "15-outdoor.md", anchor: "terrace-chair", candidate: false }), false);
});
