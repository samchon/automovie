import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";

/**
 * A wrist visits the authored marker and stays there until the release phase.
 *
 * Scenarios:
 * 1. Read the source at start and end, the target at stroke and relax, and the halfway retreat.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A wrist visits the authored marker and stays there until the release phase.
 * @evidence contracts/development/testing.md#independent-expectations The three-second approach and one-second return have exact midpoint symmetry.
 * @evidence contracts/development/testing.md#distinguishing-cases Read the source at start and end, the target at stroke and relax, and the halfway retreat.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_gesture_primitive_arm_phrase_visit(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.visit({
    body: f.body,
    side: "right",
    clock: f.clock,
    origin: f.origin,
    target: () => fixture.target({ x: 0, y: 1, z: 0.4 }),
  });
  fixture.inspect(arm, f.posture, 0, { x: 0, y: 1, z: 0 });
  fixture.inspect(arm, f.posture, 1.5, { x: 0, y: 1, z: 0.2 });
  fixture.inspect(arm, f.posture, 3, { x: 0, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 5, { x: 0, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 5.5, { x: 0, y: 1, z: 0.2 });
  fixture.inspect(arm, f.posture, 6, { x: 0, y: 1, z: 0 });
}
