/** A material plate must retain the complete active source catalogue and optics. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { buildingFinishes } from "../materials/model-bindings";
import { HouseLighting } from "../systems/lighting";

const require = createRequire(import.meta.url);
const { MaterialReview } =
  require("../materials/review.ts") as typeof import("../materials/review");
void test("neutral and baseline plates contain each active material once as a metric sphere/plate pair", () => {
  const owner = new MaterialReview(),
    ids: string[] = [];
  for (let page = 0; page < Math.ceil(buildingFinishes.length / 7); page++) {
    const a = owner.build(page, "neutral", "b"),
      b = owner.build(page, "baseline", "b");
    assert.deepEqual(a.items, b.items);
    assert.deepEqual(a.camera, b.camera);
    assert.equal(a.physicalLighting, undefined);
    assert.deepEqual(b.physicalLighting, new HouseLighting().build());
    ids.push(...a.materialReview!.rows);
    for (const item of a.items) {
      const finish = buildingFinishes.find(
        (f) =>
          `${f.material.id}/sphere` === item.id ||
          `${f.material.id}/plate` === item.id,
      )!;
      assert.equal(item.roughness, finish.material.roughness);
      assert.equal(item.metalness, finish.material.metallic);
      assert.equal(item.transmission, finish.material.transmission);
      assert.equal(item.uvs!.length, (item.positions.length / 3) * 2);
      const xs = item.positions.filter((_, i) => i % 3 === 0);
      assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - 0.5) < 1e-9);
      assert.ok(item.uvs!.every(Number.isFinite));
      if (finish.faces.includes("mirror") && item.id.endsWith("/plate")) {
        assert.equal(item.faceId, "mirror");
        assert.deepEqual(item.normals.slice(0, 3), [0, 0, 1]);
        assert.ok(item.positions[2]! > 0);
      } else assert.equal(item.faceId, `sample:${finish.material.id}`);
    }
  }
  assert.deepEqual(
    ids,
    buildingFinishes.map((f) => f.material.id),
  );
  assert.equal(new Set(ids).size, ids.length);
  for (const page of [-1, 0.5, Math.ceil(buildingFinishes.length / 7)])
    assert.throws(
      () => owner.build(page, "neutral", "b"),
      /unknown material page/,
    );
});
