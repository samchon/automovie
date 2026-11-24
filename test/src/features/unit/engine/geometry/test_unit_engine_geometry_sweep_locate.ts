import {
  compileAutoMovieSweep,
  locateAutoMovieSweepPoint,
} from "@automovie/engine";
import type {
  IAutoMovieSweep,
  IAutoMovieSweepSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

/**
 * `locateAutoMovieSweepPoint` inverts a swept surface point to its parameters
 * and offset, and admits only direction-corresponded sweeps.
 *
 * Sweep: a spine from (0,0,0) to (0,2,0) with the normal +Z and two stations of
 * the ellipse of half-widths 2 and 1 (exponents 2).
 *
 * Scenarios:
 *
 * 1. With `correspondence: "parameter"`, a surface point is refused: it cannot be
 *    inverted as a polar direction.
 * 2. With the default direction correspondence, and with it stated, the points at
 *    u in 0, 0.37, 1 and v in 0.13, 0.61 locate back to those u and v within
 *    1e-8 and offset 0.
 */
export function test_unit_engine_geometry_sweep_locate(): void {
  const sweep: IAutoMovieSweep = {
    spine: {
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 2, z: 0 },
      ],
      normal: { x: 0, y: 0, z: 1 },
    },
    stations: [0, 1].map(
      (at: number): IAutoMovieSweep.IStation => ({
        at,
        section: {
          type: "superellipse",
          right: 2,
          up: 1,
          left: 2,
          down: 1,
          exponents: [2, 2, 2, 2],
        },
      }),
    ),
  };
  const parameter: IAutoMovieSweepSurface = compileAutoMovieSweep({
    ...sweep,
    correspondence: "parameter",
  });
  TestValidator.predicate(
    "parameter correspondence",
    throwsError(
      () =>
        locateAutoMovieSweepPoint({
          surface: parameter,
          point: parameter.point(0.37, 0.13),
        }),
      ["direction correspondence"],
    ),
  );
  const direction: IAutoMovieSweep = { ...sweep, correspondence: "direction" };
  for (const input of [sweep, direction]) {
    const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(input);
    for (const u of [0, 0.37, 1])
      for (const v of [0.13, 0.61]) {
        const found = locateAutoMovieSweepPoint({
          surface,
          point: surface.point(u, v),
        });
        TestValidator.predicate(`u ${u}/${v}`, nclose(found.u, u, 1e-8));
        TestValidator.predicate(`v ${u}/${v}`, nclose(found.v, v, 1e-8));
        TestValidator.predicate(
          `offset ${u}/${v}`,
          nclose(found.offset, 0, 1e-8),
        );
      }
  }
}
