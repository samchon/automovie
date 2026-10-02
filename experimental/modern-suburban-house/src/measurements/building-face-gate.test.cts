import test from "node:test";
import assert from "node:assert/strict";
import { isBuildingFaceMissing } from "./building-face-gate.cjs";

void test("building faces without measured part sentences fail", () => {
  assert.equal(
    isBuildingFaceMissing({ file: "01-windows.md", candidate: false }),
    true,
  );
  assert.equal(
    isBuildingFaceMissing({ file: "06-interior-trim.md", candidate: false }),
    true,
  );
});

void test("measured building faces pass", () => {
  assert.equal(
    isBuildingFaceMissing({ file: "04-stair-members.md", candidate: true }),
    false,
  );
});

void test("rough furniture and props stay as reported review candidates", () => {
  assert.equal(
    isBuildingFaceMissing({ file: "10-kitchen-dining.md", candidate: false }),
    false,
  );
  assert.equal(
    isBuildingFaceMissing({ file: "19-room-accents.md", candidate: false }),
    false,
  );
});

void test("fixed fittings and exterior cladding use building exactness", () => {
  for (const [file, anchor] of [
    ["10-kitchen-dining.md", "kitchen-base-run"],
    ["10-kitchen-dining.md", "kitchen-island"],
    ["11-living.md", "fireplace-insert-mantel"],
    ["12-service-rooms.md", "pantry-l-shelf"],
    ["13-bedrooms.md", "sliding-closet"],
    ["14-bathrooms.md", "sliding-shower-booth"],
    ["15-outdoor.md", "eave-gutter-downspout"],
  ]) assert.equal(isBuildingFaceMissing({ file, anchor, candidate: false }), true);
  assert.equal(isBuildingFaceMissing({ file: "15-outdoor.md", anchor: "terrace-chair", candidate: false }), false);
  assert.equal(isBuildingFaceMissing({ file: "13-bedrooms.md", anchor: "sliding-closet", id: "clothes", candidate: false }), false);
  assert.equal(isBuildingFaceMissing({ file: "14-bathrooms.md", anchor: "vanity-basin", id: "accessory", candidate: false }), false);
});
