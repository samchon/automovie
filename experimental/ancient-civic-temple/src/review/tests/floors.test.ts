/**
 * src/geometry/floor-input.ts, floor-faces.ts, floor-supports.ts: 방 바닥 입력, 비균일 격자 경계면,
 * 보행 support 외곽·구멍.
 * fixture: 방 본체와 문턱(볼록 둘의 합), 높이가 다른 두 방(단차), 방 넷이 둘러싼 마당(구멍 있는
 * support), 얇은 slab(1cm), 수치 한계보다 가까운 끝선(거부), 체적 중첩·중복 ID·빈 입력·
 * 비유한 값·잘못된 두께(거부), 분리된 섬(거부), 결정성. 바닥 slab 합은 닫힌 실체다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { floorBoundaryFaces } from "../../geometry/floor-faces";
import { roomFloorInput, type FloorInput } from "../../geometry/floor-input";
import { floorSupportSurfaces } from "../../geometry/floor-supports";
import type { DoorPassage } from "../../geometry/spatial-cells";
import { accountFaces, assertClosed, near, planArea } from "./fixtures";

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
  assert.throws(() => roomFloorInput("x", [], [], 0, 0), /두께/);
  assert.throws(() => floorBoundaryFaces([]), /입력이 없습니다/);
  const a = room("a", { west: 0, east: 2, north: 0, south: 2 });
  assert.throws(() => floorBoundaryFaces([a, room("b", { west: 1, east: 3, north: 0, south: 2 })]), /체적 중첩/);
  assert.throws(() => floorBoundaryFaces([a, room("a", { west: 5, east: 6, north: 0, south: 1 })]), /중복 소유자/);
  assert.throws(() => floorBoundaryFaces([room("n", { west: 0, east: NaN, north: 0, south: 1 })]), /유한한/);
  assert.throws(() => floorBoundaryFaces([a, room("c", { west: 2 + 5e-10, east: 3, north: 0, south: 2 })]), /수치 한계/);
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
  assert.throws(() => floorSupportSurfaces(islands), /분리/);
});

void test("deterministic and input-preserving", () => {
  const a = room("a", { west: 0, east: 4, north: 0, south: 3 }, 0, [door]);
  const before = JSON.stringify(a);
  assert.deepEqual(floorBoundaryFaces([a]), floorBoundaryFaces([a]));
  assert.deepEqual(floorSupportSurfaces(a), floorSupportSurfaces(a));
  assert.equal(JSON.stringify(a), before);
});
