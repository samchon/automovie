/** Space finish bindings preserve authored host identity and refuse misses. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildingSpaceFinish } from "../materials/space-bindings";
import { PALETTE } from "../spaces/palette";

void test("weather faces bind siding, shingle, brick, paving and fence", () => {
  assert.equal(
    buildingSpaceFinish("wall", PALETTE.siding).material.id,
    "siding-warm-white",
  );
  assert.equal(
    buildingSpaceFinish("wall", PALETTE.brick).material.id,
    "brick-red-brown",
  );
  assert.equal(
    buildingSpaceFinish("roof", PALETTE.roof).material.id,
    "roof-shingle",
  );
  assert.equal(
    buildingSpaceFinish("chimney", PALETTE.brick).material.id,
    "brick-red-brown",
  );
  assert.equal(
    buildingSpaceFinish("chimney", PALETTE.railing).material.id,
    "charcoal-metal",
  );
  assert.equal(
    buildingSpaceFinish("porch", PALETTE.trim).material.id,
    "trim-white",
  );
  assert.equal(
    buildingSpaceFinish("porch", PALETTE.porchFloor).material.id,
    "porch-floor",
  );
  assert.equal(
    buildingSpaceFinish("paving", PALETTE.paving).material.id,
    "paving-concrete",
  );
  assert.equal(
    buildingSpaceFinish("paving", PALETTE.concrete).material.id,
    "paving-concrete",
  );
  assert.equal(
    buildingSpaceFinish("fence", PALETTE.fenceWood).material.id,
    "fence-wood",
  );
});

void test("room and stair faces bind their independent finishes", () => {
  assert.equal(
    buildingSpaceFinish("wall", PALETTE.interiorWall).material.id,
    "interior-wall-paint",
  );
  assert.equal(
    buildingSpaceFinish("partition", PALETTE.interiorWall).material.id,
    "interior-wall-paint",
  );
  assert.equal(
    buildingSpaceFinish("floor", PALETTE.concrete).material.id,
    "garage-concrete",
  );
  assert.equal(
    buildingSpaceFinish("floor", PALETTE.woodFloor).material.id,
    "oak-floor",
  );
  assert.equal(
    buildingSpaceFinish("floor", PALETTE.tile).material.id,
    "bath-floor-tile",
  );
  assert.equal(
    buildingSpaceFinish("floor", PALETTE.utility).material.id,
    "laundry-floor",
  );
  assert.equal(
    buildingSpaceFinish("floor", PALETTE.carpet).material.id,
    "beige-carpet",
  );
  assert.equal(
    buildingSpaceFinish("floor", PALETTE.interiorWall).material.id,
    "interior-wall-paint",
  );
  assert.equal(
    buildingSpaceFinish("ceiling", PALETTE.ceiling).material.id,
    "interior-ceiling",
  );
  assert.equal(
    buildingSpaceFinish("stair", PALETTE.stairWood).material.id,
    "stair-tread-wood",
  );
  assert.equal(
    buildingSpaceFinish("guard", PALETTE.stairWood).material.id,
    "handrail-wood",
  );
  assert.equal(
    buildingSpaceFinish("guard", PALETTE.railing).material.id,
    "black-coated-metal",
  );
  assert.equal(
    buildingSpaceFinish("guard", PALETTE.trim).material.id,
    "interior-trim-white",
  );
});

void test("an undesigned space finish does not silently receive a similar swatch", () => {
  assert.throws(() => buildingSpaceFinish("wall", PALETTE.trim), /found 0/);
  assert.throws(
    () => buildingSpaceFinish("floor", PALETTE.structure),
    /found 0/,
  );
});
