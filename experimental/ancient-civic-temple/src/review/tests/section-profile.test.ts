/**
 * src/review/section-profile.ts 연직 단면 측정 경로를 아는 경우에 대조한다: 상자를 X·Z로 자른 사각형,
 * 경사 상단의 사다리꼴, 삼각 평면을 비스듬히 지나는 절단, 모서리/변과 일치하는 절단(수치 경계),
 * 실체 밖 절단(조각 없음), 1mm 폭 얇은 실체, 묶음 이름에 따른 종류.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { rectanglePolygon } from "../../geometry/planar-domain";
import type { ScanSolid } from "../envelope-overlaps";
import { sectionProfile } from "../section-profile";
import { near } from "./fixtures";

const box = (group: string, top = { x: 0, z: 0, constant: 2 }): ScanSolid => ({
  group, polygon: rectanglePolygon({ west: 0, east: 4, north: 0, south: 1 }), bottom: { x: 0, z: 0, constant: 0 }, top,
});

void test("X and Z cuts of a box give exact rectangles", () => {
  const [x] = sectionProfile([box("wall.a")], "x", 1);
  assert.deepEqual(x!.points, [{ u: 0, y: 0 }, { u: 1, y: 0 }, { u: 1, y: 2 }, { u: 0, y: 2 }]);
  assert.equal(x!.kind, "wall");
  const [z] = sectionProfile([box("roof:r:p")], "z", 0.5);
  assert.deepEqual(z!.points.map((p) => p.u), [0, 4, 4, 0]);
  assert.equal(z!.kind, "roof");
});

void test("sloped top gives a trapezoid; a slanted cut through a triangle gives the chord", () => {
  const [piece] = sectionProfile([box("trim:coping", { x: 0.25, z: 0, constant: 2 })], "z", 0.5);
  near(piece!.points[2]!.y, 3);
  near(piece!.points[3]!.y, 2);
  const triangle: ScanSolid = { group: "floor:a", polygon: [{ x: 0, z: 0 }, { x: 2, z: 0 }, { x: 0, z: 2 }],
    bottom: { x: 0, z: 0, constant: -0.2 }, top: { x: 0, z: 0, constant: 0 } };
  const [chord] = sectionProfile([triangle], "x", 0.5);
  near(chord!.points[1]!.u - chord!.points[0]!.u, 1.5);
  assert.equal(chord!.kind, "floor");
});

void test("cuts on the boundary, outside the solid, and through a 1 mm solid", () => {
  assert.equal(sectionProfile([box("wall.a")], "x", 0).length, 1, "a cut along the west face still reports the face section");
  assert.deepEqual(sectionProfile([box("wall.a")], "x", 5), []);
  const thin: ScanSolid = { ...box("wall.t"), polygon: rectanglePolygon({ west: 0, east: 4, north: 0, south: 0.001 }) };
  near(sectionProfile([thin], "x", 2)[0]!.points[1]!.u, 0.001);
});
