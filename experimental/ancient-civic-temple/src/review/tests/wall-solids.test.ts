/**
 * src/geometry/wall-solids.ts: 벽 host의 기둥 분해·면 분류·높이 윤곽 clip.
 * fixture: 평평한 윗면의 곧은 벽(볼록), 바닥까지 열린 문 void(관통 구멍), 창 void(벽 안 구멍),
 * 경사 지붕 하부를 따르는 윗면, 대각 맞댐 끝(사다리꼴 평면), 얇은 벽(1cm), 거부(구간 없음,
 * 지붕 덮임 부족, void 위 지붕 하부 부족), 윤곽 clip의 볼록·박공·경계 높이, 결정성.
 * 결과는 culling 뒤 T 접합 해소 기준으로 닫힌 실체여야 한다. 열린 경계는 정의역 밖이다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { cullCoincidentVerticalFaces } from "../../geometry/face-culling";
import { rectanglePolygon, type RoofPatch } from "../../geometry/planar-domain";
import { clipOutlineAtHeight, clipOutlineAtLine, wallColumns, wallFaces, type WallSpec } from "../../geometry/wall-solids";
import { accountFaces, assertClosed, near, planArea } from "./fixtures";

const wall = (overrides: Partial<WallSpec> = {}): WallSpec => ({
  id: "wall.test", owner: "test", axis: "x", bottom: 0,
  plan: rectanglePolygon({ west: 0, east: 4, north: 0, south: 0.3 }),
  segments: [{ from: 0, to: 4, low: "inner", high: "outer", top: { kind: "flat", height: 3, surface: "surface.test.top" } }],
  voids: [],
  ...overrides,
});
const solid = (spec: WallSpec, roof: readonly RoofPatch[] = []) => accountFaces(spec.id, cullCoincidentVerticalFaces(wallFaces(spec, roof)));

void test("straight flat-top wall: one column, closed, volume 4 × 0.3 × 3, faces classified", () => {
  assert.equal(wallColumns(wall(), []).length, 1);
  const faces = wallFaces(wall(), []);
  assert.deepEqual([...new Set(faces.map((f) => f.surface))].sort((a, b) => a.localeCompare(b)),
    ["surface.test.end", "surface.test.footing", "surface.test.inner", "surface.test.outer", "surface.test.top"]);
  assertClosed(solid(wall()), 3.6);
});

void test("door void to the floor (through hole): lintel column only, closed genus-1 solid", () => {
  const spec = wall({ voids: [{ id: "door", from: 1, to: 2, bottom: 0, top: 2.1 }] });
  const columns = wallColumns(spec, []);
  assert.equal(columns.length, 3);
  assert.equal(columns[1]!.intervals.length, 1);
  const account = solid(spec);
  assertClosed(account, 3.6 - 1 * 0.3 * 2.1);
  assert.ok(wallFaces(spec, []).some((f) => f.surface === "surface.test.reveal"));
});

void test("window void inside the wall: sill and head intervals, closed", () => {
  const spec = wall({ voids: [{ id: "window", from: 1.5, to: 2, bottom: 1, top: 1.5 }] });
  assert.equal(wallColumns(spec, [])[1]!.intervals.length, 2);
  assertClosed(solid(spec), 3.6 - 0.5 * 0.3 * 0.5);
});

void test("roof-topped wall follows the sloped roof underside", () => {
  const roof: RoofPatch[] = [{
    id: "r", owner: "roof", surface: "surface.roof.upper", tier: "wing",
    polygon: rectanglePolygon({ west: -1, east: 5, north: -1, south: 1 }),
    height: { x: 0.1, z: 0, constant: 3.2 }, thickness: 0.2,
  }];
  const spec = wall({ segments: [{ from: 0, to: 4, low: "inner", high: "outer", top: { kind: "roof", tier: "wing" } }] });
  const account = solid(spec, roof);
  assertClosed(account, 4 * 0.3 * (3 + 0.1 * 2));
  assert.ok(wallFaces(spec, roof).some((f) => f.surface === "surface.test.bearing"));
});

void test("mitred (trapezoid) plan end and a thin 1 cm wall stay closed", () => {
  const mitred = wall({ plan: [{ x: 0, z: 0 }, { x: 4, z: 0 }, { x: 3.7, z: 0.3 }, { x: 0.3, z: 0.3 }] });
  assertClosed(solid(mitred), 3 * (4 + 3.4) / 2 * 0.3);
  const thin = wall({ plan: rectanglePolygon({ west: 0, east: 4, north: 0, south: 0.01 }) });
  assertClosed(solid(thin), 4 * 0.01 * 3);
});

void test("refusals: uncovered length, roof not covering the column, void top above the roof underside", () => {
  assert.throws(() => wallColumns(wall({ segments: [{ from: 0, to: 2, low: "i", high: "o", top: { kind: "flat", height: 3, surface: "s" } }] }), []), /구간이 없습니다/);
  const roofSegment = [{ from: 0, to: 4, low: "i", high: "o", top: { kind: "roof" as const, tier: "wing" as const } }];
  const half: RoofPatch[] = [{
    id: "r", owner: "roof", surface: "s", tier: "wing", polygon: rectanglePolygon({ west: -1, east: 2, north: -1, south: 1 }),
    height: { x: 0, z: 0, constant: 3 }, thickness: 0.2,
  }];
  assert.throws(() => wallColumns(wall({ segments: roofSegment }), half), /덮임/);
  assert.throws(() => wallColumns(wall({ voids: [{ id: "tall", from: 1, to: 2, bottom: 0, top: 3.2 }] }), []), /낮습니다/);
});

void test("clipOutlineAtHeight: rectangle and gable outlines, and a height outside the outline", () => {
  const rectangle = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 5 }, { x: 0, y: 5 }];
  const area = (o: ReadonlyArray<{ x: number; y: number }>) => planArea(o.map((p) => ({ x: p.x, z: p.y })));
  near(area(clipOutlineAtHeight(rectangle, 3, "below")), 12);
  near(area(clipOutlineAtHeight(rectangle, 3, "above")), 8);
  const gable = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 2, y: 5 }, { x: 0, y: 3 }];
  near(area(clipOutlineAtHeight(gable, 3, "below")) + area(clipOutlineAtHeight(gable, 3, "above")), area(gable));
  near(area(clipOutlineAtHeight(gable, 4, "above")), 1);
  assert.throws(() => clipOutlineAtHeight(rectangle, 6, "above"), /남지 않습니다/);
  assert.equal(clipOutlineAtHeight(rectangle, 5, "below").length, 4, "clip on the top edge keeps the outline");
});

void test("deterministic and input-preserving", () => {
  const spec = wall({ voids: [{ id: "door", from: 1, to: 2, bottom: 0, top: 2.1 }] });
  const before = JSON.stringify(spec);
  assert.deepEqual(wallFaces(spec, []), wallFaces(spec, []));
  assert.equal(JSON.stringify(spec), before);
});

void test("sloped split partitions a convex return host without changing its input", () => {
  const host = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 4 }, { x: 0, y: 4 }];
  const before = JSON.stringify(host);
  const below = clipOutlineAtLine(host, 0.2, 3, "below");
  const above = clipOutlineAtLine(host, 0.2, 3, "above");
  assert.deepEqual(below, [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 3.4 }, { x: 0, y: 3 }]);
  assert.deepEqual(above, [{ x: 2, y: 3.4 }, { x: 2, y: 4 }, { x: 0, y: 4 }, { x: 0, y: 3 }]);
  assert.equal(JSON.stringify(host), before);
  assert.deepEqual(clipOutlineAtLine(host, 0.2, 3, "below"), below);
});

void test("sloped split handles a concave host, a thin band, edge contact and absence", () => {
  const concave = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 4 },
    { x: 1, y: 3.5 }, { x: 0, y: 4 }];
  assert.ok(clipOutlineAtLine(concave, 0.1, 3, "below").length >= 4);
  assert.ok(clipOutlineAtLine(concave, 0.1, 3, "above").length >= 3);
  const thin = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.001 }, { x: 0, y: 0.001 }];
  assert.equal(clipOutlineAtLine(thin, 0, 0.0005, "above").length, 4);
  assert.equal(clipOutlineAtLine(thin, 0, 0.001, "below").length, 4);
  assert.throws(() => clipOutlineAtLine(thin, 0, 0.002, "above"), /남지 않습니다/);
  assert.throws(() => clipOutlineAtLine(thin.slice(0, 2), 0, 0.001, "below"), /닫힌 유한/);
  assert.throws(() => clipOutlineAtLine(thin, Number.NaN, 0.001, "below"), /닫힌 유한/);
});
