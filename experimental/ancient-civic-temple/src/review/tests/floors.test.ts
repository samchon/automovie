/**
 * roomFloorInput, floorBoundaryFaces and floorSupportSurfaces: room floor
 * inputs, irregular-grid boundary faces, and walking-support outlines and holes.
 * Fixtures: room body and threshold (union of two convex pieces), two rooms at
 * different heights (step), a yard enclosed by four rooms (support with a hole),
 * thin slab (1cm), end lines closer than the numeric limit (refused), volume
 * overlap, duplicate IDs, empty input, non-finite values and invalid thickness
 * (refused), separate islands (refused), and determinism. The floor slab union is a closed solid.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { floorBoundaryFaces } from "../../geometry/floorBoundaryFaces";
import { type FloorInput } from "../../geometry/FloorInput";
import { roomFloorInput } from "../../geometry/roomFloorInput";
import { floorSupportSurfaces } from "../../geometry/floorSupportSurfaces";
import type { DoorPassage } from "../../geometry/DoorPassage";
import { assertClosed } from "./assertClosed";
import { planArea } from "./planArea";
import { near } from "./near";
import { accountFaces } from "./accountFaces";

const door: DoorPassage = {
  id: "door-a", boundary: "b", room: "a", adjacent: "c", axis: "x", center: 1, wallLow: 3, wallHigh: 3.3,
  width: 1, height: 2.1, frame: 0.06, leafThickness: 0.05, swing: "room-double",
};
const room = (space: string, rect: { west: number; east: number; north: number; south: number }, floor = 0, doors: DoorPassage[] = []) =>
  roomFloorInput(space, [{ id: "body", floor, ...rect }], doors, 0.18, floor);

void test("room body and threshold: slabs and supports, closed union with the threshold under the frame", () => {
  const a = room("a", { west: 0, east: 4, north: 0, south: 3 }, 0, [door]);
  assert.equal(a.slabs.length, 2);
  assert.equal(a.supports.length, 2);
  near(a.slabs[1]!.east - a.slabs[1]!.west, 1.12, 1e-12, "threshold slab includes the frame");
  near(a.supports[1]!.east - a.supports[1]!.west, 1, 1e-12, "support covers only the clear width");
  const account = accountFaces("floor", floorBoundaryFaces([a]).map((f) => ({ corners: f.corners })));
  assertClosed(account, (12 + 1.12 * 0.3) * 0.18);
  assert.equal(account.boundaryEdges, 0, "the non-uniform grid conforms: no T-junction");
});

void test("two rooms at different levels touching: one closed solid across the step", () => {
  const faces = floorBoundaryFaces([room("a", { west: 0, east: 2, north: 0, south: 2 }, 0), room("b", { west: 2, east: 4, north: 0, south: 2 }, -0.12)]);
  assertClosed(accountFaces("step", faces.map((f) => ({ corners: f.corners }))), 4 * 0.18 + 4 * 0.18);
});

void test("thin slab (1 cm) and refusals", () => {
  const thin = roomFloorInput("t", [{ id: "body", floor: 0, west: 0, east: 1, north: 0, south: 1 }], [], 0.01, 0);
  assertClosed(accountFaces("thin", floorBoundaryFaces([thin]).map((f) => ({ corners: f.corners }))), 0.01);
  assert.throws(() => roomFloorInput("x", [], [], 0, 0), /thickness/);
  assert.throws(() => floorBoundaryFaces([]), /no floor solid input/);
  const a = room("a", { west: 0, east: 2, north: 0, south: 2 });
  assert.throws(() => floorBoundaryFaces([a, room("b", { west: 1, east: 3, north: 0, south: 2 })]), /overlap in volume/);
  assert.throws(() => floorBoundaryFaces([a, room("a", { west: 5, east: 6, north: 0, south: 1 })]), /duplicate owner/);
  assert.throws(() => floorBoundaryFaces([room("n", { west: 0, east: NaN, north: 0, south: 1 })]), /finite/);
  assert.throws(() => floorBoundaryFaces([a, room("c", { west: 2 + 5e-10, east: 3, north: 0, south: 2 })]), /numeric limit/);
});

void test("supports: body plus threshold make one outline; a ring of regions around a court makes a hole", () => {
  const [support] = floorSupportSurfaces(room("a", { west: 0, east: 4, north: 0, south: 3 }, 0, [door]));
  assert.equal(support!.surface.holes?.length ?? 0, 0);
  near(planArea(support!.surface.polygon), 12 + 0.3);
  const ring: FloorInput = { space: "ring", surface: "surface.ring.floor", slabs: [], supports: [
    { id: "n", floor: 0, west: 0, east: 3, north: 0, south: 1 }, { id: "s", floor: 0, west: 0, east: 3, north: 2, south: 3 },
    { id: "w", floor: 0, west: 0, east: 1, north: 1, south: 2 }, { id: "e", floor: 0, west: 2, east: 3, north: 1, south: 2 },
  ] };
  const [court] = floorSupportSurfaces(ring);
  assert.equal(court!.surface.holes?.length, 1);
  near(planArea(court!.surface.polygon) + planArea(court!.surface.holes![0]!), 8);
  const islands: FloorInput = { ...ring, supports: [ring.supports[0]!, { id: "far", floor: 0, west: 10, east: 11, north: 0, south: 1 }] };
  assert.throws(() => floorSupportSurfaces(islands), /separate/);
});

void test("deterministic and input-preserving", () => {
  const a = room("a", { west: 0, east: 4, north: 0, south: 3 }, 0, [door]);
  const before = JSON.stringify(a);
  assert.deepEqual(floorBoundaryFaces([a]), floorBoundaryFaces([a]));
  assert.deepEqual(floorSupportSurfaces(a), floorSupportSurfaces(a));
  assert.equal(JSON.stringify(a), before);
});
