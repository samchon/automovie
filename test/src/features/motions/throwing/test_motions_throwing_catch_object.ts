import { AutoMovieEngineGravity } from "@automovie/engine";
import {
  catchObjectApproach
} from "../../../../../packages/motions/src/throwing/internal/catchObjectApproach";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Check the flight time of a self-toss and of an approaching throw.
 *
 * Scenarios:
 *
 * 1. From 0.5 m above the catch at 3 m/s upward, land at the descending root.
 *    Refuse a non-rising toss and one that cannot reach the catch height.
 * 2. A throw 3 m outside reach closing at 6 m/s is met in 0.5 s. Refuse
 *    release already within reach and zero closing speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the two flight frames, roots and rejected inputs.
 * @evidence contracts/development/testing.md#behavioral-verification The toss and meeting computations are checked directly against their small scalar fixtures.
 * @evidence contracts/development/testing.md#independent-expectations Solving the ballistic height equation gives `(3 + sqrt(9 + g)) / g`. Dividing distance by closing speed gives the other time.
 */
export function test_motions_throwing_catch_object(): void {
  const g: number = AutoMovieEngineGravity.STANDARD;
  const flight: number = catchObjectApproach.tossFlight("toss", 3, 0.5);
  TestValidator.predicate(
    "a self-toss",
    nclose(flight, (3 + Math.sqrt(9 + g)) / g, 1e-12) &&
      nclose(0.5 + 3 * flight - (g * flight * flight) / 2, 0, 1e-9) &&
      throwsError(() => catchObjectApproach.tossFlight("toss", 0, 0.5)) &&
      throwsError(() => catchObjectApproach.tossFlight("toss", 1, -1)),
  );
  TestValidator.predicate(
    "another's throw",
    nclose(catchObjectApproach.meetFlight("throw", 3, 6), 0.5, 1e-12) &&
      throwsError(() => catchObjectApproach.meetFlight("throw", 0, 6)) &&
      throwsError(() => catchObjectApproach.meetFlight("throw", 3, 0)),
  );
}
