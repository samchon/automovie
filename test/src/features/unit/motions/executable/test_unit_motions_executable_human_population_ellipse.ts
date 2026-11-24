import { HumanPopulationAccess } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * How far Ramanujan's first approximation may fall from the exact perimeter of
 * a 2:1 ellipse, mm: its error there is about 3 parts in a million.
 */
const RAMANUJAN: number = 2e-4;

/**
 * `HumanPopulationAccess.ellipse` is Ramanujan's first approximation of an
 * ellipse's perimeter, `pi (3 (a + b) - sqrt((3a + b)(a + 3b)))`.
 *
 * Scenarios:
 *
 * 1. A circle of radius 10 mm has perimeter `20 pi` exactly.
 * 2. The 10 by 5 mm ellipse's perimeter is `40 E(sqrt(3) / 2)` = 48.4422411 mm
 *    (the complete elliptic integral of the second kind); the approximation
 *    falls short of it by about 0.14 um at this eccentricity.
 * 3. The perimeter is symmetric in its semi-axes.
 */
export function test_unit_motions_executable_human_population_ellipse(): void {
  TestValidator.predicate(
    "a circle and an ellipse",
    nclose(HumanPopulationAccess.ellipse(10, 10), 20 * Math.PI, 1e-12) &&
      nclose(HumanPopulationAccess.ellipse(10, 5), 48.4422411, RAMANUJAN) &&
      nclose(
        HumanPopulationAccess.ellipse(5, 10),
        HumanPopulationAccess.ellipse(10, 5),
        1e-12,
      ),
  );
}
