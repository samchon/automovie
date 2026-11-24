import type { IAutoMovieMotionHumanPrimitive } from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";

/**
 * Contact ownership ends at the authored release and the wrist returns to its independently placed rest.
 *
 * Scenarios:
 * 1. Inspect the declared bearing window and both edges of the exit path.
 * 2. Evaluate a midpoint during release and the contact-free end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Contact ownership ends at the authored release and the wrist returns to its independently placed rest.
 * @evidence contracts/development/testing.md#independent-expectations The clock has six equal phases. The press stays on the fixed marker through second five and the quintic retract has exactly half weight halfway through the final phase.
 * @evidence contracts/development/testing.md#distinguishing-cases Inspect the declared bearing window and both edges of the exit path. Evaluate a midpoint during release and the contact-free end.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_throw_catch_touch_release(): void {
  const f: fixture.IInputs = fixture();
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.visit({
    body: f.body,
    side: "right",
    clock: f.clock,
    origin: f.origin,
    target: () => fixture.target({ x: 0, y: 1, z: 0.4 }),
    contact: { kind: "grip", support: { kind: "prop", subject: "marker" } },
  });
  TestValidator.equals(
    "the authored wrist support ends at relax",
    arm.contacts,
    [
      {
        part: "rightHand",
        kind: "grip",
        from: 0.5,
        to: 5 / 6,
        support: { kind: "prop", subject: "marker" },
      },
    ],
  );
  fixture.inspect(arm, f.posture, 5, { x: 0, y: 1, z: 0.4 });
  fixture.inspect(arm, f.posture, 5.5, { x: 0, y: 1, z: 0.2 });
  fixture.inspect(arm, f.posture, 6, { x: 0, y: 1, z: 0 });
}
