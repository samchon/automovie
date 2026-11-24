import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../../features/internal/motionContactArmFixture";

/**
 * A straight wrist move clips its authored share at both ends and linearly blends the wrist between them.
 *
 * Scenarios:
 * 1. Read an underflowing share, the midpoint and an overflowing share.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A straight wrist move clips its authored share at both ends and linearly blends the wrist between them.
 * @evidence contracts/development/testing.md#independent-expectations The independent origin and destination are 0.4 m apart along +Z.
 * @evidence contracts/development/testing.md#distinguishing-cases Read an underflowing share, the midpoint and an overflowing share.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_primitive_arm_move_move(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.move({
    body: f.body,
    side: "right",
    from: 0,
    to: 1,
    origin: f.origin,
    target: () => fixture.target({ x: 0, y: 1, z: 0.4 }),
    weight: (seconds: number): number => seconds,
  });
  fixture.inspect(arm, f.posture, -1, { x: 0, y: 1, z: 0 });
  fixture.inspect(arm, f.posture, 0.5, { x: 0, y: 1, z: 0.2 });
  fixture.inspect(arm, f.posture, 2, { x: 0, y: 1, z: 0.4 });
}
