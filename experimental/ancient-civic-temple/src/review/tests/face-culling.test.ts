/**
 * src/geometry/face-culling.ts cullCoincidentVerticalFaces removes common vertical faces of touching convex pieces.
 * Fixtures: equal touching boxes (convex), different-height boxes (remaining
 * exposed band), length-offset boxes (partial overlap without a hole), three
 * boxes in an L (concave union), thin boxes (1mm), near-limit planes separated
 * by 4µm or 20µm, joining without culling (non-manifold), and determinism.
 * Open boundaries and holes are not inputs; the operation takes faces of closed convex pieces.
 * Every production vertical face uses prism side-face order
 * [a-bottom, a-top, b-top, b-bottom] (prismFaces and splitVerticalFace).
 * Two general-order tests check whether remaining pieces preserve the original
 * normal when faces arrive in another order, traversing a quadrilateral from its bottom edge.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { cullCoincidentVerticalFaces } from "../../geometry/cullCoincidentVerticalFaces";
import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import { prismFaces } from "../../geometry/prismFaces";
import { levelPlane } from "../../geometry/levelPlane";
import { assertClosed } from "./assertClosed";
import { boxFaces } from "./boxFaces";
import { accountFaces } from "./accountFaces";

/** Box using the production's prism side-face order. */
const box = (west: number, east: number, top: number, north = 0, south = 1, bottom = 0) =>
  prismFaces(rectanglePolygon({ west, east, north, south }), levelPlane(bottom), levelPlane(top))
    .map((face) => ({ surface: "surface.test.box", corners: face.corners }));
/** Box traversing from the bottom edge, as a general input. */
const bottomFirstBox = (west: number, east: number, top: number, north = 0, south = 1) =>
  boxFaces({ west, east, bottom: 0, top, north, south });

void test("two equal boxes sharing a face: both shared faces removed, closed union, no T-junction", () => {
  const faces = cullCoincidentVerticalFaces([...box(0, 1, 1), ...box(1, 2, 1)]);
  assert.equal(faces.length, 10);
  const account = accountFaces("pair", faces);
  assert.equal(account.boundaryEdges, 0);
  assertClosed(account, 2);
});

void test("without culling the touching boxes are non-manifold along the shared face", () => {
  const account = accountFaces("raw", [...box(0, 1, 1), ...box(1, 2, 1)]);
  assert.ok(account.nonManifoldEdges > 0 || account.resolvedNonManifold > 0);
});

void test("different heights: the exposed strip of the taller box survives, union closed after T-resolution", () => {
  const faces = cullCoincidentVerticalFaces([...box(0, 1, 1), ...box(1, 2, 2)]);
  const account = accountFaces("step", faces);
  assert.ok(account.tJunctionVertices > 0);
  assertClosed(account, 3);
});

void test("boxes offset along the shared plane: only the overlapping part is removed", () => {
  const faces = cullCoincidentVerticalFaces([...box(0, 1, 1, 0, 1), ...box(1, 2, 1, 0.5, 1.5)]);
  assertClosed(accountFaces("offset", faces), 2);
});

void test("three boxes in an L (concave union) close as one solid", () => {
  const faces = cullCoincidentVerticalFaces([...box(0, 1, 1), ...box(1, 2, 1), ...box(0, 1, 1, 1, 2)]);
  assertClosed(accountFaces("l", faces), 3);
});

void test("thin boxes (1 mm) sharing a face", () => {
  const faces = cullCoincidentVerticalFaces([...box(0, 1, 0.001), ...box(1, 2, 0.001)]);
  assertClosed(accountFaces("thin", faces), 0.002);
});

void test("near tolerance: planes 4 µm apart share a 10 µm offset bucket and are culled (leaving a gap); 20 µm apart are kept", () => {
  const close = accountFaces("4um", cullCoincidentVerticalFaces([...box(0, 1, 1), ...box(1.000004, 2, 1)]));
  assert.ok(close.openEdges > 0, "both faces removed across a 4 µm gap: the union is open there");
  const apart = accountFaces("20um", cullCoincidentVerticalFaces([...box(0, 1, 1), ...box(1.00002, 2, 1)]));
  assertClosed(apart, 1 + 0.99998, 2);
});

void test("general corner order, different heights: remnant keeps the original winding", () => {
  assertClosed(accountFaces("step-general", cullCoincidentVerticalFaces([...bottomFirstBox(0, 1, 1), ...bottomFirstBox(1, 2, 2)])), 3);
});

void test("general corner order, offset boxes: remnant keeps the original winding", () => {
  assertClosed(accountFaces("offset-general", cullCoincidentVerticalFaces([...bottomFirstBox(0, 1, 1, 0, 1), ...bottomFirstBox(1, 2, 1, 0.5, 1.5)])), 2);
});

void test("non-vertical faces pass through untouched; deterministic; inputs preserved", () => {
  const input = [...box(0, 1, 1), ...box(1, 2, 1)];
  const before = JSON.stringify(input);
  const a = cullCoincidentVerticalFaces(input);
  assert.deepEqual(a, cullCoincidentVerticalFaces(input));
  assert.equal(JSON.stringify(input), before);
  assert.equal(a.filter((f) => f.corners.every((c) => c.y === 1)).length, 2, "both top faces kept");
});
