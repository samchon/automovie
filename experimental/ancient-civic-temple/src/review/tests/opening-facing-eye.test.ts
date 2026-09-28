import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { levelCell } from "../../geometry/spatial-cells";
import { openingFacingEye } from "../../spaces/perimeter-observations";

const room = (west: number, east: number): IAutoMovieBuiltSpace => ({
  id: "room", kind: "room", parent: "floor", fidelity: "exact",
  cells: [levelCell("room", { west, east, north: -1, south: 1 }, 0, 3)],
} as IAutoMovieBuiltSpace);

void test("opening eye follows the host normal toward the room anchor and keeps a far-wall inset", () => {
  const space = room(0.2, 4);
  const mouth = { x: 0, y: 1.1, z: 0 };
  const anchor = { x: 2, y: 1.6, z: 0 };
  assert.ok(Math.abs(openingFacingEye(space, mouth, { x: 1, y: 0, z: 0 }, anchor, 1.3, 20)!.x - 3.7) < 1e-9);
  assert.ok(Math.abs(openingFacingEye(space, mouth, { x: -1, y: 0, z: 0 }, anchor, 1.3, 20)!.x - 3.7) < 1e-9);
  assert.ok(Math.abs(openingFacingEye(space, { x: 4.2, y: 1.1, z: 0 }, { x: 1, y: 0, z: 0 }, anchor, 1.3, 20)!.x - 0.5) < 1e-9);
  assert.ok(Math.abs(openingFacingEye(space, mouth, { x: 1, y: 0, z: 0 }, anchor, 1.3, 2)!.x - 2) < 1e-9);
});

void test("opening eye handles a thin room and refuses ambiguous or empty geometry", () => {
  const space = room(0.2, 0.4);
  const mouth = { x: 0, y: 1.1, z: 0 };
  const anchor = { x: 0.3, y: 1.6, z: 0 };
  assert.ok(openingFacingEye(space, mouth, { x: 1, y: 0, z: 0 }, anchor, 1.3, 20)?.x === 0.2);
  assert.equal(openingFacingEye(space, mouth, { x: 0, y: 1, z: 0 }, anchor, 1.3, 20), null);
  assert.equal(openingFacingEye(space, mouth, { x: 1, y: 0, z: 0 }, { ...anchor, x: 0 }, 1.3, 20), null);
  assert.equal(openingFacingEye({ ...space, cells: [] }, mouth, { x: 1, y: 0, z: 0 }, anchor, 1.3, 20), null);
});
