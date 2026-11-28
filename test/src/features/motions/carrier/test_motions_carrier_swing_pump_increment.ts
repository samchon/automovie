import {
  HumanSwingPump
} from "../../../../../packages/motions/src/carrier/internal/HumanSwingPump";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Sixty-four binary64 rounding units cover the moment sum at 20 degrees. */
const ROUNDING: number = 64 * Number.EPSILON * 20;

/**
 * Check how the sweep moment and mean inertia change a swing.
 *
 * Scenarios:
 *
 * 1. With mass isolated in the trunk at the pivot, read the trunk's 20-degree
 *    turn.
 * 2. Displace the pivot and change the increment. Double all masses at the
 *    displaced pivot and keep that increment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios specify the isolated trunk and the separate pivot and mass controls.
 * @evidence contracts/development/testing.md#behavioral-verification Matched controls vary the pivot and the mass scale separately.
 * @evidence contracts/development/testing.md#independent-expectations The isolated case cancels its squared radius, and uniform mass scaling cancels the common factor of two in the ratio.
 */
export function test_motions_carrier_swing_pump_increment(): void {
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
