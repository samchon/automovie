import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanHand,
  HumanHand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionContactArmFixture as fixture } from "../../../../features/internal/motionContactArmFixture";

/**
 * The hand shape writes a right-hand curl and preserves the opposite hand.
 *
 * Scenarios:
 * 1. Read relaxed, half-closed and fully closed index flexion.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The hand shape writes a right-hand curl and preserves the opposite hand.
 * @evidence contracts/development/testing.md#independent-expectations The endpoints are independently authored poses in the hand-shape table; linear blending determines the interior flexion.
 * @evidence contracts/development/testing.md#distinguishing-cases Read relaxed, half-closed and fully closed index flexion.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_primitive_hand_shape(): void {
  const f: fixture.IInputs = fixture();
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanHand.shape({
      side: "right",
      shape: "fist",
      from: 0,
      to: 1,
      weight: (seconds: number): number => seconds,
    });
  const initial: number = HumanHand.shape("right", "relaxed")
    .rightIndexProximal![0];
  const full: number = HumanHand.shape("right", "fist").rightIndexProximal![0];
  TestValidator.predicate(
    "closing the index finger changes its flexion",
    full > initial,
  );
  for (const [time, weight] of [
    [0, 0],
    [0.5, 0.5],
    [1, 1],
  ] as const) {
    const shown: IAutoMovieMotionHumanPosture = primitive.write(
      f.posture,
      time,
    );
    TestValidator.predicate(
      "the index follows its prescribed fraction",
      Math.abs(
        shown.joints.rightIndexProximal![0] -
          (initial + (full - initial) * weight),
      ) <= 1e-9,
    );
    TestValidator.equals(
      "the opposite index retains its input",
      shown.joints.leftIndexProximal,
      f.posture.joints.leftIndexProximal,
    );
  }
}
