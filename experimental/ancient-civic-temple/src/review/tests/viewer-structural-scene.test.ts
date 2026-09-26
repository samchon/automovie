import assert from "node:assert/strict";
import test from "node:test";
import { createViewerPayload } from "../../viewer/payload";

void test("viewer compiles the structural environment without premature model or material source", () => {
  const scene = createViewerPayload();
  const models = new Map(scene.models.map((model) => [model.id, model]));
  assert.ok(models.size > 0);
  assert.ok(scene.placements.length > 0);
  assert.ok(scene.placements.every((placement) => models.has(placement.model)));
  assert.ok(scene.models.every((model) => !model.id.startsWith("object.")));
  assert.ok(scene.placements.every((placement) => !placement.node.includes("temple.object.")));
  assert.ok(scene.models.every((model) => model.materials.length === 0));
  for (const model of scene.models) for (const part of model.parts) {
    assert.equal(part.material, null, `${model.id}/${part.id}: premature material binding`);
  }
});
