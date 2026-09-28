/**
 * src/geometry/roof-solids.ts와 roof-planes.ts: 지붕 slab·널판 천장·높이 차이 막음·박공/외쪽 평면.
 * fixture: 경사 상면의 볼록 사각 slab(하부 영역 없음/절반 영역), 삼각 slab(박공 반쪽), 얇은 slab,
 * 맞닿은 두 조각의 높이 차이 막음(있음/같은 높이/같은 방향 변), 널판 천장, 박공 용마루 위치와
 * 지지선 높이, 외쪽 지붕 평면, 수직 두께, 결정성. slab은 T 접합 해소 뒤 닫힌 실체다.
 * 높이 차이 막음은 한 장의 면이며 닫힌 실체가 아니다(mesh-ledger 시험의 막음 형태와 같다).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { rectanglePolygon, type RoofPatch } from "../../geometry/planar-domain";
import { gablePlanes, leanToPlanes, roofVerticalThickness, type RoofRules } from "../../geometry/roof-planes";
import { ceilingBoardFaces, roofSlabFaces, roofStepClosures } from "../../geometry/roof-solids";
import { accountFaces, assertClosed, faceArea, near, planArea } from "./fixtures";

const patch = (overrides: Partial<RoofPatch> = {}): RoofPatch => ({
  id: "p", owner: "roof-test", surface: "surface.roof-test.upper", tier: "wing",
  polygon: rectanglePolygon({ west: 0, east: 4, north: 0, south: 3 }),
  height: { x: 0.2, z: 0, constant: 3 }, thickness: 0.2, ...overrides,
});

void test("sloped slab without underside regions: closed, volume = plan area × vertical thickness", () => {
  const faces = roofSlabFaces([patch()], []);
  assert.deepEqual([...new Set(faces.map((f) => f.surface))].sort((a, b) => a.localeCompare(b)),
    ["surface.roof-test.edge", "surface.roof-test.soffit", "surface.roof-test.upper"]);
  assertClosed(accountFaces("slab", faces), 12 * 0.2);
});

void test("underside split by a region: same solid, two underside surfaces, T-junctions resolved", () => {
  const faces = roofSlabFaces([patch()], [{ polygon: rectanglePolygon({ west: 0, east: 2, north: -1, south: 4 }), surface: (o) => `surface.${o}.bearing` }]);
  const account = accountFaces("split", faces);
  assert.ok(account.tJunctionVertices > 0);
  assertClosed(account, 12 * 0.2);
  near(faces.filter((f) => f.surface.endsWith(".bearing")).reduce((s, f) => s + planArea(f.corners.map((c) => ({ x: c.x, z: c.z }))), 0), 6,
    1e-9, "bearing underside plan area; positive XZ area is a downward normal in the y-up frame");
});

void test("triangular (gable half) and thin (1 mm) slabs stay closed", () => {
  assertClosed(accountFaces("tri", roofSlabFaces([patch({ polygon: [{ x: 0, z: 0 }, { x: 4, z: 0 }, { x: 0, z: 3 }] })], [])), 6 * 0.2);
  assertClosed(accountFaces("thin", roofSlabFaces([patch({ thickness: 0.001 })], [])), 12 * 0.001);
});

void test("height-step closure between two touching patches; none for equal heights or same-direction edges", () => {
  const low = patch({ id: "low", owner: "low", polygon: rectanglePolygon({ west: 0, east: 2, north: 0, south: 2 }), height: { x: 0, z: 0, constant: 3 } });
  const high = patch({ id: "high", owner: "high", polygon: rectanglePolygon({ west: 2, east: 4, north: 0, south: 2 }), height: { x: 0, z: 0, constant: 3.5 } });
  const closures = roofStepClosures([low, high]);
  assert.equal(closures.length, 1);
  assert.equal(closures[0]!.surface, "surface.high.edge");
  near(faceArea(closures[0]!.corners), 2 * (3.5 - 0.2 - 3));
  assert.deepEqual(roofStepClosures([low, patch({ ...high, height: { x: 0, z: 0, constant: 3 } })]), []);
  assert.deepEqual(roofStepClosures([low, patch({ ...high, tier: "porch" })]), [], "different composition tiers do not close each other");
});

void test("ceiling board: closed, bottom face is the room ceiling", () => {
  const faces = ceilingBoardFaces("room", rectanglePolygon({ west: 0, east: 3, north: 0, south: 2 }), 3.1, 0.05);
  assert.equal(faces.filter((f) => f.surface === "surface.room.ceiling").length, 1);
  assertClosed(accountFaces("ceiling", faces), 6 * 0.05);
});

void test("gable planes: equal supports put the ridge at the midpoint; unequal supports shift it", () => {
  const slope = Math.atan(0.4);
  const planes = gablePlanes({ owner: "g", id: "g", tier: "sanctuary", pieces: [rectanglePolygon({ west: -3, east: 3, north: 0, south: 5 })],
    axis: "x", supportLow: -3, supportHigh: 3, height: 5, slope, thickness: 0.2 });
  assert.equal(planes.length, 2);
  const at = (p: RoofPatch, x: number) => p.height.x * x + p.height.z * 0 + p.height.constant;
  near(at(planes[0]!, -3), 5);
  near(at(planes[1]!, 3), 5);
  near(at(planes[0]!, 0), at(planes[1]!, 0));
  near(at(planes[0]!, 0), 5 + 3 * 0.4);
  near(planArea(planes[0]!.polygon) + planArea(planes[1]!.polygon), 30);
  const shifted = gablePlanes({ owner: "g", id: "g", tier: "wing", pieces: [rectanglePolygon({ west: 0, east: 6, north: 0, south: 1 })],
    axis: "x", supportLow: 0, supportHigh: 6, height: 3, highHeight: 3.4, slope, thickness: 0.2 });
  near(at(shifted[0]!, 3.5), at(shifted[1]!, 3.5), 1e-9, "ridge at (0.4 + 6·0.4)/(2·0.4) = 3.5");
});

void test("lean-to plane and vertical thickness", () => {
  const slope = Math.atan(0.25);
  const [p] = leanToPlanes({ owner: "l", id: "l", tier: "wing", pieces: [rectanglePolygon({ west: 0, east: 4, north: 0, south: 1 })],
    axis: "x", lowLine: 1, rising: -1, height: 3.2, slope, thickness: 0.2 });
  near(p!.height.x * 1 + p!.height.constant, 3.2);
  near(p!.height.x * 0 + p!.height.constant, 3.45);
  const rules = { normalThickness: 0.18 } as RoofRules;
  near(roofVerticalThickness(rules, Math.PI / 3), 0.36);
});

void test("deterministic and input-preserving", () => {
  const p = patch();
  const before = JSON.stringify(p);
  assert.deepEqual(roofSlabFaces([p], []), roofSlabFaces([p], []));
  assert.equal(JSON.stringify(p), before);
});
