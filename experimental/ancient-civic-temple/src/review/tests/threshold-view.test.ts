/** Thresholds preserve their eye and use an inward normal rather than a blocked diagonal. */
import assert from "node:assert/strict";
import test from "node:test";
import { templeThresholdTarget } from "../../geometry/threshold-view";
import { templeDoorPassages } from "../../spaces/openings";

void test("every door's two arrival sides look straight away from the host wall", () => {
  for (const door of templeDoorPassages) for (const side of [-1, 1]) {
    const middle = (door.wallLow + door.wallHigh) / 2;
    const position = door.axis === "x" ? { x: door.center, y: 1.6, z: middle + side * 0.2 }
      : { x: middle + side * 0.2, y: 1.6, z: door.center };
    const target = templeThresholdTarget(door, position);
    assert.equal(target.y, 1.6);
    if (door.axis === "x") { assert.equal(target.x, door.center); assert.equal(target.z - position.z, side); }
    else { assert.equal(target.z, door.center); assert.equal(target.x - position.x, side); }
  }
});

void test("an eye centred in wall thickness is refused instead of guessing an arrival side", () => {
  const door = templeDoorPassages[0]!;
  assert.throws(() => templeThresholdTarget(door, { x: door.center, y: 1.6, z: (door.wallLow + door.wallHigh) / 2 }), /wall centre plane/);
});
