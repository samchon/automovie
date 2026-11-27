import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import {
  crabWalkClock
} from "../../../../../packages/motions/src/floor/internal/crabWalkClock";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a minimum-jerk share and its bisection, seconds and cycles. */
const ROUNDING: number = 1e-9;

/**
 * `crabWalkClock` times the crab walk: `ceil(D / (0.18 stature))` whole cycles
 * of 0.9 s after a 0.8 s settle, the progress a minimum-jerk course in cycles;
 * `step` swings an end over the first half of each of its cycles on a
 * minimum-jerk course lifted on a half sine and stands over the second; and
 * `contacts` plants each end between its swings.
 *
 * Scenarios, over 1.2 m for a 1.75 m stature (`1.2 / 0.315 = 3.81`, so 4 cycles
 * of 0.3 m, 4.4 s in all):
 *
 * 1. Four cycles of 0.3 m over 4.4 s.
 * 2. The progress is 0 at the settle, 2 half way through the travel (2.6 s, the
 *    course's symmetry) and 4 at the end; `at(2)` is 2.6 s.
 * 3. An end of phase 0 stands at the start, is half way through its first swing at
 *    the top of its lift at u = 0.25, stands one stride on at u = 0.75, and
 *    rests at the last stride past the end; an end of phase 0.5 has not left at
 *    u = 0.25.
 * 4. With the right hand at phase 0 and the left at 0.5, the right hand does not
 *    bear while it swings at `at(0.25)` and the left does, the other way round
 *    at `at(0.75)`, and each bears from its last landing to the end.
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
