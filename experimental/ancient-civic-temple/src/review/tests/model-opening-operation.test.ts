import assert from "node:assert/strict";
import test from "node:test";
import { TempleOpenings } from "../../models/openings";
import { templeDoorPassages } from "../../spaces/openings";

const source = new TempleOpenings();

void test("each reviewed door exposes an open-default hinge operation over closed rest leaves", () => {
  for (const door of templeDoorPassages) {
    const double = door.id === "door-entry" || door.id === "door-sanctuary";
    const leaves = (double ? ["left", "right"] : ["only"]).map((side) => ({
      leafId: `${door.id}.${side}`,
      element: `element.${door.id}.${side}`,
    }));
    const operation = source.doorOperation(door.id, leaves);
    assert.equal(operation.state, "open");
    assert.deepEqual(operation.states.map((state) => state.id), ["closed", "open"]);
    assert.deepEqual(operation.panels.map((panel) => panel.id),
      leaves.map((leaf) => `hinge.${leaf.leafId}`));
    assert.deepEqual(operation.panels.map((panel) => panel.element),
      leaves.map((leaf) => leaf.element));
    for (const panel of operation.panels) {
      assert.equal(panel.width, door.width / (double ? 2 : 1));
      assert.equal(panel.height, door.height - 0.01);
      assert.deepEqual(panel.motion, {
        kind: "revolute",
        axis: { x: 0, y: 1, z: 0 },
        pivot: { x: double ? 0.021 : 0, y: 0, z: double ? 0 : 0.031 },
        min: -Math.PI / 2,
        max: 0,
      });
    }
    for (const state of operation.states)
      assert.deepEqual(state.panels.map((panel) => panel.value),
        operation.panels.map(() => state.id === "open" ? -Math.PI / 2 : 0));
  }
});

void test("a hinge operation refuses missing and duplicated installed leaves", () => {
  assert.throws(() => source.doorOperation("door-entry", []), /expected 2/);
  assert.throws(() => source.doorOperation("door-entry", [
    { leafId: "same", element: "a" }, { leafId: "same", element: "b" },
  ]), /distinct stable ids/);
  assert.throws(() => source.doorOperation("door-entry", [
    { leafId: "left", element: "same" }, { leafId: "right", element: "same" },
  ]), /distinct stable ids/);
  assert.throws(() => source.doorOperation("door-yard", [
    { leafId: "", element: "a" },
  ]), /distinct stable ids/);
  assert.throws(() => source.doorOperation("absent" as "door-entry", [
    { leafId: "absent", element: "element.absent" },
  ]), /reviewed door missing/);
});

void test("the closed rest door and its open inspection pose keep the same named parts", () => {
  const closed = source.doubleLeaf("door-entry", "closed");
  const open = source.doubleLeaf("door-entry", "open");
  assert.deepEqual(open.parts.map((part) => part.id),
    closed.parts.map((part) => part.id));
  assert.notDeepEqual(open.parts[0]!.geometry, closed.parts[0]!.geometry);
  assert.throws(() => source.doubleLeaf("door-entry", "ajar" as "open"),
    /unsupported door state/);
});
