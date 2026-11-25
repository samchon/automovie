import { HumanSwingPump } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Sixty-four binary64 rounding units cover the moment sum at 20 degrees. */
const ROUNDING: number = 64 * Number.EPSILON * 20;

/**
 * A swing's turn is the angle given by its swept moment and mean inertia.
 *
 * Scenarios:
 *
 * 1. In the isolated-trunk limit at the pivot the radius-squared terms cancel,
 *    yielding the trunk's 20 degree turn.
 * 2. Moving the pivot away changes the increment. Multiplying all masses by two
 *    preserves the increment at that same pivot.
 */
export function test_unit_motions_carrier_swing_pump_increment(): void {
  const body: HumanSwingPump.IIncrementBody = {
    profile: { mass: 70 },
    measure: { shoulderHeight: 1.5, hipHeight: 1, thigh: 0, shank: 0 },
  };
  const isolated: number = HumanSwingPump.increment(body, 0, 20);
  const hanging: number = HumanSwingPump.increment(body, 2, 20);
  TestValidator.predicate(
    "the pivot and mass-scale limits",
    nclose(isolated, 20, ROUNDING) &&
      hanging > 0 &&
      hanging < isolated &&
      nclose(
        HumanSwingPump.increment({ ...body, profile: { mass: 140 } }, 2, 20),
        hanging,
        ROUNDING,
      ),
  );
}
