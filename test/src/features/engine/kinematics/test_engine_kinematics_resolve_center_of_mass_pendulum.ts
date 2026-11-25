import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one product, metres. */
const ROUNDING: number = 1e-15;

/**
 * `resolveAutoMovieCenterOfMass.pendulum` is the inverted pendulum's length of
 * a body: the leg length, 1.34 times the trochanteric (hip) height (Hof,
 * Gazendam and Sinke 2005, J Biomech 38:1).
 *
 * Scenarios:
 *
 * 1. `PENDULUM` is Hof's factor, 1.34.
 * 2. A hip height of 0.9 m gives 1.206 m and one of 0.75 m gives 1.005 m.
 * 3. A hip height of 0 gives no length.
 */
export function test_engine_kinematics_resolve_center_of_mass_pendulum(): void {
  TestValidator.equals(
    "Hof's factor",
    resolveAutoMovieCenterOfMass.PENDULUM,
    1.34,
  );
  TestValidator.predicate(
    "1.34 hip heights",
    nclose(resolveAutoMovieCenterOfMass.pendulum(0.9), 1.206, ROUNDING) &&
      nclose(resolveAutoMovieCenterOfMass.pendulum(0.75), 1.005, ROUNDING),
  );
  TestValidator.predicate(
    "no hip height",
    resolveAutoMovieCenterOfMass.pendulum(0) === 0,
  );
}
