/**
 * src/review/envelope-overlaps.ts 측정 경로를 아는 경우에 대조한다: 알려진 깊이로 겹친 두 실체,
 * 면만 맞닿은 두 실체, 같은 묶음 안의 겹침(세지 않음), 경사 상단 아래의 겹침, 실체 안 점 판정.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { lastScan, scanOverlaps, solidsContaining, type ScanSolid } from "../envelope-overlaps";
import { near } from "./fixtures";

const solid = (group: string, west: number, east: number, bottom: number, top: number, slopeX = 0): ScanSolid => ({
  group, polygon: rectanglePolygon({ west, east, north: 0, south: 1 }),
  bottom: { x: 0, z: 0, constant: bottom }, top: { x: slopeX, z: 0, constant: top },
});

void test("known overlap depth 0.1 m is found once with its extent", () => {
  const pairs = scanOverlaps([solid("a", 0, 1, 0, 1), solid("b", 0.5, 1.5, 0.9, 2)], 0.05);
  assert.equal(pairs.length, 1);
  near(pairs[0]!.maxDepth, 0.1, 1e-9);
  assert.ok(pairs[0]!.bounds.west >= 0.5 && pairs[0]!.bounds.east <= 1);
  assert.ok(lastScan.samples > 0);
});

void test("face contact and same-group overlap are not overlaps", () => {
  assert.deepEqual(scanOverlaps([solid("a", 0, 1, 0, 1), solid("b", 0, 1, 1, 2)], 0.05), []);
  assert.deepEqual(scanOverlaps([solid("a", 0, 1, 0, 1), solid("b", 1, 2, 0, 1)], 0.05), []);
  assert.deepEqual(scanOverlaps([solid("a", 0, 1, 0, 1), solid("a", 0.5, 1.5, 0.5, 2)], 0.05), []);
});

void test("overlap under a sloped top is measured at the deepest sample", () => {
  const pairs = scanOverlaps([solid("roof", 0, 2, 0.8, 1, 0.1), solid("wall", 0, 2, 0, 0.9)], 0.01);
  assert.equal(pairs.length, 1);
  near(pairs[0]!.maxDepth, 0.1, 1e-9);
});

void test("solidsContaining finds strict interiors only", () => {
  const solids = [solid("a", 0, 1, 0, 1)];
  assert.deepEqual(solidsContaining(solids, { x: 0.5, y: 0.5, z: 0.5 }), ["a"]);
  assert.deepEqual(solidsContaining(solids, { x: 1, y: 0.5, z: 0.5 }), []);
  assert.deepEqual(solidsContaining(solids, { x: 0.5, y: 1.2, z: 0.5 }), []);
});
