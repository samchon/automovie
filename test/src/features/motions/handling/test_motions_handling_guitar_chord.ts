import type { IAutoMovieMotionHumanGuitarChord } from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  guitarChordTimes
} from "../../../../../packages/motions/src/handling/internal/guitarChordTimes";
import { TestValidator } from "@nestia/e2e";

/**
 * `guitarChordTimes`, the timing of `guitarChord.plan`: the hand has prepared
 * halfway to the fretting stop, and the sweep crosses the strings at its first
 * and second thirds.
 *
 * Scenarios:
 *
 * 1. Stop at 0.4 s, sweep 0.75 to 1.5 s, release 1.75 s of 2 s, down: prepared at
 *    0.2 s, crossings at 1 s and 1.25 s.
 * 2. A sweep that starts before the stop is refused on `stopAt`.
 * 3. A sweep one ulp wide has no distinct crossings: refused on `sweepStartAt`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines preparation and two string-crossing times and refusal axes for invalid sweep ordering or collapsed clock.
 * @evidence contracts/development/testing.md#behavioral-verification Builds one valid stopped chord, tries an early sweep and constructs a one-ulp sweep.
 * @evidence contracts/development/testing.md#independent-expectations Half the 0.4 s hold preparation gives 0.2 s. Thirds of [0.75, 1.5] give crossings 1 and 1.25 s, but adjacent clock values cannot hold two crossings.
 */
export function test_motions_handling_guitar_chord(): void {
  const params: Pick<
    IAutoMovieMotionHumanGuitarChord,
    | "duration"
    | "stopAt"
    | "sweepStartAt"
    | "sweepEndAt"
    | "releaseAt"
    | "direction"
  > = {
    duration: 2,
    stopAt: 0.4,
    sweepStartAt: 0.75,
    sweepEndAt: 1.5,
    releaseAt: 1.75,
    direction: "down",
  };
  TestValidator.equals("the chord's instants", guitarChordTimes(params), {
    prep: 0.2,
    firstAt: 1,
    secondAt: 1.25,
  });
  const refused = (
    changed: Partial<typeof params>,
  ): AutoMovieMotionHumanRefusal["axis"] | undefined => {
    try {
      guitarChordTimes({ ...params, ...changed });
      return undefined;
    } catch (error: unknown) {
      return error instanceof AutoMovieMotionHumanRefusal ? error.axis : undefined;
    }
  };
  TestValidator.equals(
    "unordered and indistinct times are refused on their axes",
    [
      refused({ sweepStartAt: 0.3 }),
      refused({ sweepStartAt: 1, sweepEndAt: 1 + Number.EPSILON }),
    ],
    ["stopAt", "sweepStartAt"],
  );
}
