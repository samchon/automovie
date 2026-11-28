
import { AutoMovieEngineKinematics } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one product, metres. */
const ROUNDING: number = 1e-15;

/**
 * `AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum` is the inverted pendulum's length of
 * a body: the leg length, 1.34 times the trochanteric (hip) height (Hof,
 * Gazendam and Sinke 2005, J Biomech 38:1).
 *
 * Scenarios:
 *
 * 1. `PENDULUM` is Hof's factor, 1.34.
 * 2. A hip height of 0.9 m gives 1.206 m and one of 0.75 m gives 1.005 m.
 * 3. A hip height of 0 gives no length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the hip-height multiplier and the path where no positive pendulum length is available.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the exposed coefficient and calls resolveAutoMovieCenterOfMassPendulum at two positive heights and at zero.
 * @evidence contracts/development/testing.md#independent-expectations The cited 1.34 coefficient gives 1.206 and 1.005 metres by multiplication. Height zero supplies no valid calibrated length.
 */
export function test_engine_kinematics_resolve_center_of_mass_pendulum(): void {
  TestValidator.equals(
    "Hof's factor",
    AutoMovieEngineKinematics.AUTO_MOVIE_CENTER_OF_MASS_PENDULUM,
    1.34,
  );
  TestValidator.predicate(
    "1.34 hip heights",
    nclose(AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(0.9), 1.206, ROUNDING) &&
      nclose(AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(0.75), 1.005, ROUNDING),
  );
  TestValidator.predicate(
    "no hip height",
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(0) === 0,
  );
}
