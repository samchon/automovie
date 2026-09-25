import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { identityTransform, surfaceModel } from "../../geometry/model-parts";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { levelPlane, prismFaces } from "../../geometry/prism";
import { levelCell } from "../../geometry/spatial-cells";
import { wallFaces, type WallSpec } from "../../geometry/wall-solids";
import { addressCoverageCensus, pointInOutline, rayTriangle } from "../address-coverage";
import { exposedAddressExceptionFor, exposedAddressExceptions } from "../address-exceptions";
import { ownFacadeFailures, type OwnFacadeRow } from "../own-facade-view";

const wall: WallSpec = {
  id: "wall.fixture", owner: "fixture", axis: "x", bottom: 0,
  plan: rectanglePolygon({ west: 0, east: 1, north: 0, south: 0.2 }),
  segments: [{ from: 0, to: 1, low: "surface.inner", high: "surface.outer",
    top: { kind: "flat", height: 1, surface: "surface.top" } }],
  voids: [],
};
const fixture = (addressed: boolean): IAutoMovieBuiltEnvironment => {
  const model = surfaceModel("model.wall.fixture", "fixture", wallFaces(wall, []));
  return {
    models: [model], elements: [{ id: "element.wall.fixture", model: model.id,
      transform: identityTransform(), parent: null, space: "site" }],
    spaces: [{ id: "temple-site", kind: "site", parent: null, fidelity: "exact",
      cells: [levelCell("site", { west: -1, east: 2, north: -1, south: 2 }, -1, 2)] }],
    boundaries: addressed ? [{ id: "address", kind: "exterior-wall", spaces: ["temple-site"],
      elements: ["element.wall.fixture"], face: { origin: { x: 0.5, y: 0, z: 0.1 },
        rotation: { x: 0, y: 0, z: 0, w: 1 }, thickness: 0.2,
        outline: [{ x: -0.5, y: 0 }, { x: 0.5, y: 0 }, { x: 0.5, y: 1 }, { x: -0.5, y: 1 }] } }] : [],
  } as unknown as IAutoMovieBuiltEnvironment;
};
const solids = [{ group: wall.id, polygon: wall.plan,
  bottom: { x: 0, z: 0, constant: 0 }, top: { x: 0, z: 0, constant: 1 } }];

void test("address polygon includes convex interior and excludes exterior", () => {
  const square = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }];
  assert.equal(pointInOutline(square, 1, 1), true);
  assert.equal(pointInOutline(square, 2.01, 1), false);
});

void test("concave address excludes its notch and thin address remains measurable", () => {
  const concave = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 2 }, { x: 0, y: 2 }];
  assert.equal(pointInOutline(concave, 0.25, 1.5), true);
  assert.equal(pointInOutline(concave, 1.5, 1.5), false);
  const thin = [{ x: 0, y: 0 }, { x: 0.001, y: 0 }, { x: 0.001, y: 1 }, { x: 0, y: 1 }];
  assert.equal(pointInOutline(thin, 0.0005, 0.5), true);
  assert.equal(pointInOutline(thin, 0.0015, 0.5), false);
});

void test("ray reaches a two-sided emitted face, and an open edge has no hit", () => {
  const triangle = { a: { x: 0, y: 0, z: 0 }, b: { x: 1, y: 0, z: 0 }, c: { x: 0, y: 1, z: 0 } };
  assert.equal(rayTriangle({ x: 0.25, y: 0.25, z: 1 }, { x: 0, y: 0, z: -1 }, triangle), 1);
  assert.equal(rayTriangle({ x: 0.25, y: 0.25, z: -1 }, { x: 0, y: 0, z: 1 }, triangle), 1);
  assert.equal(rayTriangle({ x: 0.8, y: 0.8, z: 1 }, { x: 0, y: 0, z: -1 }, triangle), null);
  assert.equal(rayTriangle({ x: 0.25, y: 0.25, z: 1 }, { x: 1, y: 0, z: 0 }, triangle), null);
});

void test("emitted exposed wall loses its address when the boundary is removed", () => {
  const addressed = addressCoverageCensus(fixture(true), [wall], solids);
  const removed = addressCoverageCensus(fixture(false), [wall], solids);
  assert.ok(addressed.emitted > 0);
  assert.ok(addressed.covered > 0);
  assert.ok(removed.covered < addressed.covered);
  assert.ok(removed.unexpected > addressed.unexpected);
});

