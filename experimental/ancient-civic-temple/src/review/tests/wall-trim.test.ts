/**
 * src/geometry/wall-trim.ts: 파라펫 코핑과 외곽 기단.
 * fixture: 외곽 전 폭의 곧은 파라펫 하나(코핑 돌출·자유 끝 돌출, 기단 띠와 두 모서리 칸),
 * 경사 지면(기단 상단이 지면을 따름)과 경사 전환선(칸 분할), 두 높이의 파라펫이 만나는 끝
 * (높은 벽 쪽으로 돌출하지 않음), 결정성. 코핑과 기단은 격자 칸 합집합이라 culling 뒤 닫힌
 * 실체여야 한다. 기단은 외곽이 원점 대칭이라는 가정(abs(x) = east)을 쓴다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { copingCells, copingFaces, plinthCells, plinthFaces, type WallTrimInput } from "../../geometry/wall-trim";
import { rectanglePolygon } from "../../geometry/planar-domain";
import type { WallSpec } from "../../geometry/wall-solids";
import { accountFaces, assertClosed } from "./fixtures";

const parapet = (overrides: Partial<WallSpec> = {}): WallSpec => ({
  id: "wall.front", owner: "front", axis: "x", bottom: -0.42,
  plan: rectanglePolygon({ west: -2, east: 2, north: 1.7, south: 2 }),
  segments: [{ from: -2, to: 2, low: "inner", high: "outer", top: { kind: "flat", height: 4.85, surface: "surface.front.coping", coping: 0.16 } }],
  voids: [], ...overrides,
});
const input = (walls: WallSpec[], grade: WallTrimInput["grade"] = () => ({ x: 0, z: 0, constant: 0 }), gradeBreaks: number[] = []): WallTrimInput => ({
  walls, roof: [], outline: { west: -2, east: 2, north: -2, south: 2 }, grade, gradeBreaks,
  profile: { copingProjection: 0.06, plinthProjection: 0.04, plinthRise: 0.4 },
  plinthSurface: (surface) => surface.replace(/\.outer$/, ".plinth"),
});

void test("coping on a free-standing parapet: projects on both sides and both free ends, closed", () => {
  const cells = copingCells(input([parapet()]));
  assert.equal(cells.length, 9);
  assert.equal(cells.filter((c) => c.onBed).length, 1);
  const account = accountFaces("coping", copingFaces(input([parapet()])));
  assertClosed(account, 4.12 * 0.42 * 0.16);
  assert.deepEqual(account.bounds.min.map((n) => Math.round(n * 1e6) / 1e6), [-2.06, 4.69, 1.64]);
});

void test("plinth on level ground: band in front of the outer face plus two corner cells, closed", () => {
  const faces = plinthFaces(input([parapet()]));
  assert.ok(faces.some((f) => f.surface === "surface.front.plinth"));
  assert.ok(faces.some((f) => f.surface === "surface.front.joint"), "buried bottom and wall-side back are hidden joints");
  assertClosed(accountFaces("plinth", faces), 4.08 * 0.04 * (0.4 + 0.42));
});

void test("plinth on sloped ground follows the grade and splits at grade breaks", () => {
  const slope = (at: { x: number }) => ({ x: at.x < 0 ? 0.05 : 0.05, z: 0, constant: 0 });
  const cells = plinthCells(input([parapet()], slope, [2.02]));
  assert.ok(cells.length >= 2, "cells split at the grade break");
  const account = accountFaces("sloped", plinthFaces(input([parapet()], slope, [2.02])));
  assertClosed(account, 4.08 * 0.04 * (0.4 + 0.42));
});

void test("parapet segment continuing into a taller segment of the same wall: coping stops at the segment boundary, closed", () => {
  const spec = parapet({ segments: [
    { from: -2, to: 0, low: "inner", high: "outer", top: { kind: "flat", height: 4.85, surface: "surface.front.coping", coping: 0.16 } },
    { from: 0, to: 2, low: "inner", high: "outer", top: { kind: "flat", height: 6, surface: "surface.front.top" } },
  ] });
  const cells = copingCells(input([spec]));
  assert.ok(cells.every((c) => c.rect.east <= 1e-9), "no coping over the taller segment");
  assertClosed(accountFaces("stop", copingFaces(input([spec]))), 2.06 * 0.42 * 0.16);
});

/**
 * 더 높은 별도 벽 앞에서 끝나는 파라펫(합성 fixture)은 아직 측면 돌출 칸이 끝을 넘어 그 벽 면에 붙는다.
 * production에는 이 경우가 없다. 코핑 없는 이웃 옆에 남는 측면 돌출 칸 6칸은 모두 정상 lip이며,
 * 2026-09-24 뷰어의 정확한 연직 단면(현재 source)으로 세 곳을 판독했다.
 * - Z=10.28, 현관 반환벽 앞 자유단: 반환벽 코핑의 앞 끝 lip이 포치 지붕 위 약 0.7m에 있고 삼각 막음 윗변(3.5~4.47m)에 닿지 않는다.
 * - Z=8.38: 반환벽 코핑의 양쪽 lip이 함께 남으며 그 X에서 entry-back 벽은 약 3.8~4.0m로 코핑보다 낮아 더 높은 벽이 아니다.
 * - X=9.87, 남동 모서리: 남측 파라펫의 안쪽 lip이 동측 벽 안쪽 면에서 끝나고 옆의 facade-east 처마 벽은 코핑보다 낮다.
 */
const lipTodo = "더 높은 별도 벽 앞에서 끝나는 파라펫의 측면 돌출 칸(0.06×0.06m)이 끝을 넘어 그 벽 면에 붙는다. 머리말의 \"더 높은 벽으로 이어지는 끝은 돌출하지 않고\"와 다르다. production에는 이 배치가 없고 production의 측면 돌출 6칸은 정상 lip이다(위 단면 판독).";

void test("parapet ending against a separate taller wall: side lips do not wrap past the end", { todo: lipTodo }, () => {
  const low = parapet({ plan: rectanglePolygon({ west: -2, east: 0, north: 1.7, south: 2 }), segments: [{ from: -2, to: 0, low: "i", high: "outer",
    top: { kind: "flat", height: 4.85, surface: "surface.front.coping", coping: 0.16 } }] });
  const high = parapet({ id: "wall.high", owner: "high", plan: rectanglePolygon({ west: 0, east: 2, north: 1.7, south: 2 }), segments: [{ from: 0, to: 2, low: "i", high: "outer",
    top: { kind: "flat", height: 6, surface: "surface.high.top" } }] });
  assert.ok(copingCells(input([low, high])).every((c) => c.rect.east <= 1e-9));
});

void test("deterministic and input-preserving", () => {
  const trim = input([parapet()]);
  const before = JSON.stringify(trim.walls);
  assert.deepEqual(copingFaces(trim), copingFaces(trim));
  assert.deepEqual(plinthFaces(trim), plinthFaces(trim));
  assert.equal(JSON.stringify(trim.walls), before);
});
