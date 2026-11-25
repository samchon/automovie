import { AutoMoviePhysicalTracking } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * Allow 16 rounded operations at magnitudes up to 16 N in the rational and
 * length calculations.
 */
const FORCE_ROUNDING: number = 16 * 16 * Number.EPSILON;

/**
 * The implicit root force balances spring error against next-step damping and
 * caps the norm of the result in newtons.
 *
 * Scenarios:
 *
 * 1. Mass 2 kg, stiffness 8, damping 4 and dt 1/4 s give the damping coefficient 6
 *    and denominator 7/4. Error (1, -1/2, 0) and velocity (3/4, -1/4, 1/2) give
 *    force (2, -10/7, -12/7) N. Doubling the inputs doubles each component
 *    while the cap remains inactive.
 * 2. With zero velocity and dt = 0 the force is the spring term. A (3, 4, 0) N
 *    demand limited to 2 N retains direction (3/5, 4/5, 0).
 * 3. A zero cap or zero error and velocity yield zero force.
 */
export function test_engine_physics_root_tracking_force(): void {
  const error: IAutoMovieVector3 = { x: 1, y: -0.5, z: 0 };
  const velocity: IAutoMovieVector3 = { x: 0.75, y: -0.25, z: 0.5 };
  const rest: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  TestValidator.predicate(
    "implicit spring and damping terms oppose velocity and scale linearly within the cap",
    vclose(
      AutoMoviePhysicalTracking.force(error, velocity, 2, 8, 4, 12, 0.25),
      { x: 2, y: -10 / 7, z: -12 / 7 },
      FORCE_ROUNDING,
    ) &&
      vclose(
        AutoMoviePhysicalTracking.force(
          { x: 2, y: -1, z: 0 },
          { x: 1.5, y: -0.5, z: 1 },
          2,
          8,
          4,
          12,
          0.25,
        ),
        { x: 4, y: -20 / 7, z: -24 / 7 },
        FORCE_ROUNDING,
      ),
  );
  TestValidator.predicate(
    "the cap rescales the whole force rather than limiting its components individually",
    vclose(
      AutoMoviePhysicalTracking.force(
        { x: 3 / 8, y: 1 / 2, z: 0 },
        rest,
        2,
        8,
        4,
        2,
        0,
      ),
      { x: 6 / 5, y: 8 / 5, z: 0 },
      FORCE_ROUNDING,
    ),
  );
  TestValidator.predicate(
    "zero cap and zero demand each produce zero force",
    vclose(
      AutoMoviePhysicalTracking.force(error, velocity, 2, 8, 4, 0, 0.25),
      rest,
      FORCE_ROUNDING,
    ) &&
      vclose(
        AutoMoviePhysicalTracking.force(rest, rest, 2, 8, 4, 12, 0.25),
        rest,
        FORCE_ROUNDING,
      ),
  );
}
