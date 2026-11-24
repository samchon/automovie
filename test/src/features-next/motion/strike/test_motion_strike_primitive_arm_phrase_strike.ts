import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";

import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";

/**
 * A staged wrist passes a passive marker and returns from its follow-through.
 *
 * Scenarios:
 * 1. Read the initial wrist, prepared marker, peak path marker and final rest.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A staged wrist passes a passive marker and returns from its follow-through.
 * @evidence contracts/development/testing.md#independent-expectations The caller places the two markers 0.1 and 0.4 metres from the origin along +Z.
 * @evidence contracts/development/testing.md#distinguishing-cases Read the initial wrist, prepared marker, peak path marker and final rest.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_strike_primitive_arm_phrase_strike(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.strike({
    body: f.body,
    side: "right",
    clock: f.clock,
    origin: f.origin,
    chamber: () => fixture.target({ x: 0, y: 1, z: 0.1 }),
    target: () => fixture.target({ x: 0, y: 1, z: 0.4 }),
  });
  fixture.inspect(arm, f.posture, 0, { x: 0, y: 1, z: 0 });
  fixture.inspect(arm, f.posture, 2, { x: 0, y: 1, z: 0.1 });
  fixture.inspect(arm, f.posture, 3, { x: 0, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 6, { x: 0, y: 1, z: 0 });
}
