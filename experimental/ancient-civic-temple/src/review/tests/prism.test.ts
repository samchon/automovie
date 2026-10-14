/**
 * src/geometry/prism.ts prismFaces: vertical prisms over convex planar polygons.
 * Fixtures: convex quadrilaterals with level or sloped tops, triangles, thin
 * thickness (1mm), heights near the numeric limit, concave polygons (refused),
 * and determinism. Holes are outside the domain, which takes one ring only;
 * wall-solids column decomposition owns walls with holes and planar-domain
 * partition owns planes with holes. Open boundaries are also outside the
 * domain; the operation always emits a closed face list.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { buildAutoMoviePolyhedron } from "@automovie/engine";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { levelPlane, prismFaces } from "../../geometry/prism";
import { accountFaces, assertClosed, near } from "./fixtures";

const square = rectanglePolygon({ west: 0, east: 2, north: 0, south: 3 });

void test("convex rectangle, level planes: 6 faces, closed, volume = area × height, outward edge normals", () => {
  const faces = prismFaces(square, levelPlane(0), levelPlane(1.5));
  assert.equal(faces.length, 6);
  assert.deepEqual(faces.map((f) => f.side), ["top", "bottom", "edge", "edge", "edge", "edge"]);
  assert.deepEqual(faces.filter((f) => f.side === "edge").map((f) => [f.normal.x, f.normal.z].map((n) => Math.round(n) + 0)),
    [[0, -1], [1, 0], [0, 1], [-1, 0]]);
  const account = accountFaces("prism", faces);
  assert.equal(account.triangles, 12);
  assert.equal(account.boundaryEdges, 0);
  assert.deepEqual(account.bounds, { min: [0, 0, 0], max: [2, 1.5, 3] });
  assertClosed(account, 9);
});

void test("sloped top y = 1 + 0.1x: volume = area × height at centroid", () => {
  const top = { x: 0.1, z: 0, constant: 1 };
  assertClosed(accountFaces("sloped", prismFaces(square, levelPlane(0), top)), 6 * 1.1);
});

void test("triangle base: 5 faces, closed", () => {
  const triangle = [{ x: 0, z: 0 }, { x: 2, z: 0 }, { x: 0, z: 2 }];
  const faces = prismFaces(triangle, levelPlane(-0.5), levelPlane(0.5));
  assert.equal(faces.length, 5);
  assertClosed(accountFaces("triangle", faces), 2);
});

void test("thin prism (1 mm) stays closed with exact volume", () => {
  assertClosed(accountFaces("thin", prismFaces(square, levelPlane(3.2), levelPlane(3.201))), 6 * 0.001, 1);
});

void test("near-tolerance heights: 2e-9 m accepted by prismFaces, 5e-10 m refused", () => {
  assert.equal(prismFaces(square, levelPlane(0), levelPlane(2e-9)).length, 6);
  assert.throws(() => prismFaces(square, levelPlane(0), levelPlane(5e-10)), /not higher/);
  assert.throws(() => prismFaces(square, levelPlane(1), levelPlane(0)), /not higher/);
});

void test("refused inputs: fewer than three corners, concave base (engine refuses the reflex top face)", () => {
  assert.throws(() => prismFaces([{ x: 0, z: 0 }, { x: 1, z: 0 }], levelPlane(0), levelPlane(1)), /at least three vertices/);
  const concave = [{ x: 0, z: 0 }, { x: 2, z: 0 }, { x: 2, z: 1 }, { x: 1, z: 1 }, { x: 1, z: 2 }, { x: 0, z: 2 }];
  const faces = prismFaces(concave, levelPlane(0), levelPlane(1));
  assert.equal(faces.length, 8, "prismFaces itself does not test convexity");
  assert.throws(() => buildAutoMoviePolyhedron(faces.map((f) => f.corners)));
});

void test("deterministic and does not mutate its inputs", () => {
  const input = JSON.stringify(square);
  const a = prismFaces(square, levelPlane(0), { x: 0.05, z: -0.02, constant: 2 });
  const b = prismFaces(square, levelPlane(0), { x: 0.05, z: -0.02, constant: 2 });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(square), input);
  near(a[0]!.corners[0]!.y, 2 + 0.05 * 0 - 0.02 * 3);
});
