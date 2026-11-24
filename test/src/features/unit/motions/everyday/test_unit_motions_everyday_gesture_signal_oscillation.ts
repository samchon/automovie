import { gestureSignal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one sine and one minimum-jerk share, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `gestureSignal.oscillation` is `sin(2 pi n u)` under a window easing in over
 * the first and out over the last 15 % of the stroke on the minimum-jerk share,
 * zero at and outside the stroke's ends.
 *
 * Scenarios:
 *
 * 1. At and outside the ends the signal is 0.
 * 2. In the window's open middle it is the bare sine: two cycles at u = 5/8 give
 *    `sin(5 pi / 2) = 1`.
 * 3. Inside the easing it is the sine scaled by the share: at `u = 0.075`, half
 *    the easing, the share `s(1/2) = 1/2`.
 */
export function test_unit_motions_everyday_gesture_signal_oscillation(): void {
  TestValidator.equals(
    "zero at and outside the ends",
    [
      gestureSignal.oscillation(0, 2),
      gestureSignal.oscillation(1, 2),
      gestureSignal.oscillation(-0.5, 2),
      gestureSignal.oscillation(1.5, 2),
    ],
    [0, 0, 0, 0],
  );
  TestValidator.predicate(
    "the bare sine in the middle",
    nclose(gestureSignal.oscillation(5 / 8, 2), 1, ROUNDING),
  );
  TestValidator.predicate(
    "half the easing",
    nclose(
      gestureSignal.oscillation(0.075, 2),
      0.5 * Math.sin(2 * Math.PI * 2 * 0.075),
      ROUNDING,
    ),
  );
}
