import { HumanMinimumJerkSpline } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of the block-tridiagonal elimination, coordinate units. */
const ROUNDING: number = 1e-9;

/**
 * `HumanMinimumJerkSpline` places via points on the minimum-jerk path through
 * them, at rest at both ends (Flash and Hogan 1985).
 *
 * A via point that lies on the rest-to-rest path of the whole movement adds no
 * constraint, so the spline is that one quintic: from 0 to 2 over 2 s, the
 * middle point at 1 s has the quintic's velocity `15/8 · Δ / T` = 1.875 and, by
 * the path's odd symmetry about its middle, no acceleration.
 *
 * Scenarios:
 *
 * 1. Two points: both ends at rest.
 * 2. Three points on the whole movement's path: the middle's velocity 1.875 and
 *    acceleration 0, the ends at rest.
 * 3. `quintic` at the middle of a rest-to-rest interval from 0 to 1 is ½.
 */
export function test_unit_motions_posture_minimum_jerk_spline(): void {
  // 1. No interior point.
  const two: HumanMinimumJerkSpline.IDerivatives =
    HumanMinimumJerkSpline.derivatives([0, 1], [[0], [1]]);
  TestValidator.predicate(
    "two points are at rest",
    [...two.velocities, ...two.accelerations].every(
      (v: number[]): boolean => v[0] === 0,
    ),
  );

  // 2. A point on the whole movement's path.
  const three: HumanMinimumJerkSpline.IDerivatives =
    HumanMinimumJerkSpline.derivatives([0, 1, 2], [[0], [1], [2]]);
  TestValidator.predicate(
    "the middle point moves at the whole quintic's peak",
    nclose(three.velocities[1]![0]!, 1.875, ROUNDING) &&
      nclose(three.accelerations[1]![0]!, 0, ROUNDING) &&
      three.velocities[0]![0] === 0 &&
      three.velocities[2]![0] === 0,
  );

  // 3. The interval's Hermite quintic.
  TestValidator.predicate(
    "the rest-to-rest middle is half way",
    nclose(
      HumanMinimumJerkSpline.quintic([0], [1], [0], [0], [0], [0], 2, 0.5)[0]!,
      0.5,
      ROUNDING,
    ),
  );
}
