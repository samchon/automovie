import type { IAutoMovieMotionHumanGuitarChord } from "@automovie/interface";
import { HumanRefusal, guitarChordTimes } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `guitarChordTimes`, the timing of `guitarChord.plan`: the hand has prepared
 * halfway to the fretting stop, and the sweep crosses the strings at its first
 * and second thirds.
 *
 * Scenarios:
 *
 * 1. Stop at 0.4 s, sweep 0.75 to 1.5 s, release 1.75 s of 2 s, down: prepared
 *    at 0.2 s, crossings at 1 s and 1.25 s.
 * 2. A sweep that starts before the stop is refused on `stopAt`.
 * 3. A sweep one ulp wide has no distinct crossings: refused on `sweepStartAt`.
 */
export function test_unit_motions_handling_guitar_chord(): void {
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
  ): HumanRefusal["axis"] | undefined => {
    try {
      guitarChordTimes({ ...params, ...changed });
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : undefined;
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
