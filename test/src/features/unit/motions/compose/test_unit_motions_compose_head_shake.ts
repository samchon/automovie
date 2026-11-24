import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanHead,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Observe two shakes about the twist axis from an asymmetric held posture.
 *
 * Scenarios:
 *
 * 1. Sample signed excursion and the neutral endpoints on the authored clock.
 * 2. Check the other two axes and the supporting root at each sample.
 */
export function test_unit_motions_compose_head_shake(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(1, [
    { name: "apex", seconds: 0.25 },
    { name: "release", seconds: 0.75 },
  ]);
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: -1 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { head: [3, 5, -2], neck: [1, -4, 2] },
    limbs: {},
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanHead.shake(clock, ["start", "end"], 2, 20);
  for (const [seconds, excursion] of [
    [0, 0],
    [0.375, -20],
    [0.625, 20],
    [1, 0],
  ] as const) {
    const pose: IAutoMovieMotionHumanPosture = primitive.write(entry, seconds);
    TestValidator.equals("supporting root", pose.root, entry.root);
    for (const axis of [0, 1, 2] as const) {
      for (const joint of ["neck", "head"] as const) {
        const expected: number =
          entry.joints[joint]![axis] + (axis === 2 ? excursion / 2 : 0);
        TestValidator.predicate(
          joint + " angle at " + seconds,
          nclose(pose.joints[joint]![axis], expected),
        );
      }
    }
  }
}
