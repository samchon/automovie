import assert from "node:assert/strict";
import { test } from "node:test";

import { Gate } from "../models/gate";
import { buildingModelFinish } from "../materials/model-bindings";

void test("side-yard gate boards and steel hardware bind without collisions", () => {
  const { model, faceByPart } = new Gate().build(-0.45);
  assert.equal(Object.keys(faceByPart).length, model.parts.length);
  for (const part of model.parts) {
    const face = faceByPart[part.id];
    assert.ok(face, `${part.id} missing face`);
    const material = buildingModelFinish(model.id, face).material;
    assert.equal(
      material.id,
      face === "hinge" || face === "handle"
        ? "black-coated-metal"
        : "fence-wood",
    );
  }
});
