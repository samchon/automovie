import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanArm } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionContactArmFixture as fixture } from "../../../../features/internal/motionContactArmFixture";

/**
 * The arm swing applies a signed angular excursion to one shoulder and removes only its own old wrist goal.
 *
 * Scenarios:
 * 1. Sample forward and backward extremes and the centre crossings of an authored half-turn waveform.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The arm swing applies a signed angular excursion to one shoulder and removes only its own old wrist goal.
 * @evidence contracts/development/testing.md#independent-expectations The authored sine supplies equal opposite angular displacements about the shoulder's flexion axis, with constant elbow flexion.
 * @evidence contracts/development/testing.md#distinguishing-cases Sample forward and backward extremes and the centre crossings of an authored half-turn waveform.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_primitive_arm_phrase_swing(): void {
  const f: fixture.IInputs = fixture();
  const swing: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.swing(
    "right",
    0,
    1,
    (_posture, seconds) => ({
      upper: [30 * Math.sin(2 * Math.PI * seconds), 0, 0],
      elbow: 45,
    }),
  );
  const entry: IAutoMovieMotionHumanPosture = {
    ...f.posture,
    limbs: {
      ...f.posture.limbs,
      rightArm: fixture.target({ x: 0, y: 1, z: 0.4 }),
    },
  };
  for (const [time, degrees] of [
    [0, 0],
    [0.25, 30],
    [0.5, 0],
    [0.75, -30],
    [1, 0],
  ] as const) {
    const shown: IAutoMovieMotionHumanPosture = swing.write(entry, time);
    TestValidator.predicate(
      "the shoulder follows the signed angular excursion",
      Math.abs(shown.joints.rightUpperArm![0] - degrees) < 1e-9,
    );
    TestValidator.equals(
      "the elbow keeps the supplied bend",
      shown.joints.rightLowerArm,
      [45, 0, 0],
    );
    TestValidator.equals(
      "the previous wrist goal yields",
      shown.limbs.rightArm,
      undefined,
    );
    TestValidator.equals(
      "the other shoulder is unchanged",
      shown.joints.leftUpperArm,
      entry.joints.leftUpperArm,
    );
  }
}
