import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanRoot,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { vclose } from "../../../internal/vclose";

/**
 * A shift in a turned body frame moves along its world forward axis.
 *
 * Scenarios:
 *
 * 1. Observe the midpoint, end and hold of a half-metre forward shift.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A shift in a turned body frame moves along its world forward axis.
 * @evidence contracts/development/testing.md#independent-expectations A ninety-degree heading maps local +Z onto world +X. Symmetric progress reaches one half halfway through.
 * @evidence contracts/development/testing.md#distinguishing-cases The shifted root holds its final displacement.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_primitive_root_shift(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const base: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 2, y: 0, z: 3 }, 90);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(2, [
    { name: "peak", seconds: 1 },
  ]);
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.shift(clock, ["start", "peak"], {
      x: 0,
      y: 0,
      z: 0.5,
    });
  for (const [t, dx] of [
    [0, 0],
    [0.5, 0.25],
    [1, 0.5],
    [2, 0.5],
  ] as const) {
    TestValidator.predicate(
      "turn-relative shift",
      vclose(primitive.write(base, t).root, {
        ...base.root,
        x: base.root.x + dx,
      }),
    );
  }
}
