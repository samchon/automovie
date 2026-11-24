import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanGoal } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../../features/internal/motionContactArmFixture";

/**
 * A wrist goal blends from an independent origin toward a translating endpoint.
 *
 * Scenarios:
 * 1. Read zero and half weights, then follow the endpoint after full weight.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A wrist goal blends from an independent origin toward a translating endpoint.
 * @evidence contracts/development/testing.md#independent-expectations The target's X-coordinate equals time in metres and the 0.4 m Z displacement scales by the prescribed weight.
 * @evidence contracts/development/testing.md#distinguishing-cases Read zero and half weights, then follow the endpoint after full weight.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_primitive_goal_drive(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanGoal.drive({
    limb: "rightArm",
    from: 0,
    to: 2,
    origin: () => fixture.target({ x: 0, y: 1, z: 0 }),
    goal: (_posture, seconds) => fixture.target({ x: seconds, y: 1, z: 0.4 }),
    weight: (seconds) => Math.min(1, seconds),
  });
  fixture.inspect(arm, f.posture, 0, { x: 0, y: 1, z: 0 });
  fixture.inspect(arm, f.posture, 0.5, { x: 0.25, y: 1, z: 0.2 });
  fixture.inspect(arm, f.posture, 1, { x: 1, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 2, { x: 2, y: 1, z: 0.4 });
}
