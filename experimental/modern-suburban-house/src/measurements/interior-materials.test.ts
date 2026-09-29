/** Interior finish checks pin the designed colour hierarchy and host faces. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { interiorCeilings } from "../materials/interior/ceilings";
import {
  carpet,
  garageConcrete,
  laundryFloor,
  oakFloor,
} from "../materials/interior/floors";
import { blackMetal } from "../materials/interior/metal";
import { handrail, stairTread } from "../materials/interior/stair";
import { floorTile, tileGrout, wallTile } from "../materials/interior/tile";
import { interiorTrim } from "../materials/interior/trim";
import { interiorWalls } from "../materials/interior/walls";

const finishes = [
  interiorWalls,
  interiorCeilings,
  interiorTrim,
  oakFloor,
  carpet,
  laundryFloor,
  garageConcrete,
  stairTread,
  handrail,
  blackMetal,
  floorTile,
  wallTile,
];

void test("interior finish hierarchy preserves the wall, ceiling and trim distinctions", () => {
  assert.equal(
    new Set(finishes.map((finish) => finish.material.id)).size,
    finishes.length,
  );
  for (const finish of finishes) {
    assert.equal(finish.material.metallic, 0);
    assert.equal(finish.material.opacity, 1);
    assert.ok(finish.faces.length > 0);
  }
  assert.equal(interiorWalls.material.baseColor.hex, "#f1eee6");
  assert.equal(interiorCeilings.material.baseColor.hex, "#faf9f6");
  assert.equal(interiorTrim.material.baseColor.hex, "#f4f2ec");
  assert.ok(
    interiorCeilings.material.baseColor.r > interiorWalls.material.baseColor.r,
  );
  assert.ok(interiorTrim.material.roughness < interiorWalls.material.roughness);
});

void test("floor and stair materials share oak response but keep distinct host ownership", () => {
  assert.equal(
    oakFloor.material.baseColor.hex,
    stairTread.material.baseColor.hex,
  );
  assert.equal(oakFloor.material.roughness, stairTread.material.roughness);
  assert.deepEqual(oakFloor.texture.metres, [0.13, 1.2]);
  assert.deepEqual(stairTread.texture.metres, [0.13, 1.2]);
  assert.ok(oakFloor.faces.includes("entry-floor"));
  assert.ok(stairTread.faces.includes("stair-landing"));
  assert.equal(handrail.material.baseColor.hex, "#8a5a34");
  assert.equal(blackMetal.material.baseColor.hex, "#1f1f20");
  assert.deepEqual(carpet.texture.metres, [0.01, 0.01]);
  assert.ok(carpet.material.roughness > oakFloor.material.roughness);
  assert.ok(
    laundryFloor.material.baseColor.r > garageConcrete.material.baseColor.r,
  );
});

void test("bath tile and grout use two tile modules without inventing a grout face", () => {
  assert.deepEqual(floorTile.texture.metres, [0.3, 0.3]);
  assert.deepEqual(wallTile.texture.metres, [0.3, 0.1]);
  assert.equal(wallTile.material.baseColor.hex, "#eeedea");
  assert.equal(tileGrout.baseColor.hex, "#a9a39a");
  assert.equal(tileGrout.roughness, 0.9);
  assert.ok(floorTile.material.roughness > wallTile.material.roughness);
  assert.ok(!floorTile.faces.includes("grout"));
  assert.ok(!wallTile.faces.includes("grout"));
});
