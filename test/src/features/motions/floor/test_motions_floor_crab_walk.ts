import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import {
  crabWalkClock
} from "../../../../../packages/motions/src/floor/internal/crabWalkClock";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a minimum-jerk share and its bisection, seconds and cycles. */
const ROUNDING: number = 1e-9;

/**
 * Check the crab-walk clock, progression and hand support by film second.
 *
 * Scenarios:
 *
 * 1. Travel 1.2 m at a stature of 1.75 m. Four 0.3 m strides fit into a 4.4 s
 *    clock.
 * 2. At 2.6 s, progression is halfway through the distance and its inverse
 *    returns the same second.
 * 3. Check the first swing's midpoint and lift, its landing and the terminal
 *    plant. The hands alternate bearing during those swings and both bear at
 *    the end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give distance, stature, stride timing and alternating plants.
 * @evidence contracts/development/testing.md#behavioral-verification The clock, progress reader and support reader answer the same four-stride course.
 * @evidence contracts/development/testing.md#independent-expectations The 18-percent stature cap gives four strides. Four 0.9 s strides plus 0.8 s give the duration, and minimum-jerk symmetry gives the midpoint.
 */
export async function test_motions_floor_crab_walk(): Promise<void> {
  const clock: crabWalkClock.IClock = crabWalkClock(1.2, 1.75);

  // 1. The cycles.
  TestValidator.predicate(
    "four cycles",
    clock.cycles === 4 &&
      nclose(clock.stride, 0.3, ROUNDING) &&
      nclose(clock.duration, 4.4, ROUNDING),
  );

  // 2. The progress.
  TestValidator.predicate(
    "the progress",
    clock.progress(0.8) === 0 &&
      nclose(clock.progress(2.6), 2, ROUNDING) &&
      clock.progress(4.4) === 4 &&
      nclose(clock.at(2), 2.6, ROUNDING),
  );

  // 3. The steps.
  const lifted: readonly [number, number] = crabWalkClock.step(clock, 0, 0.25);
  TestValidator.predicate(
    "the steps",
    crabWalkClock.step(clock, 0, 0)[0] === 0 &&
      nclose(lifted[0], 0.5, ROUNDING) &&
      nclose(lifted[1], crabWalkClock.LIFT, ROUNDING) &&
      crabWalkClock.step(clock, 0, 0.75)[0] === 1 &&
      crabWalkClock.step(clock, 0, 0.75)[1] === 0 &&
      crabWalkClock.step(clock, 0, 5)[0] === 4 &&
      crabWalkClock.step(clock, 0.5, 0.25)[0] === 0,
  );

  // 4. The contacts.
  const windows: IAutoMovieMotionHumanContactWindow[] = crabWalkClock.contacts(
    clock,
    [
      { part: "rightHand", phase: 0 },
      { part: "leftHand", phase: 0.5 },
    ],
  );
  const bears = (part: string, seconds: number): boolean =>
    windows.some(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.part === part &&
        w.from * clock.duration <= seconds &&
        w.to * clock.duration >= seconds,
    );
  const swingRight: number = clock.at(0.25);
  const swingLeft: number = clock.at(0.75);
  TestValidator.predicate(
    "the diagonal pairs alternate",
    !bears("rightHand", swingRight) &&
      bears("leftHand", swingRight) &&
      bears("rightHand", swingLeft) &&
      !bears("leftHand", swingLeft),
  );
  TestValidator.predicate(
    "each bears to the end",
    bears("rightHand", clock.duration) && bears("leftHand", clock.duration),
  );
}
