import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  motionClock
} from "../../../../../packages/motions/src/compose/internal/motionClock";
import {
  stretchHoldClock
} from "../../../../../packages/motions/src/exercise/internal/stretchHoldClock";
import { TestValidator } from "@nestia/e2e";

/** The grid spacing, seconds: a power of two, so every grid second is exact. */
const STEP: number = 0.25;

/**
 * `stretchHoldClock.compress` collapses a standing stretch's hold, the one
 * material pose between arrival (`reachEnd`) and `release`, onto its first
 * whole grid second: the grid cells straddling arrival and release are kept,
 * every second from the first whole grid second inside the hold to the last
 * reads that first one, and every later second reads the collapsed length
 * earlier, so the clock's instants move with it.
 *
 * A 4 s stretch arriving at 1.1 s and released at 2.6 s on a quarter-second
 * grid: the hold's whole grid seconds are 1.25 to 2.5, 1.25 s collapsed.
 *
 * Scenarios:
 *
 * 1. The first and last whole grid seconds are 1.25 and 2.5.
 * 2. 1 s and 1.25 s read themselves, 2 s and 2.5 s read 1.25, 3 s reads 1.75.
 * 3. The clock lasts 2.75 s, `reachEnd` at 1.1 and `release` at 1.35.
 * 4. A hold shorter than a grid cell, from 1.1 to 1.2 s, is not collapsed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stretch playback compresses whole grid frames inside the hold and retains the boundary frames.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the clock transform on a quarter-second grid with one long and one sub-cell hold, then reads the remapped times and cues.
 * @evidence contracts/development/testing.md#independent-expectations Grid arithmetic gives the inclusive 1.25–2.5 s interior and a 1.25-second compression. The expected approach and release times follow directly.
 */
export function test_motions_exercise_stretch_hold_clock(): void {
  const clock: IAutoMovieMotionClock = motionClock(4, [
    { name: "reachEnd", seconds: 1.1 },
    { name: "release", seconds: 2.6 },
  ]);
  const held: stretchHoldClock.ICompressed | undefined =
    stretchHoldClock.compress(clock, STEP);

  // 1. The hold's grid seconds.
  TestValidator.equals(
    "the hold's whole grid seconds",
    [held?.first, held?.last],
    [1.25, 2.5],
  );

  // 2. The compressed seconds.
  TestValidator.equals(
    "each second's compressed one",
    [1, 1.25, 2, 2.5, 3].map((s: number): number => held!.local(s)),
    [1, 1.25, 1.25, 1.25, 1.75],
  );

  // 3. The clock.
  TestValidator.predicate(
    "the compressed clock",
    Math.abs(held!.clock.duration - 2.75) < 1e-12 &&
      Math.abs(held!.clock.at("reachEnd") - 1.1) < 1e-12 &&
      Math.abs(held!.clock.at("release") - 1.35) < 1e-12,
  );

  // 4. A short hold.
  TestValidator.equals(
    "a hold under a grid cell is kept",
    stretchHoldClock.compress(
      motionClock(4, [
        { name: "reachEnd", seconds: 1.1 },
        { name: "release", seconds: 1.2 },
      ]),
      STEP,
    ),
    undefined,
  );
}
