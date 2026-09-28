import assert from "node:assert/strict";
import test from "node:test";
import { inViewerFrustum } from "../opening-frustum";

void test("perspective frustum sees its target and rejects the same opening behind the eye", () => {
  const eye = { x: 0, y: 1.6, z: 0 };
  const target = { x: 0, y: 4.2, z: -5 };
  assert.equal(inViewerFrustum(eye, target, target), true);
  assert.equal(inViewerFrustum(eye, target, { x: 0, y: 4.2, z: 5 }), false);
  assert.equal(inViewerFrustum(eye, target, { x: 0.26, y: 4.46, z: -5 }), true);
  assert.equal(inViewerFrustum(eye, target, { x: 9, y: 4.2, z: -5 }), false);
});

void test("a pitched camera still has an orthogonal up vector", () => {
  const eye = { x: -1, y: 1.6, z: 2 };
  const target = { x: 3, y: 5, z: -4 };
  assert.equal(inViewerFrustum(eye, target, target), true);
  assert.equal(inViewerFrustum(eye, target, { x: 3, y: 4.8, z: -4 }), true);
});

void test("near-plane boundary, vertical camera and zero direction are explicit", () => {
  const eye = { x: 0, y: 0, z: 0 };
  assert.equal(inViewerFrustum(eye, { x: 0, y: 1, z: 0 }, { x: 0, y: 0.05, z: 0 }), true);
  assert.equal(inViewerFrustum(eye, { x: 0, y: 1, z: 0 }, { x: 0, y: 0.049, z: 0 }), false);
  assert.throws(() => inViewerFrustum(eye, eye, { x: 0, y: 1, z: 0 }), /zero-length/);
});
