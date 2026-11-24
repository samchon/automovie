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

import { nclose } from "../../internal/nclose";

/**
 * Observe one complete oscillation with half-height quarter-cycle ramps from an
 * asymmetric held posture.
 *
 * Scenarios:
 *
 * 1. Sample signed excursion and the neutral endpoints on the authored clock.
 * 2. Check the other two axes and the supporting root at each sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the angular excursion in degrees relative to the held neck and head.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the cervical rotations and supporting root produced by the public primitive.
 * @evidence contracts/development/testing.md#independent-expectations The tabulated excursions are the supplied amplitude at the indicated extrema or its midpoint fraction on a symmetric ramp.
 * @evidence contracts/development/testing.md#distinguishing-cases Unequal held angles expose replacing the entry or applying rotation on another axis.
 * @evidence contracts/development/testing.md#execution-ownership Evaluates one primitive in memory at the named fractions of a second.
 */
export function test_motion_gaze_primitive_head_oscillate(): void {
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
    AutoMovieMotionHumanHead.nod(clock, ["start", "end"], 1, 20);
  for (const [seconds, excursion] of [
    [0, 0],
    [0.25, 10],
    [0.5, 0],
    [0.75, -10],
    [1, 0],
  ] as const) {
    const pose: IAutoMovieMotionHumanPosture = primitive.write(entry, seconds);
    TestValidator.equals("supporting root", pose.root, entry.root);
    for (const axis of [0, 1, 2] as const) {
      for (const joint of ["neck", "head"] as const) {
        const expected: number =
          entry.joints[joint]![axis] + (axis === 0 ? excursion / 2 : 0);
        TestValidator.predicate(
          joint + " angle at " + seconds,
          nclose(pose.joints[joint]![axis], expected),
        );
      }
    }
  }
}
