import { TestValidator } from "@nestia/e2e";

import {
  spacecraftGlideClock
} from "../../../../../packages/motions/src/spacecraft/internal/spacecraftGlideClock";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Eight rounding units per binary64 operation at the 6 m fixture scale. */
const ROUNDING: number = 64 * Number.EPSILON * 6;

/**
 * Check travel and hand opening through a cabin push, coast and brake.
 *
 * Scenarios:
 *
 * 1. Move six metres with one-second ramps and a two-second coast. Allocate
 *    one metre to each ramp and four to the coast, sampling progress and
 *    opening through all phases.
 * 2. Clamp samples outside the action. Refuse a zero coast or ramp, and a
 *    summed duration overflowing from finite phases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify phase lengths, hand opening, endpoint reads and invalid durations.
 * @evidence contracts/development/testing.md#behavioral-verification Clock and course functions take fixed scalar timings and are checked together against sampled distance and openness.
 * @evidence contracts/development/testing.md#independent-expectations Peak speed follows six metres divided by the effective three-second profile. Constant acceleration gives squared ramp progress and time fractions give the coast samples.
 */
export function test_motions_spacecraft_glide_clock(): void {
  const clock: spacecraftGlideClock.IClock = spacecraftGlideClock({
    ramp: 1,
    coast: 2,
  });
  const course: spacecraftGlideClock.ICourse = clock.prepare(6);
  TestValidator.predicate(
    "equal ramps delimit the coast and each travel one metre",
    nclose(clock.catchAt, 3, ROUNDING) &&
      nclose(clock.duration, 4, ROUNDING) &&
      nclose(course.rampDistance, 1, ROUNDING),
  );
  const fields: readonly [number, number, number, number][] = [
    [3.5, 5.75, 1, 0],
    [1, 1, 0, 0],
    [2, 3, 0.5, 1],
    [1.5, 2, 0.25, 9 / 16],
    [3, 5, 1, 0],
    [0.5, 0.25, 0, 0],
    [-1, 0, 0, 0],
    [5, 6, 1, 0],
  ];
  for (const [seconds, travel, share, open] of fields) {
    const sample: spacecraftGlideClock.ISample = course.sample(seconds);
    TestValidator.predicate(
      `root and hand at ${seconds} s`,
      nclose(sample.travel, travel, ROUNDING) &&
        nclose(sample.coastShare, share, ROUNDING) &&
        nclose(sample.open, open, ROUNDING),
    );
  }
  TestValidator.predicate(
    "a transfer needs two nonempty authored phases",
    throwsError(
      (): unknown => spacecraftGlideClock({ ramp: 0, coast: 2 }),
      "clock",
    ) &&
      throwsError(
        (): unknown => spacecraftGlideClock({ ramp: 1, coast: 0 }),
        "clock",
      ),
  );
  TestValidator.predicate(
    "the transfer duration must be finite",
    throwsError(
      (): unknown => spacecraftGlideClock({ ramp: 8e307, coast: 8e307 }),
      "clock",
    ),
  );
}
