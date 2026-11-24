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
 * Polar point location admits only direction-corresponded sweeps.
 *
 * Scenarios:
 * 1. A finite point on an explicitly parameter-corresponded ellipse is refused.
 * 2. The same sweep with default or explicit direction correspondence recovers
 *    authored interior and endpoint parameters and zero surface offset.
 */
export function test_unit_engine_geometry_geometry_sweep_locate_correspondence(): void {
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
    "parameter correspondence cannot be inverted as polar direction",
    throwsError(
      (): unknown =>
        locateAutoMovieSweepPoint({
          surface: parameter,
          point: parameter.point(0.37, 0.13),
        }),
      "direction correspondence",
    ),
  );

  for (const explicit of [false, true]) {
    const surface: IAutoMovieSweepSurface = compileAutoMovieSweep({
      ...sweep,
      ...(explicit ? { correspondence: "direction" as const } : {}),
    });
    for (const u of [0, 0.37, 1])
      for (const v of [0.13, 0.61]) {
        const found: ReturnType<typeof locateAutoMovieSweepPoint> =
          locateAutoMovieSweepPoint({ surface, point: surface.point(u, v) });
        TestValidator.predicate(
          `${explicit ? "explicit" : "default"} direction at ${u}/${v}`,
          nclose(found.u, u, 1e-8) &&
            nclose(found.v, v, 1e-8) &&
            nclose(found.offset, 0, 1e-8),
        );
      }
  }
}
