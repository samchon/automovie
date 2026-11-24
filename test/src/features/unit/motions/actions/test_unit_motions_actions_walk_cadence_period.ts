import { AutoMovieMotionHumanGait } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one subtraction of film seconds, seconds. */
const ROUNDING: number = 1e-12;

/**
 * `walkCadence.period` reads a beat track's period as the median interval
 * between successive beats, so one late or early beat does not move it.
 *
 * Scenarios:
 *
 * 1. A regular 120 BPM track has the period 60 / 120 = 0.5 s.
 * 2. Two beats, a single interval, have that interval as the period.
 * 3. One late beat among regular ones leaves the period at the regular 0.5 s,
 *    where a mean interval would be 0.667 s.
 * 4. Unequal intervals 0.7, 0.4, 0.5, 0.6 and 0.9 s give their median, 0.6 s:
 *    neither the first, the last nor the middle one of the track's order.
 * 5. With an even number of intervals the period is one of the two middle ones, so
 *    it lies between them.
 */
export function test_unit_motions_actions_walk_cadence_period(): void {
  const period: (beats: readonly number[]) => number =
    AutoMovieMotionHumanGait.walkCadence.period;

  TestValidator.predicate(
    "a regular 120 BPM track",
    nclose(period([1, 1.5, 2, 2.5]), 0.5, ROUNDING),
  );
  TestValidator.predicate(
    "a single interval",
    nclose(period([0, 0.75]), 0.75, ROUNDING),
  );
  TestValidator.predicate(
    "one late beat leaves the regular period",
    nclose(period([0, 0.5, 1, 2]), 0.5, ROUNDING),
  );
  TestValidator.predicate(
    "the median of unequal intervals",
    nclose(period([0, 0.7, 1.1, 1.6, 2.2, 3.1]), 0.6, ROUNDING),
  );
  const even: number = period([0, 0.4, 1]);
  TestValidator.predicate(
    `an even count lies between its middle intervals (${even} s)`,
    even >= 0.4 - ROUNDING && even <= 0.6 + ROUNDING,
  );
}
