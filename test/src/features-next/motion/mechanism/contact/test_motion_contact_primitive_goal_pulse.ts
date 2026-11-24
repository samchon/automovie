import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanGoal } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../../features/internal/motionContactArmFixture";

/**
 * A right wrist goal reaches its full amplitude then returns to its entry point.
 *
 * Scenarios:
 * 1. Read onset, full amplitude, half return and release.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A right wrist goal reaches its full amplitude then returns to its entry point.
 * @evidence contracts/development/testing.md#independent-expectations The six one-second phases yield a half-weight wrist at 5.5 seconds.
 * @evidence contracts/development/testing.md#distinguishing-cases Read onset, full amplitude, half return and release.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_primitive_goal_pulse(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanGoal.pulse(
    f.clock,
    "rightArm",
    ["start", "ready"],
    ["relax", "end"],
    () => fixture.target({ x: 0, y: 1, z: 0.4 }),
    () => fixture.target({ x: 0, y: 1, z: 0 }),
  );
  fixture.inspect(arm, f.posture, 0, { x: 0, y: 1, z: 0 });
  fixture.inspect(arm, f.posture, 1, { x: 0, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 5, { x: 0, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 5.5, { x: 0, y: 1, z: 0.2 });
  fixture.inspect(arm, f.posture, 6, { x: 0, y: 1, z: 0 });
}