void test("a wall below a projecting roof remains exterior when its vertical sky ray is blocked", () => {
  const bare = fixture(false);
  const eave = surfaceModel("model.roof.fixture", "eave", prismFaces(
    rectanglePolygon({ west: -0.2, east: 1.2, north: -0.5, south: 0.7 }),
    levelPlane(1.05), levelPlane(1.10)).map((face) => ({ ...face, surface: "surface.roof.fixture" })));
  const environment = { ...bare,
    models: [...bare.models, eave],
    elements: [...bare.elements, { id: "element.roof.fixture", model: eave.id,
      transform: identityTransform(), parent: null, space: "temple-site" }],
    spaces: [{ ...bare.spaces[0]!, cells: [levelCell("site", { west: -1, east: 2, north: -1, south: 2 }, -1, 0.25)] }],
  } as IAutoMovieBuiltEnvironment;
  const result = addressCoverageCensus(environment, [wall], solids);
  assert.ok(result.uncovered > 0);
  assert.equal(result.skyOpen, 0);
  assert.ok(result.exposed > 0);
  assert.ok(result.unexpected > 0);
});

void test("the open porch pediment inner surface still requires its own address", () => {
  const porchWall = { ...wall, segments: [{ ...wall.segments[0]!, low: "surface.entrance.pediment-back" }] };
  const model = surfaceModel("model.wall.fixture", "fixture", wallFaces(porchWall, []));
  const base = fixture(false);
  const environment = { ...base, models: [model],
    spaces: [{ ...base.spaces[0]!, id: "entrance" }] } as IAutoMovieBuiltEnvironment;
  const census = addressCoverageCensus(environment, [porchWall], solids);
  assert.ok(census.unexpected > 0);
});

void test("junction exceptions are restricted to their named wall, face, interval and height", () => {
  assert.equal(exposedAddressExceptions.length, 19);
  for (const entry of exposedAddressExceptions) {
    const middle = (entry.from + entry.to) / 2;
    const sample = { x: entry.axis === "x" ? middle : 0, y: Math.max(4, entry.minY ?? 0),
      z: entry.axis === "z" ? middle : 0 };
    assert.ok(exposedAddressExceptionFor(entry.wall, entry.face, sample));
    assert.equal(exposedAddressExceptionFor(`${entry.wall}.absent`, entry.face, sample), undefined);
    const outside = { ...sample, [entry.axis]: entry.to + 0.02 };
    assert.equal(exposedAddressExceptionFor(entry.wall, entry.face, outside), undefined);
    if (entry.minY !== undefined) {
      assert.equal(exposedAddressExceptionFor(entry.wall, entry.face, { ...sample, y: entry.minY - 0.01 }), undefined);
    }
    if (entry.lowerEdge !== undefined) {
      const z = entry.lowerEdge.atZ;
      assert.equal(exposedAddressExceptionFor(entry.wall, entry.face, { ...sample, z, y: entry.lowerEdge.atY - 0.01 }), undefined);
      assert.ok(exposedAddressExceptionFor(entry.wall, entry.face, { ...sample, z, y: entry.lowerEdge.atY + 0.1 }));
    }
  }
});

void test("southeast exception excludes the addressable lower edge of the facade", () => {
  assert.equal(exposedAddressExceptionFor("wall.facade-east", 1, { x: 10.5, y: 3.55, z: 9.7 }), undefined);
  assert.ok(exposedAddressExceptionFor("wall.facade-east", 1, { x: 10.5, y: 3.65, z: 9.7 }));
  assert.equal(exposedAddressExceptionFor("wall.facade-east", 1, { x: 10.5, y: 3.95, z: 9.8 }), undefined);
  assert.ok(exposedAddressExceptionFor("wall.facade-east", 1, { x: 10.5, y: 4.05, z: 9.8 }));
});

void test("a camera with no visible own side fails even when the opposite side is visible", () => {
  const row: OwnFacadeRow = { id: "fixture", sides: [
    { sign: 1, addressSide: true, sampled: 10, visible: 0, ratio: 0 },
    { sign: -1, addressSide: false, sampled: 10, visible: 10, ratio: 1 },
  ] };
  assert.deepEqual(ownFacadeFailures([row]), ["fixture"]);
  assert.deepEqual(ownFacadeFailures([{ ...row, sides: [{ ...row.sides[0]!, visible: 5, ratio: 0.5 }] }]), []);
});
