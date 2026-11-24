import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";

/**
 * The wrist follows an authored line during the stroke, holds its endpoint, then returns to rest.
 *
 * Scenarios:
 * 1. Measure the first point, halfway progression, end of the line and released wrist.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The wrist follows an authored line during the stroke, holds its endpoint, then returns to rest.
 * @evidence contracts/development/testing.md#independent-expectations A 0.4 m affine path beginning 0.1 m from the origin has midpoint 0.3 m and endpoint 0.5 m.
 * @evidence contracts/development/testing.md#distinguishing-cases Measure the first point, halfway progression, end of the line and released wrist.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_gesture_primitive_arm_phrase_stroke(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.stroke({
    body: f.body,
    side: "right",
    clock: f.clock,
    origin: f.origin,
    path: (_posture, _seconds, progress) =>
      fixture.target({ x: 0, y: 1, z: 0.1 + 0.4 * progress }),
  });
  fixture.inspect(arm, f.posture, 0, { x: 0, y: 1, z: 0 });
  fixture.inspect(arm, f.posture, 2, { x: 0, y: 1, z: 0.1 });
  fixture.inspect(arm, f.posture, 3, { x: 0, y: 1, z: 0.3 });
  fixture.inspect(arm, f.posture, 4, { x: 0, y: 1, z: 0.5 });
  fixture.inspect(arm, f.posture, 5, { x: 0, y: 1, z: 0.5 });
  fixture.inspect(arm, f.posture, 6, { x: 0, y: 1, z: 0 });
}
