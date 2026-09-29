/**
 * src/geometry/spatial-cells.ts: 논리 공간 cell(반공간 교집합)과 문턱 통과 영역.
 * fixture: 볼록 사각 cell과 경사 천장, 삼각 cell, 두 지붕 조각으로 덮인 방(분할), 덮임 부족(거부),
 * 문턱 cell의 방 필터와 틀 포함/제외 폭, 얇은 문턱(0.01m 벽), 경계 위 점(닫힌 반공간), 결정성.
 * cell은 렌더 geometry가 아니므로 topology가 아니라 포함 관계로 잰다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieConvexSpaceCell, IAutoMovieVector3 } from "@automovie/interface";
import { rectanglePolygon, type RoofPatch } from "../../geometry/planar-domain";
import { levelCell, passageRectangle, polygonCell, roofedCells, thresholdCells, type DoorPassage } from "../../geometry/spatial-cells";
import { near } from "./fixtures";

const inside = (cell: IAutoMovieConvexSpaceCell, p: IAutoMovieVector3) =>
  cell.planes.every((plane) => plane.normal.x * p.x + plane.normal.y * p.y + plane.normal.z * p.z <= plane.offset + 1e-12);

void test("polygon cell with a sloped ceiling: interior, above-ceiling, outside-plan and on-boundary points", () => {
  const cell = polygonCell("c", rectanglePolygon({ west: 0, east: 2, north: 0, south: 1 }), 0, { x: 0.1, z: 0, constant: 2 });
  assert.equal(inside(cell, { x: 1, y: 1, z: 0.5 }), true);
  assert.equal(inside(cell, { x: 1, y: 2.15, z: 0.5 }), false);
  assert.equal(inside(cell, { x: 1, y: 2.05, z: 0.5 }), true);
  assert.equal(inside(cell, { x: 2.5, y: 1, z: 0.5 }), false);
  assert.equal(inside(cell, { x: 2, y: 0, z: 1 }), true, "closed half-spaces include the corner");
  assert.equal(inside(cell, { x: 1, y: -0.01, z: 0.5 }), false);
});

void test("triangle cell and level cell", () => {
  const tri = polygonCell("t", [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 0, z: 1 }], 0, { x: 0, z: 0, constant: 1 });
  assert.equal(inside(tri, { x: 0.2, y: 0.5, z: 0.2 }), true);
  assert.equal(inside(tri, { x: 0.6, y: 0.5, z: 0.6 }), false);
  assert.equal(levelCell("l", { west: 0, east: 1, north: 0, south: 1 }, 0, 3.2).planes.length, 6);
});

void test("roofed cells split by two patches; incomplete cover refused", () => {
  const patch = (west: number, east: number, constant: number): RoofPatch => ({
    id: `p${west}`, owner: "r", surface: "s", tier: "wing", polygon: rectanglePolygon({ west, east, north: -1, south: 3 }),
    height: { x: 0, z: 0, constant }, thickness: 0.2,
  });
  const cells = roofedCells("room", { west: 0, east: 4, north: 0, south: 2 }, 0, [patch(-1, 2, 3.4), patch(2, 5, 3.8)]);
  assert.equal(cells.length, 2);
  assert.equal(inside(cells[0]!, { x: 1, y: 3.15, z: 1 }), true);
  assert.equal(inside(cells[0]!, { x: 1, y: 3.25, z: 1 }), false, "ceiling is the roof underside (top − thickness)");
  assert.throws(() => roofedCells("room", { west: 0, east: 4, north: 0, south: 2 }, 0, [patch(-1, 2, 3.4)]), /덮임/);
});

void test("threshold cells: only the door's room; clear width without the frame; thin wall depth", () => {
  const door: DoorPassage = { id: "d", boundary: "b", room: "a", adjacent: "c", axis: "z", center: 5, wallLow: 1, wallHigh: 1.01,
    width: 0.9, height: 2.1, frame: 0.06, leafThickness: 0.05, swing: "room-north" };
  const clear = passageRectangle(door, false);
  near(clear.south - clear.north, 0.9);
  near(passageRectangle(door, true).south - passageRectangle(door, true).north, 1.02);
  near(clear.east - clear.west, 0.01);
  assert.equal(thresholdCells("a", [door], 0).length, 1);
  assert.equal(thresholdCells("c", [door], 0).length, 0);
  assert.equal(inside(thresholdCells("a", [door], 0)[0]!, { x: 1.005, y: 2, z: 5 }), true);
  assert.equal(inside(thresholdCells("a", [door], 0)[0]!, { x: 1.005, y: 2.2, z: 5 }), false);
});

void test("deterministic", () => {
  const polygon = rectanglePolygon({ west: 0, east: 2, north: 0, south: 1 });
  assert.deepEqual(polygonCell("c", polygon, 0, { x: 0.1, z: 0, constant: 2 }), polygonCell("c", polygon, 0, { x: 0.1, z: 0, constant: 2 }));
});
