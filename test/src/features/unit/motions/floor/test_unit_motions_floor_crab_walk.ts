import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
  IAutoMovieBone,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  HumanRefusal,
  crabWalkBounds,
  crabWalkClock,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

namespace part_crab_walk_bounds {
  /** Rounding of a share of an arch, degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `crabWalkBounds` keeps the crab walk within what the body holds: `height`
   * takes a pelvis height between 0.1 statures and 0.6 hip heights, and `arch`
   * shares a trunk extension among the spine, chest and upper chest by the room
   * each extends, refusing more than their sum.
   *
   * Scenarios, for a 1.75 m stature and 0.9 m hip height, and a trunk extending
   * 30, 25 and 20 degrees (75 in all):
   *
   * 1. 0.22 statures is 0.385 m; 0.6 statures (1.05 m, over 0.54 m) and 0.05 are
   *    refused on `height`.
   * 2. A 70 degree arch is 28, 23.33 and 18.67 degrees of extension.
   * 3. An 80 degree arch is refused on `backbend`.
   * 4. A trunk with no constraint has no room: any arch is refused, and none arches
   *    nothing.
   */
  export function run(): void {
    const measure: Pick<IAutoMovieBodyMeasure, "stature" | "hipHeight"> = {
      stature: 1.75,
      hipHeight: 0.9,
    };
    const refused = (run: () => unknown, axis: string): boolean => {
      try {
        run();
      } catch (error: unknown) {
        return error instanceof HumanRefusal && error.axis === axis;
      }
      return false;
    };

    // 1. The height.
    TestValidator.predicate(
      "the height",
      nclose(crabWalkBounds.height(measure, 0.22), 0.385, ROUNDING) &&
        refused(() => crabWalkBounds.height(measure, 0.6), "height") &&
        refused(() => crabWalkBounds.height(measure, 0.05), "height"),
    );

    // 2. The arch.
    const bone = (min: number): Pick<IAutoMovieBone, "constraint"> => ({
      constraint: {
        flexion: { min, max: 60 },
        abduction: null,
        twist: null,
      },
    });
    const trunk: crabWalkBounds.IBones = {
      bones: new Map<AutoMovieHumanoidBone, Pick<IAutoMovieBone, "constraint">>(
        [
          ["spine", bone(-30)],
          ["chest", bone(-25)],
          ["upperChest", bone(-20)],
        ],
      ),
    };
    const arched: IAutoMovieMotionHumanPosture["joints"] = crabWalkBounds.arch(
      trunk,
      70,
    );
    TestValidator.predicate(
      "the shares",
      nclose(arched.spine![0], -28, ROUNDING) &&
        nclose(arched.chest![0], (-70 * 25) / 75, ROUNDING) &&
        nclose(arched.upperChest![0], (-70 * 20) / 75, ROUNDING),
    );

    // 3. Too far.
    TestValidator.predicate(
      "too far",
      refused(() => crabWalkBounds.arch(trunk, 80), "backbend"),
    );

    // 4. No room.
    const free: crabWalkBounds.IBones = { bones: new Map() };
    TestValidator.predicate(
      "no room",
      refused(() => crabWalkBounds.arch(free, 1), "backbend") &&
        Object.keys(crabWalkBounds.arch(free, 0)).length === 0,
    );
  }
}

namespace part_crab_walk_clock {
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
  export function run(): void {
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
    const lifted: readonly [number, number] = crabWalkClock.step(
      clock,
      0,
      0.25,
    );
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
    const windows: IAutoMovieMotionHumanContactWindow[] =
      crabWalkClock.contacts(clock, [
        { part: "rightHand", phase: 0 },
        { part: "leftHand", phase: 0.5 },
      ]);
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
}

/**
 * `crabWalk`'s unit contract: its bounds and clock.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `crab_walk_bounds`: `crabWalkBounds` keeps the crab walk within what the body
 *   holds:
 * - `crab_walk_clock`: `crabWalkClock` times the crab walk:
 */
export async function test_unit_motions_floor_crab_walk(): Promise<void> {
  part_crab_walk_bounds.run();
  part_crab_walk_clock.run();
}
