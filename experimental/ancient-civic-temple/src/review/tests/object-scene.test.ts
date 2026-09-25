import assert from "node:assert/strict";
import test from "node:test";
import { TempleObjectInstances } from "../../instances/objects";
import { createViewerPayload } from "../../viewer/payload";

void test("every inventoried object role reaches the compiled viewer scene as a separate mesh placement", () => {
  const roles = TempleObjectInstances.placements();
  const scene = createViewerPayload();
  const models = new Map(scene.models.map((model) => [model.id, model]));
  const placed = new Map(scene.placements.map((placement) => [placement.node, placement]));
  assert.equal(roles.length, 92);
  assert.equal(new Set(roles.map(({ space, role }) => `${space}.${role}`)).size, roles.length);
  for (const role of roles) {
    const node = `temple/temple.object.${role.space}.${role.role}`;
    const placement = placed.get(node);
    assert.ok(placement, `${node} is absent from the lowered scene`);
    assert.equal(placement.model, `object.${role.prototype}`);
    assert.deepEqual(placement.position, { x: role.x, y: role.y, z: role.z });
    const model = models.get(placement.model);
    assert.ok(model?.parts.length, `${node} has no mesh parts`);
    assert.ok(model.parts.every((part) => part.mesh.positions.length >= 9), `${node} has an empty part`);
  }
  assert.equal(scene.placements.filter(({ node }) => node.startsWith("temple/temple.object.")).length, roles.length);
  assert.equal(new Set(roles.map(({ prototype }) => prototype)).size, 36);
});
