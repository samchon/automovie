import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../../features/internal/motionContactArmFixture";

/**
 * A retraction leaves contact and arrives on the body-carried rest point.
 *
 * Scenarios:
 * 1. Observe departure, a quarter of the reverse quintic and the final rest point.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A retraction leaves contact and arrives on the body-carried rest point.
 * @evidence contracts/development/testing.md#independent-expectations A quarter of the gap has quintic share 53/512; retraction uses its complement.
 * @evidence contracts/development/testing.md#distinguishing-cases Observe departure, a quarter of the reverse quintic and the final rest point.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_primitive_arm_move_retract(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.retract(
    f.body,
    f.clock,
    "right",
    ["ready", "strokeStart"],
    () => fixture.target({ x: 0, y: 1, z: 0.4 }),
    f.origin,
  );
  fixture.inspect(arm, f.posture, 1, { x: 0, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 1.25, {
    x: 0,
    y: 1,
    z: 0.4 * (1 - 53 / 512),
  });
  fixture.inspect(arm, f.posture, 2, { x: 0, y: 1, z: 0 });
}
