/**
 * Full production lowering check, invoked by self-check outside its pure unit
 * suite. It compiles the real building, site and room objects, then checks all
 * lowered placements and material references. This is an actual production
 * observation and deliberately includes its whole-scene compilation cost.
 */
import assert from "node:assert/strict";

import { createViewerPayload } from "../viewer/payload";

const checkViewerScene = (): void => {
  const scene = createViewerPayload();
  const models = new Map(scene.models.map((model) => [model.id, model]));
  assert.ok(models.size > 0);
  assert.ok(scene.placements.length > 0);
  assert.ok(scene.placements.every((placement) => models.has(placement.model)));
  assert.equal(
    scene.placements.filter((placement) =>
      placement.node.startsWith("temple/element.object."),
    ).length,
    84,
  );
  assert.ok(models.has("fixture.altar"));
  assert.ok(models.has("ware.scroll.bundle"));
  assert.ok(models.has("portable.handcart"));
  assert.ok(scene.models.every((model) => model.materials.length > 0));
  for (const model of scene.models)
    for (const part of model.parts) {
      assert.ok(
        part.material !== null,
        `${model.id}/${part.id}: missing material binding`,
      );
      assert.ok(
        model.materials.some((material) => material.id === part.material),
        `${model.id}/${part.id}: missing material definition`,
      );
    }
  console.log(
    `viewer full-scene check: ${scene.placements.length} placements, ${models.size} models, 84 room objects, every part bound`,
  );
};

checkViewerScene();
