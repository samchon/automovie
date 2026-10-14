import { TestValidator } from "@nestia/e2e";

import { jointToQuaternion } from "../../../../packages/engine/src/kinematics/jointToQuaternion";
import { type IAutoMovieQuaternion } from "@automovie/interface";
import { qclose } from "../internal/qclose";
import { qunit } from "../internal/qunit";

/**
 * When more than one axis is articulated, `jointToQuaternion` composes them in
 * the default proximal order (twist ∘ abduction ∘ flexion), and this test's
 * product remains a unit quaternion within its numerical tolerance. Order matters because
 * quaternion multiplication does not commute.
 *
 * Scenario: a joint with flexion 90° and twist 90° must equal multiplying the
 * twist quaternion onto the flexion quaternion in that order, and the combined
 * rotation must remain unit-norm.
 *
 * @evidence contracts/testing.md#behavioral-verification Composes simultaneous X-flexion and Y-twist quarter-turns and checks orientation plus unit norm; reversing the noncommuting product changes Z's sign and fails.
 * @evidence contracts/testing.md#independent-expectations Hand expansion of Y90 times X90 gives (0.5,0.5,-0.5,0.5), with squared norm1; no expected quaternion is produced by the multiplication or axis-angle implementation under test.
 * @evidence contracts/testing.md#distinguishing-cases This mixed noncommuting case distinguishes product order while preserving unit length; null, zero, individual axes, overrides and malformed operands belong to their dedicated entries rather than being silently inferred here.
 * @evidence contracts/testing.md#execution-ownership This exported CPU entry is discovered by the normal runner and directly invokes jointToQuaternion source; its quaternion assertion does not exercise a renderer, browser, GPU or delivered frame.
 */
export function test_kinematics_joint_compose(): void {
  const composed: IAutoMovieQuaternion = jointToQuaternion({
    flexion: 90,
    abduction: null,
    twist: 90,
  });
  // Hamilton Y-quarter-turn times X-quarter-turn: reversing the order flips Z.
  const expected: IAutoMovieQuaternion = { x: 0.5, y: 0.5, z: -0.5, w: 0.5 };
  TestValidator.predicate("twist ∘ flexion order", qclose(composed, expected));
  TestValidator.predicate("composition is unit", qunit(composed));
}
