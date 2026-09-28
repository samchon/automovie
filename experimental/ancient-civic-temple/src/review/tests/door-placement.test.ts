/** Inward static opening preserves each actual model hinge at its threshold. */
import assert from "node:assert/strict";
import test from "node:test";
import { templeOpenDoorPlacement } from "../../geometry/door-placement";
import { templeDoorPassages } from "../../spaces/openings";

void test("both double leaves open into the entrance or sanctuary and preserve their hinges", () => {
  for (const door of templeDoorPassages.filter((entry) => entry.axis === "x")) {
    for (const side of [-1, 1] as const) {
      const at = templeOpenDoorPlacement(door, side);
      assert.ok(
        Math.abs(at.x + 0.021 * Math.cos(at.angle) - (door.center + side * door.width / 2)) < 1e-10,
      );
      assert.ok(
        Math.abs(at.z - 0.021 * Math.sin(at.angle) - (door.wallLow + door.wallHigh) / 2) < 1e-10,
      );
      const forwardZ = -Math.sin(at.angle);
      assert.ok(door.room === "entrance" ? forwardZ > 0.99 : forwardZ < -0.99);
    }
  }
});

void test("single leaves open into their own side of the wall rather than the colonnade", () => {
  for (const door of templeDoorPassages.filter((entry) => entry.axis === "z")) {
    const side = door.swing === "room-north" ? -1 : 1;
    const at = templeOpenDoorPlacement(door, side);
    assert.ok(
      Math.abs(at.x + 0.031 * Math.sin(at.angle) - (door.wallLow + door.wallHigh) / 2) < 1e-10,
    );
    assert.ok(
      Math.abs(at.z + 0.031 * Math.cos(at.angle) - door.center - side * door.width / 2) < 1e-10,
    );
    const forwardX = Math.cos(at.angle);
    assert.ok(
      door.room === "offering" || door.adjacent === "exterior"
        ? forwardX < -0.99
        : forwardX > 0.99,
    );
  }
});
