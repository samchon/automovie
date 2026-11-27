
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Rounding of one quotient and one sum per component, metres. */
const ROUNDING: number = 1e-12;

/** Standard gravity, m/s^2 (3rd CGPM, 1901). */
const STANDARD_GRAVITY: number = 9.80665;

/**
 * `AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassExtrapolate` is Hof's extrapolated centre of
 * mass, `x + v / w0` with `w0 = sqrt(g / l)` (Hof, Gazendam and Sinke 2005, J
 * Biomech 38:1).
 *
 * Scenarios:
 *
 * 1. Under 4 m/s^2 a 1 m pendulum has `w0 = 2`, so a centre (1, 2, 3) moving (0.5,
 *    0, -1) m/s extrapolates to (1.25, 2, 2.5).
 * 2. With the default gravity a pendulum of standard gravity's metres has `w0 =
 *    1`, so the extrapolation adds the velocity itself.
 * 3. A centre at rest extrapolates to itself.
 * 4. Neither input is changed.
 * 5. A length of 0 is refused.
 */
export function test_engine_kinematics_resolve_center_of_mass_extrapolate(): void {
  const centre: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const velocity: IAutoMovieVector3 = { x: 0.5, y: 0, z: -1 };
  TestValidator.predicate(
    "x + v / w0",
    vclose(
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassExtrapolate(centre, velocity, 1, 4),
      { x: 1.25, y: 2, z: 2.5 },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "standard gravity by default",
    vclose(
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassExtrapolate(
        centre,
        velocity,
        STANDARD_GRAVITY,
      ),
      { x: 1.5, y: 2, z: 2 },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "a centre at rest",
    vclose(
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassExtrapolate(
        centre,
        { x: 0, y: 0, z: 0 },
        1.2,
      ),
      centre,
      0,
    ),
  );
  TestValidator.predicate(
    "the inputs are unchanged",
    vclose(centre, { x: 1, y: 2, z: 3 }, 0) &&
      vclose(velocity, { x: 0.5, y: 0, z: -1 }, 0),
  );
  TestValidator.predicate(
    "a length of 0 is refused",
    throwsError(() =>
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassExtrapolate(centre, velocity, 0),
    ),
  );
}
