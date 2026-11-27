import type { IAutoMovieMotionClock } from "@automovie/interface";
import { AutoMovieMotionHumanRefusal, headTiltClock } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `headTiltClock` times a head tilt in thirds of its phrase, 0.9 s when
 * unstated: the roll peaks at `stroke`, a third in, and returns from `relax`,
 * two thirds in; a phrase shorter than 0.6 s is refused.
 *
 * Scenarios:
 *
 * 1. Unstated, the phrase is 0.9 s, the peak at 0.3 s and the return at 0.6 s.
 * 2. A 1.5 s phrase peaks at 0.5 s and returns at 1 s.
 * 3. A 0.5 s phrase is refused on `seconds`.
 */
export async function test_motions_everyday_head_tilt(): Promise<void> {
  const read: (clock: IAutoMovieMotionClock) => number[] = (
    clock: IAutoMovieMotionClock,
  ): number[] => [clock.duration, clock.at("stroke"), clock.at("relax")];
  TestValidator.equals(
    "the phrases",
    [read(headTiltClock({})), read(headTiltClock({ duration: 1.5 }))],
    [
      [0.9, 0.9 / 3, (2 / 3) * 0.9],
      [1.5, 1.5 / 3, (2 / 3) * 1.5],
    ],
  );
  let axis: string | undefined;
  try {
    headTiltClock({ duration: 0.5 });
  } catch (error: unknown) {
    if (error instanceof AutoMovieMotionHumanRefusal) axis = error.axis;
  }
  TestValidator.equals("too short", axis, "seconds");
}
