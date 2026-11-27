
import { AutoMovieEngineKinematics } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of one quotient and one square root, radians per second. */
const ROUNDING: number = 1e-15;

/** Standard gravity, m/s^2 (3rd CGPM, 1901). */
const STANDARD_GRAVITY: number = 9.80665;

/**
 * `AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassFrequency` is the inverted pendulum's
 * eigenfrequency `sqrt(g / l)` (Hof, Gazendam and Sinke 2005), with standard
 * gravity when none is given.
 *
 * Scenarios:
 *
 * 1. A length of standard gravity's metres under standard gravity is 1 rad/s, so a
 *    default other than 9.80665 m/s^2 fails.
 * 2. A quarter metre under 1 m/s^2 is 2 rad/s and four metres under 4 m/s^2 is 1
 *    rad/s, so a function of the ratio's inverse fails.
 * 3. A length of 0 or less and a gravity of 0 are refused.
 */
export function test_engine_kinematics_resolve_center_of_mass_frequency(): void {
  const frequency: typeof AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassFrequency =
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassFrequency;
  TestValidator.predicate(
    "standard gravity by default",
    nclose(frequency(STANDARD_GRAVITY), 1, ROUNDING),
  );
  TestValidator.predicate(
    "sqrt(g / l)",
    nclose(frequency(0.25, 1), 2, ROUNDING) &&
      nclose(frequency(4, 4), 1, ROUNDING),
  );
  for (const [label, task] of [
    ["a length of 0", () => frequency(0)],
    ["a negative length", () => frequency(-1)],
    ["a gravity of 0", () => frequency(1, 0)],
  ] as const)
    TestValidator.predicate(`${label} is refused`, throwsError(task));
}
