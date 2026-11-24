import type { IAutoMovieVector3 } from "@automovie/interface";
import { throwObjectCurve } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `throwObjectCurve` joins two held places with their velocities by a cubic
 * Hermite curve over a span.
 *
 * The object goes from the origin to (1, 0, 0) over 2 s at the constant
 * velocity 0.5 m/s that line needs.
 *
 * Scenarios:
 *
 * 1. The curve starts and ends on its places.
 * 2. With end velocities matching the chord, the cubic is the straight line at
 *    constant speed: halfway at the parameter one half.
 */
export function test_unit_motions_throwing_throw_object_curve(): void {
  const velocity: IAutoMovieVector3 = { x: 0.5, y: 0, z: 0 };
  const curve: (time: number) => IAutoMovieVector3 = throwObjectCurve(
    { x: 0, y: 0, z: 0 },
    velocity,
    { x: 1, y: 0, z: 0 },
    velocity,
    2,
  );
  TestValidator.predicate(
    "the curve's ends and middle",
    vclose(curve(0), { x: 0, y: 0, z: 0 }, 1e-12) &&
      vclose(curve(1), { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(curve(0.5), { x: 0.5, y: 0, z: 0 }, 1e-12),
  );
}
