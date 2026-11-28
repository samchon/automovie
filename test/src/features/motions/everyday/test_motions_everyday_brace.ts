import {
  palmSagitta
} from "../../../../../packages/motions/src/everyday/internal/palmSagitta";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one square and quotient, metres. */
const ROUNDING: number = 1e-15;

/** A hand's length, metres. */
const HAND: number = 0.19;

/** A thigh's radius, metres: 0.08 m. */
const THIGH: number = 0.08;

/**
 * `palmSagitta` lifts a flat palm along a thigh by the sagitta of half its
 * breadth on the thigh's radius, `h^2 / (2 r)`, the breadth `PALM_BREADTH`
 * (0.45) of the hand's length.
 *
 * Scenarios, for a 0.19 m hand on a thigh of 0.08 m radius:
 *
 * 1. The lift is `(0.45 * 0.19 / 2)^2 / (2 * 0.08) = 0.011422 m`.
 * 2. The palm's half breadth lies within the thigh's radius, so the lift is under
 *    half of it: h < r gives h^2 / (2 r) < h / 2.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A braced palm is raised from the thigh tangent by its breadth and surface radius.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the palm-placement geometry on a prepared stock body and thigh radius.
 * @evidence contracts/development/testing.md#independent-expectations Checks the sagitta approximation using half the palm breadth, the independently read hand length, and the thigh radius.
 */
export async function test_motions_everyday_brace(): Promise<void> {
  const lift: number = palmSagitta({
    measure: { hand: HAND, thighRadius: THIGH },
  });
  const half: number = (0.45 * HAND) / 2;
  TestValidator.predicate(
    "the sagitta of half the palm",
    nclose(lift, (half * half) / (2 * THIGH), ROUNDING),
  );
  TestValidator.predicate(
    `under half the half breadth (${lift} m)`,
    half < THIGH && lift > 0 && lift < half / 2,
  );
}
