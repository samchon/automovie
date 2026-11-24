import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../../features/internal/motionContactArmFixture";

/**
 * A held wrist follows a translating passive target during the entire hold.
 *
 * Scenarios:
 * 1. Move the target orthogonally to its initial offset and inspect both boundaries and the midpoint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A held wrist follows a translating passive target during the entire hold.
 * @evidence contracts/development/testing.md#independent-expectations The X coordinate rises by 0.1 metre per second, independently of the clock.
 * @evidence contracts/development/testing.md#distinguishing-cases Move the target orthogonally to its initial offset and inspect both boundaries and the midpoint.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_primitive_arm_move_hold(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.hold(
    f.body,
    f.clock,
    "right",
    ["ready", "strokeStart"],
    (_posture, seconds) => fixture.target({ x: seconds / 10, y: 1, z: 0.4 }),
  );
  fixture.inspect(arm, f.posture, 1, { x: 0.1, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 1.5, { x: 0.15, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 2, { x: 0.2, y: 1, z: 0.4 });
}
