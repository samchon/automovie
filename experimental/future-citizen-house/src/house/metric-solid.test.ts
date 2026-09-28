/** Pure geometric counterexamples: real through/blind holes, outward winding,
 * affine slopes, invalid depths, and the two halves of an inspection cover.
 * The production lint typechecks these exports; it does not execute tests. */
import assert from "node:assert/strict";
import { inspectAutoMovieMeshTopology } from "@automovie/engine";
import { rectangle } from "./assembly";
import { circle, heightRegion, pipeSector, tubeMesh } from "./metric-solid";

export function verifyMetricSolids(): void {
  const area = (radius: number, count: number) => count / 2 * radius ** 2 * Math.sin(2 * Math.PI / count);
  const outer = rectangle(-1, 1, -1, 1), holes = [circle(0, 0, 0.2)];
  const through = inspectAutoMovieMeshTopology(heightRegion(outer, () => 0, (_, z) => 1 - 0.01 * z, holes));
  assert.ok(through.watertight && !through.degenerate && !through.nonFinite);
  assert.ok(Math.abs(through.volume - (4 - area(0.2, 32))) < 1e-9);
  const blind = inspectAutoMovieMeshTopology(heightRegion(outer, () => 0, () => 1, holes, () => 0.8));
  assert.ok(blind.watertight);
  assert.ok(Math.abs(blind.volume - (4 - 0.2 * area(0.2, 32))) < 1e-9);
  assert.throws(() => heightRegion(outer, () => 1, () => 0), /nonpositive depth/);
  assert.throws(() => heightRegion(outer, () => 0, () => 1, holes, () => -0.1), /Blind bore floor/);
  assert.throws(() => heightRegion(outer, () => 0, () => 1, holes, () => 1), /Blind bore floor/);
  assert.throws(() => heightRegion(outer, () => 0, () => 1, [circle(2, 0, 0.2)]));
  const tube = inspectAutoMovieMeshTopology(tubeMesh(0, 0, -0.3, 6.1, 0.055, 0.05));
  assert.ok(tube.watertight);
  assert.ok(Math.abs(tube.volume - 6.4 * (area(0.055, 32) - area(0.05, 32))) < 1e-9);
  for (const span of [[Math.PI - 0.8, Math.PI + 0.8], [Math.PI + 0.8, 3 * Math.PI - 0.8]]) {
    const cover = inspectAutoMovieMeshTopology(pipeSector(0, 0, 0.1, 0.3, span[0], span[1]));
    assert.ok(cover.watertight && cover.volume > 0);
  }
}
