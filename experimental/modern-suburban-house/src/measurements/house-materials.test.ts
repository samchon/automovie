/** Material binding checks against emitted solids and metric projections. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { houseFinish, houseTextureUvs, modelTextileMap } from "../materials/bindings";
import { buildHouse } from "../spaces/house";

test("every emitted house surface resolves to one authored finish", () => {
  const house = buildHouse();
  assert.ok(house.parts.length > 200);
  const finishes = house.parts.map((part) => houseFinish(part.role, part.color));
  assert.ok(finishes.some((finish) => finish.id === "siding-warm-white"));
  assert.ok(finishes.some((finish) => finish.id === "roof-shingle"));
  assert.ok(finishes.some((finish) => finish.id === "brick-red-brown"));
  assert.ok(finishes.some((finish) => finish.id === "paving-concrete"));
  assert.throws(() => houseFinish("wall", 0x123456), /unbound house surface/);
});

test("metric tiles project by actual face and retain fallbacks", () => {
  const siding = houseFinish("wall", 0xebe5d8);
  assert.deepEqual(houseTextureUvs([0, 0, 0, 0, 0.15, 0], [0, 0, 1, 0, 0, 1], siding), [0, 0, 0, 1]);
  const paving = houseFinish("paving", 0xc4c0b6);
  assert.deepEqual(houseTextureUvs([0, 0, 0, 0.5, 0, 0.5], [0, 1, 0, 0, 1, 0], paving), [0, 0, 1, 1]);
  const shingle = houseFinish("roof", 0x3d3f43);
  const roofUvs = houseTextureUvs([0, 0, 0, 0, 0.14, 0.66], [0.6, 0.8, 0, 0.6, 0.8, 0], shingle);
  assert.deepEqual(roofUvs?.map((value) => Math.round(value * 1000) / 1000), [0, 0, 1, 0.833]);
  assert.equal(houseTextureUvs([0, 0, 0], [0, 1, 0], houseFinish("ceiling", 0xf6f4ef)), undefined);
  assert.equal(siding.color, 0xede8dc);
  assert.equal(siding.roughness, 0.55);
  assert.equal(modelTextileMap(0xb7afa3), "/textures/woven.png");
  assert.equal(modelTextileMap(0xa87a4e), undefined);
});
