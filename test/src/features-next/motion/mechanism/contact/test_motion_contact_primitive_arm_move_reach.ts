import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../../features/internal/motionContactArmFixture";

/**
 * A reach carries the right wrist along the prescribed path to its world-space marker.
 *
 * Scenarios:
 * 1. Observe the two closed endpoints and the minimum-jerk quarter between them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A reach carries the right wrist along the prescribed path to its world-space marker.
 * @evidence contracts/development/testing.md#independent-expectations At one quarter the normalized quintic is 53/512, with exact zero and one endpoints.
 * @evidence contracts/development/testing.md#distinguishing-cases Observe the two closed endpoints and the minimum-jerk quarter between them.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_primitive_arm_move_reach(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.reach(
    f.body,
    f.clock,
    "right",
    ["ready", "strokeStart"],
    f.origin,
    () => fixture.target({ x: 0, y: 1, z: 0.4 }),
  );
  fixture.inspect(arm, f.posture, 1, { x: 0, y: 1, z: 0 });
  fixture.inspect(arm, f.posture, 1.25, { x: 0, y: 1, z: (0.4 * 53) / 512 });
  fixture.inspect(arm, f.posture, 2, { x: 0, y: 1, z: 0.4 });
}
