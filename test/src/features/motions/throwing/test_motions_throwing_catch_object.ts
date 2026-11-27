import { AutoMovieEngineGravity } from "@automovie/engine";
import {
  catchObjectApproach
} from "../../../../../packages/motions/src/throwing/internal/catchObjectApproach";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `catchObject` law's interception (`catchObjectApproach.tossFlight`,
 * `meetFlight`): a self-toss is met as it falls back to the catch, the later
 * root of `fall + vy t - g t² / 2 = 0`; another's throw where it comes within
 * reach, the distance ahead over the closing speed.
 *
 * Scenarios:
 *
 * 1. Tossed up at 3 m/s from 0.5 m above the catch, it flies `(3 + sqrt(9 + g)) /
 *    g` and lands on the catch's height; a toss not rising, or one never
 *    reaching the catch, is refused.
 * 2. A throw 3 m beyond the reach closing at 6 m/s is met in 0.5 s; one released
 *    within reach, or not closing, is refused.
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
