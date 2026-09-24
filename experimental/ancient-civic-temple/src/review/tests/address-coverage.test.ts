import assert from "node:assert/strict";
import test from "node:test";
import { pointInOutline, rayTriangle } from "../address-coverage";

void test("address polygon includes convex interior and excludes exterior", () => {
  const square = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }];
  assert.equal(pointInOutline(square, 1, 1), true);
  assert.equal(pointInOutline(square, 2.01, 1), false);
});

void test("concave address excludes its notch and thin address remains measurable", () => {
  const concave = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 2 }, { x: 0, y: 2 }];
  assert.equal(pointInOutline(concave, 0.25, 1.5), true);
  assert.equal(pointInOutline(concave, 1.5, 1.5), false);
  const thin = [{ x: 0, y: 0 }, { x: 0.001, y: 0 }, { x: 0.001, y: 1 }, { x: 0, y: 1 }];
  assert.equal(pointInOutline(thin, 0.0005, 0.5), true);
  assert.equal(pointInOutline(thin, 0.0015, 0.5), false);
});

void test("ray reaches a two-sided emitted face, and an open edge has no hit", () => {
  const triangle = { a: { x: 0, y: 0, z: 0 }, b: { x: 1, y: 0, z: 0 }, c: { x: 0, y: 1, z: 0 } };
  assert.equal(rayTriangle({ x: 0.25, y: 0.25, z: 1 }, { x: 0, y: 0, z: -1 }, triangle), 1);
  assert.equal(rayTriangle({ x: 0.25, y: 0.25, z: -1 }, { x: 0, y: 0, z: 1 }, triangle), 1);
  assert.equal(rayTriangle({ x: 0.8, y: 0.8, z: 1 }, { x: 0, y: 0, z: -1 }, triangle), null);
  assert.equal(rayTriangle({ x: 0.25, y: 0.25, z: 1 }, { x: 1, y: 0, z: 0 }, triangle), null);
});
