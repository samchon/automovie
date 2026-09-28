/**
 * src/geometry/planar-domain.ts: 사각형·반평면 clip·볼록 분할·정리.
 * fixture: 볼록(사각형), 오목(L자 subject를 한 반평면으로 clip), 구멍(가운데 cutter로
 * 나눈 바깥 조각), 얇은(1mm 폭), 수치 한계 근처(꼭짓점을 지나는 clip, 0.1mm 중복점,
 * 1mm² 경계의 조각), 거부(뒤집힌·비유한 사각형), 결정성.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { clipPlan, edgeInside, partitionPlan, planeHeight, rectanglePolygon, simplifyPlan } from "../../geometry/planar-domain";
import { near, planArea } from "./fixtures";

void test("rectanglePolygon: CCW positive area; inverted, empty and non-finite ranges refused", () => {
  const r = rectanglePolygon({ west: -1, east: 2, north: 0, south: 0.5 });
  near(planArea(r), 1.5);
  assert.throws(() => rectanglePolygon({ west: 1, east: 1, north: 0, south: 1 }));
  assert.throws(() => rectanglePolygon({ west: 0, east: 1, north: 1, south: 0 }));
  assert.throws(() => rectanglePolygon({ west: 0, east: Infinity, north: 0, south: 1 }));
});

void test("planeHeight and edgeInside: left of a CCW edge is positive", () => {
  near(planeHeight({ x: 0.5, z: -2, constant: 1 }, { x: 2, z: 1 }), 0);
  const inside = edgeInside({ x: 0, z: 0 }, { x: 1, z: 0 });
  assert.ok(planeHeight(inside, { x: 0.5, z: 1 }) > 0);
  assert.ok(planeHeight(inside, { x: 0.5, z: -1 }) < 0);
});

void test("clipPlan on a convex square: half, all, none, and a clip through two corners", () => {
  const square = rectanglePolygon({ west: 0, east: 1, north: 0, south: 1 });
  near(planArea(clipPlan(square, { x: 1, z: 0, constant: -0.5 })), 0.5);
  near(planArea(clipPlan(square, { x: 1, z: 0, constant: 1 })), 1);
  assert.deepEqual(clipPlan(square, { x: 1, z: 0, constant: -2 }), []);
  const diagonal = clipPlan(square, { x: -1, z: 1, constant: 0 });
  near(planArea(diagonal), 0.5);
  assert.equal(diagonal.length, 3, "vertices on the clip line are not duplicated");
});

void test("clipPlan on a concave L subject keeps the exact area on the kept side", () => {
  const l = [{ x: 0, z: 0 }, { x: 2, z: 0 }, { x: 2, z: 1 }, { x: 1, z: 1 }, { x: 1, z: 2 }, { x: 0, z: 2 }];
  near(planArea(l), 3);
  near(planArea(clipPlan(l, { x: 0, z: -1, constant: 1.5 })), 2.5);
});

void test("partitionPlan with a central cutter: inside + disjoint outside pieces reproduce the holed subject", () => {
  const subject = rectanglePolygon({ west: 0, east: 4, north: 0, south: 4 });
  const cutter = rectanglePolygon({ west: 1, east: 2, north: 1, south: 3 });
  const { inside, outside } = partitionPlan(subject, cutter);
  near(planArea(inside), 2);
  near(outside.reduce((s, p) => s + planArea(p), 0), 14);
  assert.equal(outside.length, 4);
  for (const piece of outside) assert.ok(planArea(piece) > 0);
  const disjoint = partitionPlan(subject, rectanglePolygon({ west: 10, east: 11, north: 0, south: 1 }));
  assert.deepEqual(disjoint.inside, []);
  near(disjoint.outside.reduce((sum, piece) => sum + planArea(piece), 0), 16);
});

void test("thin strip (1 mm) survives clip and partition", () => {
  const strip = rectanglePolygon({ west: 0, east: 5, north: 0, south: 0.001 });
  near(planArea(clipPlan(strip, { x: 1, z: 0, constant: -1 })), 0.004);
  near(planArea(partitionPlan(strip, rectanglePolygon({ west: 2, east: 3, north: -1, south: 1 })).inside), 0.001);
});

void test("simplifyPlan: 0.1 mm duplicates and collinear points removed, pieces under 1 mm² dropped", () => {
  const square = [{ x: 0, z: 0 }, { x: 0.5, z: 0 }, { x: 1, z: 0 }, { x: 1, z: 1.00005 }, { x: 1, z: 1 }, { x: 0, z: 1 }];
  const simple = simplifyPlan(square);
  assert.equal(simple.length, 4);
  near(planArea(simple), 1);
  assert.deepEqual(simplifyPlan(rectanglePolygon({ west: 0, east: 0.9e-3, north: 0, south: 1e-3 })), []);
  assert.equal(simplifyPlan(rectanglePolygon({ west: 0, east: 1.1e-3, north: 0, south: 1e-3 })).length, 4);
});

void test("deterministic and input-preserving", () => {
  const subject = rectanglePolygon({ west: 0, east: 4, north: 0, south: 4 });
  const cutter = rectanglePolygon({ west: 1, east: 2, north: 1, south: 3 });
  const before = JSON.stringify([subject, cutter]);
  assert.deepEqual(partitionPlan(subject, cutter), partitionPlan(subject, cutter));
  assert.equal(JSON.stringify([subject, cutter]), before);
});
