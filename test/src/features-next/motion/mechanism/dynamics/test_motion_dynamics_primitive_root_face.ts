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

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * Turning to a diagonal heading holds the body origin stationary.
 *
 * Scenarios:
 * 1. Read the diagonal turn and a zero turn on the same clock.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Turning to a diagonal heading holds the body origin stationary.
 * @evidence contracts/development/testing.md#independent-expectations Equal horizontal components define forty-five degrees from forward.
 * @evidence contracts/development/testing.md#distinguishing-cases The neutral turn retains the entered heading.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_primitive_root_face(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const base: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 2, y: 0, z: 3 }, 90);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(2, [
    { name: "peak", seconds: 1 },
  ]);
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.face(
      clock,
      ["start", "peak"],
      (Math.atan2(1, 1) * 180) / Math.PI,
    );
  TestValidator.predicate(
    "diagonal bearing",
    nclose(primitive.write(base, 1).yaw - base.yaw, 45),
  );
  TestValidator.predicate(
    "fixed origin",
    vclose(primitive.write(base, 1).root, base.root),
  );
  const neutral: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanRoot.face(
    clock,
    ["start", "peak"],
    0,
  );
  TestValidator.predicate(
    "no turn",
    nclose(neutral.write(base, 1).yaw, base.yaw),
  );
}
