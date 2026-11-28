import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  motionClock
} from "../../../../../packages/motions/src/compose/internal/motionClock";
import {
  AutoMovieMotionHumanTrunk
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanTrunk";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Observe a held axial turn with neutral endpoints from an asymmetric held
 * posture.
 *
 * Scenarios:
 *
 * 1. Sample signed excursion and the neutral endpoints on the authored clock.
 * 2. Check the other two axes and the supporting root at each sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the negative turn through its hold and the neutral endpoints, with other axes read on both trunk joints.
 * @evidence contracts/development/testing.md#behavioral-verification Builds HumanTrunk.turn on an authored clock and writes it onto fixed chest and spine angles before, during and after the hold.
 * @evidence contracts/development/testing.md#independent-expectations The -20-degree excursion divides into -12 for chest and -8 for spine at the tested hold points. Endpoints contribute zero, and the unchanged axes and root use the literal entry pose.
 */
export function test_motions_compose_trunk_turn(): void {
  const clock: IAutoMovieMotionClock = motionClock(1, [
    { name: "apex", seconds: 0.25 },
    { name: "release", seconds: 0.75 },
  ]);
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: -1 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { chest: [3, 5, -2], spine: [1, -4, 2] },
    limbs: {},
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanTrunk.turn(
      clock,
      ["start", "apex"],
      ["release", "end"],
      -20,
    );
  for (const [seconds, excursion] of [
    [0, 0],
    [0.25, -20],
    [0.5, -20],
    [0.75, -20],
    [1, 0],
  ] as const) {
    const pose: IAutoMovieMotionHumanPosture = primitive.write(entry, seconds);
    TestValidator.equals("supporting root", pose.root, entry.root);
    for (const axis of [0, 1, 2] as const) {
      for (const joint of ["chest", "spine"] as const) {
        const expected: number =
          entry.joints[joint]![axis] +
          (axis === 2 ? excursion * (joint === "chest" ? 0.6 : 0.4) : 0);
        TestValidator.predicate(
          joint + " angle at " + seconds,
          nclose(pose.joints[joint]![axis], expected),
        );
      }
    }
  }
}
