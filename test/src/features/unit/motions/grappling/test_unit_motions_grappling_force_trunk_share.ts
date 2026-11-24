import { HumanForceTrunk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** How near a share comes to its closed form: rounding only. */
const EXACT: number = 1e-12;

/**
 * `HumanForceTrunk.share` is the share of a trunk's side-bending range at which
 * its through-range stiffness holds a torque: by quarter of a range `R` the
 * stiffness is 0.32, 0.83, 2.03 and 5.03 N m per degree (Watt, Callaway and
 * Williams 2022, Table 6), so the moment held up to quarter `q` is `R / 4` times
 * the sum of the stiffnesses before it.
 *
 * Over a 40 degree range each quarter is 10 degrees: the quarters hold 3.2,
 * 8.3, 20.3 and 50.3 N m.
 *
 * Scenarios:
 *
 * 1. 1.6 N m, half the first quarter's, bends an eighth of the range.
 * 2. 3.2 + 4.15 N m bends through the first quarter and half the second: 3/8.
 * 3. A torque past the 82.1 N m the range holds bends it all.
 * 4. No torque, or no range, bends nothing.
 */
export function test_unit_motions_grappling_force_trunk_share(): void {
  TestValidator.predicate(
    "the piecewise-linear stiffness",
    nclose(HumanForceTrunk.share(1.6, 40), 1 / 8, EXACT) &&
      nclose(HumanForceTrunk.share(3.2 + 4.15, 40), 3 / 8, EXACT) &&
      HumanForceTrunk.share(100, 40) === 1 &&
      HumanForceTrunk.share(0, 40) === 0 &&
      HumanForceTrunk.share(10, 0) === 0,
  );
}
