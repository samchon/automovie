import type {
  IAutoMovieSolidSurface,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { FamilyConicMpfbScalarAtlas } from "../../../reference-conics/FamilyConicMpfbScalarAtlas";
import { FamilyConicMpfbUpperTop } from "../../../reference-conics/FamilyConicMpfbUpperTop";

/**
 * A sloping generated top sheet preserves its exact height and jets on an
 * oblique parent chart. Supported boundary derivatives vanish through order
 * two.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the regular measured top fit and its world-chart pullback on a synthetic plane.
 * @evidence contracts/development/testing.md#independent-expectations The condition y = 5 + 2 x + 3 z and its ordinary linear derivatives give the expected pulled-back point and jets.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks the full chart, a half-window, the support boundary and the unmodified counterpart below its support.
 * @evidence contracts/development/testing.md#execution-ownership A small analytic fixture without source files, a tessellation or a person.
 */
export function test_human_upper_parent_chart(): void {
  const normal: Point = [
    -2 / Math.sqrt(14),
    1 / Math.sqrt(14),
    -3 / Math.sqrt(14),
  ];
  const height = (x: number, z: number): number => 5 + 2 * x + 3 * z;
  const chart = FamilyConicMpfbUpperTop.fit(
    (
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ] as const
    ).map(([x, z]) => ({
      point: [x, height(x, z), z],
      normal,
    })),
    (x) =>
      (z): number =>
        height(x, z),
    1,
  );
  const read = (x: number): IAutoMovieSolidSurface.IJet => ({
    p: [x, 7, 0.5],
    u: [1, 2, 0.25],
    v: [0.2, -1, 1],
    uu: [0, 0, 0],
    uv: [0, 0, 0],
    vv: [0, 0, 0],
  });
  const center = chart.lift(read(0.5));
  assert.equal(center.p[1], height(0.5, 0.5));
  assert.equal(center.u[1], 2.75);
  assert.ok(Math.abs(center.v[1] - 3.4) < 1e-13);
  assert.equal(center.uu[1], 0);
  assert.equal(center.uv[1], 0);
  assert.equal(center.vv[1], 0);

  const middle = chart.lift(read(-0.5));
  assert.ok(Math.abs(middle.p[1] - (7 + height(-0.5, 0.5)) / 2) < 1e-13);

  const outside = read(-1.25);
  assert.equal(chart.lift(outside), outside);
  assert.deepEqual(chart.lift(read(-1)), read(-1));

  // A bilinear observation isolates the mixed derivative through normalized
  // overlapping tiles. Neither the fitted tile nor its weights own the cross term.
  const atlas = FamilyConicMpfbScalarAtlas.prepare({
    domain: [
      [0, 0],
      [4, 4],
    ],
    pitch: 1,
    boundaries: [],
    observe: (x) => (z) => ({ component: 0, value: height(x, z) + 2 * x * z }),
  });
  const overlap = atlas.read(2.25)(1.5, 0)?.jet ?? null;
  assert.ok(overlap !== null && atlas.tiles > 1);
  assert.ok(Math.abs(overlap.p[1] - 20.75) < 1e-12);
  assert.ok(Math.abs(overlap.u[1] - 5) < 1e-12);
  assert.ok(Math.abs(overlap.v[1] - 7.5) < 1e-12);
  assert.ok(Math.abs(overlap.uu[1]) < 1e-12);
  assert.ok(Math.abs(overlap.uv[1] - 2) < 1e-12);
  assert.ok(Math.abs(overlap.vv[1]) < 1e-12);
  assert.equal(atlas.read(2.25)(1.5, 1), null);
}
