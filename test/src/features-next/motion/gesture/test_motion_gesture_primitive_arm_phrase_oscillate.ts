import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";

/**
 * A one-cycle hand oscillation has the authored transverse amplitude and period.
 *
 * Scenarios:
 * 1. Sample the two extreme displacements and the zero crossings in the active interval.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A one-cycle hand oscillation has the authored transverse amplitude and period.
 * @evidence contracts/development/testing.md#independent-expectations At the two quarter points the sine reaches opposite extrema while the half-cycle onset or release envelope is at its symmetric midpoint.
 * @evidence contracts/development/testing.md#distinguishing-cases Sample the two extreme displacements and the zero crossings in the active interval.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_gesture_primitive_arm_phrase_oscillate(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.oscillate(
    {
      body: f.body,
      side: "right",
      clock: f.clock,
      origin: f.origin,
      cycles: 1,
      pose: (_posture, _seconds, phase) =>
        fixture.target({ x: phase / 10, y: 1, z: 0.4 }),
    },
  );
  fixture.inspect(arm, f.posture, 2, { x: 0, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 2.5, { x: 0.05, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 3, { x: 0, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 3.5, { x: -0.05, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 4, { x: 0, y: 1, z: 0.4 });
}
