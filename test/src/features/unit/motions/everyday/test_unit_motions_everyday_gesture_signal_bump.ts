import { gestureSignal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one squared sine, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `gestureSignal.bump` is a single rise and fall over the stroke, `sin^2(pi
 * u)`, zero at and outside its ends.
 *
 * Scenarios:
 *
 * 1. Zero at and outside the ends.
 * 2. One at the middle.
 * 3. A half at a quarter: `sin^2(pi / 4) = 1/2`.
 */
export function test_unit_motions_everyday_gesture_signal_bump(): void {
  TestValidator.equals(
    "zero at and outside the ends",
    [gestureSignal.bump(0), gestureSignal.bump(1), gestureSignal.bump(2)],
    [0, 0, 0],
  );
  TestValidator.predicate(
    "one at the middle",
    nclose(gestureSignal.bump(0.5), 1, ROUNDING),
  );
  TestValidator.predicate(
    "a half at a quarter",
    nclose(gestureSignal.bump(0.25), 0.5, ROUNDING),
  );
}
