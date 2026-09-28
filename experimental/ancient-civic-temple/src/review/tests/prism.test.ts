/**
 * src/geometry/prism.ts `prismFaces`: 볼록 평면 다각형 위 수직 프리즘.
 * fixture: 볼록 사각형(수평/경사 상단), 삼각형, 얇은 두께(1mm), 수치 한계 근처 높이,
 * 오목 다각형(거부되는 경우), 결정성. 구멍은 이 연산의 정의역 밖이다(한 고리만 받는다;
 * 구멍 있는 벽은 wall-solids의 기둥 분해, 구멍 있는 평면은 planar-domain 분할이 맡는다).
 * 열린 경계도 정의역 밖이다(항상 닫힌 면 목록을 낸다).
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
  assert.throws(() => prismFaces(square, levelPlane(0), levelPlane(5e-10)), /높지 않습니다/);
  assert.throws(() => prismFaces(square, levelPlane(1), levelPlane(0)), /높지 않습니다/);
});

void test("refused inputs: fewer than three corners, concave base (engine refuses the reflex top face)", () => {
  assert.throws(() => prismFaces([{ x: 0, z: 0 }, { x: 1, z: 0 }], levelPlane(0), levelPlane(1)), /세 꼭짓점/);
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
