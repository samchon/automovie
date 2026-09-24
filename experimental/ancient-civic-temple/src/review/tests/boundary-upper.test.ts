import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { levelCell } from "../../geometry/spatial-cells";
import { boundaryUpperCensus, localUpperBand } from "../boundary-upper";

const fixture = (low: number, high: number, split: boolean): IAutoMovieBuiltEnvironment => {
  const face = (bottom: number, top: number) => ({
    origin: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, thickness: 0.2,
    outline: [{ x: -1, y: bottom }, { x: 1, y: bottom }, { x: 1, y: top }, { x: -1, y: top }],
  });
  const spaces = [
    { id: "low", kind: "room", parent: "floor", fidelity: "exact", cells: [levelCell("low", { west: -1, east: 1, north: -2, south: -0.1 }, 0, low)] },
    { id: "high", kind: "room", parent: "floor", fidelity: "exact", cells: [levelCell("high", { west: -1, east: 1, north: 0.1, south: 2 }, 0, high)] },
  ];
  const boundaries = split ? [
    { id: "pair", kind: "interior-wall", spaces: ["low", "high"], elements: [], face: face(0, low) },
    { id: "upper", kind: "exterior-wall", spaces: ["high"], elements: [], face: face(low, high) },
  ] : [{ id: "pair", kind: "interior-wall", spaces: ["low", "high"], elements: [], face: face(0, high) }];
  return { spaces, boundaries } as unknown as IAutoMovieBuiltEnvironment;
};

void test("unsplit exposed band is found across the full host and disappears after partition", () => {
  const unsplit = boundaryUpperCensus(fixture(2, 4, false), []);
  assert.equal(unsplit.length, 1);
  assert.equal(unsplit[0]!.sampled, 200);
  assert.equal(unsplit[0]!.tested, 200);
  assert.equal(unsplit[0]!.exposed, 200);
  assert.ok(Math.abs(unsplit[0]!.maxBand - 2) < 1e-9);
  const split = boundaryUpperCensus(fixture(2, 4, true), []);
  assert.equal(split.length, 2);
  assert.equal(split[0]!.exposed, 0);
  assert.equal(split[1]!.sampled, 0);
  assert.equal(split[1]!.tested, 0);
});

void test("equal room caps do not create a false upper exterior band", () => {
  assert.equal(boundaryUpperCensus(fixture(3, 3, false), [])[0]!.exposed, 0);
  assert.equal(boundaryUpperCensus(fixture(2, 2.019, false), [])[0]!.exposed, 0);
  assert.equal(boundaryUpperCensus(fixture(2, 2.021, false), [])[0]!.exposed, 200);
});

void test("local roof trough remains visible even when another station reaches the taller roof", () => {
  const porch = { physical: 3.838, volume: 3.838 };
  assert.ok(Math.abs(localUpperBand(4.69, porch, { physical: 3.683, volume: 3.838 }) - 0.155) < 1e-9);
  assert.equal(localUpperBand(4.69, porch, { physical: 3.9, volume: 3.838 }), 0);
  assert.equal(localUpperBand(3.5, porch, { physical: 3.683, volume: 3.838 }), 0);
});
