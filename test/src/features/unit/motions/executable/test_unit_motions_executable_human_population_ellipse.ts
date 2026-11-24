import { HumanPopulationAccess } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `HumanPopulationAccess.ellipse` is Ramanujan's first approximation of an
 * ellipse's perimeter, `pi (3 (a + b) / 2 - sqrt((3a + b)(a + 3b) / 4))`.
 *
 * Scenarios:
 *
 * 1. A circle of radius 10 mm has perimeter `20 pi` exactly.
 * 2. The 10 by 5 mm ellipse's perimeter is `40 E(sqrt(3) / 2)` = 48.4422411 mm
 *    (the complete elliptic integral of the second kind); the approximation's
 *    error at this eccentricity is far below a micrometre.
 * 3. The perimeter is symmetric in its semi-axes.
 */
export function test_unit_motions_executable_human_population_ellipse(): void {
  TestValidator.predicate(
    "a circle and an ellipse",
    nclose(HumanPopulationAccess.ellipse(10, 10), 20 * Math.PI, 1e-12) &&
      nclose(HumanPopulationAccess.ellipse(10, 5), 48.4422411, 1e-6) &&
      nclose(
        HumanPopulationAccess.ellipse(5, 10),
        HumanPopulationAccess.ellipse(10, 5),
        1e-12,
      ),
  );
}
