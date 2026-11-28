import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  AutoMovieMotionWave
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionWave";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { linearMotionClock } from "../../internal/synthetic/linearMotionClock";
import { throwsError } from "../../internal/throwsError";

/** Rounding of one sine and two quintics, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionWave` is `n` whole cycles of `sin(2πnu)` over a clock's
 * window, grown in and out over the first and last half cycle by minimum-jerk
 * shares.
 *
 * On a linear clock with the window from 0 to 2 s and two cycles, a half cycle
 * is u = ¼.
 *
 * Scenarios:
 *
 * 1. The window's ends and its middle are still: 0 at u = 0, ½ and 1.
 * 2. At u = 3/8, past the first half cycle and before the last, the full sine
 *    `sin(1.5π)` = −1.
 * 3. At u = ⅛, half way through the growth, `s(½)` = ½ times `sin(π/2)` = 1.
 * 4. The prepared reader reads the same; a count of 0 is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two-cycle wave's zeros, full-amplitude trough, rise midpoint, prepared read and zero-cycle refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieMotionWave.sample and its prepared reader on a linear clock and checks fixed phases along with an invalid cycle count.
 * @evidence contracts/development/testing.md#independent-expectations At phase 3/8, sin(3π/2) is -1 after the rise. At phase 1/8 the sine is 1 and the rise's midpoint weight is 0.5. The phase endpoints and midpoint have zero excursion.
 */
export function test_motions_compose_motion_wave(): void {
  const clock: IAutoMovieMotionClock = linearMotionClock(2, [
    { name: "open", seconds: 0 },
    { name: "close", seconds: 2 },
  ]);
  const at = (u: number): number =>
    AutoMovieMotionWave.sample(clock, ["open", "close"], 2, 2 * u);

  // 1. Still ends and middle.
  TestValidator.predicate(
    "the ends and the middle are still",
    nclose(at(0), 0, ROUNDING) &&
      nclose(at(0.5), 0, ROUNDING) &&
      nclose(at(1), 0, ROUNDING),
  );

  // 2. The full wave.
  TestValidator.predicate(
    "between the ramps the full sine",
    nclose(at(0.375), -1, ROUNDING),
  );

  // 3. Inside the growth.
  TestValidator.predicate(
    "the growth's minimum-jerk share",
    nclose(at(0.125), 0.5, ROUNDING),
  );

  // 4. Prepared and refused.
  const read: (seconds: number) => number = AutoMovieMotionWave.prepare(
    clock,
    ["open", "close"],
    2,
  );
  TestValidator.predicate(
    "the prepared reader and the refusal",
    nclose(read(0.75), at(0.375), ROUNDING) &&
      throwsError((): number =>
        AutoMovieMotionWave.sample(clock, ["open", "close"], 0, 1),
      ),
  );
}
