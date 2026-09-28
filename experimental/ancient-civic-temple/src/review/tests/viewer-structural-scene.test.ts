import assert from "node:assert/strict";
import test from "node:test";
import { createViewerPayload } from "../../viewer/payload";

void test("viewer compiles the current architectural members and their material bindings", () => {
  const scene = createViewerPayload();
  const models = new Map(scene.models.map((model) => [model.id, model]));
  assert.ok(models.size > 0);
  assert.ok(scene.placements.length > 0);
  assert.ok(scene.placements.every((placement) => models.has(placement.model)));
  assert.equal(scene.placements.filter((placement) => placement.node.startsWith("temple/element.object.")).length,84);
  assert.ok(models.has("fixture.altar"));
  assert.ok(models.has("ware.scroll.bundle"));
  assert.ok(models.has("portable.handcart"));
  assert.ok(scene.models.every((model) => model.materials.length > 0));
  for (const model of scene.models) for (const part of model.parts) {
    assert.ok(part.material !== null, `${model.id}/${part.id}: missing material binding`);
    assert.ok(model.materials.some((material) => material.id === part.material), `${model.id}/${part.id}: missing material definition`);
  }
});
