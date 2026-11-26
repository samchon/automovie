import { TestValidator } from "@nestia/e2e";

import { spacecraftGlideClock } from "../../../../../packages/motions/src/spacecraft/spacecraftGlideClock";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Eight rounding units per binary64 operation at the 6 m fixture scale. */
const ROUNDING: number = 64 * Number.EPSILON * 6;

/**
 * Place a cabin transfer on its push, coast and brake clock.
 *
 * Scenarios:
 *
 * 1. Six metres with two 1 s ramps and a 2 s coast travel 1 m on each ramp and 4 m
 *    in between. The half-second sample's squared progress is symmetric with
 *    braking. The hand opens in the coast alone.
 * 2. Sampling extra time stays at the nearest endpoint. A zero coast or zero ramp
 *    leaves no valid transfer.
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
}
