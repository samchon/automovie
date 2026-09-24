/**
 * src/geometry/face-culling.ts `cullCoincidentVerticalFaces`: 맞닿은 볼록 조각의 공통 수직 면 제거.
 * fixture: 같은 크기로 맞닿은 두 상자(볼록), 높이가 다른 두 상자(노출 띠가 남는 경우),
 * 길이 방향으로 어긋난 두 상자(구멍 없는 부분 겹침), 세 상자 L자(오목 합집합),
 * 얇은 상자(1mm), 수치 한계 근처(4µm·20µm 떨어진 평면), culling 없이 이은 경우(비다양체),
 * 결정성. 열린 경계와 구멍은 이 연산의 입력이 아니다(닫힌 볼록 조각의 면을 받는다).
 * production의 수직 면은 모두 prism 옆면 순서 [a아래, a위, b위, b아래]로 들어온다(prismFaces,
 * splitVerticalFace). 다른 순서(아랫변부터 도는 사각형)로 들어온 면의 남은 조각은 감김이
 * 뒤집힌다: 이 결함은 todo 시험으로 남긴다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { cullCoincidentVerticalFaces } from "../../geometry/face-culling";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { levelPlane, prismFaces } from "../../geometry/prism";
import { accountFaces, assertClosed, boxFaces } from "./fixtures";

/** production과 같은 prism 옆면 순서의 상자. */
const box = (west: number, east: number, top: number, north = 0, south = 1, bottom = 0) =>
  prismFaces(rectanglePolygon({ west, east, north, south }), levelPlane(bottom), levelPlane(top))
    .map((face) => ({ surface: "surface.test.box", corners: face.corners }));
/** 아랫변부터 도는 순서의 상자(일반 입력). */
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

const heldFix = "face-culling의 toCorners가 prism 순서를 가정해 아랫변부터 도는 면의 남은 조각을 뒤집는다(체적 3.667≠3). production 입력은 모두 prism 순서라 영향 없음. src/geometry는 판정 대기 층이라 수리를 판정 뒤로 미룬다.";

void test("general corner order, different heights: remnant keeps the original winding", { todo: heldFix }, () => {
  assertClosed(accountFaces("step-general", cullCoincidentVerticalFaces([...bottomFirstBox(0, 1, 1), ...bottomFirstBox(1, 2, 2)])), 3);
});

void test("general corner order, offset boxes: remnant keeps the original winding", { todo: heldFix }, () => {
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
