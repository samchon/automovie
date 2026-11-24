import { gestureSignal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one minimum-jerk share, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `gestureSignal.rise` is a push's rise held to the end: the minimum-jerk share
 * over the first 60 % of the stroke, `s(u / 0.6)`.
 *
 * Scenarios:
 *
 * 1. Zero at the start.
 * 2. A half at 30 % of the stroke: `s(1/2) = 1/2`.
 * 3. One from 60 % on.
 */
export function test_unit_motions_everyday_gesture_signal_rise(): void {
  TestValidator.equals("zero at the start", gestureSignal.rise(0), 0);
  TestValidator.predicate(
    "a half at 30 %",
    nclose(gestureSignal.rise(0.3), 0.5, ROUNDING),
  );
  TestValidator.equals(
    "held from 60 %",
    [gestureSignal.rise(0.6), gestureSignal.rise(0.9)],
    [1, 1],
  );
}
