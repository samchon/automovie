/** Source-bound checks for weather cladding and roof-edge repetition. */
import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { ExteriorRepetition } = require("../instances/exterior-repetition.ts") as typeof import("../instances/exterior-repetition");
const { ExteriorEdges } = require("../instances/exterior-repetition-edges.ts") as typeof import("../instances/exterior-repetition-edges");
const { buildHouse } = require("../spaces/house.ts") as typeof import("../spaces/house");
const { GARAGE_RIDGE_Z, MAIN_RIDGE_Z, mFront } = require("../spaces/roof/junctions.ts") as typeof import("../spaces/roof/junctions");

const house = buildHouse();
const onePart = (id: string) => ({
  ...house,
  parts: house.parts.filter((part) => part.id === id),
});

void test("siding covers the front wall in separate cut parts with deterministic course ids", () => {
  const builder = new ExteriorRepetition();
  const first = builder.buildSiding(onePart("front-main-wall"));
  const second = builder.buildSiding(onePart("front-main-wall"));
  assert.ok(first.models.length > 10);
  assert.deepEqual(
    first.instances.map((instance) => instance.id),
    second.instances.map((instance) => instance.id),
  );
  for (const model of first.models) {
    assert.equal(
      model.model.parts.length,
      Object.keys(model.faceByPart).length,
    );
    assert.equal(
      new Set(model.model.parts.map((part) => part.id)).size,
      model.model.parts.length,
    );
    assert.ok(
      model.model.parts.some(
        (part) => model.faceByPart[part.id] === "siding-cut",
      ),
    );
  }
});

void test("shingles stay within the authored garage roof and retain cut faces", () => {
  const built = new ExteriorRepetition().buildShingles(
    onePart("roof-garage-front"),
  );
  assert.ok(built.models.length > 5);
  assert.ok(
    built.instances.some((instance) => instance.id.includes("starter")),
  );
  assert.ok(
    built.models.some((model) =>
      Object.values(model.faceByPart).includes("shingle-cut"),
    ),
  );
  for (const model of built.models)
    for (const part of model.model.parts) {
      assert.equal(part.geometry.type, "mesh");
      if (part.geometry.type !== "mesh") continue;
      const positions = part.geometry.mesh.positions;
      for (let i = 0; i < positions.length; i += 3) {
        assert.ok(
          positions[i]! >= 5.75 - 1e-6 && positions[i]! <= 12.05 + 1e-6,
        );
        assert.ok(
          positions[i + 2]! >= GARAGE_RIDGE_Z - 1e-6 &&
            positions[i + 2]! <= 0.05 + 0.01 + 1e-6,
        );
      }
    }
});

void test("six exposed corners and four shared ridges use roof-owner endpoints", () => {
  const edges = new ExteriorEdges();
  const corners = edges.buildCornerTrim();
  const ridges = edges.buildRidgeCaps();
  assert.equal(corners.instances.length, 6);
  assert.equal(ridges.instances.length, 4);
  assert.equal(ridges.models.length, 4);
  const main = ridges.models.find(
    (model) => model.model.id === "main-shingle-ridge",
  )!;
  assert.ok(main.model.parts.length > 10);
  const positions = main.model.parts.flatMap((part) =>
    part.geometry.type === "mesh" ? part.geometry.mesh.positions : [],
  );
  assert.ok(
    positions.some(
      (value, index) =>
        index % 3 === 1 && Math.abs(value - mFront(MAIN_RIDGE_Z)) < 0.1,
    ),
  );
});

void test("horizontal free eaves receive gutters while the blocked gable interval stops", () => {
  const built = new ExteriorEdges().buildGutters(house);
  assert.equal(built.instances.length, 6);
  assert.ok(
    built.instances.every(
      (instance) => !instance.id.startsWith("roof-main-front"),
    ),
  );
  assert.ok(
    built.instances.every(
      (instance) => instance.transform.translation !== undefined,
    ),
  );
  for (const model of built.models) {
    assert.deepEqual(Object.values(model.faceByPart), ["gutter"]);
    assert.equal(model.model.parts.length, 1);
  }
});
