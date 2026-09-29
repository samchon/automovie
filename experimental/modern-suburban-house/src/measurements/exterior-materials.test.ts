/** Exterior finish source checks against the twelve authored design decisions. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { brick, brickMortar } from "../materials/exterior/brick";
import { frontDoor, garageDoor } from "../materials/exterior/doors";
import { fence } from "../materials/exterior/fence";
import { frames } from "../materials/exterior/frames";
import { clearGlass, obscureGlass } from "../materials/exterior/glass";
import { paving, porchFloor } from "../materials/exterior/paving";
import { shingle } from "../materials/exterior/shingle";
import { siding } from "../materials/exterior/siding";
import { trim } from "../materials/exterior/trim";
import { stainlessSteel } from "../materials/furnishings/appliances";

const finishes = [
  siding,
  trim,
  shingle,
  brick,
  frames,
  clearGlass,
  obscureGlass,
  frontDoor,
  garageDoor,
  porchFloor,
  paving,
  fence,
];

void test("exterior swatches decode to scene-linear materials with distinct identities", () => {
  assert.equal(
    new Set(finishes.map((finish) => finish.material.id)).size,
    finishes.length,
  );
  for (const finish of finishes) {
    const material = finish.material;
    assert.equal(material.metallic, 0);
    assert.equal(material.opacity, 1);
    assert.equal(material.baseColorTexture, null);
    assert.ok(material.baseColor.hex?.startsWith("#"));
    assert.ok(finish.faces.length > 0);
  }
  assert.equal(siding.material.baseColor.hex, "#ede8dc");
  assert.ok(Math.abs(siding.material.baseColor.r - 0.8469) < 0.0002);
  assert.equal(trim.material.baseColor.hex, "#f6f4ee");
  assert.equal(shingle.material.roughness, 0.9);
  assert.equal(brick.material.roughness, 0.85);
  assert.equal(brickMortar.roughness, 0.92);
  assert.equal(frames.material.roughness, 0.4);
  assert.equal(stainlessSteel.material.metallic, 1);
  assert.equal(stainlessSteel.material.baseColor.hex, "#c0c2c4");
});

void test("exterior patterned finishes carry physical repeat sizes and real tiles", () => {
  assert.deepEqual(siding.texture.metres, [1, 0.15]);
  assert.deepEqual(shingle.texture.metres, [0.66, 0.28]);
  assert.deepEqual(brick.texture.metres, [0.4, 0.13]);
  assert.deepEqual(porchFloor.texture.metres, [0.4, 0.4]);
  assert.deepEqual(paving.texture.metres, [0.5, 0.5]);
  assert.deepEqual(fence.texture.metres, [0.14, 0.8]);
  assert.deepEqual(trim.texture.metres, [0.1, 0.1]);
  assert.deepEqual(frames.texture.metres, [0.05, 0.05]);
  assert.deepEqual(obscureGlass.texture.metres, [0.002, 0.002]);
  assert.deepEqual(frontDoor.texture.metres, [0.15, 0.8]);
  assert.deepEqual(garageDoor.texture.metres, [0.25, 0.25]);
  assert.equal(shingle.texture.projection, "roof");
  assert.equal(paving.texture.projection, "ground");
  assert.equal(frontDoor.material.baseColor.hex, "#9a6a3e");
  assert.equal(garageDoor.material.baseColor.hex, "#34373a");
});

void test("clear and etched glass transmit light while preserving privacy contrast", () => {
  assert.equal(clearGlass.material.transmission, 0.92);
  assert.equal(obscureGlass.material.transmission, 0.8);
  assert.equal(clearGlass.material.ior, 1.5);
  assert.equal(obscureGlass.material.ior, 1.5);
  assert.equal(clearGlass.material.thickness, 0.006);
  assert.equal(obscureGlass.material.thickness, 0.006);
  assert.equal(clearGlass.material.doubleSided, true);
  assert.equal(obscureGlass.material.doubleSided, true);
  assert.ok(clearGlass.material.roughness < obscureGlass.material.roughness);
  assert.deepEqual(clearGlass.faces, ["glass"]);
  assert.deepEqual(obscureGlass.faces, ["obscured-glass"]);
});
