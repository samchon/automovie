import { strict as assert } from "node:assert";
import { test } from "node:test";

import { ExteriorEdges } from "../instances/exterior-repetition-edges";
import { buildingModelFinish } from "../materials/model-bindings";
import { buildHouse } from "../spaces/house";

void test("ridge caps and eave gutters bind every emitted face", () => {
  const edges = new ExteriorEdges();
  const caps = edges.buildRidgeCaps().models;
  const gutters = edges.buildGutters(buildHouse()).models;
  assert.equal(caps.length, 4);
  assert.ok(gutters.length > 0);
  for (const { model, faceByPart } of [...caps, ...gutters]) {
    assert.equal(Object.keys(faceByPart).length, model.parts.length);
    for (const part of model.parts) {
      const face = faceByPart[part.id];
      assert.ok(face, `${model.id}/${part.id} has no face`);
      const material = buildingModelFinish(model.id, face).material.id;
      assert.equal(material, model.id.startsWith("gutter:") ? "charcoal-metal" : "roof-shingle");
    }
  }
  assert.throws(() => buildingModelFinish("gutter:unknown", "shingle-face"), /found 0/);
});
