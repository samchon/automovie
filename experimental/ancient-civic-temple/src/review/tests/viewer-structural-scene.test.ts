import assert from "node:assert/strict";
import test from "node:test";
import { createViewerPayload } from "../../viewer/payload";

void test("viewer compiles the structural environment with its material bindings while model source is retired", () => {
  const scene = createViewerPayload();
  const models = new Map(scene.models.map((model) => [model.id, model]));
  assert.ok(models.size > 0);
  assert.ok(scene.placements.length > 0);
  assert.ok(scene.placements.every((placement) => models.has(placement.model)));
  assert.ok(scene.models.every((model) => !model.id.startsWith("object.")));
  assert.ok(scene.placements.every((placement) => !placement.node.includes("temple.object.")));
  assert.ok(scene.models.some((model) => model.materials.some((material) => material.baseColorTexture !== null)));
  for (const model of scene.models) for (const part of model.parts) {
    assert.ok(part.material !== null, `${model.id}/${part.id}: material binding absent`);
    assert.ok(model.materials.some((material) => material.id === part.material));
  }
});
