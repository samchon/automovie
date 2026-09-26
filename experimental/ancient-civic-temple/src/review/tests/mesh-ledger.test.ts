/**
 * mesh-ledger 측정 경로를 독립적으로 아는 경우에 대조한다(`review-verification/measurements.md`):
 * 닫힌 상자, 한 면만 나눈 T 접합 상자, 뚜껑 없는 상자, 뒤집힌 면, 떨어진 두 상자, 모서리에 붙은
 * 한 장짜리 막음(production의 지붕 높이 차이 막음과 같은 형태), 반복 호출의 결정성.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { buildAutoMoviePolyhedron } from "@automovie/engine";
import { accountMeshes, closureFindings, partitionNamedSheetTriangles } from "../mesh-ledger";
import { accountFaces, assertClosed, boxFaces, near, v } from "./fixtures";

const unit = { west: 0, east: 1, bottom: 0, top: 1, north: 0, south: 1 };

void test("closed unit box: 12 triangles, no boundary, volume 1, attributes kept", () => {
  const account = accountFaces("box", boxFaces(unit));
  assert.equal(account.triangles, 12);
  assert.equal(account.boundaryEdges, 0);
  assert.equal(account.tJunctionVertices, 0);
  assert.equal(account.watertight, true);
  assert.equal(account.weldedVertices, 8);
  assert.equal(account.vertices, 24);
  assert.deepEqual([account.partsWithNormals, account.partsWithUvs], [1, 1]);
  assert.deepEqual(account.bounds, { min: [0, 0, 0], max: [1, 1, 1] });
  assertClosed(account, 1);
  assert.deepEqual(closureFindings(account, true), []);
});

void test("T-junction box: engine sees open edges, resolution finds no gap", () => {
  const faces = boxFaces(unit).slice(1);
  faces.unshift(
    { surface: "top-a", corners: [v(0, 1, 0), v(0, 1, 1), v(0.5, 1, 1), v(0.5, 1, 0)] },
    { surface: "top-b", corners: [v(0.5, 1, 0), v(0.5, 1, 1), v(1, 1, 1), v(1, 1, 0)] },
  );
  const account = accountFaces("t-box", faces);
  assert.ok(account.boundaryEdges > 0, "engine counts the unsplit side edges as boundary");
  assert.equal(account.watertight, false);
  assert.equal(account.tJunctionVertices, 2);
  assertClosed(account, 1);
});

void test("open box (no top): four open edges remain after resolution", () => {
  const account = accountFaces("open", boxFaces(unit).slice(1));
  assert.equal(account.openEdges, 4);
  assert.equal(account.boundaryEdges, 4);
  assert.deepEqual(closureFindings(account, true).length > 0, true);
  assert.deepEqual(closureFindings(account, false), [], "an open surface contract does not flag open edges");
});

void test("flipped face: winding errors are reported", () => {
  const faces = boxFaces(unit);
  faces[0] = { ...faces[0]!, corners: [...faces[0]!.corners].reverse() };
  const account = accountFaces("flipped", faces);
  assert.ok(account.windingErrors > 0);
  assert.ok(account.openEdges > 0, "unpaired directed sub-edges");
  assert.ok(closureFindings(account, true).some((f) => f.startsWith("감김 오류")));
});

void test("two separate boxes: two components, summed volume", () => {
  const faces = [...boxFaces(unit), ...boxFaces({ ...unit, west: 3, east: 4 })];
  assertClosed(accountFaces("pair", faces), 2, 2);
});

void test("single-sheet closure on a solid edge: non-manifold and open (the roof step-closure form)", () => {
  const faces = [
    ...boxFaces(unit),
    { surface: "fin", corners: [v(0, 1, 0), v(1, 1, 0), v(1, 1.5, 0)] },
  ];
  const account = accountFaces("fin", faces);
  assert.ok(account.resolvedNonManifold >= 1);
  assert.ok(account.openEdges >= 2);
  assert.ok(account.defectSamples.length > 0);
});

void test("named-sheet ledger measures only emitted sheet triangles, not a coplanar neighbour", () => {
  const corners = [v(0, 0, 0), v(2, 0, 0), v(0, 2, 0)];
  const neighbour = [v(0.25, 0.25, 0), v(0.5, 0.25, 0), v(0.25, 0.5, 0)];
  const mesh = buildAutoMoviePolyhedron([corners, neighbour]);
  mesh.colors = Array.from({ length: mesh.positions.length }, (_, i) => i % 3 === 0 ? 0.5 : 1);
  const original = JSON.stringify(mesh);
  const split = partitionNamedSheetTriangles(mesh, [{ id: "fin", corners }]);
  assert.equal(split.removed, 1);
  assert.ok(split.sheet !== null && split.body !== null);
  assert.deepEqual([split.sheet!.positions.length, split.body!.positions.length], [9, 9]);
  assert.deepEqual(split.sheet!.colors, [0.5, 1, 1, 0.5, 1, 1, 0.5, 1, 1]);
  assert.deepEqual(accountMeshes("sheet", [split.sheet!]).bounds, { min: [0, 0, 0], max: [2, 2, 0] });
  assert.deepEqual(accountMeshes("body", [split.body!]).bounds, { min: [0.25, 0.25, 0], max: [0.5, 0.5, 0] });
  assert.equal(partitionNamedSheetTriangles(mesh, []).sheet, null);
  assert.equal(partitionNamedSheetTriangles({ ...mesh, indices: null }, [{ id: "fin", corners }]).removed, 1);
  const withinTolerance = { ...mesh, positions: [...mesh.positions] };
  withinTolerance.positions[0] += 0.5e-6;
  assert.equal(partitionNamedSheetTriangles(withinTolerance, [{ id: "fin", corners }]).removed, 1);
  withinTolerance.positions[0] += 2e-6;
  assert.equal(partitionNamedSheetTriangles(withinTolerance, [{ id: "fin", corners }]).removed, 0);
  assert.equal(JSON.stringify(mesh), original);
});

void test("determinism and input preservation", () => {
  const mesh = buildAutoMoviePolyhedron(boxFaces(unit).map((f) => f.corners));
  const copy = JSON.stringify(mesh);
  const first = accountMeshes("a", [mesh]);
  const second = accountMeshes("a", [mesh]);
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(mesh), copy);
  near(first.volume, 1);
  assert.throws(() => accountMeshes("empty", []), /결산할 mesh가 없습니다/);
});
